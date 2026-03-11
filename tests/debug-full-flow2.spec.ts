import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = '/c/Users/25066/Desktop/备份/BreakItDown/screenshots/debug-run';

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test('Full flow with navigation tracking', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const consoleLogs: string[] = [];
  const networkRequests: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    else if (msg.type() === 'warning') consoleWarnings.push(text);
    else consoleLogs.push(text);
  });
  page.on('pageerror', (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`));
  page.on('request', (req) => {
    if (req.url().includes('/api/')) networkRequests.push(`${req.method()} ${req.url()}`);
  });

  // Step 1: Navigate to /setup
  console.log('=== STEP 1: Navigate to /setup ===');
  await page.goto('http://localhost:3000/setup', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'B1-setup-loaded.png'), fullPage: true });
  console.log('Setup page loaded');

  // Step 2: Category titles check
  console.log('\n=== STEP 2: Category titles ===');
  const categories = ['大国重器', '极客定制', '生活黑科技', '绿色新消费'];
  for (const cat of categories) {
    const el = page.locator(`text=${cat}`).first();
    const styles = await el.evaluate((node) => {
      const s = window.getComputedStyle(node);
      return { fontSize: s.fontSize, fontWeight: s.fontWeight, hasGradient: s.backgroundImage.includes('gradient') };
    }).catch(() => null);
    if (styles) {
      console.log(`"${cat}": fontSize=${styles.fontSize}, fontWeight=${styles.fontWeight}, gradient=${styles.hasGradient}`);
    }
  }

  // Step 3: Click template card and track navigation
  console.log('\n=== STEP 3: Click template card (客制化机械键盘) ===');
  const templateBtn = page.locator('button').filter({ hasText: '客制化机械键盘' }).first();

  const clickStart = Date.now();
  await templateBtn.click();

  // Wait for any navigation or state change
  await page.waitForTimeout(2000);
  const clickDuration = Date.now() - clickStart;
  const urlAfterClick = page.url();
  console.log(`After click (${clickDuration}ms): URL = ${urlAfterClick}`);
  await page.screenshot({ path: path.join(screenshotsDir, 'B2-after-template-click.png'), fullPage: true });

  // Check if we navigated to canvas
  if (urlAfterClick.includes('canvas') || urlAfterClick.includes('breakdown')) {
    console.log('NAVIGATED TO CANVAS after template click!');
    await checkCanvasPage(page, screenshotsDir, consoleErrors, consoleLogs);
  } else {
    // Still on setup - look for 开始拆解 button
    console.log('\n=== STEP 4: Looking for 开始拆解 button ===');

    // Scroll to find it
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'B3-scrolled.png'), fullPage: true });

    const allBtns = await page.locator('button').all();
    for (const btn of allBtns) {
      const text = (await btn.textContent())?.trim() || '';
      const vis = await btn.isVisible().catch(() => false);
      if (vis && text.length > 0) {
        console.log(`Visible button: "${text.substring(0, 60)}"`);
      }
    }

    const startBtn = page.locator('button').filter({ hasText: '开始拆解' }).first();
    const startVisible = await startBtn.isVisible().catch(() => false);
    console.log(`开始拆解 button visible: ${startVisible}`);

    if (startVisible) {
      const navStart = Date.now();
      await startBtn.click();
      await page.waitForTimeout(3000);
      console.log(`After 开始拆解 click (${Date.now() - navStart}ms): URL = ${page.url()}`);
      await page.screenshot({ path: path.join(screenshotsDir, 'B4-after-start-click.png'), fullPage: true });

      if (page.url().includes('canvas') || page.url().includes('breakdown')) {
        await checkCanvasPage(page, screenshotsDir, consoleErrors, consoleLogs);
      }
    }
  }

  // Report API calls made
  console.log('\n=== API REQUESTS MADE ===');
  if (networkRequests.length === 0) {
    console.log('No API requests made');
  } else {
    networkRequests.forEach(r => console.log(r));
  }

  // Report errors
  console.log('\n=== CONSOLE ERRORS ===');
  if (consoleErrors.length === 0) {
    console.log('No JavaScript errors');
  } else {
    consoleErrors.forEach(e => console.log('ERROR:', e));
  }

  console.log('\n=== CONSOLE WARNINGS ===');
  consoleWarnings.slice(0, 5).forEach(w => console.log('WARN:', w));
});

async function checkCanvasPage(page: any, screenshotsDir: string, errors: string[], logs: string[]) {
  console.log('\n=== CANVAS PAGE CHECK ===');
  const canvasUrl = page.url();
  console.log(`Canvas URL: ${canvasUrl}`);
  await page.screenshot({ path: path.join(screenshotsDir, 'B5-canvas-page.png'), fullPage: true });

  // Check for template tree (should load instantly without API)
  const treeStart = Date.now();
  const treeEl = page.locator('[class*="tree"], [class*="Tree"], [class*="node"], [class*="branch"], [class*="mindmap"]').first();
  const treeVisible = await treeEl.isVisible().catch(() => false);
  console.log(`Template tree visible: ${treeVisible} (checked in ${Date.now() - treeStart}ms)`);

  // List all visible buttons
  const buttons = await page.locator('button').all();
  console.log(`Total buttons: ${buttons.length}`);
  for (const btn of buttons) {
    const text = (await btn.textContent())?.trim() || '';
    const vis = await btn.isVisible().catch(() => false);
    if (vis && text.length > 0) {
      console.log(`  Visible button: "${text.substring(0, 60)}"`);
    }
  }

  // Check for 开始拆解 button on canvas
  const canvasStartBtn = page.locator('button').filter({ hasText: '开始拆解' }).first();
  const canvasStartVisible = await canvasStartBtn.isVisible().catch(() => false);
  console.log(`Canvas 开始拆解 button: ${canvasStartVisible}`);

  if (canvasStartVisible) {
    console.log('\nClicking canvas 开始拆解...');
    await canvasStartBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'B6-canvas-after-start.png'), fullPage: true });

    // Check for streaming animation
    const streamEls = await page.locator('[class*="stream"], [class*="typing"], [class*="animate"], [class*="cursor-blink"]').all();
    console.log(`Animation elements after click: ${streamEls.length}`);

    // Wait for more content
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'B7-canvas-streaming.png'), fullPage: true });

    // Check page text to see if streaming happened
    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('Page text after streaming:', pageText);
  }
}
