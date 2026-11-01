import fs from 'node:fs';
import path from 'node:path';
import { extractText } from '../server/src/services/extractText.js';
import {
  extractStructuredResume,
  cleanStructuredResume,
  parseCandidateBasics
} from '../server/src/services/workflow.js';
import { generateResumePdf } from '../server/src/services/pdfGenerator.js';

async function testBhuvisha() {
  const filePath = '/Users/juitawde/Downloads/RESUME UPDATED.pdf';
  console.log('Testing extraction on:', filePath);
  const buffer = fs.readFileSync(filePath);
  const text = await extractText({ buffer, mimetype: 'application/pdf', originalname: 'RESUME UPDATED.pdf' });

  console.log('\n--- PARSED CANDIDATE BASICS ---');
  const basics = parseCandidateBasics(text);
  console.log('Name:', basics.name);
  console.log('Headline:', basics.headline);
  console.log('Email:', basics.email);
  console.log('Phone:', basics.phone);
  console.log('Location:', basics.location);
  console.log('LinkedIn:', basics.linkedin);
  console.log('GitHub:', basics.github);
  console.log('Portfolio:', basics.portfolio);

  console.log('\n--- FULL STRUCTURE EXTRACTION ---');
  const rawStructured = extractStructuredResume(text);
  const structured = cleanStructuredResume(rawStructured);
  console.log('Summary:', structured.summary);
  console.log('Skills count:', structured.skills?.length);
  console.log('Projects count:', structured.projects?.length);
  console.log('Achievements count:', structured.achievements?.length);
  console.log('Achievements items:', JSON.stringify(structured.achievements, null, 2));
  console.log('Certifications count:', structured.certifications?.length);
  console.log('Certifications items:', JSON.stringify(structured.certifications, null, 2));

  // Generate 1-page budget version
  console.log('\n--- 1-PAGE BUDGET PDF GENERATION ---');
  // If targetPages: 1 is specified, enforcePreservation ranks projects to top 3
  const tailored1Page = JSON.parse(JSON.stringify(structured));
  tailored1Page.projects = structured.projects.slice(0, 3);
  const pdf1Page = await generateResumePdf(tailored1Page, { template: 'ats-classic', targetPages: 1 });
  const out1Page = path.resolve('scratch/bhuvisha_1page_test.pdf');
  fs.writeFileSync(out1Page, pdf1Page);
  console.log('Generated 1-page PDF at:', out1Page, 'Bytes:', pdf1Page.length);
}

testBhuvisha().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
