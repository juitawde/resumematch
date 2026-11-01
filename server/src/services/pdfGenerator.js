import PDFDocument from 'pdfkit';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { cleanStructuredResume } from './workflow.js';

const COLOR_MAP = {
  slate: '#405F75',
  navy: '#1E3A5F',
  charcoal: '#29243A',
  rosewood: '#95576A',
  emerald: '#2D6A4F',
};

function resolveAccentColor(color, template) {
  if (template === 'ats-classic') return '#111827';
  if (!color) return '#405F75';
  if (COLOR_MAP[color]) return COLOR_MAP[color];
  if (color.startsWith('#')) return color;
  return '#405F75';
}

function resolveFont(fontName) {
  const f = String(fontName || '').toLowerCase();
  if (f.includes('times') || f.includes('georgia') || f.includes('serif')) {
    return {
      regular: 'Times-Roman',
      bold: 'Times-Bold',
      italic: 'Times-Italic',
    };
  }
  if (f.includes('courier') || f.includes('mono')) {
    return {
      regular: 'Courier',
      bold: 'Courier-Bold',
      italic: 'Courier-Oblique',
    };
  }
  return {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
  };
}

function compileSinglePassPdf(tailoredData, options = {}, layoutTuning = {}) {
  return new Promise((resolve, reject) => {
    try {
      const {
        template = 'ats-classic',
        font = 'Helvetica',
        accentColor = 'slate',
        spacing = 'standard',
      } = options;

      const accent = resolveAccentColor(accentColor, template);
      const fonts = resolveFont(font);

      // Defensively clean and sanitize tailoredData to eradicate legacy artifacts
      const cleanedData = cleanStructuredResume(tailoredData || {});

      const allProjects = Array.isArray(cleanedData?.projects) ? cleanedData.projects : [];
      const experience = Array.isArray(cleanedData?.experience) ? cleanedData.experience : [];

      // Determine which projects to render on the PDF:
      // Exactly matches ResumeDocument.jsx Live Preview
      const explicitlySelected = allProjects.filter((p) => p.selected === true);
      const explicitlyExcluded = allProjects.filter((p) => p.selected === false);
      let projects;
      const isTargetOnePage = options.targetPages === 1 || options.pageBudget === 1;
      const isTargetTwoPage = options.targetPages === 2 || options.pageBudget === 2 || options.showAllProjects;

      if (isTargetTwoPage) {
        projects = allProjects;
      } else if (explicitlySelected.length > 0) {
        projects = explicitlySelected;
      } else if (explicitlyExcluded.length > 0) {
        projects = allProjects.filter((p) => p.selected !== false);
      } else if (isTargetOnePage) {
        projects = allProjects.slice(0, 3);
      } else {
        projects = allProjects;
      }

      const isLongResume = projects.length >= 4 || experience.length >= 3;

      // Intelligent pagination tuning: 1-page for short, 2-page for 4-7 projects
      const margin = layoutTuning.margin !== undefined ? layoutTuning.margin : (isLongResume ? 34 : spacing === 'compact' ? 32 : spacing === 'relaxed' ? 44 : 36);
      const bodySize = layoutTuning.bodySize !== undefined ? layoutTuning.bodySize : (isLongResume ? 9.2 : spacing === 'compact' ? 9.2 : spacing === 'relaxed' ? 10.2 : 9.8);
      const leadingGap = layoutTuning.leadingGap !== undefined ? layoutTuning.leadingGap : (isLongResume ? 1.8 : spacing === 'compact' ? 1.8 : spacing === 'relaxed' ? 3.0 : 2.2);
      const maxPages = layoutTuning.maxPages !== undefined ? layoutTuning.maxPages : (isLongResume ? 2 : 1);

      const doc = new PDFDocument({
        size: 'A4',
        margin,
        autoFirstPage: true,
        bufferPages: true,
        pdfVersion: '1.4', // Standard PDF 1.4 for universal ATS and viewer compatibility
        info: {
          Title: `${cleanedData?.basics?.name || 'Resume'} - Tailored Resume`,
          Author: cleanedData?.basics?.name || 'ResumeMatch AI',
          Subject: 'Tailored Resume',
          Keywords: 'resume, cv, career, job application, ats',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const contentWidth = pageWidth - margin * 2;
      const bottomLimit = pageHeight - margin - 22;

      const checkBlockBreak = (neededHeight = 45) => {
        if (doc.y + neededHeight > bottomLimit) {
          // If we are at the maximum page limit, tighten spacing rather than creating an extra page
          if (doc.bufferedPageRange().count < maxPages) {
            doc.addPage();
            doc.y = margin;
            return true;
          }
        }
        return false;
      };

      const basics = cleanedData?.basics || {};
      const summary = cleanedData?.summary || '';
      const skills = Array.isArray(cleanedData?.skills) ? cleanedData.skills : [];
      const education = Array.isArray(cleanedData?.education) ? cleanedData.education : [];
      const certifications = Array.isArray(cleanedData?.certifications) ? cleanedData.certifications : [];
      const achievements = Array.isArray(cleanedData?.achievements) ? cleanedData.achievements : [];

      // Unified, professional contact block renderer:
      // Prevents awkward line-breaks across middle of URLs, eliminates spurious "GitHub, VS",
      // and organizes contact items into balanced, readable rows.
      const renderContactRows = (align = 'left') => {
        const email = (basics.email || '').trim();
        const phone = (basics.phone || '').trim();
        const location = (basics.location || '').trim();
        const linkedin = (basics.linkedin || '').trim();
        const github = (basics.github || '').trim();
        const portfolio = (basics.portfolio || '').trim();

        const cleanLinkedin = linkedin.replace(/^https?:\/\/(www\.)?/, '');
        const cleanGithub = github.replace(/^https?:\/\/(www\.)?/, '');
        const cleanPortfolio = portfolio.replace(/^https?:\/\/(www\.)?/, '');

        const row1 = [email, phone, location].filter(Boolean);
        const row2 = [cleanLinkedin, cleanGithub, cleanPortfolio].filter(Boolean);

        const sep = template === 'ats-classic' ? '  |  ' : template === 'minimal-elegant' ? '  ·  ' : '  |  ';
        const contactColor = template === 'ats-classic' ? '#374151' : '#475569';

        doc.font(fonts.regular).fontSize(bodySize - 0.7).fillColor(contactColor);

        // If total items <= 3 and fits single line width
        const combined = [...row1, ...row2];
        const combinedStr = combined.join(sep);
        const singleLineWidth = doc.widthOfString(combinedStr);

        if (combined.length <= 3 && singleLineWidth < contentWidth - 10) {
          doc.text(combinedStr, margin, doc.y, { align, width: contentWidth, lineBreak: false });
        } else {
          // Render two intentional, well-spaced lines
          if (row1.length > 0) {
            doc.text(row1.join(sep), margin, doc.y, { align, width: contentWidth, lineBreak: false });
            doc.moveDown(0.18);
          }
          if (row2.length > 0) {
            doc.text(row2.join(sep), margin, doc.y, { align, width: contentWidth, lineBreak: false });
          }
        }
      };

      // ==================== HEADER ====================
      if (template === 'minimal-elegant') {
        doc
          .font(fonts.bold)
          .fontSize(20)
          .fillColor(template === 'ats-classic' ? '#111827' : accent)
          .text(basics.name || 'Candidate Name', { align: 'center', characterSpacing: 0.5 });

        if (basics.headline) {
          doc
            .font(fonts.regular)
            .fontSize(bodySize + 0.5)
            .fillColor('#555555')
            .text(basics.headline, { align: 'center', characterSpacing: 0.3 });
          doc.moveDown(0.15);
        }

        renderContactRows('center');
        doc.moveDown(0.4);
        doc
          .strokeColor('#E0D8DE')
          .lineWidth(0.8)
          .moveTo(margin, doc.y)
          .lineTo(pageWidth - margin, doc.y)
          .stroke();
        doc.moveDown(0.5);
      } else if (template === 'ats-classic') {
        // ATS Classic: strict clean single column
        doc
          .font(fonts.bold)
          .fontSize(19)
          .fillColor('#111827')
          .text(basics.name || 'Candidate Name', { align: 'left' });

        if (basics.headline) {
          doc
            .font(fonts.regular)
            .fontSize(bodySize + 0.5)
            .fillColor('#374151')
            .text(basics.headline);
          doc.moveDown(0.15);
        }

        renderContactRows('left');
        doc.moveDown(0.3);
        doc
          .strokeColor('#1F2937')
          .lineWidth(1)
          .moveTo(margin, doc.y)
          .lineTo(pageWidth - margin, doc.y)
          .stroke();
        doc.moveDown(0.4);
      } else if (template === 'technical-developer') {
        // Technical / Developer: Prominent links and badges
        doc
          .font(fonts.bold)
          .fontSize(20)
          .fillColor(accent)
          .text(basics.name || 'Candidate Name', { align: 'left' });

        if (basics.headline) {
          doc
            .font(fonts.regular)
            .fontSize(bodySize + 0.5)
            .fillColor('#334155')
            .text(basics.headline);
          doc.moveDown(0.15);
        }

        renderContactRows('left');
        doc.moveDown(0.35);
        doc
          .strokeColor(accent)
          .lineWidth(1.2)
          .moveTo(margin, doc.y)
          .lineTo(pageWidth - margin, doc.y)
          .stroke();
        doc.moveDown(0.5);
      } else {
        // Modern Professional (default)
        doc
          .font(fonts.bold)
          .fontSize(20)
          .fillColor(accent)
          .text(basics.name || 'Candidate Name');

        if (basics.headline) {
          doc
            .font(fonts.regular)
            .fontSize(bodySize + 0.5)
            .fillColor('#475569')
            .text(basics.headline);
          doc.moveDown(0.15);
        }

        renderContactRows('left');
        doc.moveDown(0.35);
        doc
          .strokeColor(accent)
          .lineWidth(1.2)
          .moveTo(margin, doc.y)
          .lineTo(pageWidth - margin, doc.y)
          .stroke();
        doc.moveDown(0.5);
      }

      // Section Heading Renderer with Orphan Prevention
      const renderSectionHeading = (title) => {
        checkBlockBreak(48); // Ensure heading + at least one item fit together

        if (template === 'ats-classic') {
          doc
            .font(fonts.bold)
            .fontSize(bodySize + 1.2)
            .fillColor('#111827')
            .text(title.toUpperCase());
          doc
            .strokeColor('#374151')
            .lineWidth(0.8)
            .moveTo(margin, doc.y + 1)
            .lineTo(pageWidth - margin, doc.y + 1)
            .stroke();
          doc.moveDown(0.35);
        } else if (template === 'minimal-elegant') {
          doc
            .font(fonts.bold)
            .fontSize(bodySize + 1.2)
            .fillColor(accent)
            .text(title, { characterSpacing: 0.4 });
          doc
            .strokeColor('#E2E8F0')
            .lineWidth(0.6)
            .moveTo(margin, doc.y + 1)
            .lineTo(pageWidth - margin, doc.y + 1)
            .stroke();
          doc.moveDown(0.35);
        } else if (template === 'technical-developer') {
          doc
            .font(fonts.bold)
            .fontSize(bodySize + 1.2)
            .fillColor(accent)
            .text(title.toUpperCase());
          doc
            .strokeColor(accent)
            .lineWidth(0.8)
            .moveTo(margin, doc.y + 1)
            .lineTo(margin + 100, doc.y + 1)
            .stroke();
          doc
            .strokeColor('#CBD5E1')
            .lineWidth(0.5)
            .moveTo(margin + 102, doc.y + 1)
            .lineTo(pageWidth - margin, doc.y + 1)
            .stroke();
          doc.moveDown(0.35);
        } else {
          doc
            .font(fonts.bold)
            .fontSize(bodySize + 1.2)
            .fillColor(accent)
            .text(title);
          doc
            .strokeColor(accent)
            .lineWidth(0.8)
            .moveTo(margin, doc.y + 1)
            .lineTo(pageWidth - margin, doc.y + 1)
            .stroke();
          doc.moveDown(0.35);
        }
      };

      // Bullet Point Renderer
      const renderBullets = (bullets = []) => {
        if (!Array.isArray(bullets)) return;
        bullets.forEach((bullet) => {
          const text = typeof bullet === 'string' ? bullet.trim() : '';
          if (!text) return;

          const bulletIndent = 11;
          const currentY = doc.y;

          doc
            .font(fonts.regular)
            .fontSize(bodySize - 1)
            .fillColor(template === 'ats-classic' ? '#374151' : '#334155')
            .text('•', margin, currentY);

          doc
            .font(fonts.regular)
            .fontSize(bodySize)
            .fillColor(template === 'ats-classic' ? '#1F2937' : '#1E293B')
            .text(text, margin + bulletIndent, currentY, {
              width: contentWidth - bulletIndent,
              lineGap: leadingGap,
            });

          doc.moveDown(0.15);
        });
      };

      const sectionOrder =
        template === 'technical-developer'
          ? ['summary', 'skills', 'projects', 'experience', 'education', 'certifications', 'achievements']
          : ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'];

      sectionOrder.forEach((sectionKey) => {
        if (sectionKey === 'summary' && summary) {
          renderSectionHeading('Professional Summary');
          doc
            .font(fonts.regular)
            .fontSize(bodySize)
            .fillColor(template === 'ats-classic' ? '#1F2937' : '#334155')
            .text(summary, {
              align: 'justify',
              lineGap: leadingGap,
              width: contentWidth,
            });
          doc.moveDown(0.3);
        } else if (sectionKey === 'skills' && skills.length) {
          renderSectionHeading('Technical Skills');
          skills.forEach((cat) => {
            const catName = cat.category || cat.name || 'Skills';
            const items = Array.isArray(cat.items)
              ? cat.items.join(', ')
              : Array.isArray(cat.skills)
              ? cat.skills.join(', ')
              : String(cat.items || cat.skills || '');

            doc
              .font(fonts.bold)
              .fontSize(bodySize)
              .fillColor(template === 'ats-classic' ? '#111827' : '#1E293B')
              .text(`${catName}: `, { continued: true });
            doc
              .font(fonts.regular)
              .fontSize(bodySize)
              .fillColor(template === 'ats-classic' ? '#374151' : '#334155')
              .text(items, { lineGap: leadingGap });
            doc.moveDown(0.1);
          });
          doc.moveDown(0.3);
        } else if (sectionKey === 'experience' && experience.length) {
          renderSectionHeading(template === 'ats-classic' ? 'Experience' : 'Work Experience');
          experience.forEach((job) => {
            checkBlockBreak(45);
            const role = job.role || job.title || 'Role';
            const company = job.company || 'Company';
            const dates = job.dates || job.date || '';
            const location = job.location || '';

            const rowY = doc.y;
            doc
              .font(fonts.bold)
              .fontSize(bodySize + 0.3)
              .fillColor(template === 'ats-classic' ? '#111827' : accent)
              .text(role, margin, rowY, { continued: false });

            if (dates) {
              doc
                .font(fonts.bold)
                .fontSize(bodySize - 0.5)
                .fillColor('#64748B')
                .text(dates, margin, rowY, { align: 'right', width: contentWidth });
            }

            const subY = doc.y;
            doc
              .font(fonts.italic)
              .fontSize(bodySize - 0.2)
              .fillColor(template === 'ats-classic' ? '#374151' : '#475569')
              .text(`${company}${location ? ` · ${location}` : ''}`, margin, subY);

            doc.moveDown(0.18);
            renderBullets(job.bullets);
            doc.moveDown(0.25);
          });
        } else if (sectionKey === 'projects' && projects.length) {
          renderSectionHeading(template === 'ats-classic' ? 'Projects' : 'Key Projects');
          projects.forEach((proj) => {
            checkBlockBreak(48); // Ensure project title and at least 1 bullet stay together
            const name = proj.name || proj.title || 'Project';
            const tech = proj.technologies || proj.tech || '';
            const dates = proj.dates || proj.date || '';
            const link = proj.link || '';

            const rowY = doc.y;
            // ONLY project name gets heading bold styling!
            doc
              .font(fonts.bold)
              .fontSize(bodySize + 0.3)
              .fillColor(template === 'ats-classic' ? '#111827' : accent)
              .text(name, margin, rowY, { continued: false });

            if (dates) {
              doc
                .font(fonts.regular)
                .fontSize(bodySize - 0.5)
                .fillColor('#64748B')
                .text(dates, margin, rowY, { align: 'right', width: contentWidth });
            }

            // Technologies and link are clean body text (never heading)
            if (tech || link) {
              doc
                .font(fonts.italic)
                .fontSize(bodySize - 0.3)
                .fillColor('#4B5563')
                .text(`${tech ? `Technologies: ${tech}` : ''}${tech && link ? '  |  ' : ''}${link ? `Link: ${link}` : ''}`);
            }

            doc.moveDown(0.16);
            renderBullets(proj.bullets);
            doc.moveDown(0.24);
          });
        } else if (sectionKey === 'education' && education.length) {
          renderSectionHeading('Education');
          education.forEach((edu) => {
            checkBlockBreak(35);
            const degree = edu.degree || edu.qualification || 'Degree';
            const institution = edu.institution || edu.school || 'Institution';
            const dates = edu.dates || edu.date || '';
            const details = edu.gpa || edu.details || '';

            const rowY = doc.y;
            doc
              .font(fonts.bold)
              .fontSize(bodySize + 0.3)
              .fillColor(template === 'ats-classic' ? '#111827' : accent)
              .text(institution, margin, rowY);

            if (dates) {
              doc
                .font(fonts.regular)
                .fontSize(bodySize - 0.5)
                .fillColor('#64748B')
                .text(dates, margin, rowY, { align: 'right', width: contentWidth });
            }

            doc
              .font(fonts.regular)
              .fontSize(bodySize)
              .fillColor(template === 'ats-classic' ? '#374151' : '#334155')
              .text(`${degree}${details ? ` — ${details}` : ''}`);

            renderBullets(edu.bullets);
            doc.moveDown(0.2);
          });
        } else if (sectionKey === 'certifications' && certifications.length) {
          renderSectionHeading('Certifications & Credentials');
          certifications.forEach((cert) => {
            checkBlockBreak(22);
            const name = typeof cert === 'string' ? cert : cert.name || '';
            const issuer = cert.issuer ? ` · ${cert.issuer}` : '';
            const date = cert.date ? ` (${cert.date})` : '';

            doc
              .font(fonts.regular)
              .fontSize(bodySize)
              .fillColor(template === 'ats-classic' ? '#374151' : '#1E293B')
              .text(`• ${name}${issuer}${date}`, { lineGap: leadingGap });
          });
          doc.moveDown(0.2);
        } else if (sectionKey === 'achievements' && achievements.length) {
          renderSectionHeading(template === 'ats-classic' ? 'Achievements & Activities' : 'Achievements & Activities');
          achievements.forEach((ach) => {
            checkBlockBreak(22);
            const text = typeof ach === 'string' ? ach : ach.name || ach.description || '';
            if (!text) return;
            doc
              .font(fonts.regular)
              .fontSize(bodySize)
              .fillColor(template === 'ats-classic' ? '#374151' : '#1E293B')
              .text(`• ${text}`, { lineGap: leadingGap });
          });
          doc.moveDown(0.2);
        }
      });

      // Page numbering footer if multiple pages (no footer if 1 page)
      const range = doc.bufferedPageRange();
      if (range.count > 1) {
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(i);
          const origBottom = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;
          doc
            .font(fonts.regular)
            .fontSize(8)
            .fillColor('#9CA3AF')
            .text(`Page ${i + 1} of ${range.count}`, margin, pageHeight - 20, {
              align: 'center',
              width: contentWidth,
              lineBreak: false,
            });
          doc.page.margins.bottom = origBottom;
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateResumePdf(tailoredData, options = {}) {
  // Pass 1: standard compilation
  let buffer = await compileSinglePassPdf(tailoredData, options, {});

  // If 1-page target is requested (or default when targetPages === 1 or pageBudget === 1)
  const isStrictOnePage = (options.targetPages === 1 || options.pageBudget === 1) && !options.showAllProjects && options.targetPages !== 2;
  if (isStrictOnePage) {
    try {
      const parsed = await pdfParse(buffer);
      if (parsed.numpages > 1) {
        // Pass 2: moderate tightening
        buffer = await compileSinglePassPdf(tailoredData, options, {
          margin: 30,
          bodySize: 9.0,
          leadingGap: 1.6,
        });
        const parsed2 = await pdfParse(buffer);
        if (parsed2.numpages > 1) {
          // Pass 3: maximum safe tightening
          buffer = await compileSinglePassPdf(tailoredData, options, {
            margin: 26,
            bodySize: 8.5,
            leadingGap: 1.2,
          });
        }
      }
    } catch (parseErr) {
      console.warn('PDF page count validation warning:', parseErr.message);
    }
  }

  return buffer;
}
