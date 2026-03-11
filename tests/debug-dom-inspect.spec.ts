import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = '/c/Users/25066/Desktop/备份/BreakItDown/screenshots/debug-run';

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test('Inspect setup page DOM structure', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  await page.goto('http://localhost:3000/setup', { waitUntil: 'networkidle', timeout: 30000 });

  // Dump the full page HTML structure (truncated)
  const bodyHTML = await page.evaluate(() => {
    // Get all interactive elements
    const elements = document.querySelectorAll('button, [role="button"], [onclick], a, [class*="cursor-pointer"]');
    return Array.from(elements).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().substring(0, 80),
      className: el.className?.substring(0, 100),
      id: el.id,
      role: el.getAttribute('role'),
      href: (el as HTMLAnchorElement).href,
    }));
  });

  console.log('=== INTERACTIVE ELEMENTS ===');
  bodyHTML.forEach((el, i) => console.log(`[${i}]`, JSON.stringify(el)));

  // Get all text content to understand page structure
  const allText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && text.length > 2) texts.push(text);
    }
    return texts.slice(0, 50);
  });

  console.log('\n=== PAGE TEXT CONTENT ===');
  allText.forEach(t => console.log(t));

  // Look for template-related elements
  const templateInfo = await page.evaluate(() => {
    // Find elements containing Chinese template names
    const allElements = document.querySelectorAll('*');
    const templateElements: any[] = [];

    const templateNames = ['智能手表', '无人机', '电动车', '太阳能', '空气净化', '智能家居'];

    for (const el of allElements) {
      const text = el.textContent?.trim() || '';
      for (const name of templateNames) {
        if (text.includes(name) && text.length < 200) {
          templateElements.push({
            tag: el.tagName,
            text: text.substring(0, 100),
            className: el.className?.substring(0, 100),
            clickable: el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' ||
                       el.className?.includes('cursor-pointer') || el.className?.includes('click'),
          });
          break;
        }
      }
    }
    return templateElements.slice(0, 20);
  });

  console.log('\n=== TEMPLATE ELEMENTS ===');
  templateElements.forEach(el => console.log(JSON.stringify(el)));

  await page.screenshot({ path: path.join(screenshotsDir, '10-dom-inspection.png'), fullPage: true });

  console.log('\n=== CONSOLE ERRORS ===');
  consoleErrors.forEach(e => console.log('ERROR:', e));
});
