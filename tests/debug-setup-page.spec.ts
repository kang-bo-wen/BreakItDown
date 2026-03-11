import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = '/c/Users/25066/Desktop/备份/BreakItDown/screenshots/debug-run';

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test('Debug BreakItDown setup page and full flow', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const consoleLogs: string[] = [];

  // Capture console messages
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    else if (msg.type() === 'warning') consoleWarnings.push(text);
    else consoleLogs.push(text);
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  // ===== STEP 1: Navigate to /setup =====
  console.log('Step 1: Navigating to /setup...');
  await page.goto('http://localhost:3000/setup', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotsDir, '01-setup-page.png'), fullPage: true });
  console.log('Screenshot 01-setup-page.png taken');

  // ===== STEP 2: Check template category titles =====
  console.log('Step 2: Checking template category titles...');
  const categoryTitles = ['大国重器', '极客定制', '生活黑科技', '绿色新消费'];

  for (const title of categoryTitles) {
    const el = page.locator(`text=${title}`).first();
    const isVisible = await el.isVisible().catch(() => false);
    console.log(`Category "${title}" visible: ${isVisible}`);

    if (isVisible) {
      const styles = await el.evaluate((node) => {
        const computed = window.getComputedStyle(node);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          backgroundImage: computed.backgroundImage,
          webkitBackgroundClip: computed.webkitBackgroundClip,
          color: computed.color,
          tagName: node.tagName,
          className: node.className,
        };
      });
      console.log(`  Styles for "${title}":`, JSON.stringify(styles));
    }
  }

  await page.screenshot({ path: path.join(screenshotsDir, '02-category-titles.png'), fullPage: true });

  // ===== STEP 3: Click on a template card in 极客定制 =====
  console.log('Step 3: Looking for template cards in 极客定制...');
  
  // Find the 极客定制 section
  const geekSection = page.locator('text=极客定制').first();
  const geekVisible = await geekSection.isVisible().catch(() => false);
  console.log(`极客定制 section visible: ${geekVisible}`);

  // Look for template cards - try various selectors
  const cardSelectors = [
    '[data-testid="template-card"]',
    '.template-card',
    '[class*="template"]',
    '[class*="card"]',
    'button[class*="template"]',
  ];

  let templateCard = null;
  for (const sel of cardSelectors) {
    const count = await page.locator(sel).count();
    console.log(`Selector "${sel}" found ${count} elements`);
    if (count > 0) {
      templateCard = page.locator(sel).first();
      break;
    }
  }

  // Try to find cards near 极客定制 section
  const allCards = await page.locator('[class*="card"], [class*="Card"]').all();
  console.log(`Total card-like elements: ${allCards.length}`);

  // Take screenshot before clicking
  await page.screenshot({ path: path.join(screenshotsDir, '03-before-card-click.png'), fullPage: true });

  // Try clicking the first visible clickable element that looks like a template
  const clickableItems = page.locator('div[class*="cursor-pointer"], button, [role="button"]');
  const clickableCount = await clickableItems.count();
  console.log(`Clickable items found: ${clickableCount}`);

  // Record time before click to measure delay
  const clickStart = Date.now();
  
  if (templateCard) {
    await templateCard.click({ timeout: 5000 });
    const clickDuration = Date.now() - clickStart;
    console.log(`Template card click took: ${clickDuration}ms`);
  } else {
    // Try clicking the second or third clickable item (first might be nav)
    if (clickableCount > 2) {
      await clickableItems.nth(2).click({ timeout: 5000 }).catch(e => console.log('Click failed:', e.message));
      const clickDuration = Date.now() - clickStart;
      console.log(`Fallback click took: ${clickDuration}ms`);
    }
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '04-after-card-click.png'), fullPage: true });
  console.log('Screenshot 04-after-card-click.png taken');

  // ===== STEP 4: Check for 开始拆解 button and click it =====
  console.log('Step 4: Looking for 开始拆解 button...');
  
  const startButton = page.locator('text=开始拆解').first();
  const startButtonVisible = await startButton.isVisible().catch(() => false);
  console.log(`开始拆解 button visible: ${startButtonVisible}`);

  if (startButtonVisible) {
    const btnStyles = await startButton.evaluate((node) => {
      const computed = window.getComputedStyle(node);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        disabled: (node as HTMLButtonElement).disabled,
      };
    });
    console.log('开始拆解 button styles:', JSON.stringify(btnStyles));

    // Click the button and measure navigation time
    const navStart = Date.now();
    await startButton.click({ timeout: 5000 });
    
    // Wait for navigation
    try {
      await page.waitForURL(/\/canvas|\/breakdown/, { timeout: 10000 });
      const navDuration = Date.now() - navStart;
      console.log(`Navigation to canvas took: ${navDuration}ms`);
      console.log(`Current URL after click: ${page.url()}`);
    } catch (e) {
      console.log(`Navigation timeout or no URL change. Current URL: ${page.url()}`);
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '05-after-start-button.png'), fullPage: true });
    console.log('Screenshot 05-after-start-button.png taken');
  } else {
    console.log('开始拆解 button NOT found on setup page');
    await page.screenshot({ path: path.join(screenshotsDir, '05-no-start-button.png'), fullPage: true });
  }

  // ===== STEP 5: Check canvas page =====
  const currentUrl = page.url();
  console.log(`Step 5: Current URL: ${currentUrl}`);
  
  if (currentUrl.includes('/canvas') || currentUrl.includes('/breakdown')) {
    console.log('On canvas page - checking for streaming animation and template tree...');
    
    // Check for 开始拆解 button on canvas
    const canvasStartBtn = page.locator('text=开始拆解').first();
    const canvasStartVisible = await canvasStartBtn.isVisible().catch(() => false);
    console.log(`Canvas 开始拆解 button visible: ${canvasStartVisible}`);

    // Check for template tree
    const treeSelectors = [
      '[class*="tree"]',
      '[class*="Tree"]',
      '[data-testid*="tree"]',
      '[class*="node"]',
      '[class*="branch"]',
    ];
    
    for (const sel of treeSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) console.log(`Tree selector "${sel}" found ${count} elements`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '06-canvas-page.png'), fullPage: true });
    
    if (canvasStartVisible) {
      console.log('Clicking canvas 开始拆解 button...');
      const animStart = Date.now();
      await canvasStartBtn.click({ timeout: 5000 });
      await page.waitForTimeout(3000);
      const animDuration = Date.now() - animStart;
      console.log(`After clicking canvas button, waited ${animDuration}ms`);
      await page.screenshot({ path: path.join(screenshotsDir, '07-canvas-after-click.png'), fullPage: true });
      
      // Check for streaming text animation
      const streamingSelectors = [
        '[class*="stream"]',
        '[class*="typing"]',
        '[class*="animate"]',
        '[class*="loading"]',
      ];
      for (const sel of streamingSelectors) {
        const count = await page.locator(sel).count();
        if (count > 0) console.log(`Streaming selector "${sel}" found ${count} elements`);
      }
    }
  } else {
    console.log('Did not navigate to canvas page');
  }

  // ===== FINAL: Report console errors =====
  console.log('\n===== CONSOLE ERRORS =====');
  if (consoleErrors.length === 0) {
    console.log('No console errors found');
  } else {
    consoleErrors.forEach(e => console.log('ERROR:', e));
  }

  console.log('\n===== CONSOLE WARNINGS =====');
  consoleWarnings.slice(0, 10).forEach(w => console.log('WARN:', w));

  console.log('\n===== RECENT CONSOLE LOGS =====');
  consoleLogs.slice(-20).forEach(l => console.log('LOG:', l));
});
