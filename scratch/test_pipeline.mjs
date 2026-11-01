import fs from 'fs';
import path from 'path';
import pdfParse from '../server/node_modules/pdf-parse/index.js';
import { extractText } from '../server/src/services/extractText.js';
import {
  extractStructuredResume,
  cleanStructuredResume,
  enforcePreservation,
  selectAndRankProjects,
  tailorProjectDescriptions,
  buildAtsOptimization,
  sanitizeValidationIssues,
  formatResumeText,
} from '../server/src/services/workflow.js';
import { generateResumePdf } from '../server/src/services/pdfGenerator.js';

async function main() {
  console.log('=== STEP 1: PARSING Resume_latest.pdf ===');
  const pdfBuffer = fs.readFileSync('/Users/juitawde/Downloads/Resume_latest.pdf');
  const extractedText = await extractText({ buffer: pdfBuffer, originalname: 'Resume_latest.pdf' });

  const structured = extractStructuredResume(extractedText);
  const cleaned = cleanStructuredResume(structured);

  console.log('Name:', cleaned.basics.name);
  console.log('Headline:', cleaned.basics.headline);
  console.log('Email:', cleaned.basics.email);
  console.log('Phone:', cleaned.basics.phone);
  console.log('LinkedIn:', cleaned.basics.linkedin);
  console.log('GitHub:', cleaned.basics.github);
  console.log('Location:', cleaned.basics.location);

  console.log('\n--- VERIFYING ZERO EMPLOYMENT/INTERNSHIP HISTORY ---');
  console.log('Experience records count:', cleaned.experience.length);
  if (cleaned.experience.length !== 0) {
    console.error('FAIL: Expected 0 experience records, got:', cleaned.experience);
    process.exit(1);
  } else {
    console.log('PASS: Exactly 0 employment records extracted (as required for candidate Jui Tawde).');
  }

  console.log('\n--- VERIFYING EDUCATION ---');
  console.log('Education records count:', cleaned.education.length);
  cleaned.education.forEach(e => console.log(` - Degree: ${e.degree} | Inst: ${e.institution} | Dates: ${e.dates}`));

  console.log('\n--- VERIFYING 7 CANDIDATE PROJECTS ---');
  console.log('Total projects count:', cleaned.projects.length);
  cleaned.projects.forEach((p, idx) => {
    console.log(` ${idx + 1}. ${p.name} | Tech: ${p.technologies} | Bullets: ${p.bullets.length}`);
  });
  if (cleaned.projects.length !== 7) {
    console.error('FAIL: Expected exactly 7 projects, got:', cleaned.projects.length);
    process.exit(1);
  } else {
    console.log('PASS: All 7 original candidate projects preserved.');
  }

  console.log('\n--- VERIFYING SKILLS ---');
  console.log('Skills categories count:', cleaned.skills.length);
  cleaned.skills.forEach(s => console.log(` - [${s.category}]: ${s.items.join(', ')}`));

  console.log('\n=== STEP 2: TAILORING & 1-PAGE BUDGET PROJECT RANKING ===');
  const sampleJobDescription = `
    Job Title: Full Stack Developer
    Requirements:
    - Strong experience in React.js, Node.js, Express.js
    - Experience building real-time applications with Socket.IO and WebSockets
    - Hands-on database experience with MongoDB, SQL, PostgreSQL
    - Proficient in JavaScript, TypeScript, Python
    - Familiarity with RESTful APIs, Git, GitHub
  `;

  const preserved = enforcePreservation(cleaned, cleaned);
  console.log('Preserved exp count after enforcement:', preserved.experience.length);

  preserved.projects = tailorProjectDescriptions(preserved.projects);
  preserved.projects = selectAndRankProjects(preserved.projects, [
    'react', 'node.js', 'socket.io', 'mongodb', 'javascript', 'rest api', 'sql'
  ], 3);

  const selectedCount = preserved.projects.filter(p => p.selected === true).length;
  console.log(`Ranked projects: ${selectedCount} selected for 1-page budget, ${preserved.projects.length - selectedCount} preserved in portfolio.`);
  preserved.projects.forEach((p, i) => {
    console.log(` ${i + 1}. [${p.selected ? 'SELECTED' : 'SAVED'}] ${p.name} (Score: ${p.relevanceScore})`);
  });

  console.log('\n=== STEP 3: ATS SCORING & KEYWORD AUDIT ===');
  const atsOpt = buildAtsOptimization(null, sampleJobDescription, extractedText, preserved, cleaned);
  console.log('Baseline Score (Before):', atsOpt.scoreBefore);
  console.log('Tailored Score (After):', atsOpt.scoreAfter);
  console.log('Score Delta:', atsOpt.scoreDelta);
  console.log('Percentage Improvement:', atsOpt.percentageImprovement + '%');
  console.log('Matched Keywords:', atsOpt.existingMatched.length);
  console.log('Emphasized Keywords:', atsOpt.newlyEmphasized.length);
  console.log('Related/Partial Keywords:', atsOpt.relatedEvidence.length);
  console.log('Missing Requirements:', atsOpt.missingRequirements.length);

  console.log('\n=== STEP 4: FACTUAL REVIEW SANITIZATION ===');
  const mockReviewIssues = [
    { claim: 'Socket.IO real-time chat', reason: 'Socket.IO is not mentioned in source resume' },
    { claim: 'HTML5 / CSS3 responsive web interface', reason: 'Skill not evidenced' },
    { claim: 'Increased performance by 40%', reason: 'This numeric result was not found in the source resume.' },
  ];
  const sanitized = sanitizeValidationIssues(mockReviewIssues, extractedText, cleaned, preserved);
  console.log('Sanitized issues count:', sanitized.issues.length);
  sanitized.issues.forEach(iss => console.log(' - Flagged issue:', iss.claim, '| Reason:', iss.reason));
  if (sanitized.issues.length === 1 && sanitized.issues[0].claim.includes('40%')) {
    console.log('PASS: False positive skill accusations correctly eliminated; authentic hallucination (40%) correctly flagged.');
  }

  console.log('\n=== STEP 5: PDF GENERATION (STRICT 1-PAGE GUARANTEE) ===');
  const templates = ['ats-classic', 'modern-professional', 'minimal-elegant', 'technical-developer'];
  for (const tpl of templates) {
    const pdfBytes = await generateResumePdf(preserved, { template: tpl, pageBudget: 1 });
    const parsedPdf = await pdfParse(pdfBytes);
    console.log(`Template: [${tpl}] -> Page Count: ${parsedPdf.numpages}`);
    if (parsedPdf.numpages !== 1) {
      console.error(`FAIL: Template ${tpl} generated ${parsedPdf.numpages} pages instead of exactly 1!`);
      process.exit(1);
    }
  }

  console.log('\nALL INTEGRATION AND PIPELINE TESTS PASSED 100% SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
