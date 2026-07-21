import fs from 'fs';
import pdfjs from 'pdfjs-dist/build/pdf.js';

async function extractFull() {
  const pdfPath = 'D:\\Private Project\\Chronologie Manual Book V2\\document-sources\\Edox User Manual.pdf';
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data });
  const pdfDoc = await loadingTask.promise;

  const outline = await pdfDoc.getOutline();
  console.log(`Found ${outline ? outline.length : 0} raw outline items.`);

  const resolved = [];

  for (const item of (outline || [])) {
    let pageNum = 1;
    if (item.dest) {
      try {
        let destRef = item.dest;
        if (typeof item.dest === 'string') {
          destRef = await pdfDoc.getDestination(item.dest);
        }
        if (Array.isArray(destRef) && destRef[0]) {
          const pageIdx = await pdfDoc.getPageIndex(destRef[0]);
          pageNum = pageIdx + 1;
        }
      } catch (e) {
        console.error('Err resolving page:', item.title, e);
      }
    }

    // Filter out long warning texts, keep section titles
    if (item.title && item.title.length < 80) {
      resolved.push({
        title: item.title,
        page: pageNum
      });
    }
  }

  console.log('\n--- RESOLVED EDOX CHAPTERS ---');
  console.log(JSON.stringify(resolved, null, 2));

  // If outline didn't cover all calibers/sections, let's also scan headings on each page
  console.log('\n--- PAGE BY PAGE SCAN ---');
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const str = textContent.items.map(item => item.str).join(' ');
    // Filter pages that look like caliber titles (e.g. Caliber, Cal., EDOX, TANGGAL, CHRONOGRAPH)
    if (/calib|cal\.|edox|chronograph|automatic|quartz|gmt|moonphase|timer|tanggal/i.test(str)) {
      console.log(`Page ${i}: ${str.slice(0, 150)}...`);
    }
  }
}

extractFull().catch(console.error);
