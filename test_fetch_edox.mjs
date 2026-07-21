import pdfjs from 'pdfjs-dist/build/pdf.js';

async function testFetch() {
  const url = 'https://vekgzcxorvdidjutuvrj.supabase.co/storage/v1/object/public/chronologie-manuals/edox';
  console.log('Fetching uploaded Edox PDF from Supabase Storage:', url);
  
  const res = await fetch(url);
  console.log('Response status:', res.status, res.headers.get('content-type'));
  
  const buffer = await res.arrayBuffer();
  console.log('Fetched buffer size:', buffer.byteLength, 'bytes');

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdfDoc = await loadingTask.promise;
  console.log('PDF Document loaded successfully! Total Pages:', pdfDoc.numPages);

  const outline = await pdfDoc.getOutline();
  console.log('Embedded Outlines/Bookmarks found:', outline ? outline.length : 0);
}

testFetch().catch(console.error);
