import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = '/c/Users/25066/Desktop/备份/BreakItDown/screenshots/debug-run';

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test('Full flow: template selection and canvas', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const consoleLogs: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    else if (msg.type() === 'warning') consoleWarnings.push(text);
    else consoleLogs.push(text);
  });
  page.on('pageerror', (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  // Step 1: Navigate to /setup
  console.log('=== STEP 1: Navigate to /setup ===');
  await page.goto('http://localhost:3000/setup', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotsDir, 'A1-setup-loaded.png'), fullPage: true });

  // Step 2: Verify category titles with gradient text
  console.log('\n=== STEP 2: Category title styles ===');
  const categories = ['大国重器', '极客定制', '生活黑科技', '绿色新消费'];
  for (const cat of categories) {
    const el = page.locator(`text=${cat}`).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      const styles = await el.evaluate((node) => {
        const s = window.getComputedStyle(node);
        return { fontSize: s.fontSize, fontWeight: s.fontWeight, hasGradient: s.backgroundImage.includes('gradient') };
      });
      console.log(`"${cat}": visible=true, fontSize=${styles.fontSize}, fontWeight=${styles.fontWeight}, gradient=${styles.hasGradient}`);
    } else {
      console.log(`"${cat}": NOT VISIBLE`);
    }
  }

  // Step 3: Click a template card in 极客定制 (客制化机械键盘)
  console.log('\n=== STEP 3: Click template card ===');
  // Template buttons contain the name + category text
  const templateBtn = page.locator('button').filter({ hasText: '客制化机械键盘' }).first();
  const btnVisible = await templateBtn.isVisible().catch(() => false);
  console.log(`Template button "客制化机械键盘" visible: ${btnVisible}`);

  if (btnVisible) {
    const clickStart = Date.now();
    await templateBtn.click();
    const clickDuration = Date.now() - clickStart;
    console.log(`Click response time: ${clickDuration}ms`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, 'A2-template-selected.png'), fullPage: true });

    // Check if card is now selected (border/highlight change)
    const selectedClass = await templateBtn.evaluate((node) => node.className);
    console.log(`Selected card class: ${selectedClass.substring(0, 150)}`);
    const isSelected = selectedClass.includes('border-purple') || selectedClass.includes('selected') || selectedClass.includes('ring');
    console.log(`Card appears selected: ${isSelected}`);
  }

  // Step 4: Look for 开始拆解 button
  console.log('\n=== STEP 4: Find 开始拆解 button ===');
  await page.waitForTimeout(500);

  // Scroll down to find the button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, 'A3-scrolled-down.png'), fullPage: true });

  const startBtn = page.locator('button').filter({ hasText: '开始拆解' }).first();
  const startBtnVisible = await startBtn.isVisible().catch(() => false);
  console.log(`开始拆解 button visible: ${startBtnVisible}`);

  // Also check for any button with similar text
  const allButtons = await page.locator('button').all();
  console.log(`Total buttons on page: ${allButtons.length}`);
  for (const btn of allButtons) {
    const text = await btn.textContent();
    if (text && (text.includes('拆解') || text.includes('开始') || text.includes('确认') || text.includes('下一步'))) {
      const vis = await btn.isVisible().catch(() => false);
      console.log(`Button "${text?.trim()}" visible: ${vis}`);
    }
  }

  // Step 5: Navigate to canvas if button found, else try direct URL
  console.log('\n=== STEP 5: Navigate to canvas ===');
  
  if (startBtnVisible) {
    const navStart = Date.now();
    await startBtn.click();
    try {
      await page.waitForURL(/canvas|breakdown/, { timeout: 10000 });
      console.log(`Navigation took: ${Date.now() - navStart}ms`);
    } catch {
      console.log(`No URL change after 10s. URL: ${page.url()}`);
    }
  } else {
    // Try to navigate directly to canvas with a template
    console.log('Trying direct canvas navigation...');
    await page.goto('http://localhost:3000/canvas?template=%E5%AE%A2%E5%88%B6%E5%8C%96%E6%9C%BA%E6%A2%B0%E9%94%AE%E7%9B%98', { waitUntil: 'networkidle', timeout: 30000 });
  }

  const canvasUrl = page.url();
  console.log(`Current URL: ${canvasUrl}`);
  await page.screenshot({ path: path.join(screenshotsDir, 'A4-canvas-page.png'), fullPage: true });

  // Step 6: Check canvas page elements
  console.log('\n=== STEP 6: Canvas page inspection ===');
  
  if (canvasUrl.includes('canvas') || canvasUrl.includes('breakdown')) {
    // Check for 开始拆解 button on canvas
    const canvasStartBtn = page.locator('button').filter({ hasText: '开始拆解' }).first();
    const canvasStartVisible = await canvasStartBtn.isVisible().catch(() => false);
    console.log(`Canvas 开始拆解 button visible: ${canvasStartVisible}`);

    // Check for template tree (should load instantly)
    const treeLoadStart = Date.now();
    const treeEl = page.locator('[class*="tree"], [class*="Tree"], [class*="node"], [class*="branch"]').first();
    const treeVisible = await treeEl.isVisible().catch(() => false);
    const treeLoadTime = Date.now() - treeLoadStart;
    console.log(`Template tree visible: ${treeVisible}, check took: ${treeLoadTime}ms`);

    // Check for any loading indicators
    const loadingEl = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').first();
    const loadingVisible = await loadingEl.isVisible().catch(() => false);
    console.log(`Loading indicator visible: ${loadingVisible}`);

    // List all buttons on canvas
    const canvasButtons = await page.locator('button').all();
    console.log(`Buttons on canvas: ${canvasButtons.length}`);
    for (const btn of canvasButtons) {
      const text = await btn.textContent();
      const vis = await btn.isVisible().catch(() => false);
      if (vis) console.log(`  Button: "${text?.trim().substring(0, 50)}"`);
    }

    if (canvasStartVisible) {
      console.log('\nClicking canvas 开始拆解 button...');
      const animStart = Date.now();
      await canvasStartBtn.click();
      
      // Wait and check for streaming animation
      await page.waitForTimeout(2000);
      const animDuration = Date.now() - animStart;
      console.log(`After click, waited ${animDuration}ms`);
      
      await page.screenshot({ path: path.join(screenshotsDir, 'A5-canvas-after-click.png'), fullPage: true });
      
      // Check for streaming text indicators
      const streamingEls = await page.locator('[class*="stream"], [class*="typing"], [class*="animate-pulse"], [class*="cursor"]').all();
      console.log(`Streaming/animation elements: ${streamingEls.length}`);
      
      // Wait more and take another screenshot
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(screenshotsDir, 'A6-canvas-streaming.png'), fullPage: true });
    }
  } else {
    console.log('Not on canvas page - checking current page structure');
    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Page text:', pageText);
  }

  // Final: Console errors report
  console.log('\n=== CONSOLE ERRORS ===');
  if (consoleErrors.length === 0) {
    console.log('No JavaScript errors found');
  } else {
    consoleErrors.forEach(e => console.log('ERROR:', e));
  }

  console.log('\n=== CONSOLE WARNINGS (first 5) ===');
  consoleWarnings.slice(0, 5).forEach(w => console.log('WARN:', w));

  console.log('\n=== RECENT LOGS (last 10) ===');
  consoleLogs.slice(-10).forEach(l => console.log('LOG:', l));
});
