import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWorkflow,
  fallbackSkills,
  buildStructuredResumeFallback,
  buildAtsOptimization,
  formatResumeText,
  extractStructuredResume,
  cleanStructuredResume,
  enforcePreservation,
  calculateAlignmentScore,
  calculateWeightedAtsScore,
  extractJobKeywords,
  classifyKeywords,
  selectAndRankProjects,
  sanitizeValidationIssues,
} from '../src/services/workflow.js';
import { generateResumePdf } from '../src/services/pdfGenerator.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';

test('validation does not flag a plain source-grounded draft', async () => {
  const source = 'Jui Tawde\nSkills: JavaScript, React, SQL\nBuilt a student project using React.';
  const result = await validateWorkflow({
    resumeText: source,
    jobDescription: 'React developer',
    tailoredResume: source,
  });
  assert.equal(result.passed, true);
});

test('validation flags suspicious unsupported numeric claims in demo mode', async () => {
  const source = 'Worked on a web project using React.';
  const draft = 'Improved sales by 95% and built a web project using React.';
  const result = await validateWorkflow({
    resumeText: source,
    jobDescription: 'Developer',
    tailoredResume: draft,
  });
  if (result.mode === 'demo') {
    assert.equal(result.passed, false);
    assert.ok(result.issues.length > 0);
  }
});

test('buildStructuredResumeFallback extracts candidate info and builds complete structure', () => {
  const resume = `Jui Tawde
Software Development Student
jui.tawde@example.com | +91 98765 43210 | Bengaluru, India
github.com/juitawde | linkedin.com/in/juitawde

SUMMARY
IT student interested in web development and data-driven products.

SKILLS
JavaScript, React, Node.js, Express, SQL, Git

PROJECTS
Resume Builder: Built a web application to create and manage resume content.
PulseChat: Real-time chat prototype using Node.js and Socket.io.

EDUCATION
BTech Information Technology — XYZ University (2022 - 2026)`;

  const jd = `Junior Full Stack Developer
Requirements: React, Node.js, Express, SQL, Git, Docker, Kubernetes`;

  const skills = fallbackSkills(resume, jd);
  const result = buildStructuredResumeFallback(resume, jd, skills, 'Junior Full Stack Developer');

  assert.ok(result.tailoredData);
  assert.equal(result.tailoredData.basics.name, 'Jui Tawde');
  assert.equal(result.tailoredData.basics.email, 'jui.tawde@example.com');
  assert.equal(result.tailoredData.basics.phone, '+91 98765 43210');
  assert.ok(result.tailoredData.skills.length > 0);
  assert.ok(result.tailoredData.projects.length > 0);
  assert.ok(result.tailoredData.education.length > 0);

  // ATS Optimization
  assert.ok(result.atsOptimization);
  assert.ok(Array.isArray(result.atsOptimization.targetKeywords));
  assert.ok(result.atsOptimization.coverageBefore > 0);
  assert.ok(result.atsOptimization.coverageAfter >= result.atsOptimization.coverageBefore);

  // Plain text formatting
  const plainText = formatResumeText(result.tailoredData);
  assert.ok(plainText.includes('Jui Tawde'));
  assert.ok(plainText.includes('TECHNICAL SKILLS'));
});

test('generateResumePdf generates valid selectable-text PDF for all 4 templates', async () => {
  const sampleData = {
    basics: {
      name: 'Jui Tawde',
      headline: 'Software Engineer',
      email: 'jui@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      linkedin: 'linkedin.com/in/juitawde',
      github: 'github.com/juitawde',
    },
    summary: 'Results-driven software engineer experienced in React, Node.js, and MongoDB.',
    skills: [
      { category: 'Languages & Frameworks', items: ['JavaScript', 'React', 'Node.js'] },
      { category: 'Databases & Tools', items: ['MongoDB', 'SQL', 'Git'] },
    ],
    experience: [
      {
        role: 'Full Stack Intern',
        company: 'Innovatech',
        dates: '2025 - Present',
        bullets: ['Implemented responsive components in React.', 'Engineered RESTful APIs with Node.js.'],
      },
    ],
    projects: [
      {
        name: 'ResumeMatch AI',
        technologies: 'React, Express, MongoDB',
        bullets: ['Built full-stack AI career intelligence platform.'],
      },
    ],
    education: [
      {
        degree: 'BTech in Information Technology',
        institution: 'XYZ Institute',
        dates: '2022 - 2026',
      },
    ],
    certifications: [
      {
        name: 'Full Stack Web Development',
        issuer: 'Coursera',
        date: '2024',
      },
    ],
  };

  const templates = ['ats-classic', 'modern-professional', 'minimal-elegant', 'technical-developer'];

  for (const template of templates) {
    const pdfBuf = await generateResumePdf(sampleData, {
      template,
      font: 'Helvetica',
      accentColor: 'slate',
      spacing: 'standard',
    });

    assert.ok(pdfBuf instanceof Buffer);
    assert.ok(pdfBuf.length > 1000);
    // Standard PDF header signature
    assert.equal(pdfBuf.subarray(0, 4).toString(), '%PDF');
  }
});

test('4-project preservation guarantee: zero projects are lost when AI returns only 1', () => {
  const resumeText = `Jui Tawde
Full Stack Developer
jui@example.com | +91 98765 43210 | Bengaluru, India
github.com/juitawde | linkedin.com/in/juitawde

SUMMARY
Dedicated full stack developer passionate about creating accessible web applications.

SKILLS
JavaScript, React, Node.js, Express, MongoDB, SQL, Git

PROJECTS
ResumeMatch AI | React, Node.js, Express | 2024
• Built full-stack AI career platform for analyzing resumes.
• Engineered secure backend endpoints using Express.

PulseChat Realtime Messenger | Socket.io, Node.js | 2024
• Developed WebSocket real-time messaging application.
• Reduced message latency by 40ms.

DevPortfolio Showcase | React, Tailwind CSS | 2023
• Crafted personal developer portfolio with light/dark themes.
• Optimized Core Web Vitals to score 98+ on Lighthouse.

CloudTask Task Manager | MERN Stack, Docker | 2023
• Created collaborative task dashboard with JWT authentication.
• Containerized microservices using Docker Compose.

EDUCATION
BTech Information Technology — XYZ University (2022 - 2026)`;

  const extracted = extractStructuredResume(resumeText);
  const cleaned = cleanStructuredResume(extracted);

  // Assert 4 projects extracted
  assert.equal(cleaned.projects.length, 4);
  assert.equal(cleaned.projects[0].name, 'ResumeMatch AI');
  assert.equal(cleaned.projects[1].name, 'PulseChat Realtime Messenger');
  assert.equal(cleaned.projects[2].name, 'DevPortfolio Showcase');
  assert.equal(cleaned.projects[3].name, 'CloudTask Task Manager');

  // Simulate an AI response that only returns 1 project (the bug that used to drop 3 projects)
  const truncatedAiOutput = {
    basics: cleaned.basics,
    summary: 'Tailored summary for software engineer role.',
    skills: cleaned.skills,
    projects: [
      {
        name: 'ResumeMatch AI',
        technologies: 'React, Node.js, Express',
        bullets: ['Enhanced bullet point tailored specifically for backend role.'],
      },
    ],
  };

  const preserved = enforcePreservation(cleaned, truncatedAiOutput);

  // Preserved must have all 4 projects!
  assert.equal(preserved.projects.length, 4);
  assert.equal(preserved.projects[0].name, 'ResumeMatch AI');
  assert.equal(preserved.projects[0].bullets[0], 'Enhanced bullet point tailored specifically for backend role.');
  assert.equal(preserved.projects[1].name, 'PulseChat Realtime Messenger');
  assert.equal(preserved.projects[2].name, 'DevPortfolio Showcase');
  assert.equal(preserved.projects[3].name, 'CloudTask Task Manager');
});

test('strict contact isolation: professional summary contains NO email, phone, or URLs', () => {
  const resumeWithContactScattered = `Jui Tawde
jui.tawde@example.com
+91 98765 43210
linkedin.com/in/juitawde
github.com/juitawde
Bengaluru, India

SUMMARY
Passionate software engineer with hands-on experience building web apps. Contact me at jui.tawde@example.com or visit github.com/juitawde for details.

SKILLS
React, Node.js, SQL`;

  const extracted = extractStructuredResume(resumeWithContactScattered);
  const cleaned = cleanStructuredResume(extracted);

  assert.ok(!cleaned.summary.includes('jui.tawde@example.com'));
  assert.ok(!cleaned.summary.includes('+91'));
  assert.ok(!cleaned.summary.includes('github.com'));
  assert.ok(!cleaned.summary.includes('linkedin.com'));
  assert.equal(cleaned.basics.email, 'jui.tawde@example.com');
  assert.equal(cleaned.basics.phone, '+91 98765 43210');
});

test('symmetrical ATS scoring: calculates scoreBefore, scoreAfter and scoreDelta', () => {
  const resumeData = {
    summary: 'Experienced React and JavaScript developer.',
    skills: [{ category: 'Frontend', items: ['React', 'JavaScript', 'HTML', 'CSS'] }],
    experience: [{ role: 'Frontend Intern', company: 'Tech Corp', bullets: ['Built React components.'] }],
    projects: [{ name: 'Web App', technologies: 'React, Redux', bullets: ['Used Git for version control.'] }],
  };

  const jdTerms = ['react', 'node.js', 'docker', 'git', 'javascript'];
  const res = calculateAlignmentScore(resumeData, jdTerms);

  assert.ok(res.score > 0);
  assert.ok(res.exactCount >= 2);
});

test('7-project extraction preserves all titles, technologies, and bullet descriptions without turning text into fake projects', () => {
  const resumeWith7Projects = `Jui Tawde
Software Development Engineer
jui.tawde@example.com | +91 98765 43210 | Bengaluru, India
github.com/juitawde | linkedin.com/in/juitawde

SUMMARY
Dedicated full stack developer passionate about creating accessible web applications and real-time systems.

SKILLS
JavaScript, TypeScript, React.js, Node.js, Express.js, Java, Spring Boot, C++, Python, MySQL, MongoDB, Redis, Docker, Git

PROJECTS
PetMatch – Pet Adoption Portal
React.js, Node.js, Express.js, MongoDB
Built full-stack adoption platform connecting pet shelters with prospective adopters.
Engineered secure RESTful authentication with JWT and automated status updates.

Quiz Arena – Real-Time Quiz Platform
React.js, Socket.IO, Node.js, Redis
Engineered real-time multiplayer quiz competition platform handling concurrent lobbies.
Synchronized game state and scoring with sub-50ms latency using WebSocket events.

Chatterly – Real-Time Chat App
Socket.IO, Express.js, React.js, MongoDB
Architected group messaging application with channel subscriptions and typing indicators.
Implemented message persistence and read receipts with MongoDB change streams.

Vox Commander – Voice-Controlled Notes App
JavaScript, Web Speech API, React.js
Created voice-driven productivity suite allowing speech-to-text note capture.
Built client-side speech recognition pipeline with 94% command interpretation accuracy.

Eventify – Java Event Management System
Java, Spring Boot, MySQL
Designed modular backend for campus event registration and ticketing management.
Created relational schema with transactional integrity and QR ticket verification.

MemGrid – Distributed Shared Memory Simulator
C++, POSIX Threads, Distributed Systems
Simulated shared memory coherence protocols across simulated distributed nodes.
Implemented MESI cache invalidation mechanism with multi-threaded message passing.

WeatherScope – Weather Information Application
React.js, OpenWeather API, Tailwind CSS
Built responsive meteorological forecasting app with interactive radar maps.
Integrated multi-day forecast caching to minimize API requests by 45%.

EDUCATION
BTech Information Technology — XYZ University (2021 - 2025)`;

  const extracted = extractStructuredResume(resumeWith7Projects);
  const cleaned = cleanStructuredResume(extracted);

  // Exactly 7 projects extracted! (Not 28 fake projects!)
  assert.equal(cleaned.projects.length, 7);
  assert.equal(cleaned.projects[0].name, 'PetMatch – Pet Adoption Portal');
  assert.equal(cleaned.projects[1].name, 'Quiz Arena – Real-Time Quiz Platform');
  assert.equal(cleaned.projects[2].name, 'Chatterly – Real-Time Chat App');
  assert.equal(cleaned.projects[3].name, 'Vox Commander – Voice-Controlled Notes App');
  assert.equal(cleaned.projects[4].name, 'Eventify – Java Event Management System');
  assert.equal(cleaned.projects[5].name, 'MemGrid – Distributed Shared Memory Simulator');
  assert.equal(cleaned.projects[6].name, 'WeatherScope – Weather Information Application');

  // Verify that description sentences were NOT turned into project names
  for (const p of cleaned.projects) {
    assert.ok(!p.name.startsWith('Built'));
    assert.ok(!p.name.startsWith('Engineered'));
    assert.ok(!p.name.startsWith('Architected'));
    assert.ok(!p.name.startsWith('Created'));
    assert.ok(!p.name.startsWith('Designed'));
    assert.ok(!p.name.startsWith('Simulated'));
    assert.ok(p.bullets.length >= 1, `Project ${p.name} should have bullet points`);
  }
});

test('ATS keyword extraction extracts real technical skills and rejects noise phrases', () => {
  const jdWithNoise = `Senior Full Stack Developer
We are looking to join a high-performing team that will work on next-generation products while collaborating with experienced developers.
Requirements:
- Strong experience in React.js, Node.js, and Express.js
- Proficiency with MongoDB, PostgreSQL, and Redis
- Solid understanding of REST APIs, JWT Authentication, and WebSockets (Socket.IO)
- Good grasp of Data Structures and Algorithms and Object-Oriented Programming
- Familiarity with Git, Docker, and CI/CD Pipelines
- Experience with Distributed Systems and Microservices architecture`;

  const keywords = extractJobKeywords(jdWithNoise);
  const keywordNames = keywords.map((k) => k.keyword.toLowerCase());

  // Real technical skills extracted
  assert.ok(keywordNames.includes('react.js'));
  assert.ok(keywordNames.includes('node.js'));
  assert.ok(keywordNames.includes('express.js'));
  assert.ok(keywordNames.includes('mongodb'));
  assert.ok(keywordNames.includes('redis'));
  assert.ok(keywordNames.includes('git'));
  assert.ok(keywordNames.includes('docker'));

  // Zero noise phrases!
  assert.ok(!keywordNames.includes('is looking'));
  assert.ok(!keywordNames.includes('to join'));
  assert.ok(!keywordNames.includes('team the'));
  assert.ok(!keywordNames.includes('work on'));
  assert.ok(!keywordNames.includes('while collaborating'));
  assert.ok(!keywordNames.includes('with experienced'));
});

test('ATS keyword classification categorizes into matched, emphasized, related, and missing', () => {
  const jd = `Requirements: React.js, Node.js, PostgreSQL, AWS, CI/CD Pipelines`;

  const origResume = {
    summary: 'Student with web development skills.',
    skills: [{ category: 'Tech', items: ['React.js', 'Node.js', 'MySQL', 'Docker'] }],
    projects: [{ name: 'Project A', technologies: 'React.js, Node.js', bullets: ['Built web app'] }],
  };

  const tailoredResume = {
    summary: 'Full-stack developer experienced in React.js and Node.js backend systems.',
    skills: [{ category: 'Tech', items: ['React.js', 'Node.js', 'MySQL', 'Docker'] }],
    projects: origResume.projects,
  };

  const jdKeywords = extractJobKeywords(jd);
  const classified = classifyKeywords(jdKeywords, origResume, tailoredResume);

  const matched = classified.find((c) => c.keyword === 'React.js');
  assert.ok(matched);
  assert.equal(matched.classification, 'emphasized'); // Surfaced in tailored summary!

  const related = classified.find((c) => c.keyword === 'PostgreSQL');
  assert.ok(related);
  assert.equal(related.classification, 'related'); // MySQL related database capability!

  const missing = classified.find((c) => c.keyword.includes('CI/CD'));
  assert.ok(missing);
  assert.equal(missing.classification, 'missing'); // Skill gap!
});

test('PDF pagination: 1-page for short resume and exactly 2-page for 7-project resume', async () => {
  const shortResume = {
    basics: { name: 'Jui Tawde', email: 'jui@example.com', phone: '123' },
    summary: 'Concise summary for student.',
    skills: [{ category: 'Tech', items: ['JavaScript', 'React.js'] }],
    projects: [
      { name: 'PetMatch', technologies: 'React.js', bullets: ['Built pet portal'] },
      { name: 'Quiz Arena', technologies: 'Node.js', bullets: ['Real-time quiz'] },
    ],
    education: [{ degree: 'BTech IT', institution: 'University', dates: '2025' }],
  };

  const shortBuf = await generateResumePdf(shortResume, { template: 'ats-classic' });
  const shortPdf = await pdf(shortBuf);
  assert.equal(shortPdf.numpages, 1, 'Short resume should generate exactly 1 page');

  const longResume = {
    basics: { name: 'Jui Tawde', headline: 'Full Stack Engineer', email: 'jui@example.com', phone: '+91 98765 43210', location: 'Bengaluru, India' },
    summary: 'Experienced developer with strong hands-on background in full-stack web and distributed systems, cloud infrastructure, and enterprise messaging systems with high throughput.',
    skills: [
      { category: 'Languages', items: ['Java', 'JavaScript', 'TypeScript', 'C++', 'Python'] },
      { category: 'Web', items: ['React.js', 'Node.js', 'Express.js', 'Socket.IO', 'Tailwind CSS'] },
      { category: 'Databases', items: ['MongoDB', 'PostgreSQL', 'Redis', 'SQL'] },
    ],
    experience: [
      { role: 'Engineering Intern', company: 'TechCorp', dates: '2024', bullets: [
        'Engineered web endpoints serving high traffic production volumes with strict SLA adherence.',
        'Optimized query latency and caching strategies to reduce database roundtrips significantly.',
      ]},
    ],
    projects: [
      {
        name: 'PetMatch – Pet Adoption Portal',
        technologies: 'React.js, Node.js, Express.js, MongoDB',
        bullets: [
          'Built full-stack adoption platform connecting pet shelters with prospective adopters across 12 regional chapters.',
          'Engineered secure RESTful authentication with JWT and automated real-time notification pipelines.',
          'Designed modular REST APIs with comprehensive input validation and responsive frontend components.',
        ],
      },
      {
        name: 'Quiz Arena – Real-Time Quiz Platform',
        technologies: 'React.js, Socket.IO, Node.js, Redis',
        bullets: [
          'Engineered real-time multiplayer quiz competition platform handling concurrent active matchmaking rooms.',
          'Synchronized game state and scoring with sub-50ms latency using WebSocket events and Redis pub/sub.',
          'Implemented leaderboards with atomic Redis sorted set operations ensuring zero race conditions.',
        ],
      },
      {
        name: 'Chatterly – Real-Time Chat App',
        technologies: 'Socket.IO, Express.js, React.js, MongoDB',
        bullets: [
          'Architected group messaging application with channel subscriptions, typing indicators, and message history.',
          'Implemented message persistence and read receipts with MongoDB change streams and reliable delivery queues.',
          'Engineered client-side state management with optimistic UI updates and reconnection handling.',
        ],
      },
      {
        name: 'Vox Commander – Voice-Controlled Notes App',
        technologies: 'JavaScript, Web Speech API, React.js',
        bullets: [
          'Created voice-driven productivity suite allowing continuous speech-to-text note capture and hands-free control.',
          'Built client-side speech recognition pipeline with 94% command interpretation accuracy in noisy environments.',
          'Implemented indexed local storage caching enabling full offline productivity without data loss.',
        ],
      },
      {
        name: 'Eventify – Java Event Management System',
        technologies: 'Java, Spring Boot, MySQL',
        bullets: [
          'Designed modular backend for campus event registration and ticketing management with ACID transactions.',
          'Created relational schema with transactional integrity and automated QR code ticket verification.',
          'Built administrative analytics dashboard tracking attendee check-ins and revenue generation.',
        ],
      },
      {
        name: 'MemGrid – Distributed Shared Memory Simulator',
        technologies: 'C++, POSIX Threads, Distributed Systems',
        bullets: [
          'Simulated shared memory coherence protocols across simulated distributed cluster nodes.',
          'Implemented MESI cache invalidation mechanism with multi-threaded message passing and barrier synchronization.',
          'Profiled thread contention and memory access patterns under diverse simulated workloads.',
        ],
      },
      {
        name: 'WeatherScope – Weather Information Application',
        technologies: 'React.js, OpenWeather API, Tailwind CSS',
        bullets: [
          'Built responsive meteorological forecasting app with interactive radar maps and geolocation lookup.',
          'Integrated multi-day forecast caching to minimize external API requests by 45% and accelerate load times.',
          'Designed adaptive responsive layout with dark mode toggle and dynamic atmospheric visuals.',
        ],
      },
    ],
    education: [{ degree: 'BTech Information Technology', institution: 'XYZ University', dates: '2021 - 2025' }],
  };

  for (const tpl of ['ats-classic', 'modern-professional', 'minimal-elegant', 'technical-developer']) {
    const longBuf = await generateResumePdf(longResume, { template: tpl });
    const longPdf = await pdf(longBuf);
    assert.equal(longPdf.numpages, 2, `Template ${tpl} should generate exactly 2 pages for 7 projects`);
  }
});

test('mathematical consistency: 2 matches and 8 gaps out of 10 requirements scores exactly 20/100, not 87/100', () => {
  // 10 standard requirements: 2 matched, 8 missing
  const testKeywords = [
    { keyword: 'React.js', group: 'technical_skills', importance: 'standard', classification: 'matched' },
    { keyword: 'Node.js', group: 'technical_skills', importance: 'standard', classification: 'matched' },
    { keyword: 'Python', group: 'technical_skills', importance: 'standard', classification: 'missing' },
    { keyword: 'AWS', group: 'technical_skills', importance: 'standard', classification: 'missing' },
    { keyword: 'Docker', group: 'technical_skills', importance: 'standard', classification: 'missing' },
    { keyword: 'Kubernetes', group: 'technical_skills', importance: 'standard', classification: 'missing' },
    { keyword: 'GraphQL', group: 'technical_skills', importance: 'standard', classification: 'missing' },
    { keyword: 'Django', group: 'technical_skills', importance: 'standard', classification: 'missing' },
    { keyword: 'FastAPI', group: 'technical_skills', importance: 'standard', classification: 'missing' },
    { keyword: 'PostgreSQL', group: 'technical_skills', importance: 'standard', classification: 'missing' },
  ];

  const evalResult = calculateWeightedAtsScore(testKeywords);
  assert.equal(evalResult.score, 20, 'Score must be exactly 20 for 2 verified matches and 8 gaps');
  assert.equal(evalResult.matchedCount, 2);
  assert.equal(evalResult.gapsCount, 8);
  assert.equal(evalResult.totalRequirements, 10);
});

test('ATS keywords categorized into 4 distinct groups: technical_skills, core_competencies, role_specific, action_verbs', () => {
  const jdText = `
    Job Title: Senior Full-Stack Engineer
    Responsibilities:
    - Architect and develop high throughput web applications and microservices.
    - Implement real-time communication using WebSockets and Socket.IO.
    - Optimize latency and state synchronization across distributed systems.
    - Designed and engineered scalable REST APIs.
    Requirements:
    - Strong proficiency in React.js, TypeScript, and Node.js.
    - Deep knowledge of system design, database management, and testing and debugging.
    - Experience with Redis distributed caching and MongoDB.
  `;

  const keywords = extractJobKeywords(jdText);
  const groups = new Set(keywords.map((k) => k.group));

  assert.ok(groups.has('technical_skills'), 'Should include technical_skills');
  assert.ok(groups.has('core_competencies'), 'Should include core_competencies');
  assert.ok(groups.has('role_specific'), 'Should include role_specific');
  assert.ok(groups.has('action_verbs'), 'Should include action_verbs');

  const tech = keywords.filter((k) => k.group === 'technical_skills');
  const comp = keywords.filter((k) => k.group === 'core_competencies');
  const role = keywords.filter((k) => k.group === 'role_specific');
  const verbs = keywords.filter((k) => k.group === 'action_verbs');

  assert.ok(tech.length >= 3, 'Should extract technical skills');
  assert.ok(comp.length >= 1, 'Should extract core competencies');
  assert.ok(role.length >= 1, 'Should extract role-specific terms');
  assert.ok(verbs.length >= 2, 'Should extract action verbs');
});

test('intelligent project selection selects top 3 for 1-page A4 while preserving 100% in portfolio', () => {
  const projects = [
    { name: 'PetMatch – Pet Adoption Portal', technologies: 'React.js, Node.js, Express.js, MongoDB', bullets: ['Built pet portal'] },
    { name: 'Quiz Arena – Real-Time Quiz Platform', technologies: 'React.js, Socket.IO, Node.js, Redis', bullets: ['Real-time quiz'] },
    { name: 'Chatterly – Real-Time Chat App', technologies: 'Socket.IO, Express.js, React.js, MongoDB', bullets: ['Chat app'] },
    { name: 'Vox Commander – Voice-Controlled Notes App', technologies: 'JavaScript, Web Speech API, React.js', bullets: ['Voice notes'] },
    { name: 'Eventify – Java Event Management System', technologies: 'Java, Spring Boot, MySQL', bullets: ['Event backend'] },
    { name: 'MemGrid – Distributed Shared Memory Simulator', technologies: 'C++, POSIX Threads, Distributed Systems', bullets: ['Memory simulator'] },
    { name: 'WeatherScope – Weather Information Application', technologies: 'React.js, OpenWeather API, Tailwind CSS', bullets: ['Weather app'] },
  ];

  const jdKeywords = [
    { keyword: 'React.js', importance: 'essential', syns: ['react', 'react.js'] },
    { keyword: 'Node.js', importance: 'essential', syns: ['node', 'node.js'] },
    { keyword: 'MongoDB', importance: 'standard', syns: ['mongodb', 'mongo'] },
  ];

  const selected = selectAndRankProjects(projects, jdKeywords, 3);
  assert.equal(selected.length, 7, 'All 7 projects must be preserved in array');
  const selectedCount = selected.filter((p) => p.selected === true).length;
  const preservedCount = selected.filter((p) => p.selected === false).length;
  assert.equal(selectedCount, 3, 'Exactly 3 projects selected for 1-page A4');
  assert.equal(preservedCount, 4, 'Remaining 4 projects preserved in portfolio');
  assert.equal(selected[0].name, 'PetMatch – Pet Adoption Portal');
});

test('validation eliminates false accusations on verified candidate skills', () => {
  const source = `Jui Tawde
SKILLS
Languages: JavaScript, TypeScript, Java, C++, Python, SQL
Frontend: React.js, HTML5, CSS3, DOM Manipulation, Tailwind CSS
Backend: Node.js, Express.js, Spring Boot, REST API Integration
Real-Time & Cloud: Socket.IO, Firebase, Supabase, Git, GitHub`;

  const rawIssues = [
    { claim: 'HTML5', reason: 'Skill HTML5 was not found in the source resume.' },
    { claim: 'CSS3', reason: 'Skill CSS3 was not evidenced in source document.' },
    { claim: 'DOM Manipulation', reason: 'DOM Manipulation not mentioned in source.' },
    { claim: 'REST API Integration', reason: 'REST API Integration not found.' },
    { claim: 'Socket.IO', reason: 'Socket.IO skill not evidenced.' },
    { claim: 'Firebase', reason: 'Firebase not found in candidate source.' },
    { claim: 'Supabase', reason: 'Supabase not mentioned in resume.' },
    { claim: 'Increased team revenue by 85%', reason: 'This numeric result was not found in the source resume.' },
  ];

  const result = sanitizeValidationIssues(rawIssues, source);
  assert.equal(result.passed, false);
  // Only the genuine unsupported numeric claim must remain!
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].claim, 'Increased team revenue by 85%');
});

test('glued section header detection correctly splits artifacts like andsubmit SKILLS', () => {
  const resumeWithGluedHeader = `Jui Tawde
PROJECTS
Quiz Arena – Real-Time Quiz Platform
React.js, Socket.IO, Node.js
Implemented WebSocket-based room management and timer synchronization to validate, score, andsubmit SKILLS
JavaScript, React.js, Node.js, SQL
EDUCATION
BTech Information Technology — XYZ University`;

  const extracted = extractStructuredResume(resumeWithGluedHeader);
  assert.ok(extracted.skills.length > 0, 'Skills section must be identified despite glued header');
  assert.ok(extracted.skills.some((c) => c.items.includes('React.js') || c.items.includes('JavaScript')));
  assert.ok(extracted.projects.length > 0, 'Projects must be identified');
});
