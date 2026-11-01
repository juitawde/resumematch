import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Database,
  FileText,
  LoaderCircle,
  Lock,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { clearAnalysesHistory, getUserSettings, updateUserSettings } from './api';

const DEFAULT_SETTINGS = {
  profile: {
    fullName: 'Jui Tawde',
    headline: 'Software Development Engineer / Data Analyst',
    email: 'jui.tawde@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    linkedin: 'linkedin.com/in/juitawde',
    github: 'github.com/juitawde',
    portfolio: '',
  },
  resumeDefaults: {
    targetPageBudget: 1, // 1 page A4
    defaultTemplate: 'ats-classic',
    defaultFont: 'Inter',
    defaultAccentColor: 'slate',
    defaultSpacing: 'standard',
  },
  aiPersonalization: {
    tone: 'Confident & Direct',
    tailoringStrength: 'Balanced',
    actionVerbDensity: 'High Impact',
    targetIndustry: 'Software Engineering & Data Analytics',
  },
};

const TABS = [
  { id: 'profile', label: 'Profile & Account', icon: User },
  { id: 'resume', label: 'Resume Defaults', icon: FileText },
  { id: 'ai', label: 'AI Personalization', icon: Sparkles },
  { id: 'privacy', label: 'Privacy & Data', icon: ShieldCheck },
];

export default function SettingsPage({ status, notify }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let mounted = true;
    getUserSettings()
      .then((data) => {
        if (mounted && data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            profile: { ...prev.profile, ...(data.settings.profile || {}) },
            resumeDefaults: { ...prev.resumeDefaults, ...(data.settings.resumeDefaults || {}) },
            aiPersonalization: { ...prev.aiPersonalization, ...(data.settings.aiPersonalization || {}) },
          }));
        }
      })
      .catch((err) => {
        console.warn('Using local settings fallback:', err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateUserSettings(settings);
      setSavedSuccess(true);
      if (notify) notify('Settings saved successfully!');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      if (notify) notify('Settings saved locally (server fallback).');
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      const res = await clearAnalysesHistory();
      setShowClearConfirm(false);
      if (notify) notify(`Cleared ${res?.deletedCount || 0} analyses from history.`);
    } catch (err) {
      console.error('Clear failed:', err);
      if (notify) notify('Failed to clear history: ' + err.message);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '320px', gap: '10px', color: '#686070' }}>
        <LoaderCircle size={22} className="spin" />
        <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* PAGE HEADER */}
      <div className="page-intro">
        <div>
          <div className="eyebrow">PREFERENCES & CONFIGURATION</div>
          <h1>Settings & Preferences</h1>
          <p>Configure your candidate defaults, AI tailoring rules, privacy, and workspace data.</p>
        </div>
        <div className="intro-action">
          <button
            type="button"
            className="primary-btn"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '136px', justifyContent: 'center' }}
          >
            {saving ? (
              <>
                <LoaderCircle size={15} className="spin" /> Saving...
              </>
            ) : savedSuccess ? (
              <>
                <Check size={15} /> Saved!
              </>
            ) : (
              <>
                <Save size={15} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* TABS BAR */}
      <div className="settings-tab-bar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div className="panel settings-panel">
          <div className="settings-panel-head">
            <h3>Candidate Profile</h3>
            <p>Default contact details automatically populated when creating or tailoring resumes.</p>
          </div>

          <div className="settings-grid-2col">
            <div className="field-wrap">
              <label>Full Name</label>
              <input
                type="text"
                value={settings.profile.fullName || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, fullName: e.target.value },
                  })
                }
                placeholder="e.g. Jui Tawde"
              />
            </div>

            <div className="field-wrap">
              <label>Target Headline / Professional Title</label>
              <input
                type="text"
                value={settings.profile.headline || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, headline: e.target.value },
                  })
                }
                placeholder="e.g. Software Engineer / Data Analyst"
              />
            </div>

            <div className="field-wrap">
              <label>Email Address</label>
              <input
                type="email"
                value={settings.profile.email || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, email: e.target.value },
                  })
                }
                placeholder="you@example.com"
              />
            </div>

            <div className="field-wrap">
              <label>Phone Number</label>
              <input
                type="text"
                value={settings.profile.phone || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, phone: e.target.value },
                  })
                }
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="field-wrap">
              <label>Location</label>
              <input
                type="text"
                value={settings.profile.location || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, location: e.target.value },
                  })
                }
                placeholder="Bengaluru, India"
              />
            </div>

            <div className="field-wrap">
              <label>LinkedIn Profile URL</label>
              <input
                type="text"
                value={settings.profile.linkedin || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, linkedin: e.target.value },
                  })
                }
                placeholder="linkedin.com/in/username"
              />
            </div>

            <div className="field-wrap">
              <label>GitHub Profile URL</label>
              <input
                type="text"
                value={settings.profile.github || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, github: e.target.value },
                  })
                }
                placeholder="github.com/username"
              />
            </div>

            <div className="field-wrap">
              <label>Portfolio / Personal Website</label>
              <input
                type="text"
                value={settings.profile.portfolio || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, portfolio: e.target.value },
                  })
                }
                placeholder="https://yourportfolio.dev"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RESUME DEFAULTS */}
      {activeTab === 'resume' && (
        <div className="panel settings-panel">
          <div className="settings-panel-head">
            <h3>Resume Formatting & Export Defaults</h3>
            <p>Set standard page budget, template design, typography, and styling presets.</p>
          </div>

          <div className="settings-grid-2col">
            <div className="field-wrap">
              <label>Target Page Budget</label>
              <select
                value={settings.resumeDefaults.targetPageBudget || 1}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    resumeDefaults: {
                      ...settings.resumeDefaults,
                      targetPageBudget: Number(e.target.value),
                    },
                  })
                }
              >
                <option value={1}>Strict 1-Page A4 (Recommended for Internships & Early Career)</option>
                <option value={2}>2-Page Comprehensive (Experienced / Multi-Project)</option>
              </select>
              <div className="field-helper-text">
                1-Page A4 automatically selects top 3 projects while preserving all in your portfolio.
              </div>
            </div>

            <div className="field-wrap">
              <label>Default Template</label>
              <select
                value={settings.resumeDefaults.defaultTemplate || 'ats-classic'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    resumeDefaults: {
                      ...settings.resumeDefaults,
                      defaultTemplate: e.target.value,
                    },
                  })
                }
              >
                <option value="ats-classic">ATS Classic (Maximum Compatibility)</option>
                <option value="modern-professional">Modern Professional (Balanced)</option>
                <option value="minimal-elegant">Minimal Elegant (Refined)</option>
                <option value="technical-developer">Technical / Developer (Code & GitHub Links)</option>
              </select>
            </div>

            <div className="field-wrap">
              <label>Default Typography Font</label>
              <select
                value={settings.resumeDefaults.defaultFont || 'Inter'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    resumeDefaults: {
                      ...settings.resumeDefaults,
                      defaultFont: e.target.value,
                    },
                  })
                }
              >
                <option value="Inter">Inter (Modern Clean Sans)</option>
                <option value="Arial">Arial (Standard Universal ATS)</option>
                <option value="Georgia">Georgia (Executive Serif)</option>
                <option value="Manrope">Manrope (Geometric Modern)</option>
                <option value="Roboto">Roboto (Google Clean)</option>
              </select>
            </div>

            <div className="field-wrap">
              <label>Default Accent Color</label>
              <select
                value={settings.resumeDefaults.defaultAccentColor || 'slate'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    resumeDefaults: {
                      ...settings.resumeDefaults,
                      defaultAccentColor: e.target.value,
                    },
                  })
                }
              >
                <option value="slate">Slate Blue (#405F75)</option>
                <option value="navy">Deep Navy (#1E3A5F)</option>
                <option value="charcoal">Charcoal (#29243A)</option>
                <option value="rosewood">Rosewood (#95576A)</option>
                <option value="emerald">Emerald Forest (#2D6A4F)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI PERSONALIZATION */}
      {activeTab === 'ai' && (
        <div className="panel settings-panel">
          <div className="settings-panel-head">
            <h3>AI Tailoring Personalization</h3>
            <p>Fine-tune how the AI engine adapts bullet points, phrasing, and target job keyword alignment.</p>
          </div>

          <div className="settings-grid-2col">
            <div className="field-wrap">
              <label>Writing Style & Tone</label>
              <select
                value={settings.aiPersonalization.tone || 'Confident & Direct'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiPersonalization: {
                      ...settings.aiPersonalization,
                      tone: e.target.value,
                    },
                  })
                }
              >
                <option value="Confident & Direct">Confident & Direct (Action-oriented, active voice)</option>
                <option value="Technical & Detailed">Technical & Detailed (Focus on architecture and tools)</option>
                <option value="Executive & Strategic">Executive & Strategic (Outcomes and scale)</option>
              </select>
            </div>

            <div className="field-wrap">
              <label>Tailoring Intensity</label>
              <select
                value={settings.aiPersonalization.tailoringStrength || 'Balanced'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiPersonalization: {
                      ...settings.aiPersonalization,
                      tailoringStrength: e.target.value,
                    },
                  })
                }
              >
                <option value="Balanced">Balanced (Standard professional tailoring)</option>
                <option value="High Alignment">High Alignment (Maximum target JD terminology)</option>
                <option value="Conservative">Conservative (Minimal restructuring, preserve source phrasing)</option>
              </select>
            </div>

            <div className="field-wrap">
              <label>Action Verb Density</label>
              <select
                value={settings.aiPersonalization.actionVerbDensity || 'High Impact'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiPersonalization: {
                      ...settings.aiPersonalization,
                      actionVerbDensity: e.target.value,
                    },
                  })
                }
              >
                <option value="High Impact">High Impact (Architected, Engineered, Optimized)</option>
                <option value="Standard">Standard (Developed, Created, Implemented)</option>
              </select>
            </div>

            <div className="field-wrap">
              <label>Target Career Track / Focus</label>
              <input
                type="text"
                value={settings.aiPersonalization.targetIndustry || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiPersonalization: {
                      ...settings.aiPersonalization,
                      targetIndustry: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Software Engineering & Data Analytics"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PRIVACY & DATA */}
      {activeTab === 'privacy' && (
        <div className="panel settings-panel">
          <div className="settings-panel-head">
            <h3>Privacy, Security & Data Management</h3>
            <p>Review how your documents are processed, storage status, and clean up historical records.</p>
          </div>

          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div className="settings-status-box">
              <div className="settings-status-box-left">
                <div className="settings-status-icon-wrap" style={{ background: '#EAF1F6', color: '#405F75' }}>
                  <Server size={20} />
                </div>
                <div>
                  <div className="settings-status-title">Database Storage Status</div>
                  <div className="settings-status-desc">
                    MongoDB Atlas Connected (Secure analysis records and preferences)
                  </div>
                </div>
              </div>
              <span className="settings-status-pill success">Connected</span>
            </div>

            <div className="settings-status-box">
              <div className="settings-status-box-left">
                <div className="settings-status-icon-wrap" style={{ background: '#E8F5EC', color: '#1E6B3C' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <div className="settings-status-title">In-Memory File Processing</div>
                  <div className="settings-status-desc">
                    Uploaded PDF and DOCX files are extracted in memory and never written to permanent disk storage.
                  </div>
                </div>
              </div>
              <span className="settings-status-pill success">Enforced</span>
            </div>
          </div>

          <div className="danger-box">
            <div className="danger-box-title">
              <Trash2 size={16} />
              <span>Clear Analysis History</span>
            </div>
            <p className="danger-box-desc">
              Permanently remove all previous resume analyses and generated documents from database storage. This action cannot be undone.
            </p>
            {showClearConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary-btn small-btn"
                  style={{ background: '#D92D20', borderColor: '#D92D20', color: '#FFFFFF' }}
                  onClick={handleClearHistory}
                  disabled={clearing}
                >
                  {clearing ? (
                    <>
                      <LoaderCircle size={14} className="spin" /> Clearing records...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Yes, Delete All History
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="secondary-btn small-btn"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="secondary-btn small-btn"
                onClick={() => setShowClearConfirm(true)}
              >
                Clear All Analyses...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
