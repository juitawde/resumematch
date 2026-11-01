import mongoose from 'mongoose';

const UserSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user', unique: true },
    profile: {
      name: { type: String, default: 'Jui Tawde' },
      email: { type: String, default: 'juitawde23@gmail.com' },
      headline: { type: String, default: 'Full Stack Developer | React.js | Node.js' },
      accountType: { type: String, default: 'Career Workspace (Personal)' },
      location: { type: String, default: 'Mumbai, India' },
    },
    resumePreferences: {
      defaultTemplate: { type: String, default: 'ats-classic' },
      defaultFont: { type: String, default: 'Inter' },
      defaultSpacing: { type: String, default: 'standard' },
      defaultPagePreference: { type: String, default: 'one-page' },
      dateFormat: { type: String, default: 'Month Year' },
    },
    aiPersonalization: {
      tone: { type: String, default: 'Professional' },
      descriptionStyle: { type: String, default: 'Achievement-focused' },
      projectLength: { type: String, default: 'Compact' },
      actionVerbStyle: { type: String, default: 'Executive Action-Driven' },
      optimizationEmphasis: { type: String, default: 'Balanced' },
    },
    appearance: {
      density: { type: String, default: 'Standard' },
      theme: { type: String, default: 'Light' },
    },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.UserSettings || mongoose.model('UserSettings', UserSettingsSchema);

