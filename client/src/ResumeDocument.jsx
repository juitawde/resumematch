import React from 'react';
import { ExternalLink, Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const ACCENT_COLORS = {
  slate: '#405F75',
  navy: '#1E3A5F',
  charcoal: '#29243A',
  rosewood: '#95576A',
  emerald: '#2D6A4F',
};

export default function ResumeDocument({
  data,
  template = 'modern-professional',
  font = 'Inter',
  accentColor = 'slate',
  spacing = 'standard',
}) {
  const accent = template === 'ats-classic' ? '#111827' : ACCENT_COLORS[accentColor] || ACCENT_COLORS.slate;
  const basics = data?.basics || {};
  const summary = data?.summary || '';
  const skills = Array.isArray(data?.skills) ? data.skills : [];
  const experience = Array.isArray(data?.experience) ? data.experience : [];
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const education = Array.isArray(data?.education) ? data.education : [];

  // Filter out invalid/malformed contact data from legacy records
  const rawPhone = String(basics.phone || '').trim();
  const digits = rawPhone.replace(/\D/g, '');
  const cleanPhone = digits.length >= 10 && digits.length <= 15 ? rawPhone : '';

  let cleanLocation = String(basics.location || '').trim();
  if (/\b(?:git|github|vs|vscode|code|react|node|html|css|python|java|sql)\b/i.test(cleanLocation)) {
    cleanLocation = '';
  }

  // Separate achievements if accidentally folded into certifications in legacy database records
  const rawCertifications = Array.isArray(data?.certifications) ? data.certifications : [];
  const achievements = Array.isArray(data?.achievements) ? [...data.achievements] : [];
  const certifications = [];
  let certTarget = certifications;

  for (const cert of rawCertifications) {
    const rawName = String(cert?.name || cert || '').trim();
    if (/^(?:[•\-*–—\s]*)?(?:achievements?|awards?|honors?|activities)(?:\s+(?:&|and)\s+(?:activities|involvement|extracurriculars?|leadership|honors?))?:?$/i.test(rawName)) {
      certTarget = achievements;
      continue;
    }
    if (certTarget === achievements) {
      const cleanAchName = rawName.replace(/^[•\-*–—\d.]+\s*/, '').trim();
      if (cleanAchName) {
        achievements.push({
          id: cert?.id || `ach-${achievements.length + 1}`,
          name: cleanAchName,
          description: cleanAchName,
        });
      }
    } else {
      if (rawName) {
        certifications.push(cert);
      }
    }
  }

  const fontStyle = {
    fontFamily:
      font === 'Times' || font === 'Georgia'
        ? '"Georgia", "Times New Roman", serif'
        : font === 'Arial'
        ? 'Arial, Helvetica, sans-serif'
        : font === 'Roboto'
        ? '"Roboto", sans-serif'
        : font === 'Manrope'
        ? '"Manrope", sans-serif'
        : '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const spacingClass = `resume-spacing-${spacing}`;
  const templateClass = `resume-tpl-${template}`;

  const renderSectionHeader = (title) => {
    if (template === 'ats-classic') {
      return (
        <div className="res-section-head ats-head">
          <h3>{title.toUpperCase()}</h3>
          <div className="ats-divider" />
        </div>
      );
    }
    if (template === 'minimal-elegant') {
      return (
        <div className="res-section-head minimal-head">
          <h3 style={{ color: accent }}>{title}</h3>
          <div className="minimal-divider" />
        </div>
      );
    }
    if (template === 'technical-developer') {
      return (
        <div className="res-section-head tech-head">
          <div className="tech-head-accent" style={{ background: accent }} />
          <h3 style={{ color: accent }}>{title.toUpperCase()}</h3>
          <div className="tech-divider" style={{ borderBottomColor: `${accent}40` }} />
        </div>
      );
    }
    // modern-professional (default)
    return (
      <div className="res-section-head modern-head">
        <h3 style={{ color: accent }}>{title}</h3>
        <div className="modern-divider" style={{ backgroundColor: accent }} />
      </div>
    );
  };

  const sectionsToRender =
    template === 'technical-developer'
      ? ['summary', 'skills', 'projects', 'experience', 'education', 'certifications', 'achievements']
      : ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements'];

  const cleanLinkedin = (basics.linkedin || '').replace(/^https?:\/\/(www\.)?/, '');
  const cleanGithub = (basics.github || '').replace(/^https?:\/\/(www\.)?/, '');
  const cleanPortfolio = (basics.portfolio || '').replace(/^https?:\/\/(www\.)?/, '');

  const contactRow1 = [
    basics.email && <a key="email" href={`mailto:${basics.email}`} className="res-link">{basics.email}</a>,
    cleanPhone && <span key="phone">{cleanPhone}</span>,
    cleanLocation && <span key="loc">{cleanLocation}</span>,
  ].filter(Boolean);

  const contactRow2 = [
    cleanLinkedin && (
      <a key="li" href={basics.linkedin.startsWith('http') ? basics.linkedin : `https://${basics.linkedin}`} target="_blank" rel="noreferrer" className="res-link">
        {cleanLinkedin}
      </a>
    ),
    cleanGithub && (
      <a key="gh" href={basics.github.startsWith('http') ? basics.github : `https://${basics.github}`} target="_blank" rel="noreferrer" className="res-link">
        {cleanGithub}
      </a>
    ),
    cleanPortfolio && (
      <a key="port" href={basics.portfolio.startsWith('http') ? basics.portfolio : `https://${basics.portfolio}`} target="_blank" rel="noreferrer" className="res-link">
        {cleanPortfolio}
      </a>
    ),
  ].filter(Boolean);

  return (
    <div
      className={`resume-paper-page ${templateClass} ${spacingClass}`}
      style={fontStyle}
      id="printable-resume-document"
    >
      {/* HEADER SECTION */}
      {template === 'minimal-elegant' ? (
        <header className="res-header minimal-header">
          <h1 style={{ color: accent }}>{basics.name || 'Candidate Name'}</h1>
          {basics.headline && <div className="res-headline">{basics.headline}</div>}
          <div className="res-contact-bar minimal-contact">
            {contactRow1.length > 0 && (
              <div className="res-contact-line" style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {contactRow1.reduce((prev, curr) => (prev === null ? [curr] : [...prev, '  ·  ', curr]), null)}
              </div>
            )}
            {contactRow2.length > 0 && (
              <div className="res-contact-line" style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {contactRow2.reduce((prev, curr) => (prev === null ? [curr] : [...prev, '  ·  ', curr]), null)}
              </div>
            )}
          </div>
          <div className="minimal-header-rule" />
        </header>
      ) : template === 'ats-classic' ? (
        <header className="res-header ats-header">
          <h1>{basics.name || 'Candidate Name'}</h1>
          {basics.headline && <div className="res-headline ats-headline">{basics.headline}</div>}
          <div className="res-contact-bar ats-contact" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {contactRow1.length > 0 && (
              <div className="ats-contact-line">
                {contactRow1.reduce((prev, curr) => (prev === null ? [curr] : [...prev, '  |  ', curr]), null)}
              </div>
            )}
            {contactRow2.length > 0 && (
              <div className="ats-contact-line">
                {contactRow2.reduce((prev, curr) => (prev === null ? [curr] : [...prev, '  |  ', curr]), null)}
              </div>
            )}
          </div>
          <div className="ats-header-rule" />
        </header>
      ) : template === 'technical-developer' ? (
        <header className="res-header tech-header">
          <div className="tech-name-row">
            <div>
              <h1 style={{ color: accent }}>{basics.name || 'Candidate Name'}</h1>
              {basics.headline && <div className="res-headline tech-headline">{basics.headline}</div>}
            </div>
          </div>
          <div className="res-contact-bar tech-contact" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {contactRow1.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {contactRow1.map((item, idx) => (
                  <span key={idx} className="tech-contact-pill">{item}</span>
                ))}
              </div>
            )}
            {contactRow2.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {contactRow2.map((item, idx) => (
                  <span key={idx} className="tech-contact-pill">{item}</span>
                ))}
              </div>
            )}
          </div>
          <div className="tech-header-rule" style={{ backgroundColor: accent }} />
        </header>
      ) : (
        /* Modern Professional (default) */
        <header className="res-header modern-header">
          <h1 style={{ color: accent }}>{basics.name || 'Candidate Name'}</h1>
          {basics.headline && <div className="res-headline modern-headline">{basics.headline}</div>}
          <div className="res-contact-bar modern-contact" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {contactRow1.length > 0 && (
              <div className="modern-contact-line" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {contactRow1.reduce((prev, curr) => (prev === null ? [curr] : [...prev, '  |  ', curr]), null)}
              </div>
            )}
            {contactRow2.length > 0 && (
              <div className="modern-contact-line" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {contactRow2.reduce((prev, curr) => (prev === null ? [curr] : [...prev, '  |  ', curr]), null)}
              </div>
            )}
          </div>
          <div className="modern-header-rule" style={{ backgroundColor: accent }} />
        </header>
      )}

      {/* DYNAMIC SECTIONS */}
      {sectionsToRender.map((key) => {
        if (key === 'summary' && summary) {
          return (
            <section key="summary" className="res-section">
              {renderSectionHeader('Professional Summary')}
              <p className="res-summary-text">{summary}</p>
            </section>
          );
        }

        if (key === 'skills' && skills.length > 0) {
          return (
            <section key="skills" className="res-section">
              {renderSectionHeader('Technical Skills')}
              <div className="res-skills-container">
                {skills.map((cat, i) => {
                  const catName = cat.category || cat.name || 'Core Skills';
                  const items = Array.isArray(cat.items)
                    ? cat.items
                    : Array.isArray(cat.skills)
                    ? cat.skills
                    : String(cat.items || cat.skills || '')
                        .split(',')
                        .map((x) => x.trim())
                        .filter(Boolean);

                  return (
                    <div key={i} className="res-skill-row">
                      <b className="res-skill-cat">{catName}:</b>{' '}
                      <span className="res-skill-items">{items.join(', ')}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }

        if (key === 'experience' && experience.length > 0) {
          return (
            <section key="experience" className="res-section">
              {renderSectionHeader('Work Experience')}
              <div className="res-items-list">
                {experience.map((job, idx) => (
                  <div key={job.id || idx} className="res-item">
                    <div className="res-item-header">
                      <div className="res-item-role" style={{ color: template === 'ats-classic' ? '#111827' : accent }}>
                        {job.role || 'Role Title'}
                      </div>
                      <div className="res-item-date">{job.dates}</div>
                    </div>
                    <div className="res-item-company">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ''}
                    </div>
                    {Array.isArray(job.bullets) && job.bullets.length > 0 && (
                      <ul className="res-bullet-list">
                        {job.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (key === 'projects' && projects.length > 0) {
          const explicitlySelected = projects.filter((p) => p.selected === true);
          const explicitlyExcluded = projects.filter((p) => p.selected === false);
          let visibleProjects;
          if (explicitlySelected.length > 0) {
            visibleProjects = explicitlySelected;
          } else if (explicitlyExcluded.length > 0) {
            visibleProjects = projects.filter((p) => p.selected !== false);
          } else {
            visibleProjects = projects.slice(0, 3);
          }
          if (visibleProjects.length === 0) return null;
          return (
            <section key="projects" className="res-section">
              {renderSectionHeader('Key Projects')}
              <div className="res-items-list">
                {visibleProjects.map((proj, idx) => (
                  <div key={proj.id || idx} className="res-item">
                    <div className="res-item-header">
                      <div className="res-item-role" style={{ color: template === 'ats-classic' ? '#111827' : accent }}>
                        {proj.name || 'Project Name'}
                        {proj.link && (
                          <a
                            href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="res-proj-link"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div className="res-item-date">{proj.dates}</div>
                    </div>
                    {proj.technologies && (
                      <div className="res-item-company res-proj-tech">
                        Technologies: <span>{proj.technologies}</span>
                      </div>
                    )}
                    {Array.isArray(proj.bullets) && proj.bullets.length > 0 && (
                      <ul className="res-bullet-list">
                        {proj.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (key === 'education' && education.length > 0) {
          return (
            <section key="education" className="res-section">
              {renderSectionHeader('Education')}
              <div className="res-items-list">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="res-item">
                    <div className="res-item-header">
                      <div className="res-item-role" style={{ color: template === 'ats-classic' ? '#111827' : accent }}>
                        {edu.institution || 'University'}
                      </div>
                      <div className="res-item-date">{edu.dates}</div>
                    </div>
                    <div className="res-item-company">
                      {edu.degree}
                      {edu.gpa ? ` — ${edu.gpa}` : ''}
                    </div>
                    {Array.isArray(edu.bullets) && edu.bullets.length > 0 && (
                      <ul className="res-bullet-list">
                        {edu.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (key === 'certifications' && certifications.length > 0) {
          return (
            <section key="certifications" className="res-section">
              {renderSectionHeader('Certifications & Credentials')}
              <ul className="res-bullet-list res-cert-list">
                {certifications.map((cert, idx) => {
                  const name = typeof cert === 'string' ? cert : cert.name;
                  const issuer = cert.issuer ? ` · ${cert.issuer}` : '';
                  const date = cert.date ? ` (${cert.date})` : '';
                  return (
                    <li key={cert.id || idx}>
                      <b>{name}</b>
                      {issuer}
                      {date}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        }

        if (key === 'achievements' && achievements.length > 0) {
          return (
            <section key="achievements" className="res-section">
              {renderSectionHeader('Achievements & Activities')}
              <ul className="res-bullet-list">
                {achievements.map((ach, idx) => {
                  const text = typeof ach === 'string' ? ach : ach.description || ach.name || '';
                  return <li key={ach.id || idx}>{text}</li>;
                })}
              </ul>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}

