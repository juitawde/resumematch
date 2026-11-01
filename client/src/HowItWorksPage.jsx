import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Filter,
  Layers,
  LayoutTemplate,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Target,
  WandSparkles,
} from 'lucide-react';
import { TiltCard, AnimatedAccordionItem } from './MotionComponents';

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Document Ingestion & Spatial Text Extraction',
    eyebrow: 'STAGE 1: PARSING',
    icon: FileText,
    accent: '#405F75',
    summary: 'Extracts every section, heading, bullet, and link while repairing PDF text anomalies.',
    details: [
      'Spatial coordinate analysis detects multi-column layouts without merging distinct columns.',
      'Intelligent word-spacing normalization repairs run-together words (e.g. "React.js,Node.js" -> "React.js, Node.js").',
      'Contact isolation isolates email, phone, and links into discrete fields, keeping summaries pristine.',
    ],
    technicalSafeguard: 'Zero dropped characters or corrupted characters. Text is parsed into clean, deterministic UTF-8 tokens.',
  },
  {
    step: 2,
    title: 'Canonical Data Normalization (100% Preservation)',
    eyebrow: 'STAGE 2: EXTRACTION',
    icon: Layers,
    accent: '#1E3A5F',
    summary: 'Preserves 100% of candidate history in a structured, canonical profile.',
    details: [
      'Extracts all projects, work experience, education, certifications, and technical skill categories.',
      'Identifies and preserves all project links, demo URLs, and GitHub repositories.',
      'Never drops, deletes, or truncates candidate accomplishments, even if not required by the job.',
    ],
    technicalSafeguard: 'Immutable canonical record: The original resume data serves as the non-negotiable source of truth.',
  },
  {
    step: 3,
    title: 'Target Job Description Intent & Requirements Extraction',
    eyebrow: 'STAGE 3: INTENT ANALYSIS',
    icon: Target,
    accent: '#95576A',
    summary: 'Analyzes target JD requirements, differentiating essential qualifications from nice-to-haves.',
    details: [
      'Separates mandatory technical requirements from standard skills and preferred qualifications.',
      'Categorizes skills into 4 explicit groups: Technical Skills, Core Competencies, Role-Specific Keywords, and Action Verbs.',
      'Filters out HR buzzwords and hiring noise phrases, focusing strictly on verifiable competencies.',
    ],
    technicalSafeguard: 'Noise-rejection filter prevents non-technical phrases like "looking for" or "fast-paced team" from polluting keyword analysis.',
  },
  {
    step: 4,
    title: 'Evidence-Weighted ATS Alignment (Exact Arithmetic)',
    eyebrow: 'STAGE 4: SCORING',
    icon: Scale,
    accent: '#2D6A4F',
    summary: 'Calculates mathematically consistent alignment scores based strictly on verified candidate proof.',
    details: [
      'Weighting formula: Mandatory/Essential Tech (3x), Standard Tech & Competencies (2x), Preferred Skills (1x).',
      'Exact matches receive 100% credit, partial/related capabilities receive 50% credit, missing requirements receive 0% credit.',
      'Zero arbitrary scores: 2 matches and 8 gaps out of 10 equal requirements scores exactly 20%, never a fake 85%.',
    ],
    technicalSafeguard: 'Symmetrical scoring calculates baseline original score and tailored score independently to show true delta.',
  },
  {
    step: 5,
    title: 'Intelligent 1-Page A4 Project Budgeting',
    eyebrow: 'STAGE 5: PAGE BUDGET',
    icon: Filter,
    accent: '#B45309',
    summary: 'Selects the top 3–4 most relevant projects for the 1-page A4 document while preserving all in your portfolio.',
    details: [
      'Ranks candidate projects by relevance to target job description keywords.',
      'Default 1-page A4 budget selects the top 3–4 highest-scoring projects for clean single-page printing.',
      'Remaining projects are safely preserved in the database and portfolio, and can be toggled on/off anytime.',
    ],
    technicalSafeguard: 'Intentionally excluded projects are labeled "Page Budget Exclusion", never lost or dropped.',
  },
  {
    step: 6,
    title: 'Impact-Driven Action-Verb Bullet Rewriting',
    eyebrow: 'STAGE 6: TAILORING',
    icon: WandSparkles,
    accent: '#7C3AED',
    summary: 'Reframes accomplishments with powerful active engineering verbs without fabricating metrics.',
    details: [
      'Replaces passive or weak verbs with verified engineering actions: Architected, Engineered, Developed, Optimized, Integrated.',
      'Surfaces verified candidate skills and target role terminology authentically.',
      'Strict anti-fabrication guarantee: NEVER invents percentages, dollar figures, revenue numbers, or metrics.',
    ],
    technicalSafeguard: 'Content is rewritten for clarity and ATS keyword density, but claims are strictly grounded in original facts.',
  },
  {
    step: 7,
    title: 'Deterministic Factual Review & Guardrails',
    eyebrow: 'STAGE 7: VERIFICATION',
    icon: ShieldCheck,
    accent: '#059669',
    summary: 'Cross-checks every claim in the tailored draft against the source resume to eliminate hallucinations.',
    details: [
      'Identifies and flags any unsupported numeric results, employers, degrees, or certifications.',
      'Eliminates false positives: Candidate skills present in source (e.g. HTML5, CSS3, REST APIs, Socket.IO) are never falsely flagged.',
      'Categorizes unselected projects as intentional page budget choices rather than factual discrepancies.',
    ],
    technicalSafeguard: 'Dual verification: AI semantic review is verified against deterministic token matching from the source document.',
  },
  {
    step: 8,
    title: 'Multi-Template Professional PDF Compilation',
    eyebrow: 'STAGE 8: EXPORT',
    icon: LayoutTemplate,
    accent: '#111827',
    summary: 'Compiles clean, selectable-text A4 PDFs across 4 professional ATS-tested templates.',
    details: [
      'Strict A4 page constraints (210mm x 297mm) with balanced 34pt margins and crisp typography.',
      'Zero overlapping text, zero word concatenation, and perfect bullet alignment.',
      'Interactive Live Preview in the workspace matches the exact layout of the exported PDF.',
    ],
    technicalSafeguard: 'Generates standard PDF 1.4 documents compatible with Taleo, Workday, Greenhouse, Lever, and iCIMS.',
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  const currentStep = WORKFLOW_STEPS.find((s) => s.step === activeStep) || WORKFLOW_STEPS[0];
  const StepIcon = currentStep.icon;

  return (
    <div className="how-page">
      {/* HERO SECTION */}
      <TiltCard className="how-hero" maxTilt={4.5} scale={1.012} glare={true}>
        <div className="how-hero-kicker">
          <span className="welcome-kicker-dot" />
          <span>Transparent AI Architecture</span>
        </div>
        <h1>
          How ResumeMatch AI <em>Actually Works</em>
        </h1>
        <p>
          ResumeMatch is an evidence-based career intelligence platform. Unlike generic resume generators that fabricate metrics or drop original candidate information, ResumeMatch enforces strict 100% data preservation, transparent ATS arithmetic, and deterministic factual verification.
        </p>

        <div className="how-hero-actions">
          <button type="button" className="primary-btn" onClick={() => navigate('/')}>
            <span>Start New Analysis</span>
            <ArrowRight size={15} />
          </button>
          <button type="button" className="secondary-btn" onClick={() => navigate('/history')}>
            <span>View Analysis History</span>
          </button>
        </div>
      </TiltCard>

      {/* 8-STEP INTERACTIVE WORKFLOW PIPELINE */}
      <div className="panel how-pipeline-card">
        <div className="how-section-header">
          <div>
            <div className="card-eyebrow">STEP-BY-STEP PIPELINE</div>
            <h2>The 8-Stage Intelligence Pipeline</h2>
          </div>
          <span
            className="intro-chip"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#405F75',
              background: '#EAF1F6',
              padding: '6px 14px',
              borderRadius: '20px',
            }}
          >
            Click any step to inspect
          </span>
        </div>

        {/* Step Buttons Grid */}
        <div className="how-step-nav">
          {WORKFLOW_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.step === activeStep;
            return (
              <button
                key={s.step}
                type="button"
                className={`how-step-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveStep(s.step)}
              >
                <div className="how-step-icon-wrap">
                  <Icon size={17} />
                </div>
                <span className="how-step-num">Step {s.step}</span>
                <span className="how-step-label">
                  {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Step Detail Card */}
        <div className="how-detail-card">
          <div className="how-detail-head">
            <div className="how-detail-title-group">
              <div className="how-detail-icon">
                <StepIcon size={22} />
              </div>
              <div>
                <span className="eyebrow" style={{ color: '#405F75' }}>
                  {currentStep.eyebrow}
                </span>
                <h3 className="how-detail-h3">
                  Step {currentStep.step}: {currentStep.title}
                </h3>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="secondary-btn small-btn"
                disabled={activeStep === 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="secondary-btn small-btn"
                disabled={activeStep === 8}
                onClick={() => setActiveStep((prev) => Math.min(8, prev + 1))}
              >
                Next Step
              </button>
            </div>
          </div>

          <p className="how-detail-summary">{currentStep.summary}</p>

          <div style={{ marginBottom: '18px' }}>
            <b
              style={{
                fontSize: '12px',
                color: '#29243A',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                display: 'block',
                marginBottom: '10px',
              }}
            >
              Key Operational Mechanisms:
            </b>
            <ul className="how-mechanisms-list">
              {currentStep.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div className="how-safeguard-box">
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Deterministic Safeguard:</strong> {currentStep.technicalSafeguard}
            </div>
          </div>
        </div>
      </div>

      {/* WHAT RESUMEMATCH DOES VS WHAT IT NEVER DOES */}
      <div className="panel" style={{ padding: '30px 34px', marginBottom: '32px' }}>
        <div className="card-eyebrow">ETHICAL & FACTUAL STANDARDS</div>
        <h2 style={{ font: '800 22px "Manrope", sans-serif', color: '#29243A', letterSpacing: '-0.6px', margin: '4px 0 20px' }}>
          What ResumeMatch AI Does vs. What It NEVER Does
        </h2>

        <div className="how-comparison-grid">
          {/* DOES CARD */}
          <TiltCard className="how-comparison-card does" maxTilt={3.5} scale={1.01}>
            <div className="how-comparison-header">
              <CheckCircle2 size={20} />
              <span>What ResumeMatch AI Does</span>
            </div>
            <ul className="how-comparison-list">
              <li>
                <strong>100% Data Preservation:</strong> Preserves every project, job, school, and skill from your uploaded resume.
              </li>
              <li>
                <strong>Active Bullet Rewriting:</strong> Enhances descriptions using strong action verbs (Architected, Engineered, Developed).
              </li>
              <li>
                <strong>Transparent Arithmetic:</strong> Employs a weighted mathematical formula based strictly on verified evidence.
              </li>
              <li>
                <strong>Relevance-Based Project Selection:</strong> Selects top projects for 1-page A4 documents while keeping all in portfolio.
              </li>
              <li>
                <strong>A4 Professional PDF Export:</strong> Produces high-fidelity, ATS-parseable single-page and two-page documents.
              </li>
            </ul>
          </TiltCard>

          {/* NEVER DOES CARD */}
          <TiltCard className="how-comparison-card never" maxTilt={3.5} scale={1.01}>
            <div className="how-comparison-header">
              <ShieldAlert size={20} />
              <span>What ResumeMatch AI NEVER Does</span>
            </div>
            <ul className="how-comparison-list">
              <li>
                <strong>NEVER Fabricates Metrics:</strong> Will never invent fake percentages (e.g. "+85% efficiency") or dollar figures.
              </li>
              <li>
                <strong>NEVER Drops Projects:</strong> Will never discard or permanently delete your original candidate projects.
              </li>
              <li>
                <strong>NEVER Invents Credentials:</strong> Will never fabricate degrees, job titles, or companies you never worked at.
              </li>
              <li>
                <strong>NEVER Uses Fake Match Numbers:</strong> Will never display arbitrary 90%+ scores without underlying proof.
              </li>
              <li>
                <strong>NEVER Injects Hidden Text:</strong> Will never insert invisible keywords or white text to fool ATS systems.
              </li>
            </ul>
          </TiltCard>
        </div>
      </div>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <div className="panel" style={{ padding: '30px 34px', marginBottom: '40px' }}>
        <div className="card-eyebrow">COMMON QUESTIONS</div>
        <h2 style={{ font: '800 22px "Manrope", sans-serif', color: '#29243A', letterSpacing: '-0.6px', margin: '4px 0 20px' }}>
          Frequently Asked Questions
        </h2>

        <div className="how-faq-list">
          <AnimatedAccordionItem
            title="Why does my 1-page resume only show 3 projects when I uploaded 7?"
            defaultOpen={true}
          >
            To ensure a clean, professional 1-page A4 document without tiny microscopic fonts or overflow onto a blank second page, ResumeMatch intelligently selects the top 3 projects ranked by relevance to your target job. All 7 projects remain 100% preserved in your portfolio and workspace editor, where you can easily toggle any project on or off.
          </AnimatedAccordionItem>

          <AnimatedAccordionItem
            title="How is the ATS Score calculated?"
            defaultOpen={false}
          >
            We use a transparent evidence-weighted formula: Essential job requirements carry 3x weight, standard technical skills and core competencies carry 2x weight, and preferred skills carry 1x weight. Verified exact matches receive 100% credit, partial/semantic alignments receive 50% credit, and unevidenced requirements receive 0% credit. The score is calculated as (Awarded Points / Total Points) × 100.
          </AnimatedAccordionItem>

          <AnimatedAccordionItem
            title="Can I customize the typography, colors, and layout?"
            defaultOpen={false}
          >
            Yes! In the Resume Workspace, you can choose from 4 ATS-tested templates (ATS Classic, Modern Professional, Minimal Elegant, and Technical / Developer), 5 font families, 5 accent colors, and standard/compact spacing presets. Your Live Preview updates in real-time.
          </AnimatedAccordionItem>
        </div>
      </div>
    </div>
  );
}
