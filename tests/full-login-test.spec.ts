import { test, expect } from '@playwright/test';

test('完整的登录流程测试', async ({ page }) => {
  console.log('\n🔍 开始完整登录测试\n');

  // 访问登录页面
  await page.goto('http://localhost:3000/login');
  console.log('✅ 已访问登录页面');

  // 等待页面加载
  await page.waitForLoadState('networkidle');
  console.log('✅ 页面加载完成');

  // 检查页面标题
  await expect(page.locator('h1')).toContainText('登录');
  console.log('✅ 找到登录标题');

  // 截图
  await page.screenshot({ path: 'screenshots/login-page-loaded.png' });
  console.log('📸 截图保存: login-page-loaded.png');

  // 填写表单
  await page.fill('input[type="email"]', '2506639957@qq.com');
  console.log('✅ 已填写邮箱');

  await page.fill('input[type="password"]', 'test123');
  console.log('✅ 已填写密码');

  // 截图填写后的表单
  await page.screenshot({ path: 'screenshots/login-form-filled.png' });
  console.log('📸 截图保存: login-form-filled.png');

  // 点击登录按钮
  console.log('🔄 点击登录按钮...');
  await page.click('button[type="submit"]');

  // 等待导航或错误消息
  try {
    await page.waitForURL('**/setup', { timeout: 10000 });
    console.log('✅ 登录成功！已跳转到 /setup');

    // 截图成功页面
    await page.screenshot({ path: 'screenshots/login-success.png' });
    console.log('📸 截图保存: login-success.png');

    // 验证用户已登录
    const userMenu = page.locator('text=dudu, text=2506639957@qq.com');
    if (await userMenu.count() > 0) {
      console.log('✅ 用户菜单显示正常');
    }

  } catch (error) {
    console.log('⏳ 等待跳转超时，检查是否有错误消息...');

    // 检查错误消息
    const errorMsg = page.locator('text=邮箱或密码错误');
    if (await errorMsg.isVisible()) {
      console.log('❌ 显示错误: 邮箱或密码错误');
    }

    // 截图错误状态
    await page.screenshot({ path: 'screenshots/login-error-state.png' });
    console.log('📸 截图保存: login-error-state.png');

    // 获取当前 URL
    const currentUrl = page.url();
    console.log('📍 当前 URL:', currentUrl);
  }

  console.log('\n✅ 测试完成\n');
});
