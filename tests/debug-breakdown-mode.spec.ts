import { test } from '@playwright/test';

test('Debug breakdown mode', async ({ page }) => {
  // 注册
  await page.goto('http://localhost:8000/register');
  const timestamp = Date.now();
  const testEmail = `debug${timestamp}@example.com`;

  await page.fill('input#name', 'Debug User');
  await page.fill('input#email', testEmail);
  await page.fill('input#password', 'testpassword123');
  await page.fill('input#confirmPassword', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/setup', { timeout: 10000 });

  // 输入并识别
  await page.click('button:has-text("文字")');
  await page.fill('textarea', '四足机器人');
  await page.click('button:has-text("开始识别")');
  await page.waitForTimeout(5000);

  // 选择生产模式
  await page.click('button:has-text("生产模式")');
  await page.waitForTimeout(500);

  // 检查 localStorage
  const setupState = await page.evaluate(() => {
    const data = localStorage.getItem('setupState');
    return data ? JSON.parse(data) : null;
  });
  console.log('Setup state before navigation:', JSON.stringify(setupState, null, 2));

  // 开始拆解
  await page.click('button:has-text("开始拆解")');
  await page.waitForURL('**/canvas**', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 检查 canvas 页面的状态
  const canvasState = await page.evaluate(() => {
    const setupData = localStorage.getItem('setupState');
    return {
      setupState: setupData ? JSON.parse(setupData) : null,
      url: window.location.href
    };
  });
  console.log('Canvas state:', JSON.stringify(canvasState, null, 2));

  // 等待拆解完成
  await page.waitForTimeout(10000);

  // 检查页面上的 breakdownMode
  const pageInfo = await page.evaluate(() => {
    // 尝试找到任何包含 breakdownMode 的元素
    const allText = document.body.innerText;
    return {
      hasProductionButton: document.querySelector('button[title="查看生产分析"]') !== null,
      bodyText: allText.substring(0, 500)
    };
  });
  console.log('Page info:', JSON.stringify(pageInfo, null, 2));

  await page.screenshot({ path: 'screenshots/debug-final.png', fullPage: true });
});
