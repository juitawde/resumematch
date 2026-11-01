import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(SERVER_DIR, '../.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import { extractText } from './services/extractText.js';
import {
  runWorkflow,
  tailorWorkflow,
  validateWorkflow,
  formatResumeText,
  buildStructuredResumeFallback,
  buildAtsOptimization,
} from './services/workflow.js';
import { generateResumePdf } from './services/pdfGenerator.js';
import Analysis from './models/Analysis.js';
import UserSettings from './models/UserSettings.js';
import { checkAIConnection, aiConfigured } from './services/aiProvider.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';
const memoryStore = new Map();

// Helper to gather allowed origins from environment
function getAllowedOrigins() {
  const allowed = new Set();

  // 1. Explicit production frontend URL from environment
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').forEach((url) => {
      const clean = url.trim().replace(/\/+$/, '');
      if (clean) allowed.add(clean);
    });
  }

  // 2. Additional allowed origins (comma-separated list)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((url) => {
      const clean = url.trim().replace(/\/+$/, '');
      if (clean) allowed.add(clean);
    });
  }

  // 3. Backward-compatibility: CLIENT_ORIGIN
  if (process.env.CLIENT_ORIGIN) {
    process.env.CLIENT_ORIGIN.split(',').forEach((url) => {
      const clean = url.trim().replace(/\/+$/, '');
      if (clean) allowed.add(clean);
    });
  }

  return allowed;
}

const isLocalOrigin = (origin) => {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const isVercelPreview = (origin) => {
  if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' || process.env.ALLOW_VERCEL_PREVIEWS === '1') {
    return /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin);
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server health checks)
    if (!origin) {
      return callback(null, true);
    }

    // Always allow localhost / 127.0.0.1 on any port for local development
    if (isLocalOrigin(origin)) {
      return callback(null, true);
    }

    const allowed = getAllowedOrigins();
    const normalizedOrigin = origin.replace(/\/+$/, '');

    // Allow explicitly configured production frontend domain
    if (allowed.has(normalizedOrigin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments if enabled
    if (isVercelPreview(normalizedOrigin)) {
      return callback(null, true);
    }

    // In local development / test without FRONTEND_URL configured, allow with notice
    if (process.env.NODE_ENV !== 'production' && allowed.size === 0) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin '${origin}' is not authorized. Allowed:`, Array.from(allowed));
    return callback(new Error(`CORS error: Origin '${origin}' is not allowed by Access-Control-Allow-Origin.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '4mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024,
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    const ok =
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ].includes(file.mimetype) || /\.(pdf|docx|txt)$/i.test(file.originalname);
    cb(
      ok ? null : new Error('Unsupported file type. Upload PDF, DOCX, or TXT.'),
      ok
    );
  },
});

const dbReady = () => mongoose.connection.readyState === 1;

async function saveAnalysis(data) {
  if (dbReady()) {
    const doc = await Analysis.create(data);
    return doc.toObject();
  }
  const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item = {
    ...data,
    _id: id,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.set(id, item);
  return item;
}

async function findAnalysis(id) {
  let doc = null;
  if (dbReady()) {
    if (mongoose.isValidObjectId(id)) {
      doc = await Analysis.findById(id).select('+resumeText +jobDescription').lean();
    }
  } else {
    doc = memoryStore.get(id) || null;
  }

  if (doc) {
    if (!doc.originalResumeData || !doc.cleanedResumeData) {
      // Backfill structured resume for existing older analyses
      const fb = buildStructuredResumeFallback(
        doc.resumeText || '',
        doc.jobDescription || '',
        doc.skills || {},
        doc.jobTitle || ''
      );
      if (!doc.originalResumeData) doc.originalResumeData = fb.originalResumeData;
      if (!doc.cleanedResumeData) doc.cleanedResumeData = fb.cleanedResumeData;
      if (!doc.tailoredData || !doc.tailoredData.basics) doc.tailoredData = fb.tailoredData;
      if (!doc.originalScore) doc.originalScore = fb.originalScore;
      if (doc.scoreDelta === undefined) doc.scoreDelta = fb.scoreDelta;
      if (!doc.atsOptimization) doc.atsOptimization = fb.atsOptimization;
    }
    if (!doc.selectedTemplate) doc.selectedTemplate = 'ats-classic';
    if (!doc.resumeCustomization) {
      doc.resumeCustomization = {
        font: 'Inter',
        accentColor: 'slate',
        spacing: 'standard',
      };
    }
  }

  return doc;
}

async function listAnalyses() {
  if (dbReady()) {
    return Analysis.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .select('-resumeText -jobDescription')
      .lean();
  }
  return [...memoryStore.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 100)
    .map(({ resumeText, jobDescription, ...a }) => a);
}

async function updateAnalysis(id, patch) {
  if (dbReady()) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Analysis.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
  }
  const old = memoryStore.get(id);
  if (!old) return null;
  const next = { ...old, ...patch, updatedAt: new Date() };
  memoryStore.set(id, next);
  return next;
}

// Health check
app.get('/api/health', (req, res) =>
  res.json({
    ok: true,
    service: 'ResumeMatch API',
    database: dbReady() ? 'connected' : 'memory-fallback',
    timestamp: new Date().toISOString(),
  })
);
// Convenient root & /health aliases for cloud monitors (Render / UptimeRobot)
app.get('/health', (req, res) => res.redirect('/api/health'));
app.get('/', (req, res) =>
  res.json({
    ok: true,
    service: 'ResumeMatch API',
    status: 'healthy',
    health: '/api/health',
  })
);

// Config status
app.get('/api/config/status', async (req, res) => {
  const configured = aiConfigured();
  let connection = {
    ok: false,
    reason: configured ? 'Connection not checked' : 'No AI_API_KEY found in server/.env',
  };
  if (configured) connection = await checkAIConnection();
  const live = Boolean(configured && connection.ok);

  res.json({
    mode: live ? 'ai' : configured ? 'invalid-key' : 'demo',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    aiConfigured: configured,
    aiConnected: live,
    aiError: connection.reason || null,
    aiCoverage: live ? 100 : 0,
    aiStages: [
      'resume-understanding',
      'job-description-parsing',
      'semantic-matching',
      'skill-gap-analysis',
      'recommendations',
      'resume-drafting',
      'factual-review',
      'natural-language-explanation',
    ],
    database: dbReady() ? 'mongodb' : 'memory',
  });
});

let defaultMemorySettings = {
  userId: 'default-user',
  profile: {
    name: 'Jui Tawde',
    email: 'juitawde23@gmail.com',
    headline: 'Full Stack Developer | React.js | Node.js',
    accountType: 'Career Workspace (Personal)',
    location: 'Mumbai, India',
  },
  resumePreferences: {
    defaultTemplate: 'ats-classic',
    defaultFont: 'Inter',
    defaultSpacing: 'standard',
    defaultPagePreference: 'one-page',
    dateFormat: 'Month Year',
  },
  aiPersonalization: {
    tone: 'Professional',
    descriptionStyle: 'Achievement-focused',
    projectLength: 'Compact',
    actionVerbStyle: 'Executive Action-Driven',
    optimizationEmphasis: 'Balanced',
  },
  appearance: {
    density: 'Standard',
    theme: 'Light',
  },
};

// User settings API (persists preferences & personalization)
app.get('/api/settings', async (req, res) => {
  try {
    if (dbReady()) {
      let settings = await UserSettings.findOne({ userId: 'default-user' }).lean();
      if (!settings) {
        settings = (await UserSettings.create(defaultMemorySettings)).toObject();
      }
      return res.json({ settings });
    }
    res.json({ settings: defaultMemorySettings });
  } catch (e) {
    res.status(500).json({ error: 'Could not load user settings.' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const patch = req.body || {};
    if (dbReady()) {
      const updated = await UserSettings.findOneAndUpdate(
        { userId: 'default-user' },
        { $set: patch },
        { upsert: true, new: true }
      ).lean();
      return res.json({ settings: updated, ok: true });
    }
    defaultMemorySettings = {
      ...defaultMemorySettings,
      ...patch,
      profile: { ...defaultMemorySettings.profile, ...(patch.profile || {}) },
      resumePreferences: { ...defaultMemorySettings.resumePreferences, ...(patch.resumePreferences || {}) },
      aiPersonalization: { ...defaultMemorySettings.aiPersonalization, ...(patch.aiPersonalization || {}) },
      appearance: { ...defaultMemorySettings.appearance, ...(patch.appearance || {}) },
    };
    res.json({ settings: defaultMemorySettings, ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not update user settings.' });
  }
});

// Clear all analysis history
app.post('/api/analyses/clear', async (req, res) => {
  try {
    if (dbReady()) {
      await Analysis.deleteMany({});
    } else {
      memoryStore.clear();
    }
    res.json({ ok: true, message: 'All analysis history cleared.' });
  } catch (e) {
    res.status(500).json({ error: 'Could not clear history.' });
  }
});

// List recent analyses
app.get('/api/analyses', async (req, res) => {
  try {
    res.json({ analyses: await listAnalyses() });
  } catch (e) {
    res.status(500).json({ error: 'Could not load analyses.' });
  }
});

// Create new analysis
app.post(
  '/api/analyses',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'jobFile', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const resumeFile = req.files?.resume?.[0];
      const jobFile = req.files?.jobFile?.[0];

      if (!resumeFile) return res.status(400).json({ error: 'A resume file is required.' });

      const resumeText = await extractText(resumeFile);
      const jobDescription =
        (req.body.jobDescription || '').trim() ||
        (jobFile ? await extractText(jobFile) : '');

      if (!resumeText.trim()) {
        return res.status(400).json({ error: 'The resume appears to be empty or unreadable.' });
      }
      if (!jobDescription.trim()) {
        return res.status(400).json({ error: 'Paste or upload a job description.' });
      }
      if (resumeText.length > 100000 || jobDescription.length > 60000) {
        return res
          .status(413)
          .json({ error: 'The extracted document is too long. Please use a shorter version.' });
      }

      const result = await runWorkflow({
        resumeText,
        jobDescription,
        jobTitle: req.body.jobTitle || '',
        resumeName: resumeFile.originalname,
        jobFileName: jobFile?.originalname || '',
      });

      const saved = await saveAnalysis({
        ...result,
        resumeName: resumeFile.originalname,
        jobFileName: jobFile?.originalname || '',
        resumeText,
        jobDescription,
        jobTitle: result.jobTitle || req.body.jobTitle || 'Target role',
      });

      res.status(201).json({ analysis: saved });
    } catch (e) {
      next(e);
    }
  }
);

// Get specific analysis
app.get('/api/analyses/:id', async (req, res) => {
  try {
    const analysis = await findAnalysis(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found.' });
    res.json({ analysis });
  } catch (e) {
    res.status(500).json({ error: 'Could not load analysis.' });
  }
});

// Update tailored resume content, template, and customization
app.put('/api/analyses/:id/resume', async (req, res) => {
  try {
    const old = await findAnalysis(req.params.id);
    if (!old) return res.status(404).json({ error: 'Analysis not found.' });

    const { tailoredData, selectedTemplate, resumeCustomization } = req.body;
    const patch = {};

    if (tailoredData && typeof tailoredData === 'object') {
      patch.tailoredData = tailoredData;
      patch.tailoredResume = formatResumeText(tailoredData);

      // Recalculate ATS score whenever resume content is edited
      if (old.jobDescription) {
        const atsOptimization = buildAtsOptimization(
          old.skills,
          old.jobDescription,
          old.resumeText || '',
          tailoredData,
          old.cleanedResumeData || old.originalResumeData
        );
        patch.atsOptimization = atsOptimization;
        patch.score = atsOptimization.scoreAfter;
        patch.originalScore = atsOptimization.scoreBefore;
        patch.scoreDelta = atsOptimization.scoreDelta;
      }
    }
    if (selectedTemplate) patch.selectedTemplate = selectedTemplate;
    if (resumeCustomization) patch.resumeCustomization = resumeCustomization;

    const updated = await updateAnalysis(req.params.id, patch);
    res.json({ analysis: updated });
  } catch (e) {
    console.error('Update resume error:', e);
    res.status(500).json({ error: 'Could not save resume edits.' });
  }
});

// Delete analysis
app.delete('/api/analyses/:id', async (req, res) => {
  try {
    if (dbReady()) {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Analysis not found.' });
      const r = await Analysis.findByIdAndDelete(req.params.id);
      if (!r) return res.status(404).json({ error: 'Analysis not found.' });
    } else if (!memoryStore.delete(req.params.id)) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not delete analysis.' });
  }
});

// Regenerate tailored resume (entire or selected section)
app.post('/api/analyses/:id/tailor', async (req, res) => {
  try {
    const old = await findAnalysis(req.params.id);
    if (!old) return res.status(404).json({ error: 'Analysis not found.' });

    const { focus = '', section = 'all' } = req.body;

    const tailored = await tailorWorkflow({
      resumeText: old.resumeText,
      jobDescription: old.jobDescription,
      skills: old.skills,
      focus: String(focus).slice(0, 500),
      currentTailoredData: old.tailoredData,
      cleanedResumeData: old.cleanedResumeData,
    });

    let newTailoredData = tailored.tailoredData;
    if (section && section !== 'all' && old.tailoredData) {
      newTailoredData = {
        ...old.tailoredData,
        [section]: tailored.tailoredData[section] || old.tailoredData[section],
      };
    }

    const tailoredResume = formatResumeText(newTailoredData);

    // Recalculate ATS score after tailoring operation
    const atsOptimization = buildAtsOptimization(
      old.skills,
      old.jobDescription || '',
      old.resumeText || '',
      newTailoredData,
      old.cleanedResumeData || old.originalResumeData
    );

    const updated = await updateAnalysis(req.params.id, {
      tailoredData: newTailoredData,
      tailoredResume,
      validation: tailored.validation,
      aiMode: tailored.aiMode,
      aiCoverage: tailored.aiCoverage,
      atsOptimization,
      score: atsOptimization.scoreAfter,
      originalScore: atsOptimization.scoreBefore,
      scoreDelta: atsOptimization.scoreDelta,
    });

    res.json({ analysis: updated, regeneratedSection: section });
  } catch (e) {
    console.error('Tailor error:', e);
    res.status(500).json({ error: 'Could not regenerate tailored resume.' });
  }
});

// Restore section or entire resume from cleaned or original data
app.post('/api/analyses/:id/restore', async (req, res) => {
  try {
    const analysis = await findAnalysis(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found.' });

    const { section = 'all', source = 'cleaned' } = req.body;
    const sourceData = source === 'original'
      ? (analysis.originalResumeData || analysis.cleanedResumeData)
      : (analysis.cleanedResumeData || analysis.originalResumeData);

    if (!sourceData) {
      return res.status(400).json({ error: 'No source resume data found to restore from.' });
    }

    let updatedTailored = { ...(analysis.tailoredData || {}) };

    if (section === 'all') {
      updatedTailored = JSON.parse(JSON.stringify(sourceData));
    } else if (['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'basics'].includes(section)) {
      updatedTailored[section] = JSON.parse(JSON.stringify(sourceData[section]));
    } else {
      return res.status(400).json({ error: `Invalid section: ${section}` });
    }

    const tailoredResume = formatResumeText(updatedTailored);

    // Recalculate ATS score after restoration
    const atsOptimization = buildAtsOptimization(
      analysis.skills,
      analysis.jobDescription || '',
      analysis.resumeText || '',
      updatedTailored,
      analysis.cleanedResumeData || analysis.originalResumeData
    );

    const updated = await updateAnalysis(req.params.id, {
      tailoredData: updatedTailored,
      tailoredResume,
      atsOptimization,
      score: atsOptimization.scoreAfter,
      originalScore: atsOptimization.scoreBefore,
      scoreDelta: atsOptimization.scoreDelta,
    });

    res.json({ analysis: updated, restoredSection: section });
  } catch (e) {
    console.error('Restore error:', e);
    res.status(500).json({ error: 'Failed to restore resume section.' });
  }
});

// Validate tailored resume claims
app.post('/api/analyses/:id/validate', async (req, res) => {
  try {
    const old = await findAnalysis(req.params.id);
    if (!old) return res.status(404).json({ error: 'Analysis not found.' });

    const tailoredData = req.body.tailoredData || old.tailoredData;
    const tailoredResume = req.body.tailoredResume || old.tailoredResume || formatResumeText(tailoredData);

    const validation = await validateWorkflow({
      resumeText: old.resumeText,
      jobDescription: old.jobDescription,
      tailoredResume,
      tailoredData,
    });

    const updated = await updateAnalysis(req.params.id, { validation });
    res.json({ analysis: updated, validation });
  } catch (e) {
    console.error('Validation error:', e);
    res.status(500).json({ error: 'Could not validate tailored resume.' });
  }
});

// Helper for sanitized filename
function makeSanitizedPdfFilename(tailoredData, jobTitle) {
  const candidate = (tailoredData?.basics?.name || 'Resume')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .join('_');

  const role = (jobTitle || 'Tailored_Role')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 4)
    .join('_');

  return `${candidate}_${role}_Resume.pdf`.replace(/_+/g, '_');
}

// Generate & download PDF (GET & POST)
async function handlePdfExport(req, res) {
  try {
    const analysis = await findAnalysis(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found.' });

    const body = req.body || {};
    const tailoredData = body.tailoredData || analysis.tailoredData;
    const template = body.selectedTemplate || req.query.template || analysis.selectedTemplate || 'ats-classic';
    const customization = body.resumeCustomization || analysis.resumeCustomization || {};

    const pdfBuffer = await generateResumePdf(tailoredData, {
      template,
      font: customization.font || 'Helvetica',
      accentColor: customization.accentColor || 'slate',
      spacing: customization.spacing || 'standard',
      pageBudget: customization.pageBudget || analysis.pageBudget || 1,
      targetPages: customization.targetPages || 1,
    });

    const filename = makeSanitizedPdfFilename(tailoredData, analysis.jobTitle);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) {
    console.error('PDF export error:', e);
    res.status(500).json({ error: 'Failed to generate PDF document.' });
  }
}

app.get('/api/analyses/:id/pdf', handlePdfExport);
app.post('/api/analyses/:id/pdf', handlePdfExport);

// Export JSON report
app.get('/api/analyses/:id/report', async (req, res) => {
  const a = await findAnalysis(req.params.id);
  if (!a) return res.status(404).json({ error: 'Analysis not found.' });
  const { resumeText, jobDescription, ...safe } = a;
  res.json(safe);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error:
        err.code === 'LIMIT_FILE_SIZE'
          ? `File is too large. Maximum upload size is ${process.env.MAX_UPLOAD_MB || 8} MB.`
          : err.message,
    });
  }
  if (err.message?.startsWith('Unsupported file type')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({
    error: 'Unexpected server error. Check the API terminal for details.',
  });
});

try {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');
  } else {
    console.warn('MONGODB_URI missing: using temporary in-memory history.');
  }
} catch (e) {
  console.error('MongoDB connection failed; using in-memory history:', e.message);
}

app.listen(PORT, HOST, () => {
  console.log(`ResumeMatch API listening on http://${HOST}:${PORT} (port: ${PORT})`);
});
