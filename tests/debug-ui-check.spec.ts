import { test, expect } from '@playwright/test';

test('Debug BreakItDown UI - Full Flow', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleLogs: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`ERROR: ${msg.text()}`);
    } else {
      consoleLogs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  // Step 1: Navigate to /setup
  console.log('=== Step 1: Navigate to /setup ===');
  await page.goto('http://localhost:3000/setup');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/screenshots/01-setup-page.png', fullPage: true });

  // Step 2: Check category titles styling
  console.log('=== Step 2: Check category title styling ===');
  const categoryTitles = ['大国重器', '极客定制', '生活黑科技', '绿色新消费'];
  for (const title of categoryTitles) {
    const el = page.locator(`text="${title}"`).first();
    const count = await el.count();
    console.log(`Category "${title}" found: ${count > 0}`);
    if (count > 0) {
      const styles = await el.evaluate((node) => {
        const computed = window.getComputedStyle(node);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          backgroundImage: computed.backgroundImage,
          webkitBackgroundClip: computed.webkitBackgroundClip,
          color: computed.color,
          className: node.className,
          tagName: node.tagName,
        };
      });
      console.log(`  Styles for "${title}":`, JSON.stringify(styles));
    }
  }

  // Step 3: Click on 客制化机械键盘 template card
  console.log('=== Step 3: Click on 客制化机械键盘 ===');
  const templateCard = page.locator('text="客制化机械键盘"').first();
  const cardCount = await templateCard.count();
  console.log(`Template card found: ${cardCount > 0}`);

  if (cardCount > 0) {
    const startTime = Date.now();
    await templateCard.click();
    await page.waitForTimeout(3000); // wait up to 3s
    const elapsed = Date.now() - startTime;
    console.log(`Template selection took: ${elapsed}ms`);
    await page.screenshot({ path: 'tests/screenshots/02-after-template-click.png', fullPage: true });
  }

  // Step 3b: Test 返回 button - go back to target selection
  console.log('=== Step 3b: Test 返回 button ===');
  const backBtn = page.locator('button:has-text("返回")').first();
  const backBtnCount = await backBtn.count();
  console.log(`返回 button found: ${backBtnCount > 0}`);

  if (backBtnCount > 0) {
    const isVisible = await backBtn.isVisible();
    console.log(`返回 button visible: ${isVisible}`);
    if (isVisible) {
      await backBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/02b-after-back-click.png', fullPage: true });

      // Verify we're back to target selection (template cards should be visible again)
      const templateCardAgain = page.locator('text="客制化机械键盘"').first();
      const backToSelection = await templateCardAgain.isVisible().catch(() => false);
      console.log(`Back to target selection (template visible): ${backToSelection}`);

      // Re-click the template to continue the flow
      if (backToSelection) {
        await templateCardAgain.click();
        await page.waitForTimeout(3000);
        console.log('Re-selected template after going back');
        await page.screenshot({ path: 'tests/screenshots/02c-reselected-template.png', fullPage: true });
      }
    }
  }

  // Step 4: Check if "开始拆解" button is visible
  console.log('=== Step 4: Check 开始拆解 button ===');
  const startBtn = page.locator('button:has-text("开始拆解")').first();
  const btnCount = await startBtn.count();
  console.log(`开始拆解 button found: ${btnCount > 0}`);
  await page.screenshot({ path: 'tests/screenshots/03-before-start.png', fullPage: true });

  if (btnCount > 0) {
    const isVisible = await startBtn.isVisible();
    const isEnabled = await startBtn.isEnabled();
    console.log(`Button visible: ${isVisible}, enabled: ${isEnabled}`);

    if (isVisible && isEnabled) {
      await startBtn.click();
      console.log('Clicked 开始拆解 button');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/04-after-start-click.png', fullPage: true });
    }
  }

  // Step 5: Check canvas page
  console.log('=== Step 5: Check canvas/tree page ===');
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/screenshots/05-canvas-page.png', fullPage: true });

  // Check if tree auto-loaded or if there's another 开始拆解 button
  const canvasStartBtn = page.locator('button:has-text("开始拆解")').first();
  const canvasBtnCount = await canvasStartBtn.count();
  console.log(`Canvas page 开始拆解 button found: ${canvasBtnCount > 0}`);

  if (canvasBtnCount > 0) {
    const isVisible = await canvasStartBtn.isVisible();
    console.log(`Canvas 开始拆解 button visible: ${isVisible}`);
    if (isVisible) {
      console.log('Tree did NOT auto-load - clicking 开始拆解 on canvas page');
      await canvasStartBtn.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'tests/screenshots/06-after-canvas-start.png', fullPage: true });
    }
  } else {
    console.log('Tree appears to have auto-loaded (no 开始拆解 button visible)');
  }

  // Step 6: Check for tree nodes
  console.log('=== Step 6: Check tree nodes ===');
  await page.waitForTimeout(2000);
  const treeNodes = page.locator('[data-testid="tree-node"], .tree-node, [class*="node"]');
  const nodeCount = await treeNodes.count();
  console.log(`Tree nodes found: ${nodeCount}`);
  await page.screenshot({ path: 'tests/screenshots/07-tree-state.png', fullPage: true });

  // Step 7: Try clicking a non-expanded node
  console.log('=== Step 7: Try clicking a node ===');
  const clickableNodes = page.locator('[class*="node"]:not([class*="expanded"])').first();
  const clickableCount = await clickableNodes.count();
  if (clickableCount > 0) {
    await clickableNodes.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/08-after-node-click.png', fullPage: true });
    console.log('Clicked a node - check screenshot for waiting animation');
  }

  // Final: Report console errors
  console.log('=== Console Errors ===');
  if (consoleErrors.length === 0) {
    console.log('No console errors found');
  } else {
    consoleErrors.forEach(e => console.log(e));
  }

  console.log('=== Console Logs (last 20) ===');
  consoleLogs.slice(-20).forEach(l => console.log(l));
});
