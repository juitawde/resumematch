import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

/**
 * Custom spatial page renderer for pdf-parse.
 * Handles both single-column and multi-column PDF resumes.
 * Correctly detects column gutters to avoid slicing through sentences.
 * Sorts items top-to-bottom and left-to-right to preserve reading order,
 * prevents line-interleaving across columns, and avoids word concatenation.
 */
async function spatialPageRender(pageData) {
  const content = await pageData.getTextContent({ normalizeWhitespace: false });
  const rawItems = (content.items || []).filter((it) => it && it.str && it.str.trim());
  if (!rawItems.length) return '';

  // In PDF coordinate space, (0,0) is bottom-left, Y increases upward.
  // Normalize each item with bounding box properties.
  const items = rawItems.map((it) => {
    const x = it.transform[4];
    const y = it.transform[5];
    const str = it.str;
    const width = it.width || str.length * 6;
    return { x, y, str, width };
  });

  const xs = items.map((i) => i.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const totalWidth = maxX - minX;

  function renderItemGroup(group) {
    if (!group.length) return '';

    // Sort: Y descending (top-to-bottom), then X ascending (left-to-right)
    const sorted = [...group].sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3.5) return yDiff;
      return a.x - b.x;
    });

    let result = '';
    let lastY = null;
    let lastXEnd = null;

    for (const it of sorted) {
      if (lastY === null) {
        result += it.str;
      } else if (Math.abs(lastY - it.y) > 3.5) {
        // Line break
        if (lastY - it.y > 18) {
          result += '\n\n' + it.str;
        } else {
          result += '\n' + it.str;
        }
      } else {
        // Same line
        const gap = it.x - (lastXEnd || it.x);
        const needsSpace =
          gap > 0.6 ||
          (gap > 0.1 &&
            !result.endsWith(' ') &&
            !it.str.startsWith(' ') &&
            /[a-zA-Z0-9]/.test(result.slice(-1)) &&
            /[a-zA-Z0-9]/.test(it.str[0]));
        if (needsSpace) {
          result += ' ' + it.str;
        } else {
          result += it.str;
        }
      }
      lastY = it.y;
      lastXEnd = it.x + it.width;
    }

    return result;
  }

  // Determine if there is a distinct two-column layout
  // Check section headers or cluster of left-aligned text in the right half
  const maxY = Math.max(...items.map((i) => i.y));
  const headerThreshold = maxY - 75;
  const headerItems = items.filter((i) => i.y >= headerThreshold);
  const bodyItems = items.filter((i) => i.y < headerThreshold);

  // Look for items starting in the right half (e.g. between 45% and 80% of width)
  const rightHalfStarts = bodyItems
    .map((i) => i.x)
    .filter((x) => x > minX + totalWidth * 0.45 && x < minX + totalWidth * 0.85);

  // Find right column start: locate the most frequent starting X in the right half (with 5pt tolerance)
  let rightColStartX = null;
  if (totalWidth > 280 && rightHalfStarts.length >= 10) {
    const startCounts = {};
    for (const x of rightHalfStarts) {
      const bucket = Math.round(x / 4) * 4;
      startCounts[bucket] = (startCounts[bucket] || 0) + 1;
    }
    const topBuckets = Object.entries(startCounts)
      .map(([b, c]) => ({ bucket: Number(b), count: c }))
      .sort((a, b) => b.count - a.count);

    if (topBuckets.length && topBuckets[0].count >= 4) {
      rightColStartX = topBuckets[0].bucket;
    }
  }

  // Check if known section headers exist in right half
  const rightHeaders = bodyItems.filter(
    (i) =>
      i.x > minX + totalWidth * 0.45 &&
      /^(?:SUMMARY|SKILLS|TECHNICAL\s+SKILLS|EDUCATION|TRAINING|COURSES|EXPERIENCE)/i.test(i.str.trim())
  );
  if (rightHeaders.length) {
    // If a section header starts at x, that is a definitive column start!
    rightColStartX = Math.min(...rightHeaders.map((h) => h.x));
  }

  const isTwoColumn = Boolean(rightColStartX && rightColStartX > minX + totalWidth * 0.4);

  if (isTwoColumn) {
    // Split boundary is in the gutter just before the right column begins (15pt gutter safety margin)
    const splitX = rightColStartX - 15;
    const leftBody = bodyItems.filter((i) => i.x < splitX);
    const rightBody = bodyItems.filter((i) => i.x >= splitX);

    let output = '';
    if (headerItems.length > 0) {
      output += renderItemGroup(headerItems) + '\n\n';
    }
    output += renderItemGroup(leftBody) + '\n\n' + renderItemGroup(rightBody);
    return output;
  }

  return renderItemGroup(items);
}

/**
 * Repairs concatenated words resulting from certain PDF font kerning anomalies.
 */
export function deglueText(str = '') {
  if (!str) return '';
  return str
    .replace(/\b(Builta|Builtan|Developeda|Developedan|Implementeduser|Createda|Designeda)\b/gi, (m) => {
      const lower = m.toLowerCase();
      if (lower === 'builta') return 'Built a';
      if (lower === 'builtan') return 'Built an';
      if (lower === 'developeda') return 'Developed a';
      if (lower === 'developedan') return 'Developed an';
      if (lower === 'implementeduser') return 'Implemented user';
      if (lower === 'createda') return 'Created a';
      if (lower === 'designeda') return 'Designed a';
      return m;
    })
    .replace(/([a-z]),([a-zA-Z])/g, '$1, $2')
    .replace(/([a-z]);([a-zA-Z])/g, '$1; $2')
    .replace(/([a-zA-Z]),and([a-zA-Z])/gi, '$1, and $2')
    .replace(/\band([a-z]{3,})/gi, (m, word) => {
      const common = [
        'admins',
        'users',
        'maintain',
        'manage',
        'review',
        'blocking',
        'timers',
        'media',
        'custom',
        'document',
        'winners',
        'modular',
        'scalable',
        'responsive',
        'high',
      ];
      if (common.includes(word.toLowerCase())) {
        return `and ${word}`;
      }
      return m;
    });
}

export async function extractText(file) {
  if (!file?.buffer) return '';

  const { mimetype, originalname, buffer } = file;
  const isPdf = mimetype === 'application/pdf' || /\.pdf$/i.test(originalname || '');
  const isDocx =
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.docx$/i.test(originalname || '');
  const isTxt = mimetype === 'text/plain' || /\.txt$/i.test(originalname || '');

  if (isPdf) {
    try {
      const data = await pdf(buffer, {
        pagerender: spatialPageRender,
        max: 8,
      });

      let text = (data.text || '').trim();
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      text = deglueText(text);

      return text;
    } catch (e) {
      console.warn('Spatial PDF extraction fallback to standard parser:', e.message);
      try {
        const fallback = await pdf(buffer, { max: 8 });
        return (fallback.text || '').replace(/\r\n/g, '\n').trim();
      } catch (err) {
        throw new Error('Failed to parse PDF document: ' + err.message);
      }
    }
  }

  if (isDocx) {
    const res = await mammoth.extractRawText({ buffer });
    return (res.value || '').trim();
  }

  if (isTxt) {
    return buffer.toString('utf8').trim();
  }

  return '';
}
