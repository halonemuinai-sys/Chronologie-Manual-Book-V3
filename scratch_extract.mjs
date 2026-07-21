import fs from 'fs';
import pdfjs from 'pdfjs-dist/build/pdf.js';

async function extract() {
  const pdfPath = 'D:\\Private Project\\Chronologie Manual Book V2\\document-sources\\Edox User Manual.pdf';
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data });
  const pdfDoc = await loadingTask.promise;

  console.log('Num pages:', pdfDoc.numPages);
  const outline = await pdfDoc.getOutline();
  console.log('Outline:', JSON.stringify(outline, null, 2));

  if (!outline || outline.length === 0) {
    console.log('\n--- SCANNING ALL PAGES FOR HEADINGS ---');
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      console.log(`\n[PAGE ${i}] ${pageText.trim().replace(/\s+/g, ' ')}`);
    }
  }
}

extract().catch(console.error);
