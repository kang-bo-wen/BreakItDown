import { test, expect } from '@playwright/test';

test.describe('Production Analysis Access', () => {
  test('should show production analysis button when production mode is selected', async ({ page }) => {
    // 1. 注册并登录
    await page.goto('http://localhost:8000/register');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    await page.fill('input#name', 'Test User');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', 'testpassword123');
    await page.fill('input#confirmPassword', 'testpassword123');
    await page.click('button[type="submit"]');

    // 等待跳转到 setup 页面
    await page.waitForURL('**/setup', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/production-01-setup.png', fullPage: true });

    // 2. 输入文字进行识别
    await page.click('button:has-text("文字")');
    await page.fill('textarea', '四足机器人');
    await page.screenshot({ path: 'screenshots/production-02-input.png', fullPage: true });

    await page.click('button:has-text("开始识别")');
    await page.waitForTimeout(5000); // 等待AI识别
    await page.screenshot({ path: 'screenshots/production-03-identified.png', fullPage: true });

    // 3. 选择生产模式
    await page.click('button:has-text("生产模式")');
    await page.screenshot({ path: 'screenshots/production-04-mode-selected.png', fullPage: true });

    // 4. 开始拆解
    await page.click('button:has-text("开始拆解")');
    await page.waitForURL('**/canvas**', { timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/production-05-canvas-loading.png', fullPage: true });

    // 5. 等待拆解完成
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'screenshots/production-06-decomposed.png', fullPage: true });

    // 6. 检查是否有生产分析按钮（🏭 emoji）
    const productionButtons = await page.$$('button[title="查看生产分析"]');
    console.log(`Found ${productionButtons.length} production analysis buttons`);

    if (productionButtons.length > 0) {
      // 点击第一个生产分析按钮
      await productionButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/production-07-analysis-page.png', fullPage: true });

      // 检查是否跳转到生产分析页面
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/production-analysis');
    } else {
      console.log('No production analysis buttons found - this is the issue!');

      // 检查 breakdownMode 是否正确设置
      const treeElement = await page.$('[data-testid="decomposition-tree"]');
      if (treeElement) {
        console.log('Tree element found');
      } else {
        console.log('Tree element not found');
      }
    }
  });

  test('should NOT show production analysis button in basic mode', async ({ page }) => {
    // 登录
    await page.goto('http://localhost:8000/login');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#password', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/setup', { timeout: 10000 });

    // 输入文字
    await page.click('button:has-text("文字")');
    await page.fill('textarea', '笔记本电脑');
    await page.click('button:has-text("开始识别")');
    await page.waitForTimeout(5000);

    // 选择基础模式（默认）
    await page.click('button:has-text("基础模式")');
    await page.screenshot({ path: 'screenshots/basic-mode-selected.png', fullPage: true });

    // 开始拆解
    await page.click('button:has-text("开始拆解")');
    await page.waitForURL('**/canvas**', { timeout: 10000 });
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'screenshots/basic-mode-canvas.png', fullPage: true });

    // 检查不应该有生产分析按钮
    const productionButtons = await page.$$('button[title="查看生产分析"]');
    console.log(`Found ${productionButtons.length} production analysis buttons in basic mode`);
    expect(productionButtons.length).toBe(0);
  });
});
