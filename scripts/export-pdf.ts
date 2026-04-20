import { chromium } from 'playwright';
import path from 'path';

async function exportToPDF() {
  const url = process.argv[2];
  const filename = process.argv[3] || 'report.pdf';

  if (!url) {
    console.error('Error: Please provide a URL as the first argument.');
    console.log('Usage: npx tsx scripts/export-pdf.ts <URL> [filename]');
    process.exit(1);
  }

  console.log(`🚀 Starting PDF export for: ${url}`);
  
  const browser = await chromium.launch();
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for a standard dashboard view
    await page.setViewportSize({ width: 1280, height: 800 });
    
    console.log('📄 Navigating to page...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Hide UI elements that shouldn't be in the PDF (Sidebar and Header)
    console.log('✂️  Tailoring view for PDF (hiding sidebar and header)...');
    await page.addStyleTag({ 
      content: `
        aside, header, #export-modal-root { display: none !important; }
        main { padding: 0 !important; margin: 0 !important; }
        #report-container { padding: 20px !important; }
      ` 
    });
    
    // Ensure all charts and elements are settled
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`💾 Saving PDF to: ${filename}...`);
    await page.pdf({
      path: filename,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    
    console.log('✅ PDF successfully generated!');
  } catch (error) {
    console.error('❌ PDF Generation failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

exportToPDF();
