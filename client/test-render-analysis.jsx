
import React from "react";
import ReactDOMServer from "react-dom/server";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CloudUpload,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  LayoutTemplate,
  Lightbulb,
  LoaderCircle,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  createAnalysis,
  deleteAnalysis,
  exportResumePdf,
  getAnalyses,
  getAnalysis,
  getStatus,
  tailorAnalysis,
  validateAnalysis,
} from './api';
import ResumeWorkspace from './ResumeWorkspace';
import AtsOptimizationModal from './AtsOptimizationModal';
import ResumeComparisonModal from './ResumeComparisonModal';
import BrandMarkIcon from './BrandMarkIcon';


const cx = (...v) => v.filter(Boolean).join(' ');


function PageIntro({ eyebrow, title, description, children }) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="intro-action">{children}</div>}
    </div>
  );
}


function SkillGroup({ title, subtitle, items, tone }) {
  return (
    <div className="skill-group">
      <div className="skill-group-title">
        <div>
          <b>{title}</b>
          <small>{subtitle}</small>
        </div>
        <span className={`skill-count ${tone}`}>{items.length}</span>
      </div>
      {items.length ? (
        <div className="skill-chips">
          {items.map((item, i) => {
            const name = typeof item === 'string' ? item : item.name;
            const why = typeof item === 'string' ? '' : item.evidence || item.reason;
            return (
              <span key={`${name}-${i}`} className={`skill-chip ${tone}`} title={why}>
                {tone === 'good' ? (
                  <CheckCircle2 size={13} />
                ) : tone === 'gap' ? (
                  <Target size={13} />
                ) : (
                  <Activity size={13} />
                )}
                {' '}{name}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="no-skills">No items in this category.</div>
      )}
    </div>
  );
}



async function run() {
  const res = await fetch("http://localhost:4000/api/analyses/6ae457e484b24d2f0265b1f2");
  const json = await res.json();
  const data = json.analysis;

  function MockAnalysisView() {
    const navigate = useNavigate();
    const score = Number(data.score || 0),
      skills = data.skills || {},
      gaps = skills.gaps || [],
      matched = skills.matched || [],
      partial = skills.partial || [];
    const focus = "", tailoring = false, validating = false, exportingPdf = false;
    const showAtsModal = false, showCompareModal = false;
    const id = data._id;
    const notify = () => {};
    const exportReport = () => {};
    const exportTxt = () => {};
    const handleDownloadPdf = () => {};
    const regenerate = () => {};
    const validate = () => {};

    return (
      <MemoryRouter>
        ) => clearTimeout(t);
    }
  }, [toast]);

  const pageTitle = location.pathname.includes('resume')
    ? 'Tailored Resume'
    : location.pathname.includes('history')
    ? 'Analysis history'
    : location.pathname.includes('settings')
    ? 'Settings'
    : location.pathname.includes('analysis')
    ? 'Analysis results'
    : 'Dashboard';

  const notify = (m) => setToast(m);

  return (
    <div className="app-shell">
      <aside className={cx('sidebar', mobileOpen && 'sidebar-open')}>
        <div className="brand">
          <div className="brand-mark">
            <BrandMarkIcon size={28} />
          </div>
          <div>
            <div className="brand-name">
              Resume<span>Match</span>
            </div>
            <div className="brand-sub">CAREER INTELLIGENCE</div>
          </div>
          <button className="icon-btn sidebar-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cx('nav-item', isActive && 'active')}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/history"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cx('nav-item', isActive && 'active')}
          >
            <History size={18} />
            <span>Analysis history</span>
          </NavLink>
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cx('nav-item', isActive && 'active')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <div className="tip-icon">
            <Lightbulb size={17} />
          </div>
          <div className="tip-title">A little career clarity</div>
          <p>Use your match report to spot what to highlight — and what to learn next.</p>
          <button onClick={() => navigate('/#how-it-works')}>
            How it works <ArrowRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="avatar">JT</div>
          <div className="profile-text">
            <b>Career workspace</b>
            <span>Personal account</span>
          </div>
          <ChevronDown size={16} className="muted" />
        </div>
      </aside>

      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <b>{pageTitle}</b>
          </div>
          <div className="topbar-right">
            <div
              className={cx(
                'ai-status',
                status.mode === 'ai'
                  ? 'live'
                  : status.mode === 'offline' || status.mode === 'invalid-key'
                  ? 'offline'
                  : 'demo'
              )}
            >
              <span className="status-dot" />
              {status.mode === 'ai'
                ? 'AI engine connected'
                : status.mode === 'invalid-key'
                ? 'Invalid AI key'
                : status.mode === 'offline'
                ? 'API unavailable'
                : 'Demo mode'}
            </div>
            <button
              className="help-btn"
              title="About this tool"
              onClick={() =>
                notify('ResumeMatch is decision support. Always review AI suggestions before using them.')
              }
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard status={status} notify={notify} />} />
            <Route path="/analysis/:id" element={<AnalysisPage notify={notify} />} />
            <Route path="/analysis/:id/resume" element={<ResumeWorkspace notify={notify} />} />
            <Route path="/history" element={<HistoryPage notify={notify} />} />
            <Route path="/settings" element={<SettingsPage status={status} />} />
            <Route path="*" element={<Dashboard status={status} notify={notify} />} />
          </Routes>
        </div>

        <footer className="app-footer">
          <span>© 2026 ResumeMatch</span>
          <span>
            <ShieldCheck size={13} /> Your documents are processed for analysis only.
          </span>
          <span className="footer-version">AI-assisted career tools</span>
        </footer>
      </main>

      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
          <button onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function PageIntro({ eyebrow, title, description, children }) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="intro-action">{children}</div>}
    </div>
  );
}

function Dashboard({ status, notify }) {
  const [resume, setResume] = useState(null),
    [jobFile, setJobFile] = useState(null),
    [jobText, setJobText] = useState(''),
    [jobTitle, setJobTitle] = useState(''),
    [drag, setDrag] = useState(false),
    [busy, setBusy] = useState(false),
    [recent, setRecent] = useState([]),
    [showPaste, setShowPaste] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAnalyses()
      .then((d) => setRecent(d.analyses || []))
      .catch(() => {});
  }, []);

  const chooseResume = (f) => {
    if (
      f &&
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ].includes(f.type)
    ) {
      setResume(f);
    } else notify('Please choose a PDF, DOCX, or TXT resume.');
  };

  const analyze = async () => {
    if (!resume) {
      notify('Upload your resume first.');
      return;
    }
    if (!jobText.trim() && !jobFile) {
      notify('Paste or upload a job description to continue.');
      return;
    }
    const form = new FormData();
    form.append('resume', resume);
    if (jobText.trim()) form.append('jobDescription', jobText);
    if (jobFile) form.append('jobFile', jobFile);
    if (jobTitle) form.append('jobTitle', jobTitle);
    setBusy(true);
    try {
      const d = await createAnalysis(form);
      navigate(`/analysis/${d.analysis._id || d.analysis.id}`);
    } catch (e) {
      notify(e.response?.data?.error || 'Could not run analysis. Check that the API server is running.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="YOUR CAREER, WITH MORE CLARITY"
        title="Make your next application count."
        description="Understand how your experience aligns with a role, find the gaps, and tailor your resume with confidence."
      >
        <div className="intro-chip">
          <Sparkles size={15} /> Thoughtful AI, grounded in your experience
        </div>
      </PageIntro>

      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-kicker">
            <span className="welcome-kicker-dot" /> YOUR NEXT STEP STARTS HERE
          </div>
          <h2>
            A stronger application
            <br />
            <em>begins with insight.</em>
          </h2>
          <p>Turn a job description into a clear, actionable plan for your resume.</p>
          <div className="welcome-stats">
            <div>
              <span className="stat-icon blue">
                <Target size={16} />
              </span>
              <span>
                <b>Understand</b>
                <small>your role alignment</small>
              </span>
            </div>
            <div>
              <span className="stat-icon rose">
                <TrendingUp size={16} />
              </span>
              <span>
                <b>Improve</b>
                <small>with clear next steps</small>
              </span>
            </div>
          </div>
        </div>
        <div className="welcome-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-document">
            <div className="art-doc-top">
              <span />
              <span />
              <span />
            </div>
            <div className="art-avatar">
              <BriefcaseBusiness size={21} />
            </div>
            <div className="art-line long" />
            <div className="art-line medium" />
            <div className="art-divider" />
            <div className="art-line long pale" />
            <div className="art-line short pale" />
            <div className="art-skill-row">
              <span />
              <span />
              <span />
            </div>
            <div className="art-check">
              <Check size={18} />
            </div>
          </div>
          <div className="art-score">
            <span className="score-mini-icon">
              <Sparkles size={14} />
            </span>
            <div>
              <b>Role alignment</b>
              <small>Insights ready to explore</small>
            </div>
            <ArrowUpRightFallback />
          </div>
          <div className="art-sparkle sparkle-a">✦</div>
          <div className="art-sparkle sparkle-b">✧</div>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <h2>Start a new analysis</h2>
          <p>Two inputs. One clearer picture of your fit.</p>
        </div>
        <span className="step-count">
          <span>01</span> / 02 <span className="step-label">ADD YOUR DETAILS</span>
        </span>
      </section>

      <div className="analysis-grid">
        <section className="panel input-panel">
          <div className="panel-heading">
            <div className="panel-icon blue-icon">
              <FileText size={19} />
            </div>
            <div>
              <h3>Your resume</h3>
              <p>Upload the latest version you'd like to improve.</p>
            </div>
            <span className="required-tag">REQUIRED</span>
          </div>
          <label
            className={cx('upload-zone', drag && 'dragging', resume && 'has-file')}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              chooseResume(e.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => chooseResume(e.target.files[0])}
            />
            {resume ? (
              <>
                <div className="file-type-icon">
                  <FileCheck2 size={24} />
                </div>
                <div className="upload-title">{resume.name}</div>
                <div className="upload-hint">
                  {(resume.size / 1024).toFixed(0)} KB · Ready to analyze
                </div>
                <button
                  type="button"
                  className="text-action"
                  onClick={(e) => {
                    e.preventDefault();
                    setResume(null);
                  }}
                >
                  Remove file
                </button>
              </>
            ) : (
              <>
                <div className="upload-icon-wrap">
                  <CloudUpload size={24} />
                </div>
                <div className="upload-title">Drop your resume here</div>
                <div className="upload-hint">
                  or <span>browse files</span> from your device
                </div>
                <div className="file-chips">
                  <span>PDF</span>
                  <span>DOCX</span>
                  <span>TXT</span>
                  <span>Up to 8 MB</span>
                </div>
              </>
            )}
          </label>
          <div className="privacy-note">
            <ShieldCheck size={15} />
            <span>
              Your resume stays yours. Review the privacy note before sharing sensitive details.
            </span>
          </div>
        </section>

        <section className="panel input-panel">
          <div className="panel-heading">
            <div className="panel-icon rose-icon">
              <BriefcaseBusiness size={19} />
            </div>
            <div>
              <h3>Target job description</h3>
              <p>Share the role you're interested in.</p>
            </div>
            <span className="required-tag">REQUIRED</span>
          </div>
          <div className="field-wrap">
            <label htmlFor="jobTitle">
              Role title <span>OPTIONAL</span>
            </label>
            <input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Product Analyst"
            />
          </div>
          <div className="field-wrap">
            <div className="label-row">
              <label htmlFor="jobText">Job description</label>
              <button className="subtle-link" onClick={() => setShowPaste((v) => !v)}>
                {showPaste ? 'Hide text area' : 'Paste text'}
              </button>
            </div>
            {showPaste && (
              <textarea
                id="jobText"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the responsibilities, requirements, and skills from the job listing…"
                rows={5}
              />
            )}
          </div>
          <label className="job-file-row">
            <span className="job-file-icon">
              <Upload size={16} />
            </span>
            <span className="job-file-copy">
              <b>{jobFile ? jobFile.name : 'Or upload a job description'}</b>
              <small>{jobFile ? 'File selected' : 'PDF, DOCX, or TXT'}</small>
            </span>
            <span className="browse-small">
              Browse
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setJobFile(e.target.files[0] || null)}
              />
            </span>
          </label>
        </section>
      </div>

      <div className="action-bar">
        <div className="action-note">
          <div className="action-note-icon">
            <Zap size={17} />
          </div>
          <div>
            <b>Evidence first. No invented credentials.</b>
            <span>Suggestions are grounded in the content you provide.</span>
          </div>
        </div>
        <button className="primary-btn analyze-btn" onClick={analyze} disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle size={17} className="spin" /> Analyzing your profile…
            </>
          ) : (
            <>
              Analyze my fit <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <h2>From application to action plan</h2>
            <p>A simple workflow designed to make the next step clear.</p>
          </div>
        </div>
        <div className="how-grid">
          <HowCard
            n="01"
            icon={<Search size={19} />}
            title="Understand the role"
            text="Key skills and expectations are pulled from the job description."
            tone="blue"
          />
          <HowCard
            n="02"
            icon={<Gauge size={19} />}
            title="See your alignment"
            text="Review evidence-backed matches, partial matches, and gaps."
            tone="rose"
          />
          <HowCard
            n="03"
            icon={<WandSparkles size={19} />}
            title="Improve with care"
            text="Get tailored wording and recommendations without made-up claims."
            tone="sage"
          />
        </div>
      </section>

      <section className="recent-section">
        <div className="section-heading">
          <div>
            <h2>Recent analyses</h2>
            <p>Pick up where you left off.</p>
          </div>
          <a className="subtle-link" href="/history">
            View history <ArrowRight size={14} />
          </a>
        </div>
        {recent.length ? (
          <div className="recent-list">
            {recent.slice(0, 3).map((a) => (
              <RecentRow key={a._id || a.id} a={a} />
            ))}
          </div>
        ) : (
          <div className="empty-recent">
            <div className="empty-icon">
              <Clock3 size={20} />
            </div>
            <div>
              <b>Your recent work will appear here</b>
              <p>Run your first analysis to build a personal library of insights.</p>
            </div>
            <span className="empty-pill">READY WHEN YOU ARE</span>
          </div>
        )}
      </section>
    </>
  );
}

function ArrowUpRightFallback() {
  return <ArrowRight size={15} className="muted" />;
}

function HowCard({ n, icon, title, text, tone }) {
  return (
    <div className="how-card">
      <div className="how-top">
        <div className={`how-icon ${tone}`}>{icon}</div>
        <span>{n}</span>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function RecentRow({ a }) {
  const navigate = useNavigate();
  return (
    <button className="recent-row" onClick={() => navigate(`/analysis/${a._id || a.id}`)}>
      <div className="recent-file">
        <FileText size={19} />
      </div>
      <div className="recent-info">
        <b>{a.jobTitle || 'Untitled role'}</b>
        <span>
          {a.resumeName || 'Resume'} · {new Date(a.createdAt || Date.now()).toLocaleDateString()}
        </span>
      </div>
      <div className="recent-score">
        <b>
          {a.score ?? '—'}
          {a.score != null ? '%' : ''}
        </b>
        <span>match</span>
      </div>
      <ArrowRight size={16} className="muted" />
    </button>
  );
}

function HistoryPage({ notify }) {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState('');
  const navigate = useNavigate();

  const refresh = () =>
    getAnalyses()
      .then((d) => setItems(d.analyses || []))
      .catch(() => notify('Could not load history. Is the API running?'))
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
  }, []);

  const filtered = items.filter(
    (a) =>
      (a.jobTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.resumeName || '').toLowerCase().includes(search.toLowerCase())
  );

  const remove = async (id) => {
    if (!confirm('Delete this analysis?')) return;
    try {
      await deleteAnalysis(id);
      setItems((x) => x.filter((a) => (a._id || a.id) !== id));
      notify('Analysis deleted.');
    } catch {
      notify('Could not delete this analysis.');
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="YOUR WORKSPACE"
        title="Analysis history"
        description="Revisit previous role comparisons and the tailored resumes you generated."
      />
      <div className="history-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role or resume…"
          />
        </div>
        <span className="count-pill">
          {filtered.length} {filtered.length === 1 ? 'analysis' : 'analyses'}
        </span>
      </div>
      {loading ? (
        <LoadingState text="Loading your history…" />
      ) : filtered.length ? (
        <div className="history-table panel">
          <div className="history-head">
            <span>ROLE / RESUME</span>
            <span>MATCH SCORE</span>
            <span>DATE</span>
            <span>ACTIONS</span>
          </div>
          {filtered.map((a) => (
            <div className="history-row" key={a._id || a.id}>
              <button
                className="history-role"
                onClick={() => navigate(`/analysis/${a._id || a.id}`)}
              >
                <span className="history-file">
                  <FileText size={18} />
                </span>
                <span>
                  <b>{a.jobTitle || 'Untitled role'}</b>
                  <small>{a.resumeName || 'Resume document'}</small>
                </span>
              </button>
              <span className="table-score">
                {a.score ?? '—'}
                {a.score != null ? '%' : ''}
              </span>
              <span className="table-date">
                {new Date(a.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <div className="table-actions">
                <button
                  className="secondary-btn small-btn history-action-btn"
                  onClick={() => navigate(`/analysis/${a._id || a.id}/resume`)}
                  title="Open Tailored Resume Workspace"
                >
                  <FileCheck2 size={14} /> Resume
                </button>
                <button
                  className="icon-btn"
                  title="Open Report"
                  onClick={() => navigate(`/analysis/${a._id || a.id}`)}
                >
                  <ArrowRight size={16} />
                </button>
                <button
                  className="icon-btn danger-icon"
                  title="Delete analysis"
                  onClick={() => remove(a._id || a.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <div className="empty-icon large">
            <History size={23} />
          </div>
          <h3>{search ? 'No matching analyses' : 'No analyses saved yet'}</h3>
          <p>
            {search
              ? 'Try a different search term.'
              : 'Your completed analyses will be available here for easy reference.'}
          </p>
          <button className="primary-btn" onClick={() => navigate('/')}>
            Start an analysis <ArrowRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}

function LoadingState({ text }) {
  return (
    <div className="loading-state">
      <LoaderCircle size={23} className="spin" />
      <span>{text}</span>
    </div>
  );
}

function AnalysisPage({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [focus, setFocus] = useState(''),
    [tailoring, setTailoring] = useState(false),
    [validating, setValidating] = useState(false),
    [exportingPdf, setExportingPdf] = useState(false),
    [showAtsModal, setShowAtsModal] = useState(false),
    [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAnalysis(id)
      .then((d) => setData(d.analysis))
      .catch(() =>
        notify('Could not load this analysis. It may not be saved in the current server session.')
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState text="Preparing your analysis…" />;
  if (!data)
    return (
      <div className="empty-state panel">
        <h3>Analysis not found</h3>
        <p>This analysis may have expired if the server restarted without MongoDB configured.</p>
        <a href="/" className="primary-btn">
          Back to dashboard
        </a>
      </div>
    );

  const score = Number(data.score || 0),
    skills = data.skills || {},
    gaps = skills.gaps || [],
    matched = skills.matched || [],
    partial = skills.partial || [];

  const download = (name, content, type = 'text/plain') => {
    const blob = new Blob([content], { type }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = () =>
    download('resumematch-report.json', JSON.stringify(data, null, 2), 'application/json');

  const exportTxt = () =>
    download('tailored-resume.txt', data.tailoredResume || 'No tailored resume generated.');

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const filename = await exportResumePdf(id, {
        tailoredData: data.tailoredData,
        selectedTemplate: data.selectedTemplate || 'modern-professional',
        resumeCustomization: data.resumeCustomization || {
          font: 'Inter',
          accentColor: 'slate',
          spacing: 'standard',
        },
      });
      notify(`PDF downloaded: ${filename}`);
    } catch {
      notify('Failed to generate PDF. You can also export via the Resume Workspace.');
    } finally {
      setExportingPdf(false);
    }
  };

  const regenerate = async () => {
    setTailoring(true);
    try {
      const d = await tailorAnalysis(id, focus);
      setData(d.analysis);
      notify('Tailored resume updated.');
    } catch (e) {
      notify(e.response?.data?.error || 'Could not regenerate resume.');
    } finally {
      setTailoring(false);
    }
  };

  const validate = async () => {
    setValidating(true);
    try {
      const d = await validateAnalysis(id, data.tailoredData);
      setData(d.analysis);
      if (d.validation?.passed) {
        notify('Factual review passed: No unsupported claims found.');
      } else {
        notify('Validation flagged potential claims for manual review.');
      }
    } catch {
      notify('Validation could not be completed.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <div className="result-back">
        <a href="/">
          <ArrowLeft size={15} /> Back to dashboard
        </a>
        <div className="result-actions">
          <button className="secondary-btn small-btn" onClick={() => setShowCompareModal(true)} title="Compare tailored resume with original">
            <Layers size={15} /> Compare with Original
          </button>
          <button className="secondary-btn small-btn" onClick={exportReport}>
            <ArrowDownToLine size={15} /> Export report
          </button>
          <button className="primary-btn small-btn" onClick={() => navigate(`/analysis/${id}/resume`)}>
            <FileCheck2 size={15} /> View Tailored Resume
          </button>
        </div>
      </div>

      <PageIntro
        eyebrow="YOUR ANALYSIS"
        title={data.jobTitle || 'Role alignment report'}
        description={`Analysis of ${data.resumeName || 'your resume'} against the target job description.`}
      >
        <span className={cx('mode-pill', data.aiMode === 'ai' ? 'mode-live' : 'mode-demo')}>
          <span className="status-dot" />
          {data.aiMode === 'ai' ? 'AI-powered analysis' : 'Demo analysis'}
        </span>
      </PageIntro>

      {/* DEDICATED ACTION AREA: 6 ESSENTIAL ACTIONS */}
      <section className="analysis-action-bar panel">
        <div className="action-bar-info">
          <div className="action-bar-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <b>Tailored Resume & ATS Workspace Ready</b>
            <p>
              Your tailored resume has been structured and aligned with verified evidence from your document.
            </p>
          </div>
        </div>

        <div className="action-bar-buttons">
          <button
            className="primary-btn action-bar-primary"
            onClick={() => navigate(`/analysis/${id}/resume`)}
          >
            <FileCheck2 size={16} /> View Tailored Resume
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate(`/analysis/${id}/resume`)}
          >
            <Edit3 size={15} /> Edit Resume
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate(`/analysis/${id}/resume`)}
          >
            <LayoutTemplate size={15} /> Choose Template
          </button>
          <button
            className="secondary-btn"
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <ArrowDownToLine size={15} />
            )}
            Download PDF
          </button>
          <button
            className="secondary-btn"
            onClick={() => setShowCompareModal(true)}
            title="Side-by-side comparison of original and tailored resume"
          >
            <Layers size={15} /> Compare with Original
          </button>
          <button
            className="secondary-btn"
            onClick={() => setShowAtsModal(true)}
          >
            <Target size={15} /> View ATS Keywords
          </button>
          <button
            className="secondary-btn"
            onClick={validate}
            disabled={validating}
          >
            {validating ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <ShieldCheck size={15} />
            )}
            Validate Resume
          </button>
        </div>
      </section>

      {/* OVERVIEW SNAPSHOT */}
      <div className="result-overview">
        <section className="panel score-panel">
          <div className="score-heading">
            <div>
              <div className="card-eyebrow">OVERALL ROLE ALIGNMENT</div>
              <h3>Your match snapshot</h3>
            </div>
            <span className="score-badge">
              <Sparkles size={14} /> ESTIMATED
            </span>
          </div>
          <div className="score-content">
            <div className="score-ring" style={{ '--score': `${score * 3.6}deg` }}>
              <div className="score-ring-inner">
                <strong>{score}</strong>
                <span>out of 100</span>
              </div>
            </div>
            <div className="score-summary">
              <h4>
                {score >= 80
                  ? 'Strong alignment'
                  : score >= 60
                  ? 'Promising foundation'
                  : score >= 40
                  ? 'Room to strengthen'
                  : 'An opportunity to build'}
              </h4>
              <p>
                {data.explanation ||
                  'This estimate summarizes the skills and experience evidenced in your resume against the role requirements.'}
              </p>
              <div className="score-legend">
                <span>
                  <i className="legend-dot blue-dot" /> Matched: {matched.length}
                </span>
                {partial.length > 0 && (
                  <span>
                    <i className="legend-dot" style={{ background: '#F59E0B' }} /> Partial: {partial.length}
                  </span>
                )}
                <span>
                  <i className="legend-dot rose-dot" /> Gaps: {gaps.length}
                </span>
              </div>
              {skills.scoringMethodology && (
                <small style={{ display: 'block', marginTop: '6px', color: '#64748B', fontSize: '11px', lineHeight: 1.4 }}>
                  {skills.scoringMethodology}
                </small>
              )}
            </div>
          </div>
          <div className="score-foot">
            <ShieldCheck size={15} /> A text-based estimate, not a hiring decision.
          </div>
        </section>

        <section className="panel metric-panel">
          <div className="metric-top">
            <div className="panel-icon blue-icon">
              <BadgeCheck size={19} />
            </div>
            <span className="metric-label">MATCHED SKILLS</span>
          </div>
          <div className="metric-number">
            {matched.length}
            <span> skills</span>
          </div>
          <p>Clear evidence found in your resume.</p>
          <div className="metric-progress">
            <span
              style={{
                width: `${Math.min(
                  100,
                  (matched.length / Math.max(1, matched.length + partial.length + gaps.length)) * 100
                )}%`,
              }}
            />
          </div>
          <div className="metric-bottom">{partial.length} partial matches</div>
        </section>

        <section className="panel metric-panel">
          <div className="metric-top">
            <div className="panel-icon rose-icon">
              <Target size={19} />
            </div>
            <span className="metric-label">SKILL GAPS</span>
          </div>
          <div className="metric-number">
            {gaps.length}
            <span> areas</span>
          </div>
          <p>Requirements not clearly evidenced.</p>
          <div className="gap-tags">
            {gaps.slice(0, 3).map((g) => (
              <span key={g.name}>{g.name}</span>
            ))}
            {!gaps.length && <span>No major gaps listed</span>}
          </div>
          <div className="metric-bottom">A gap means “not found”, not “can't do”.</div>
        </section>
      </div>

      {/* REQUIREMENTS BREAKDOWN & RECOMMENDATIONS */}
      <div className="result-columns">
        <section className="panel result-panel">
          <div className="result-panel-heading">
            <div>
              <div className="card-eyebrow">REQUIREMENTS BREAKDOWN</div>
              <h3>Where you align</h3>
            </div>
            <span className="subtle-count">
              {matched.length + partial.length + gaps.length} signals
            </span>
          </div>
          <SkillGroup
            title="Strong evidence"
            subtitle="Clearly supported by resume content"
            items={matched}
            tone="good"
          />
          <SkillGroup
            title="Partial evidence"
            subtitle="Related experience may need clearer wording"
            items={partial}
            tone="partial"
          />
          <SkillGroup
            title="Not evidenced yet"
            subtitle="Not clearly present in the resume provided"
            items={gaps}
            tone="gap"
          />
        </section>

        <section className="panel result-panel">
          <div className="result-panel-heading">
            <div>
              <div className="card-eyebrow">YOUR NEXT MOVES</div>
              <h3>Recommendations</h3>
            </div>
            <div className="panel-icon rose-icon">
              <Lightbulb size={18} />
            </div>
          </div>
          <div className="recommendation-list">
            {(data.recommendations || []).map((r, i) => (
              <div className="recommendation" key={i}>
                <div className="recommend-number">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <b>{typeof r === 'string' ? r : r.title}</b>
                  <p>{typeof r === 'string' ? '' : r.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="recommendation-note">
            <ShieldCheck size={15} />
            <span>Only add a skill or achievement if it reflects your real experience.</span>
          </div>
        </section>
      </div>

      {/* TAILORED RESUME PREVIEW PANEL */}
      <section className="panel tailored-panel">
        <div className="tailored-heading">
          <div className="tailored-icon">
            <WandSparkles size={20} />
          </div>
          <div>
            <div className="card-eyebrow">TAILORED FOR THIS ROLE</div>
            <h3>Your resume, thoughtfully refined</h3>
            <p>
              Relevant wording is prioritized while keeping your experience grounded in the original document. Available in 4 professional templates with live editing and PDF export.
            </p>
          </div>
          <span className="grounded-tag">
            <CheckCircle2 size={14} /> Evidence-aware
          </span>
        </div>

        <div className="tailor-workspace-callout">
          <div className="callout-text">
            <b>Ready to customize, preview, and download your resume?</b>
            <p>
              Switch between ATS Classic, Modern Professional, Minimal Elegant, and Technical Developer templates, customize fonts and colors, edit content with instant live preview, and download an ATS-compliant PDF.
            </p>
          </div>
          <button
            className="primary-btn callout-btn"
            onClick={() => navigate(`/analysis/${id}/resume`)}
          >
            Open in Resume Editor & Live Preview <ArrowRight size={16} />
          </button>
        </div>

        <div className="tailor-controls">
          <label htmlFor="focus">Optional focus for the rewrite</label>
          <div className="tailor-control-row">
            <input
              id="focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. emphasize project work and SQL experience"
            />
            <button className="secondary-btn" onClick={regenerate} disabled={tailoring}>
              {tailoring ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <WandSparkles size={15} />
              )}
              Regenerate
            </button>
          </div>
        </div>

        <div className="resume-preview">
          {data.tailoredResume ? (
            <pre>{data.tailoredResume}</pre>
          ) : (
            <p className="muted">No tailored resume was generated.</p>
          )}
        </div>

        <div className="tailored-footer">
          <span>
            <FileText size={15} /> Plain-text preview · Review before submitting
          </span>
          <div>
            <button className="secondary-btn small-btn" onClick={validate} disabled={validating}>
              {validating ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <ShieldCheck size={14} />
              )}
              Validate claims
            </button>
            <button className="secondary-btn small-btn" onClick={exportTxt}>
              Export .txt
            </button>
            <button className="primary-btn small-btn" onClick={handleDownloadPdf} disabled={exportingPdf}>
              {exportingPdf ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <ArrowDownToLine size={14} />
              )}
              Download PDF
            </button>
          </div>
        </div>

        {data.validation && (
          <div
            className={cx(
              'validation-box',
              data.validation.passed ? 'validation-pass' : 'validation-warn'
            )}
          >
            <div>
              {data.validation.passed ? <CheckCircle2 size={17} /> : <Activity size={17} />}
              <b>
                {data.validation.passed
                  ? 'Factual review passed'
                  : 'Review these claims carefully'}
              </b>
            </div>
            {(data.validation.issues || []).length ? (
              <ul>
                {data.validation.issues.map((x, i) => (
                  <li key={i}>{typeof x === 'string' ? x : JSON.stringify(x)}</li>
                ))}
              </ul>
            ) : (
              <p>
                No unsupported claims were flagged by the current validation pass. Still review manually.
              </p>
            )}
          </div>
        )}
      </section>

      <div className="method-note">
        <div className="method-icon">
          <MessageSquareText size={17} />
        </div>
        <div>
          <b>How to read this report</b>
          <p>
            The score is an estimate based on the supplied text. Missing evidence is not proof you lack a skill. AI output can be wrong; verify every statement before sending your resume.
          </p>
        </div>
        <div className="coverage-pill">
          <Sparkles size={14} />{' '}
          {data.aiMode === 'ai' ? 'AI-assisted stages' : 'Demo workflow'}
        </div>
      </div>

      {/* ATS OPTIMIZATION MODAL */}
      {showAtsModal && (
        <AtsOptimizationModal
          atsData={data.atsOptimization}
          onClose={() => setShowAtsModal(false)}
        />
      )}

      {/* BEFORE & AFTER COMPARISON MODAL */}
      {showCompareModal && (
        <ResumeComparisonModal
          analysis={data}
          onAnalysisUpdate={setData}
          onClose={() => setShowCompareModal(false)}
          notify={notify}
        />
      )}

        </>
      </MemoryRouter>
    );
  }

  try {
    const html = ReactDOMServer.renderToString(React.createElement(MockAnalysisView));
    console.log("SUCCESSFULLY RENDERED AnalysisPage! Length:", html.length);
  } catch (err) {
    console.error("CRASH IN AnalysisPage RENDER:", err);
  }
}
run();
