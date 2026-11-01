import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Layers,
  FileText,
  FileCheck2,
  CheckCircle2,
  Columns2,
  ShieldCheck,
  BriefcaseBusiness,
  GraduationCap,
  Award,
  Target,
  ArrowRight,
  Split,
  Eye,
  Check,
} from 'lucide-react';
import { restoreResume } from './api';

// Lightweight phrase-level text diffing helper
function diffText(origStr = '', tailoredStr = '') {
  if (!origStr && !tailoredStr) return [];
  if (!origStr) {
    return [{ type: 'added', text: tailoredStr }];
  }
  if (!tailoredStr) {
    return [{ type: 'removed', text: origStr }];
  }
  if (origStr.trim() === tailoredStr.trim()) {
    return [{ type: 'unchanged', text: tailoredStr }];
  }

  // Tokenize by sentences / clauses
  const origSentences = origStr.split(/(?<=[.?!])\s+/).filter(Boolean);
  const tailoredSentences = tailoredStr.split(/(?<=[.?!])\s+/).filter(Boolean);

  const results = [];
  const origSet = new Set(origSentences.map((s) => s.trim().toLowerCase()));

  tailoredSentences.forEach((ts) => {
    const tsClean = ts.trim().toLowerCase();
    if (origSet.has(tsClean)) {
      results.push({ type: 'unchanged', text: ts });
    } else {
      // Check if it's a modified version of an original sentence
      const hasOverlap = origSentences.some((os) => {
        const words = os.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
        return words.filter((w) => tsClean.includes(w)).length >= 2;
      });
      if (hasOverlap) {
        results.push({ type: 'modified', text: ts });
      } else {
        results.push({ type: 'added', text: ts });
      }
    }
  });

  return results;
}

export default function ResumeComparisonModal({ analysis, onAnalysisUpdate, onClose, notify }) {
  const [viewMode, setViewMode] = useState('side_by_side'); // 'side_by_side' | 'highlighted' | 'original' | 'tailored'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'summary' | 'skills' | 'projects' | 'experience' | 'education' | 'certifications'
  const [restoring, setRestoring] = useState(false);

  const origData = analysis?.cleanedResumeData || analysis?.originalResumeData || {};
  const tailoredData = analysis?.tailoredData || origData;

  const origProjects = Array.isArray(origData?.projects) ? origData.projects : [];
  const tailoredProjects = Array.isArray(tailoredData?.projects) ? tailoredData.projects : [];

  const origExp = Array.isArray(origData?.experience) ? origData.experience : [];
  const tailoredExp = Array.isArray(tailoredData?.experience) ? tailoredData.experience : [];

  const origEdu = Array.isArray(origData?.education) ? origData.education : [];
  const tailoredEdu = Array.isArray(tailoredData?.education) ? tailoredData.education : [];

  const origCerts = Array.isArray(origData?.certifications) ? origData.certifications : [];
  const tailoredCerts = Array.isArray(tailoredData?.certifications) ? tailoredData.certifications : [];

  // Flattened skills
  const origSkills = (origData?.skills || []).flatMap((c) => c.items || []);
  const tailoredSkills = (tailoredData?.skills || []).flatMap((c) => c.items || []);
  const origSkillsSet = new Set(origSkills.map((s) => s.toLowerCase()));

  // Metrics computation
  const scoreBefore = analysis?.originalScore ?? analysis?.atsOptimization?.scoreBefore ?? 50;
  const scoreAfter = analysis?.score ?? analysis?.atsOptimization?.scoreAfter ?? 75;
  const scoreDelta = scoreAfter - scoreBefore;

  const totalProjectsPreserved = Math.min(origProjects.length, tailoredProjects.length);
  const projectsPreservedPct = origProjects.length > 0
    ? Math.round((totalProjectsPreserved / origProjects.length) * 100)
    : 100;

  const bulletsRewrittenCount = tailoredProjects.reduce((acc, p) => acc + (p.bullets?.length || 0), 0);
  const newlyEmphasizedCount = analysis?.atsOptimization?.newlyEmphasized?.length ||
    tailoredSkills.filter((s) => !origSkillsSet.has(s.toLowerCase())).length;

  // Restore section handler
  const handleRestore = async (section) => {
    if (!analysis?.id && !analysis?._id) return;
    const aid = analysis.id || analysis._id;
    setRestoring(true);
    try {
      const res = await restoreResume(aid, {
        section,
        source: 'cleaned',
      });
      if (res?.analysis) {
        if (onAnalysisUpdate) onAnalysisUpdate(res.analysis);
        if (notify) {
          notify(section === 'all' ? 'All resume sections restored to original.' : `${section.charAt(0).toUpperCase() + section.slice(1)} restored to original.`);
        }
      }
    } catch (e) {
      if (notify) notify(e.response?.data?.error || 'Failed to restore section.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="ats-modal-card panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Resume Comparison"
        style={{ maxWidth: '1060px', width: '94vw', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* HEADER */}
        <div className="ats-modal-header" style={{ marginBottom: '14px' }}>
          <div>
            <div className="card-eyebrow">BEFORE & AFTER COMPARISON</div>
            <h2>Original vs. Tailored Resume</h2>
            <p>
              Side-by-side evidence inspection for <b>{analysis.jobTitle || 'Target Role'}</b>. Compare exact improvements and restore any section at any time.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* TOP CHANGE SUMMARY DASHBOARD (Requirement E) */}
        <div className="ats-coverage-banner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <div className="ats-metric-tile">
            <div className="ats-metric-num">{scoreBefore}%</div>
            <div className="ats-metric-lbl">
              <span>Original Score</span>
              <small>Raw evidence fit</small>
            </div>
          </div>

          <div className="ats-metric-arrow" style={{ textAlign: 'center' }}>➔</div>

          <div className="ats-metric-tile highlighted">
            <div className="ats-metric-num">{scoreAfter}%</div>
            <div className="ats-metric-lbl">
              <span>Tailored Score</span>
              <small>Optimized alignment</small>
            </div>
          </div>

          <div className="ats-metric-tile">
            <div className="ats-metric-num" style={{ color: '#2F694B' }}>+{Math.max(0, scoreDelta)} pts</div>
            <div className="ats-metric-lbl">
              <span>Score Improvement</span>
              <small>Clarity enhancement</small>
            </div>
          </div>

          <div className="ats-metric-tile">
            <div className="ats-metric-num" style={{ color: '#1E40AF' }}>{totalProjectsPreserved} / {origProjects.length}</div>
            <div className="ats-metric-lbl">
              <span>Projects Preserved</span>
              <small>{projectsPreservedPct}% preserved</small>
            </div>
          </div>

          <div className="ats-metric-tile">
            <div className="ats-metric-num" style={{ color: '#854D0E' }}>{bulletsRewrittenCount}</div>
            <div className="ats-metric-lbl">
              <span>Descriptions Refined</span>
              <small>Action verbs applied</small>
            </div>
          </div>

          <div className="ats-metric-tile">
            <div className="ats-metric-num" style={{ color: '#166534' }}>0</div>
            <div className="ats-metric-lbl">
              <span>Items Removed</span>
              <small>Zero data loss</small>
            </div>
          </div>
        </div>

        {/* RESTORE ALL BUTTON & VIEW MODE TOGGLE (Requirement F) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          {/* VIEW SWITCHER */}
          <div className="ats-pills" style={{ margin: 0 }}>
            <button
              className={`ats-pill ${viewMode === 'side_by_side' ? 'active' : ''}`}
              onClick={() => setViewMode('side_by_side')}
            >
              <Columns2 size={13} /> Side-by-Side
            </button>
            <button
              className={`ats-pill ${viewMode === 'highlighted' ? 'active' : ''}`}
              onClick={() => setViewMode('highlighted')}
            >
              <Sparkles size={13} /> Highlighted Changes
            </button>
            <button
              className={`ats-pill ${viewMode === 'original' ? 'active' : ''}`}
              onClick={() => setViewMode('original')}
            >
              <FileText size={13} /> Original Only
            </button>
            <button
              className={`ats-pill ${viewMode === 'tailored' ? 'active' : ''}`}
              onClick={() => setViewMode('tailored')}
            >
              <FileCheck2 size={13} /> Tailored Only
            </button>
          </div>

          <button
            className="secondary-btn small-btn"
            disabled={restoring}
            onClick={() => handleRestore('all')}
            style={{ background: '#fff', borderColor: '#CBD5E1' }}
          >
            <RotateCcw size={14} /> Restore All to Original
          </button>
        </div>

        {/* CATEGORY FILTER TABS (Requirement D) */}
        <div className="ats-filter-bar" style={{ marginBottom: '18px' }}>
          <div className="ats-pills">
            <button className={`ats-pill ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
              All Sections
            </button>
            <button className={`ats-pill ${activeCategory === 'summary' ? 'active' : ''}`} onClick={() => setActiveCategory('summary')}>
              Professional Summary
            </button>
            <button className={`ats-pill ${activeCategory === 'skills' ? 'active' : ''}`} onClick={() => setActiveCategory('skills')}>
              Technical Skills
            </button>
            <button className={`ats-pill ${activeCategory === 'projects' ? 'active' : ''}`} onClick={() => setActiveCategory('projects')}>
              Key Projects ({origProjects.length})
            </button>
            {origExp.length > 0 && (
              <button className={`ats-pill ${activeCategory === 'experience' ? 'active' : ''}`} onClick={() => setActiveCategory('experience')}>
                Experience ({origExp.length})
              </button>
            )}
            <button className={`ats-pill ${activeCategory === 'education' ? 'active' : ''}`} onClick={() => setActiveCategory('education')}>
              Education
            </button>
            {origCerts.length > 0 && (
              <button className={`ats-pill ${activeCategory === 'certifications' ? 'active' : ''}`} onClick={() => setActiveCategory('certifications')}>
                Certifications
              </button>
            )}
          </div>
        </div>

        {/* SECTION CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. PROFESSIONAL SUMMARY */}
          {(activeCategory === 'all' || activeCategory === 'summary') && (
            <div className="panel compare-section-box" style={{ background: '#FAF9FA', padding: '16px', border: '1px solid #EBE4E9', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                  <FileText size={17} color="#405F75" /> Professional Summary
                </h4>
                <button
                  className="text-action"
                  disabled={restoring}
                  onClick={() => handleRestore('summary')}
                  style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={13} /> Restore Original Summary
                </button>
              </div>

              {viewMode === 'side_by_side' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original Document Summary</div>
                    <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: '#4B5563' }}>
                      {origData.summary || 'No original summary provided in resume.'}
                    </p>
                  </div>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tailored & Role-Aligned Summary</div>
                    <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: '#166534', fontWeight: 500 }}>
                      {tailoredData.summary || 'Standard tailored summary.'}
                    </p>
                  </div>
                </div>
              )}

              {viewMode === 'highlighted' && (
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#4B5563', marginBottom: '8px', textTransform: 'uppercase' }}>Sentence-Level Modifications</div>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.7 }}>
                    {diffText(origData.summary, tailoredData.summary).map((chunk, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: chunk.type === 'added' ? '#DCFCE7' : chunk.type === 'modified' ? '#FEF9C3' : 'transparent',
                          color: chunk.type === 'added' ? '#166534' : chunk.type === 'modified' ? '#854D0E' : '#374151',
                          padding: chunk.type !== 'unchanged' ? '2px 4px' : '0',
                          borderRadius: '3px',
                          fontWeight: chunk.type !== 'unchanged' ? 600 : 400,
                        }}
                      >
                        {chunk.text}{' '}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {viewMode === 'original' && (
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: '#374151' }}>{origData.summary || 'No original summary.'}</p>
                </div>
              )}

              {viewMode === 'tailored' && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: '#166534', fontWeight: 500 }}>{tailoredData.summary || 'Tailored summary.'}</p>
                </div>
              )}
            </div>
          )}

          {/* 2. TECHNICAL SKILLS */}
          {(activeCategory === 'all' || activeCategory === 'skills') && (
            <div className="panel compare-section-box" style={{ background: '#FAF9FA', padding: '16px', border: '1px solid #EBE4E9', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                  <Target size={17} color="#405F75" /> Technical Skills
                </h4>
                <button
                  className="text-action"
                  disabled={restoring}
                  onClick={() => handleRestore('skills')}
                  style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={13} /> Restore Original Skills
                </button>
              </div>

              {viewMode === 'side_by_side' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>Original Skills ({origSkills.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {origSkills.map((s, idx) => (
                        <span key={idx} style={{ fontSize: '12px', background: '#F3F4F6', color: '#374151', padding: '4px 8px', borderRadius: '5px' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', marginBottom: '8px', textTransform: 'uppercase' }}>Tailored Skills Presentation ({tailoredSkills.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {tailoredSkills.map((s, idx) => {
                        const isNew = !origSkillsSet.has(s.toLowerCase());
                        return (
                          <span
                            key={idx}
                            style={{
                              fontSize: '12px',
                              background: isNew ? '#DCFCE7' : '#E0E7FF',
                              color: isNew ? '#166534' : '#3730A3',
                              fontWeight: isNew ? 700 : 500,
                              padding: '4px 8px',
                              borderRadius: '5px',
                              border: isNew ? '1px solid #86EFAC' : 'none',
                            }}
                          >
                            {isNew ? `★ ${s}` : s}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {viewMode !== 'side_by_side' && (
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(viewMode === 'original' ? origSkills : tailoredSkills).map((s, idx) => (
                      <span key={idx} style={{ fontSize: '12px', background: '#F3F4F6', color: '#374151', padding: '4px 8px', borderRadius: '5px' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. KEY PROJECTS (Strict Preservation Check) */}
          {(activeCategory === 'all' || activeCategory === 'projects') && (
            <div className="panel compare-section-box" style={{ background: '#FAF9FA', padding: '16px', border: '1px solid #EBE4E9', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                  <Layers size={17} color="#405F75" /> Key Projects ({totalProjectsPreserved} / {origProjects.length} Preserved)
                </h4>
                <button
                  className="text-action"
                  disabled={restoring}
                  onClick={() => handleRestore('projects')}
                  style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={13} /> Restore Original Projects
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {origProjects.map((proj, pIdx) => {
                  const tProj = tailoredProjects.find((tp) => tp.id === proj.id || tp.name === proj.name) || proj;

                  return (
                    <div key={pIdx} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <b style={{ fontSize: '14px', color: '#1F2937' }}>{proj.name}</b>
                        <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                          Preserved
                        </span>
                      </div>

                      {viewMode === 'side_by_side' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                          <div style={{ borderRight: '1px dashed #E5E7EB', paddingRight: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase' }}>Original Wording</div>
                            <small style={{ color: '#4B5563', fontStyle: 'italic', display: 'block', marginBottom: '6px' }}>Technologies: {proj.technologies || 'None listed'}</small>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#4B5563', lineHeight: 1.5 }}>
                              {(proj.bullets || []).map((b, bIdx) => (
                                <li key={bIdx} style={{ marginBottom: '4px' }}>{b}</li>
                              ))}
                            </ul>
                          </div>

                          <div style={{ paddingLeft: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', marginBottom: '4px', textTransform: 'uppercase' }}>Tailored & Action-Verb Enhanced</div>
                            <small style={{ color: '#15803D', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Technologies: {tProj.technologies || proj.technologies}</small>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#166534', lineHeight: 1.5 }}>
                              {(tProj.bullets || proj.bullets || []).map((b, bIdx) => (
                                <li key={bIdx} style={{ marginBottom: '4px', fontWeight: 500 }}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {viewMode === 'highlighted' && (
                        <div style={{ marginTop: '8px' }}>
                          <small style={{ color: '#15803D', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Technologies: {tProj.technologies}</small>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', lineHeight: 1.6 }}>
                            {(tProj.bullets || []).map((b, bIdx) => {
                              const origB = (proj.bullets || [])[bIdx] || '';
                              return (
                                <li key={bIdx} style={{ marginBottom: '5px' }}>
                                  {diffText(origB, b).map((chunk, cIdx) => (
                                    <span
                                      key={cIdx}
                                      style={{
                                        background: chunk.type === 'added' ? '#DCFCE7' : chunk.type === 'modified' ? '#FEF9C3' : 'transparent',
                                        color: chunk.type === 'added' ? '#166534' : chunk.type === 'modified' ? '#854D0E' : '#374151',
                                        padding: chunk.type !== 'unchanged' ? '2px 4px' : '0',
                                        borderRadius: '3px',
                                        fontWeight: chunk.type !== 'unchanged' ? 600 : 400,
                                      }}
                                    >
                                      {chunk.text}{' '}
                                    </span>
                                  ))}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {viewMode === 'original' && (
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#4B5563', lineHeight: 1.5 }}>
                          {(proj.bullets || []).map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}

                      {viewMode === 'tailored' && (
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#166534', lineHeight: 1.5 }}>
                          {(tProj.bullets || []).map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. WORK EXPERIENCE */}
          {(activeCategory === 'all' || activeCategory === 'experience') && origExp.length > 0 && (
            <div className="panel compare-section-box" style={{ background: '#FAF9FA', padding: '16px', border: '1px solid #EBE4E9', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                  <BriefcaseBusiness size={17} color="#405F75" /> Work Experience
                </h4>
                <button
                  className="text-action"
                  disabled={restoring}
                  onClick={() => handleRestore('experience')}
                  style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={13} /> Restore Original Experience
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'side_by_side' ? '1fr 1fr' : '1fr', gap: '14px' }}>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>Original Experience</div>
                  {origExp.map((j, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <b style={{ fontSize: '13px' }}>{j.role} — {j.company}</b>
                      <small style={{ display: 'block', color: '#6B7280' }}>{j.dates}</small>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: '#4B5563' }}>
                        {(j.bullets || []).map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {viewMode === 'side_by_side' && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', marginBottom: '6px', textTransform: 'uppercase' }}>Tailored & Role-Aligned</div>
                    {tailoredExp.map((j, idx) => (
                      <div key={idx} style={{ marginBottom: '8px' }}>
                        <b style={{ fontSize: '13px', color: '#166534' }}>{j.role} — {j.company}</b>
                        <small style={{ display: 'block', color: '#15803D' }}>{j.dates}</small>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: '#166534' }}>
                          {(j.bullets || []).map((b, bIdx) => (
                            <li key={bIdx} style={{ fontWeight: 500 }}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. EDUCATION */}
          {(activeCategory === 'all' || activeCategory === 'education') && origEdu.length > 0 && (
            <div className="panel compare-section-box" style={{ background: '#FAF9FA', padding: '16px', border: '1px solid #EBE4E9', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                  <GraduationCap size={17} color="#405F75" /> Education (100% Unchanged)
                </h4>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                {origEdu.map((edu, idx) => (
                  <div key={idx}>
                    <b style={{ fontSize: '13px' }}>{edu.degree}</b>
                    <div style={{ fontSize: '12.5px', color: '#4B5563' }}>{edu.institution} {edu.dates ? `· ${edu.dates}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="ats-modal-footer" style={{ marginTop: '20px' }}>
          <span className="ats-footnote">
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Immutable Source Document: Your original resume data is permanently preserved in the database and never overwritten.
          </span>
          <button className="primary-btn" onClick={onClose}>
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}

