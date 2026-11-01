import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, default: 'Target role' },
    resumeName: String,
    jobFileName: String,
    originalScore: { type: Number, min: 0, max: 100, default: 0 },
    score: { type: Number, min: 0, max: 100, default: 0 },
    scoreDelta: { type: Number, default: 0 },
    skills: {
      matched: [mongoose.Schema.Types.Mixed],
      partial: [mongoose.Schema.Types.Mixed],
      gaps: [mongoose.Schema.Types.Mixed],
    },
    recommendations: [mongoose.Schema.Types.Mixed],
    originalResumeData: { type: mongoose.Schema.Types.Mixed, default: null },
    cleanedResumeData: { type: mongoose.Schema.Types.Mixed, default: null },
    tailoredData: { type: mongoose.Schema.Types.Mixed, default: null },
    tailoredResume: String,
    selectedTemplate: { type: String, default: 'ats-classic' },
    resumeCustomization: {
      font: { type: String, default: 'Inter' },
      accentColor: { type: String, default: 'slate' },
      spacing: { type: String, default: 'standard' },
    },
    atsOptimization: { type: mongoose.Schema.Types.Mixed, default: null },
    validation: {
      passed: Boolean,
      issues: [mongoose.Schema.Types.Mixed],
    },
    explanation: String,
    aiMode: { type: String, enum: ['ai', 'demo'], default: 'demo' },
    aiCoverage: { type: Number, default: 0 },
    stageLog: [mongoose.Schema.Types.Mixed],
    resumeText: { type: String, select: false },
    jobDescription: { type: String, select: false },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);
