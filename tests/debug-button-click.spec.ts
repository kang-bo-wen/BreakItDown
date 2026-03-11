import { test } from '@playwright/test';

test('Debug production button click', async ({ page }) => {
  // 监听控制台日志
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  // 注册
  await page.goto('http://localhost:8000/register');
  const timestamp = Date.now();
  await page.fill('input#name', 'Debug');
  await page.fill('input#email', `debug${timestamp}@example.com`);
  await page.fill('input#password', 'testpassword123');
  await page.fill('input#confirmPassword', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/setup');

  // 识别
  await page.click('button:has-text("文字")');
  await page.fill('textarea', '四足机器人');
  await page.click('button:has-text("开始识别")');
  await page.waitForTimeout(6000);

  // 选择生产模式
  await page.click('button:has-text("生产模式")');
  await page.waitForTimeout(500);

  // 导航到 canvas
  await page.click('button:has-text("开始拆解")');
  await page.waitForURL('**/canvas**');
  await page.waitForTimeout(2000);

  // 点击开始拆解
  await page.click('button:has-text("开始拆解")');
  await page.waitForTimeout(15000);

  // 查找并点击生产分析按钮
  const button = await page.waitForSelector('button[title="查看生产分析"]', { timeout: 5000 });

  console.log('Found production analysis button');

  // 点击前的 URL
  const urlBefore = page.url();
  console.log('URL before click:', urlBefore);

  // 点击按钮
  await button.click();
  console.log('Clicked production analysis button');

  // 等待一下
  await page.waitForTimeout(3000);

  // 点击后的 URL
  const urlAfter = page.url();
  console.log('URL after click:', urlAfter);

  // 截图
  await page.screenshot({ path: 'screenshots/debug-after-click.png', fullPage: true });
});
