import { test, expect } from '@playwright/test';

test.describe('登录功能测试', () => {
  test('应该能够成功登录', async ({ page }) => {
    // 访问登录页面
    await page.goto('/login');

    // 等待页面加载
    await expect(page.locator('h1')).toContainText('登录');

    // 填写登录表单
    await page.fill('input[type="email"]', '2506639957@qq.com');
    await page.fill('input[type="password"]', 'test123');

    // 点击登录按钮
    await page.click('button[type="submit"]');

    // 等待跳转
    await page.waitForURL('/setup', { timeout: 10000 });

    // 验证登录成功
    await expect(page).toHaveURL('/setup');
  });

  test('应该显示错误信息当密码错误时', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', '2506639957@qq.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // 等待错误信息出现
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible({ timeout: 5000 });
  });

  test('首页应该快速加载', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    console.log(`页面加载时间: ${loadTime}ms`);

    // 验证页面加载时间小于 5 秒
    expect(loadTime).toBeLessThan(5000);

    // 验证关键元素存在
    await expect(page.locator('text=BREAK IT DOWN')).toBeVisible();
  });
});
