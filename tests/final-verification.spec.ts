import { test, expect } from '@playwright/test';

test('Final verification - BreakItDown complete flow', async ({ page }) => {
  const consoleErrors: string[] = [];
  const networkRequests: { url: string; status: number }[] = [];

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture network responses
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      networkRequests.push({ url, status: response.status() });
    }
  });

  // Step 1: Navigate to /setup
  console.log('=== Step 1: Navigate to /setup ===');
  await page.goto('http://localhost:3000/setup');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/screenshots/01-setup-page.png', fullPage: true });

  // Step 2: Verify 4 category titles with gradient text
  console.log('=== Step 2: Verify category titles ===');
  const categories = ['大国重器', '极客定制', '生活黑科技', '绿色新消费'];
  for (const cat of categories) {
    const el = page.locator(`text=${cat}`).first();
    const isVisible = await el.isVisible().catch(() => false);
    console.log(`Category "${cat}" visible: ${isVisible}`);
    if (isVisible) {
      const className = await el.getAttribute('class').catch(() => '');
      console.log(`  Classes: ${className}`);
    }
  }

  // Step 3: Click on 客制化机械键盘 template card
  console.log('=== Step 3: Click 客制化机械键盘 template card ===');
  const templateCard = page.locator('text=客制化机械键盘').first();
  const cardVisible = await templateCard.isVisible().catch(() => false);
  console.log(`Template card visible: ${cardVisible}`);

  if (cardVisible) {
    await templateCard.click();
    console.log('Clicked template card');
    await page.waitForTimeout(500);
  } else {
    // Try finding by partial text or data attributes
    const allCards = await page.locator('[class*="card"], [class*="template"]').all();
    console.log(`Found ${allCards.length} card-like elements`);
    for (const card of allCards.slice(0, 5)) {
      const text = await card.textContent().catch(() => '');
      console.log(`  Card text: ${text?.substring(0, 80)}`);
    }
  }

  // Step 4: Wait for "开始拆解" button
  console.log('=== Step 4: Wait for 开始拆解 button ===');
  await page.waitForTimeout(2000);
  
  const startBtn = page.locator('button:has-text("开始拆解"), button:has-text("准备中")').first();
  const btnExists = await startBtn.isVisible().catch(() => false);
  console.log(`Start button visible: ${btnExists}`);
  
  if (btnExists) {
    const btnText = await startBtn.textContent();
    const btnDisabled = await startBtn.isDisabled();
    console.log(`Button text: "${btnText}", disabled: ${btnDisabled}`);
    
    // Wait for it to become enabled (up to 10 seconds)
    try {
      await expect(startBtn).toBeEnabled({ timeout: 10000 });
      console.log('Button is now enabled!');
    } catch (e) {
      console.log('Button did not become enabled within 10s');
      const finalText = await startBtn.textContent().catch(() => '');
      console.log(`Final button text: "${finalText}"`);
    }
  }

  await page.screenshot({ path: 'tests/screenshots/02-after-template-select.png', fullPage: true });

  // Step 5: Check localStorage for templateTreeData
  console.log('=== Step 5: Check localStorage ===');
  const templateTreeData = await page.evaluate(() => {
    return localStorage.getItem('templateTreeData');
  });
  console.log(`templateTreeData in localStorage: ${templateTreeData ? 'EXISTS (length: ' + templateTreeData.length + ')' : 'NOT FOUND'}`);
  
  if (templateTreeData) {
    try {
      const parsed = JSON.parse(templateTreeData);
      console.log(`Parsed templateTreeData keys: ${Object.keys(parsed).join(', ')}`);
    } catch (e) {
      console.log('Could not parse templateTreeData as JSON');
    }
  }

  // Also check all localStorage keys
  const allKeys = await page.evaluate(() => {
    return Object.keys(localStorage);
  });
  console.log(`All localStorage keys: ${allKeys.join(', ')}`);

  // Step 6: Click "开始拆解"
  console.log('=== Step 6: Click 开始拆解 ===');
  const startBtnFinal = page.locator('button:has-text("开始拆解")').first();
  const canClick = await startBtnFinal.isVisible().catch(() => false);
  
  if (canClick) {
    const isEnabled = await startBtnFinal.isEnabled().catch(() => false);
    console.log(`Button enabled: ${isEnabled}`);
    if (isEnabled) {
      await startBtnFinal.click();
      console.log('Clicked 开始拆解');
      await page.waitForTimeout(2000);
    }
  }

  // Step 7: Check canvas page auto-loads tree
  console.log('=== Step 7: Check canvas page ===');
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'tests/screenshots/03-canvas-page.png', fullPage: true });
  
  // Check for tree/graph elements
  const svgElements = await page.locator('svg').count();
  const canvasElements = await page.locator('canvas').count();
  const reactFlowElements = await page.locator('.react-flow, [class*="react-flow"]').count();
  const nodeElements = await page.locator('[class*="node"], .node').count();
  
  console.log(`SVG elements: ${svgElements}`);
  console.log(`Canvas elements: ${canvasElements}`);
  console.log(`React Flow elements: ${reactFlowElements}`);
  console.log(`Node elements: ${nodeElements}`);

  // Check page content
  const pageText = await page.locator('body').textContent().catch(() => '');
  console.log(`Page text snippet: ${pageText?.substring(0, 300)}`);

  // Step 8: Report console errors
  console.log('=== Step 8: Console errors ===');
  console.log(`Total console errors: ${consoleErrors.length}`);
  consoleErrors.forEach((err, i) => console.log(`  Error ${i + 1}: ${err}`));

  // Report API calls
  console.log('=== API Requests ===');
  networkRequests.forEach(req => {
    console.log(`  ${req.status} ${req.url}`);
  });

  // Check specifically for mechanical-keyboard API
  const mkRequest = networkRequests.find(r => r.url.includes('mechanical-keyboard'));
  if (mkRequest) {
    console.log(`mechanical-keyboard API status: ${mkRequest.status}`);
  } else {
    console.log('No mechanical-keyboard API request found');
  }
});
