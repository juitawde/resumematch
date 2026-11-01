import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  Layers,
  LayoutTemplate,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Minus,
  Palette,
  Plus,
  Printer,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Type,
  User,
  WandSparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { exportResumePdf, fetchResumePdfBlob, getAnalysis, tailorAnalysis, updateResume, validateAnalysis, restoreResume } from './api';
import ResumeDocument from './ResumeDocument';
import AtsOptimizationModal from './AtsOptimizationModal';
import ResumeComparisonModal from './ResumeComparisonModal';

const TEMPLATES = [
  {
    id: 'ats-classic',
    name: 'ATS Classic',
    desc: 'Single-column, zero-fluff ATS formatting.',
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    desc: 'Contemporary layout with balanced hierarchy.',
  },
  {
    id: 'minimal-elegant',
    name: 'Minimal Elegant',
    desc: 'Generous whitespace and refined styling.',
  },
  {
    id: 'technical-developer',
    name: 'Technical / Developer',
    desc: 'Prominent skills, projects, and repository links.',
  },
];

const FONTS = [
  { id: 'Inter', name: 'Inter (Clean Sans)' },
  { id: 'Manrope', name: 'Manrope (Modern)' },
  { id: 'Arial', name: 'Arial (ATS Standard)' },
  { id: 'Georgia', name: 'Georgia (Refined Serif)' },
  { id: 'Roboto', name: 'Roboto (Geometric)' },
];

const COLORS = [
  { id: 'slate', name: 'Slate Blue', hex: '#405F75' },
  { id: 'navy', name: 'Deep Navy', hex: '#1E3A5F' },
  { id: 'charcoal', name: 'Charcoal', hex: '#29243A' },
  { id: 'rosewood', name: 'Rosewood', hex: '#95576A' },
  { id: 'emerald', name: 'Emerald', hex: '#2D6A4F' },
];

export default function ResumeWorkspace({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [tailoredData, setTailoredData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('ats-classic');
  const [customization, setCustomization] = useState({
    font: 'Inter',
    accentColor: 'slate',
    spacing: 'standard',
  });

  // Editor states
  const [activeTab, setActiveTab] = useState('basics'); // 'basics' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications'
  const [mobileView, setMobileView] = useState('editor'); // 'editor' | 'preview'
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'dirty'
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenFocus, setRegenFocus] = useState('');
  const [regenSection, setRegenSection] = useState('all');
  const [regenerating, setRegenerating] = useState(false);

  // Load analysis
  useEffect(() => {
    setLoading(true);
    getAnalysis(id)
      .then((d) => {
        const a = d.analysis;
        setAnalysis(a);
        if (a.tailoredData) setTailoredData(a.tailoredData);
        if (a.selectedTemplate) setSelectedTemplate(a.selectedTemplate);
        if (a.resumeCustomization) setCustomization(a.resumeCustomization);
        if (a.validation) setValidationResult(a.validation);
      })
      .catch((e) => {
        notify('Could not load analysis record.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Debounced autosave
  const saveTimeout = useRef(null);
  const triggerAutoSave = (newData, newTemplate, newCustomization) => {
    setSaveStatus('dirty');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      setSaveStatus('saving');
      try {
        const res = await updateResume(id, {
          tailoredData: newData,
          selectedTemplate: newTemplate,
          resumeCustomization: newCustomization,
        });
        if (res?.analysis) {
          setAnalysis((prev) => ({
            ...prev,
            ...res.analysis,
            tailoredData: newData,
            selectedTemplate: newTemplate,
            resumeCustomization: newCustomization,
          }));
        }
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('error');
      } finally {
        setSaving(false);
      }
    }, 1800);
  };

  const handleDataChange = (updater) => {
    setTailoredData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      triggerAutoSave(next, selectedTemplate, customization);
      return next;
    });
  };

  const handleTemplateChange = (tpl) => {
    setSelectedTemplate(tpl);
    triggerAutoSave(tailoredData, tpl, customization);
    notify(`Template changed to ${TEMPLATES.find((t) => t.id === tpl)?.name || tpl}`);
  };

  const handleCustomizationChange = (field, val) => {
    const next = { ...customization, [field]: val };
    setCustomization(next);
    triggerAutoSave(tailoredData, selectedTemplate, next);
  };

  const handleManualSave = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      await updateResume(id, {
        tailoredData,
        selectedTemplate,
        resumeCustomization: customization,
      });
      setSaveStatus('saved');
      notify('All resume changes saved successfully.');
    } catch {
      notify('Failed to save changes. Please try again.');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const filename = await exportResumePdf(id, {
        tailoredData,
        selectedTemplate,
        resumeCustomization: customization,
      });
      notify(`PDF exported: ${filename}`);
    } catch (e) {
      notify('Failed to export PDF. Please check server connection.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Validate claims
  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await validateAnalysis(id, tailoredData);
      setValidationResult(res.validation);
      if (res.validation?.passed) {
        notify('Factual review passed: No unsupported claims found.');
      } else {
        notify(`Review flagged ${res.validation?.issues?.length || 1} potential claim(s).`);
      }
    } catch {
      notify('Factual validation failed. Please check connection.');
    } finally {
      setValidating(false);
    }
  };

  // Reorder project
  const moveProject = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= (tailoredData.projects || []).length) return;
    handleDataChange((d) => {
      const projects = [...(d.projects || [])];
      const temp = projects[index];
      projects[index] = projects[target];
      projects[target] = temp;
      return { ...d, projects };
    });
    notify(`Moved project ${delta < 0 ? 'up' : 'down'}.`);
  };

  // Reorder experience
  const moveExperience = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= (tailoredData.experience || []).length) return;
    handleDataChange((d) => {
      const experience = [...(d.experience || [])];
      const temp = experience[index];
      experience[index] = experience[target];
      experience[target] = temp;
      return { ...d, experience };
    });
    notify(`Moved position ${delta < 0 ? 'up' : 'down'}.`);
  };

  // Regenerate
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await tailorAnalysis(id, regenFocus, regenSection);
      if (res.analysis?.tailoredData) {
        setTailoredData(res.analysis.tailoredData);
      }
      if (res.analysis?.validation) {
        setValidationResult(res.analysis.validation);
      }
      setShowRegenModal(false);
      setRegenFocus('');
      const targetLabel =
        regenSection === 'all'
          ? 'Entire resume'
          : regenSection === 'summary'
          ? 'Professional summary'
          : regenSection === 'projects'
          ? 'Key projects'
          : regenSection === 'skills'
          ? 'Technical skills'
          : regenSection;
      notify(`${targetLabel} regenerated with target focus.`);
    } catch (e) {
      notify(e.response?.data?.error || 'Could not regenerate resume.');
    } finally {
      setRegenerating(false);
    }
  };

  // Restore section from original / cleaned data
  const handleRestoreSection = async (section) => {
    try {
      const res = await restoreResume(id, { section, source: 'cleaned' });
      if (res.analysis?.tailoredData) {
        setTailoredData(res.analysis.tailoredData);
        if (res.analysis) setAnalysis(res.analysis);
        notify(`Restored ${section === 'all' ? 'all resume sections' : section} to original version.`);
      }
    } catch (e) {
      notify('Failed to restore section.');
    }
  };

  // Copy resume plain text
  const handleCopyText = () => {
    const lines = [];
    const b = tailoredData?.basics || {};
    lines.push(b.name || '');
    if (b.headline) lines.push(b.headline);
    const contact = [b.email, b.phone, b.location, b.linkedin, b.github].filter(Boolean).join(' | ');
    if (contact) lines.push(contact);
    lines.push('\nPROFESSIONAL SUMMARY');
    lines.push(tailoredData?.summary || '');
    lines.push('\nTECHNICAL SKILLS');
    (tailoredData?.skills || []).forEach((c) => {
      const it = Array.isArray(c.items) ? c.items.join(', ') : c.items;
      lines.push(`${c.category}: ${it}`);
    });
    lines.push('\nWORK EXPERIENCE');
    (tailoredData?.experience || []).forEach((j) => {
      lines.push(`${j.role} — ${j.company} (${j.dates || ''})`);
      (j.bullets || []).forEach((pt) => lines.push(`• ${pt}`));
    });
    lines.push('\nPROJECTS');
    (tailoredData?.projects || []).forEach((p) => {
      lines.push(`${p.name} [${p.technologies || ''}]`);
      (p.bullets || []).forEach((pt) => lines.push(`• ${pt}`));
    });
    lines.push('\nEDUCATION');
    (tailoredData?.education || []).forEach((e) => {
      lines.push(`${e.degree} — ${e.institution} (${e.dates || ''})`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    notify('Resume plain text copied to clipboard.');
  };

  const handlePrint = async () => {
    // Controlled PDF-based printing workflow:
    // Fetches the exact same vector PDF buffer generated by PDFKit.
    // Completely eliminates Chrome's native HTML headers (date, title) and footers (localhost URL, 1/2).
    // Eliminates HTML background bleeds and grey placeholder rectangles.
    // Guarantees 100% visual consistency with Download PDF.
    setPrintingPdf(true);
    try {
      const blob = await fetchResumePdfBlob(id, {
        tailoredData,
        selectedTemplate,
        resumeCustomization: customization,
      });

      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (printErr) {
          console.warn('Direct PDF iframe print fallback to new window:', printErr);
          window.open(blobUrl, '_blank');
        }
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
          } catch (_) {}
        }, 60000);
      };
    } catch (e) {
      console.warn('PDF-based print failed, fallback to native window.print():', e);
      window.print();
    } finally {
      setPrintingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <LoaderCircle size={24} className="spin" />
        <span>Loading tailored resume workspace…</span>
      </div>
    );
  }

  if (!analysis || !tailoredData) {
    return (
      <div className="empty-state panel">
        <h3>Could not load tailored resume</h3>
        <p>This record may have expired or is not available in the current session.</p>
        <button className="primary-btn" onClick={() => navigate('/')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="resume-workspace">
      {/* TOP WORKSPACE NAVIGATION & TOOLBAR */}
      <div className="workspace-topbar">
        <div className="ws-top-left">
          <button className="subtle-link back-to-report" onClick={() => navigate(`/analysis/${id}`)}>
            <ArrowLeft size={16} /> Return to Analysis Report
          </button>
          <div className="ws-title-group">
            <h2>{tailoredData.basics?.name || 'Candidate'}'s Tailored Resume</h2>
            <span className="ws-role-tag">{analysis.jobTitle || 'Target Role'}</span>
          </div>
        </div>

        <div className="ws-top-actions">
          {/* Save indicator */}
          <div className="ws-save-indicator">
            {saveStatus === 'saving' ? (
              <>
                <LoaderCircle size={14} className="spin" />
                <span>Saving edits…</span>
              </>
            ) : saveStatus === 'dirty' ? (
              <button className="text-action save-pill-btn" onClick={handleManualSave}>
                Save changes
              </button>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-success" />
                <span>All changes saved</span>
              </>
            )}
          </div>

          <button className="secondary-btn small-btn" onClick={() => setShowCompareModal(true)} title="Compare tailored resume with original candidate text">
            <Layers size={15} /> Compare with Original
          </button>

          <button className="secondary-btn small-btn" onClick={() => setShowAtsModal(true)} title="View ATS Keywords">
            <Target size={15} /> ATS Keywords
          </button>

          <button className="secondary-btn small-btn" onClick={handleValidate} disabled={validating} title="Check claims against source resume">
            {validating ? <LoaderCircle size={15} className="spin" /> : <ShieldCheck size={15} />} Validate claims
          </button>

          <button className="secondary-btn small-btn" onClick={() => setShowRegenModal(true)} title="Regenerate with AI focus">
            <WandSparkles size={15} /> Regenerate
          </button>

          <button className="secondary-btn small-btn" onClick={handleCopyText} title="Copy plain text">
            <Copy size={15} /> Copy text
          </button>

          <button
            className="secondary-btn small-btn print-hide-btn"
            onClick={handlePrint}
            disabled={printingPdf || exportingPdf}
            title="Print / Vector PDF Print"
          >
            {printingPdf ? (
              <>
                <LoaderCircle size={15} className="spin" /> Preparing Print…
              </>
            ) : (
              <>
                <Printer size={15} /> Print
              </>
            )}
          </button>

          <button className="primary-btn small-btn ws-download-btn" onClick={handleDownloadPdf} disabled={exportingPdf}>
            {exportingPdf ? (
              <>
                <LoaderCircle size={15} className="spin" /> Exporting PDF…
              </>
            ) : (
              <>
                <ArrowDownToLine size={15} /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* CUSTOMIZATION BAR */}
      <div className="workspace-controls-bar panel">
        {/* Template Selector */}
        <div className="ws-ctrl-group">
          <label className="ws-ctrl-lbl">
            <LayoutTemplate size={14} /> Template
          </label>
          <div className="ws-pill-selector">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={`ws-pill-opt ${selectedTemplate === t.id ? 'active' : ''}`}
                onClick={() => handleTemplateChange(t.id)}
                title={t.desc}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font Selector */}
        <div className="ws-ctrl-group">
          <label className="ws-ctrl-lbl">
            <Type size={14} /> Font
          </label>
          <select
            className="ws-select"
            value={customization.font}
            onChange={(e) => handleCustomizationChange('font', e.target.value)}
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Accent Color (disabled for ATS Classic) */}
        {selectedTemplate !== 'ats-classic' && (
          <div className="ws-ctrl-group">
            <label className="ws-ctrl-lbl">
              <Palette size={14} /> Accent
            </label>
            <div className="ws-color-row">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  className={`ws-color-dot ${customization.accentColor === c.id ? 'active' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => handleCustomizationChange('accentColor', c.id)}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Spacing Selector */}
        <div className="ws-ctrl-group">
          <label className="ws-ctrl-lbl">
            <Layers size={14} /> Spacing
          </label>
          <div className="ws-pill-selector">
            {['compact', 'standard', 'relaxed'].map((sp) => (
              <button
                key={sp}
                className={`ws-pill-opt ${customization.spacing === sp ? 'active' : ''}`}
                onClick={() => handleCustomizationChange('spacing', sp)}
              >
                {sp.charAt(0).toUpperCase() + sp.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="ws-mobile-toggle">
          <button
            className={`ws-pill-opt ${mobileView === 'editor' ? 'active' : ''}`}
            onClick={() => setMobileView('editor')}
          >
            Edit
          </button>
          <button
            className={`ws-pill-opt ${mobileView === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileView('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* EXTRACTION AUDIT BANNER */}
      {analysis?.originalResumeData?.extractionAudit?.flags?.length > 0 && (
        <div
          className="ws-validation-strip val-warn"
          style={{ background: '#FFFBF5', borderColor: '#FDE68A', color: '#92400E', marginBottom: '12px' }}
        >
          <div className="ws-val-head">
            <ShieldAlert size={16} />
            <b>Resume Extraction Notice ({analysis.originalResumeData.extractionAudit.confidence}% confidence)</b>
          </div>
          <ul className="ws-val-issues" style={{ margin: '4px 0 0 16px', fontSize: '12px' }}>
            {analysis.originalResumeData.extractionAudit.flags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* VALIDATION NOTICE BANNER */}
      {validationResult && (
        <div
          className={`ws-validation-strip ${
            validationResult.passed ? 'val-pass' : 'val-warn'
          }`}
        >
          <div className="ws-val-head">
            {validationResult.passed ? (
              <CheckCircle2 size={16} />
            ) : (
              <ShieldAlert size={16} />
            )}
            <b>
              {validationResult.passed
                ? 'Factual review passed: Claims are supported by your source resume.'
                : 'Review flagged claims carefully'}
            </b>
          </div>
          {Array.isArray(validationResult.issues) &&
            validationResult.issues.length > 0 && (
              <ul className="ws-val-issues">
                {validationResult.issues.map((iss, i) => (
                  <li key={i}>
                    {typeof iss === 'string'
                      ? iss
                      : `${iss.claim || 'Claim'}: ${iss.reason || 'Check source resume'}`}
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}

      {/* TWO PANEL WORKSPACE */}
      <div className="ws-workspace-grid">
        {/* LEFT PANEL: EDITOR */}
        <div className={`ws-editor-panel ${mobileView === 'preview' ? 'mobile-hidden' : ''}`}>
          <div className="ws-editor-tabs">
            <button
              className={`ws-tab-btn ${activeTab === 'basics' ? 'active' : ''}`}
              onClick={() => setActiveTab('basics')}
            >
              Contact
            </button>
            <button
              className={`ws-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`ws-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              Skills
            </button>
            <button
              className={`ws-tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
              onClick={() => setActiveTab('experience')}
            >
              Experience ({tailoredData.experience?.length || 0})
            </button>
            <button
              className={`ws-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              Projects ({tailoredData.projects?.length || 0})
            </button>
            <button
              className={`ws-tab-btn ${activeTab === 'education' ? 'active' : ''}`}
              onClick={() => setActiveTab('education')}
            >
              Education
            </button>
            <button
              className={`ws-tab-btn ${activeTab === 'certifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('certifications')}
            >
              Certs
            </button>
          </div>

          <div className="ws-editor-body panel">
            {/* TAB: BASICS */}
            {activeTab === 'basics' && (
              <div className="ws-tab-content">
                <div className="ws-sec-intro">
                  <h4>Contact & Candidate Details</h4>
                  <p>Preserve your accurate contact information and links.</p>
                </div>
                <div className="ws-field-grid">
                  <div className="field-wrap">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={tailoredData.basics?.name || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, name: e.target.value },
                        }))
                      }
                      placeholder="Candidate Name"
                    />
                  </div>
                  <div className="field-wrap">
                    <label>Target Role Title / Headline</label>
                    <input
                      type="text"
                      value={tailoredData.basics?.headline || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, headline: e.target.value },
                        }))
                      }
                      placeholder="e.g. Junior Full Stack Developer"
                    />
                  </div>
                  <div className="field-wrap">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={tailoredData.basics?.email || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, email: e.target.value },
                        }))
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="field-wrap">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={tailoredData.basics?.phone || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, phone: e.target.value },
                        }))
                      }
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="field-wrap">
                    <label>Location</label>
                    <input
                      type="text"
                      value={tailoredData.basics?.location || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, location: e.target.value },
                        }))
                      }
                      placeholder="e.g. Bengaluru, India"
                    />
                  </div>
                  <div className="field-wrap">
                    <label>LinkedIn URL</label>
                    <input
                      type="text"
                      value={tailoredData.basics?.linkedin || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, linkedin: e.target.value },
                        }))
                      }
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                  <div className="field-wrap">
                    <label>GitHub Profile</label>
                    <input
                      type="text"
                      value={tailoredData.basics?.github || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, github: e.target.value },
                        }))
                      }
                      placeholder="github.com/username"
                    />
                  </div>
                  <div className="field-wrap">
                    <label>Portfolio / Website</label>
                    <input
                      type="text"
                      value={tailoredData.basics?.portfolio || ''}
                      onChange={(e) =>
                        handleDataChange((d) => ({
                          ...d,
                          basics: { ...d.basics, portfolio: e.target.value },
                        }))
                      }
                      placeholder="portfolio.dev"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SUMMARY */}
            {activeTab === 'summary' && (
              <div className="ws-tab-content">
                <div className="ws-sec-intro">
                  <h4>Professional Summary</h4>
                  <p>
                    Targeted 2-4 sentences highlighting genuine experience and core technologies aligned with the job description.
                  </p>
                </div>
                <div className="field-wrap">
                  <textarea
                    rows={6}
                    value={tailoredData.summary || ''}
                    onChange={(e) =>
                      handleDataChange((d) => ({ ...d, summary: e.target.value }))
                    }
                    placeholder="Results-driven developer with..."
                  />
                  <div className="ws-char-count">
                    {(tailoredData.summary || '').length} characters · ~
                    {(tailoredData.summary || '').split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SKILLS */}
            {activeTab === 'skills' && (
              <div className="ws-tab-content">
                <div className="ws-sec-intro">
                  <h4>Technical Skills</h4>
                  <p>Group skills into ATS-friendly categories.</p>
                </div>
                {(tailoredData.skills || []).map((cat, catIdx) => (
                  <div key={catIdx} className="ws-card-block">
                    <div className="ws-block-head">
                      <input
                        className="ws-inline-title"
                        value={cat.category || ''}
                        onChange={(e) =>
                          handleDataChange((d) => {
                            const newSkills = [...d.skills];
                            newSkills[catIdx] = { ...newSkills[catIdx], category: e.target.value };
                            return { ...d, skills: newSkills };
                          })
                        }
                        placeholder="Category Name (e.g. Languages)"
                      />
                      <button
                        className="icon-btn danger-icon"
                        onClick={() =>
                          handleDataChange((d) => ({
                            ...d,
                            skills: d.skills.filter((_, idx) => idx !== catIdx),
                          }))
                        }
                        title="Delete category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="field-wrap">
                      <label>Skills (comma separated)</label>
                      <input
                        type="text"
                        value={
                          Array.isArray(cat.items)
                            ? cat.items.join(', ')
                            : cat.items || ''
                        }
                        onChange={(e) => {
                          const items = e.target.value.split(',').map((x) => x.trimStart());
                          handleDataChange((d) => {
                            const newSkills = [...d.skills];
                            newSkills[catIdx] = { ...newSkills[catIdx], items };
                            return { ...d, skills: newSkills };
                          });
                        }}
                        placeholder="React, JavaScript, TypeScript, Node.js"
                      />
                    </div>
                  </div>
                ))}
                <button
                  className="secondary-btn small-btn ws-add-btn"
                  onClick={() =>
                    handleDataChange((d) => ({
                      ...d,
                      skills: [
                        ...(d.skills || []),
                        { category: 'Developer Tools', items: ['Git', 'VS Code'] },
                      ],
                    }))
                  }
                >
                  <Plus size={14} /> Add Skill Category
                </button>
              </div>
            )}

            {/* TAB: EXPERIENCE */}
            {activeTab === 'experience' && (
              <div className="ws-tab-content">
                <div className="ws-sec-intro">
                  <h4>Work Experience</h4>
                  <p>Highlight positions, roles, and action-verb accomplishments.</p>
                </div>
                {(tailoredData.experience || []).map((job, jIdx) => (
                  <div key={job.id || jIdx} className="ws-card-block">
                    <div className="ws-block-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b>Position #{jIdx + 1}</b>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="icon-btn"
                            disabled={jIdx === 0}
                            onClick={() => moveExperience(jIdx, -1)}
                            title="Move position up"
                            style={{ opacity: jIdx === 0 ? 0.35 : 1, padding: '2px 4px' }}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            className="icon-btn"
                            disabled={jIdx === (tailoredData.experience || []).length - 1}
                            onClick={() => moveExperience(jIdx, 1)}
                            title="Move position down"
                            style={{ opacity: jIdx === (tailoredData.experience || []).length - 1 ? 0.35 : 1, padding: '2px 4px' }}
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="icon-btn danger-icon"
                        onClick={() =>
                          handleDataChange((d) => ({
                            ...d,
                            experience: d.experience.filter((_, idx) => idx !== jIdx),
                          }))
                        }
                        title="Delete position"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="ws-field-grid">
                      <div className="field-wrap">
                        <label>Role / Job Title</label>
                        <input
                          type="text"
                          value={job.role || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const exp = [...d.experience];
                              exp[jIdx] = { ...exp[jIdx], role: e.target.value };
                              return { ...d, experience: exp };
                            })
                          }
                          placeholder="e.g. Software Engineer Intern"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Company / Organization</label>
                        <input
                          type="text"
                          value={job.company || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const exp = [...d.experience];
                              exp[jIdx] = { ...exp[jIdx], company: e.target.value };
                              return { ...d, experience: exp };
                            })
                          }
                          placeholder="Company Name"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Dates</label>
                        <input
                          type="text"
                          value={job.dates || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const exp = [...d.experience];
                              exp[jIdx] = { ...exp[jIdx], dates: e.target.value };
                              return { ...d, experience: exp };
                            })
                          }
                          placeholder="e.g. Jan 2025 – Present"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Location</label>
                        <input
                          type="text"
                          value={job.location || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const exp = [...d.experience];
                              exp[jIdx] = { ...exp[jIdx], location: e.target.value };
                              return { ...d, experience: exp };
                            })
                          }
                          placeholder="e.g. Bengaluru, India"
                        />
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="ws-bullets-section">
                      <label className="ws-sub-lbl">Achievement Bullet Points</label>
                      {(job.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="ws-bullet-row">
                          <span className="ws-bullet-dot">•</span>
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) =>
                              handleDataChange((d) => {
                                const exp = [...d.experience];
                                const bullets = [...(exp[jIdx].bullets || [])];
                                bullets[bIdx] = e.target.value;
                                exp[jIdx] = { ...exp[jIdx], bullets };
                                return { ...d, experience: exp };
                              })
                            }
                            placeholder="Implemented feature using..."
                          />
                          <button
                            className="icon-btn danger-icon"
                            onClick={() =>
                              handleDataChange((d) => {
                                const exp = [...d.experience];
                                exp[jIdx] = {
                                  ...exp[jIdx],
                                  bullets: exp[jIdx].bullets.filter((_, idx) => idx !== bIdx),
                                };
                                return { ...d, experience: exp };
                              })
                            }
                            title="Delete bullet point"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="subtle-link ws-add-bullet"
                        onClick={() =>
                          handleDataChange((d) => {
                            const exp = [...d.experience];
                            exp[jIdx] = {
                              ...exp[jIdx],
                              bullets: [...(exp[jIdx].bullets || []), 'Collaborated with team to deliver...'],
                            };
                            return { ...d, experience: exp };
                          })
                        }
                      >
                        <Plus size={13} /> Add bullet point
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  className="secondary-btn small-btn ws-add-btn"
                  onClick={() =>
                    handleDataChange((d) => ({
                      ...d,
                      experience: [
                        ...(d.experience || []),
                        {
                          id: `exp-${Date.now()}`,
                          role: 'Software Developer',
                          company: 'Company Name',
                          dates: '2025 – Present',
                          location: 'Remote',
                          bullets: ['Built responsive features adhering to best practices.'],
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={14} /> Add Work Position
                </button>
              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="ws-tab-content">
                <div className="ws-sec-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4>Key Projects & Portfolio</h4>
                    <p>
                      {tailoredData.projects?.filter((p) => p.selected !== false).length || 0} of {tailoredData.projects?.length || 0} projects selected for 1-page A4 document. All {tailoredData.projects?.length || 0} preserved in your profile.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11.5px', padding: '5px 9px' }}
                      onClick={() =>
                        handleDataChange((d) => ({
                          ...d,
                          projects: d.projects.map((p, idx) => ({ ...p, selected: idx < 3 })),
                        }))
                      }
                    >
                      Top 3 (1-Page A4)
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11.5px', padding: '5px 9px' }}
                      onClick={() =>
                        handleDataChange((d) => ({
                          ...d,
                          projects: d.projects.map((p) => ({ ...p, selected: true })),
                        }))
                      }
                    >
                      Select All
                    </button>
                  </div>
                </div>
                {(tailoredData.projects || []).map((proj, pIdx) => (
                  <div key={proj.id || pIdx} className="ws-card-block">
                    <div className="ws-block-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b>Project #{pIdx + 1}</b>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="icon-btn"
                            disabled={pIdx === 0}
                            onClick={() => moveProject(pIdx, -1)}
                            title="Move project up"
                            style={{ opacity: pIdx === 0 ? 0.35 : 1, padding: '2px 4px' }}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            className="icon-btn"
                            disabled={pIdx === (tailoredData.projects || []).length - 1}
                            onClick={() => moveProject(pIdx, 1)}
                            title="Move project down"
                            style={{ opacity: pIdx === (tailoredData.projects || []).length - 1 ? 0.35 : 1, padding: '2px 4px' }}
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="icon-btn danger-icon"
                        onClick={() =>
                          handleDataChange((d) => ({
                            ...d,
                            projects: d.projects.filter((_, idx) => idx !== pIdx),
                          }))
                        }
                        title="Delete project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '7px 12px', background: proj.selected !== false ? '#F0F9F4' : '#F6F3F5', borderRadius: '8px', border: `1px solid ${proj.selected !== false ? '#CDE6D5' : '#E8E1E6'}` }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 650, color: proj.selected !== false ? '#2D6A4F' : '#6F6777', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={proj.selected !== false}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const p = [...d.projects];
                              p[pIdx] = { ...p[pIdx], selected: e.target.checked };
                              return { ...d, projects: p };
                            })
                          }
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{proj.selected !== false ? '✓ Included on 1-Page Resume' : 'Preserved in Portfolio (Hidden on 1-Page PDF)'}</span>
                      </label>
                      {proj.relevanceScore > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: proj.selected !== false ? '#DDF3E4' : '#ECE7EB', color: proj.selected !== false ? '#1E5338' : '#776E7F' }}>
                          Rank #{pIdx + 1} match
                        </span>
                      )}
                    </div>

                    <div className="ws-field-grid">
                      <div className="field-wrap">
                        <label>Project Name</label>
                        <input
                          type="text"
                          value={proj.name || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const p = [...d.projects];
                              p[pIdx] = { ...p[pIdx], name: e.target.value };
                              return { ...d, projects: p };
                            })
                          }
                          placeholder="Project Title"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Technologies Used</label>
                        <input
                          type="text"
                          value={proj.technologies || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const p = [...d.projects];
                              p[pIdx] = { ...p[pIdx], technologies: e.target.value };
                              return { ...d, projects: p };
                            })
                          }
                          placeholder="e.g. React, Node.js, Express, MongoDB"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Repository / Demo Link</label>
                        <input
                          type="text"
                          value={proj.link || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const p = [...d.projects];
                              p[pIdx] = { ...p[pIdx], link: e.target.value };
                              return { ...d, projects: p };
                            })
                          }
                          placeholder="github.com/user/project"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Dates</label>
                        <input
                          type="text"
                          value={proj.dates || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const p = [...d.projects];
                              p[pIdx] = { ...p[pIdx], dates: e.target.value };
                              return { ...d, projects: p };
                            })
                          }
                          placeholder="e.g. Fall 2025"
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="ws-bullets-section">
                      <label className="ws-sub-lbl">Project Details & Outcomes</label>
                      {(proj.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="ws-bullet-row">
                          <span className="ws-bullet-dot">•</span>
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) =>
                              handleDataChange((d) => {
                                const p = [...d.projects];
                                const bullets = [...(p[pIdx].bullets || [])];
                                bullets[bIdx] = e.target.value;
                                p[pIdx] = { ...p[pIdx], bullets };
                                return { ...d, projects: p };
                              })
                            }
                            placeholder="Architected modular services..."
                          />
                          <button
                            className="icon-btn danger-icon"
                            onClick={() =>
                              handleDataChange((d) => {
                                const p = [...d.projects];
                                p[pIdx] = {
                                  ...p[pIdx],
                                  bullets: p[pIdx].bullets.filter((_, idx) => idx !== bIdx),
                                };
                                return { ...d, projects: p };
                              })
                            }
                            title="Delete bullet"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="subtle-link ws-add-bullet"
                        onClick={() =>
                          handleDataChange((d) => {
                            const p = [...d.projects];
                            p[pIdx] = {
                              ...p[pIdx],
                              bullets: [...(p[pIdx].bullets || []), 'Implemented features using...'],
                            };
                            return { ...d, projects: p };
                          })
                        }
                      >
                        <Plus size={13} /> Add bullet point
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  className="secondary-btn small-btn ws-add-btn"
                  onClick={() =>
                    handleDataChange((d) => ({
                      ...d,
                      projects: [
                        ...(d.projects || []),
                        {
                          id: `proj-${Date.now()}`,
                          name: 'New Project',
                          technologies: 'React, Node.js',
                          bullets: ['Engineered key features adhering to modern web standards.'],
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>
            )}

            {/* TAB: EDUCATION */}
            {activeTab === 'education' && (
              <div className="ws-tab-content">
                <div className="ws-sec-intro">
                  <h4>Education & Academics</h4>
                  <p>Degree, institution, and genuine graduation dates.</p>
                </div>
                {(tailoredData.education || []).map((edu, eIdx) => (
                  <div key={edu.id || eIdx} className="ws-card-block">
                    <div className="ws-block-head">
                      <b>Degree #{eIdx + 1}</b>
                      <button
                        className="icon-btn danger-icon"
                        onClick={() =>
                          handleDataChange((d) => ({
                            ...d,
                            education: d.education.filter((_, idx) => idx !== eIdx),
                          }))
                        }
                        title="Delete education"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="ws-field-grid">
                      <div className="field-wrap">
                        <label>Degree / Qualification</label>
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const list = [...d.education];
                              list[eIdx] = { ...list[eIdx], degree: e.target.value };
                              return { ...d, education: list };
                            })
                          }
                          placeholder="e.g. BTech in Information Technology"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Institution / University</label>
                        <input
                          type="text"
                          value={edu.institution || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const list = [...d.education];
                              list[eIdx] = { ...list[eIdx], institution: e.target.value };
                              return { ...d, education: list };
                            })
                          }
                          placeholder="University Name"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Dates / Graduation Year</label>
                        <input
                          type="text"
                          value={edu.dates || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const list = [...d.education];
                              list[eIdx] = { ...list[eIdx], dates: e.target.value };
                              return { ...d, education: list };
                            })
                          }
                          placeholder="e.g. 2022 – 2026"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>GPA / Honors / Details (Optional)</label>
                        <input
                          type="text"
                          value={edu.gpa || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const list = [...d.education];
                              list[eIdx] = { ...list[eIdx], gpa: e.target.value };
                              return { ...d, education: list };
                            })
                          }
                          placeholder="e.g. GPA: 3.8 / 4.0"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  className="secondary-btn small-btn ws-add-btn"
                  onClick={() =>
                    handleDataChange((d) => ({
                      ...d,
                      education: [
                        ...(d.education || []),
                        {
                          id: `edu-${Date.now()}`,
                          degree: 'Degree Title',
                          institution: 'Institution Name',
                          dates: 'Expected 2026',
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={14} /> Add Education
                </button>
              </div>
            )}

            {/* TAB: CERTS */}
            {activeTab === 'certifications' && (
              <div className="ws-tab-content">
                <div className="ws-sec-intro">
                  <h4>Certifications & Credentials</h4>
                  <p>Add verified certificates, courses, or achievements.</p>
                </div>
                {(tailoredData.certifications || []).map((cert, cIdx) => (
                  <div key={cert.id || cIdx} className="ws-card-block">
                    <div className="ws-block-head">
                      <b>Certification #{cIdx + 1}</b>
                      <button
                        className="icon-btn danger-icon"
                        onClick={() =>
                          handleDataChange((d) => ({
                            ...d,
                            certifications: d.certifications.filter((_, idx) => idx !== cIdx),
                          }))
                        }
                        title="Delete certification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="ws-field-grid">
                      <div className="field-wrap">
                        <label>Certification Name</label>
                        <input
                          type="text"
                          value={typeof cert === 'string' ? cert : cert.name || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const list = [...d.certifications];
                              list[cIdx] =
                                typeof list[cIdx] === 'string'
                                  ? { name: e.target.value }
                                  : { ...list[cIdx], name: e.target.value };
                              return { ...d, certifications: list };
                            })
                          }
                          placeholder="e.g. AWS Certified Cloud Practitioner"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Issuing Organization</label>
                        <input
                          type="text"
                          value={cert.issuer || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const list = [...d.certifications];
                              list[cIdx] = { ...list[cIdx], issuer: e.target.value };
                              return { ...d, certifications: list };
                            })
                          }
                          placeholder="e.g. Amazon Web Services"
                        />
                      </div>
                      <div className="field-wrap">
                        <label>Date</label>
                        <input
                          type="text"
                          value={cert.date || ''}
                          onChange={(e) =>
                            handleDataChange((d) => {
                              const list = [...d.certifications];
                              list[cIdx] = { ...list[cIdx], date: e.target.value };
                              return { ...d, certifications: list };
                            })
                          }
                          placeholder="e.g. 2025"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  className="secondary-btn small-btn ws-add-btn"
                  onClick={() =>
                    handleDataChange((d) => ({
                      ...d,
                      certifications: [
                        ...(d.certifications || []),
                        {
                          id: `cert-${Date.now()}`,
                          name: 'New Certification',
                          issuer: '',
                          date: '',
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={14} /> Add Certification
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div className={`ws-preview-panel ${mobileView === 'editor' ? 'mobile-hidden' : ''}`}>
          <div className="ws-preview-header">
            <div className="ws-preview-title">
              <Eye size={15} />
              <b>Live A4 Document Preview</b>
              <span className="ws-a4-pill">A4 · Selectable Vector Text</span>
            </div>

            {/* Zoom Controls */}
            <div className="ws-zoom-controls">
              <button
                className="icon-btn"
                onClick={() => setZoom((z) => Math.max(0.65, z - 0.1))}
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="ws-zoom-pct">{Math.round(zoom * 100)}%</span>
              <button
                className="icon-btn"
                onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
              <button
                className="icon-btn"
                onClick={() => setZoom(1)}
                title="Reset zoom (100%)"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          <div className="ws-preview-viewport">
            <div
              className="ws-paper-stage"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
              }}
            >
              <ResumeDocument
                data={tailoredData}
                template={selectedTemplate}
                font={customization.font}
                accentColor={customization.accentColor}
                spacing={customization.spacing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ATS OPTIMIZATION MODAL */}
      {showAtsModal && (
        <AtsOptimizationModal
          atsData={analysis?.atsOptimization || analysis}
          onClose={() => setShowAtsModal(false)}
        />
      )}

      {/* BEFORE & AFTER COMPARISON MODAL */}
      {showCompareModal && (
        <ResumeComparisonModal
          analysis={analysis}
          onAnalysisUpdate={(updated) => {
            setAnalysis(updated);
            setTailoredData(updated.tailoredData || {});
          }}
          onClose={() => setShowCompareModal(false)}
          notify={notify}
        />
      )}

      {/* REGENERATE MODAL */}
      {showRegenModal && (
        <div className="modal-backdrop" onClick={() => setShowRegenModal(false)}>
          <div className="panel regen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-heading">
              <div className="panel-icon rose-icon">
                <WandSparkles size={19} />
              </div>
              <div>
                <h3>Regenerate Tailored Resume</h3>
                <p>Provide an optional direction to guide the rewrite.</p>
              </div>
            </div>

            <div className="field-wrap" style={{ marginBottom: '14px' }}>
              <label>Target section to regenerate</label>
              <select
                className="ws-select"
                value={regenSection}
                onChange={(e) => setRegenSection(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D6CAD2', background: '#fff' }}
              >
                <option value="all">Entire Tailored Resume</option>
                <option value="summary">Professional Summary only</option>
                <option value="projects">Key Projects only</option>
                <option value="skills">Technical Skills only</option>
                <option value="experience">Work Experience only</option>
              </select>
            </div>

            <div className="field-wrap">
              <label>Rewrite focus (Optional)</label>
              <textarea
                rows={4}
                value={regenFocus}
                onChange={(e) => setRegenFocus(e.target.value)}
                placeholder="e.g. Prioritize backend engineering and API design; emphasize SQL and database optimization."
              />
              <small className="ws-hint-text">
                The rewrite preserves strict factual integrity and will not invent new credentials.
              </small>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowRegenModal(false)}
                disabled={regenerating}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? (
                  <>
                    <LoaderCircle size={15} className="spin" /> Tailoring…
                  </>
                ) : (
                  <>
                    <WandSparkles size={15} /> Regenerate Resume
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

