import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

export async function POST(request: Request) {
  let browser = null;

  try {
    const { html, filename } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    // Inject <base> tag to help Puppeteer resolve relative assets (CSS, images) from the dev server
    const baseUrl = 'http://localhost:3000';
    const htmlWithBase = html.replace('<head>', `<head><base href="${baseUrl}/">`);

    const isLocal = process.env.NODE_ENV === 'development';

    // Configure Puppeteer to use local Chrome on Windows as verified
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
    });

    const page = await browser.newPage();
    
    // Set viewport to a standard A4-like width to ensure responsive charts render correctly
    await page.setViewport({ width: 1200, height: 1600 });

    // Emulate print media type to trigger CSS @media print
    await page.emulateMediaType('print');

    // Inject HTML. We wrap it in a basic document structure to ensure styles are applied
    await page.setContent(htmlWithBase, { waitUntil: 'networkidle0' });

    // Add some extra CSS to force white background and high contrast for PDF
    await page.addStyleTag({
      content: `
        @page {
          margin: 10mm;
        }
        body {
          background-color: white !important;
          color: black !important;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .report-content {
          background-color: white !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: 100% !important;
        }
      `
    });

    // Wait a bit for SVGs and external styles to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    return new Response(pdf as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'report'}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
