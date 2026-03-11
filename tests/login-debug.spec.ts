import { test, expect } from '@playwright/test';

test.describe('Login Debug', () => {
  test('调试登录功能', async ({ page }) => {
    console.log('🔍 开始调试登录功能\n');

    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   [浏览器错误] ${msg.text()}`);
      }
    });

    // 监听网络请求
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/auth') || url.includes('/login')) {
        console.log(`   [API] ${response.status()} ${url}`);
        if (response.status() >= 400) {
          try {
            const body = await response.text();
            console.log(`   [响应] ${body.substring(0, 200)}`);
          } catch (e) {
            // ignore
          }
        }
      }
    });

    // 步骤 1: 访问登录页面
    console.log('📍 Step 1: 访问登录页面');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/login-debug-01-page.png', fullPage: true });
    console.log('   ✅ 登录页面加载完成\n');

    // 步骤 2: 尝试使用已存在的测试账号登录
    console.log('📍 Step 2: 尝试登录');

    // 使用一个已知的测试账号
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';

    console.log(`   邮箱: ${testEmail}`);
    console.log(`   密码: ${testPassword}`);

    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);

    await page.screenshot({ path: 'screenshots/login-debug-02-filled.png', fullPage: true });

    console.log('   点击登录按钮...');
    await page.click('button[type="submit"]');

    // 等待响应
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`   当前 URL: ${currentUrl}`);

    await page.screenshot({ path: 'screenshots/login-debug-03-after-submit.png', fullPage: true });

    // 检查是否有错误消息
    const errorMsg = await page.$('text=/错误|失败|invalid|error/i');
    if (errorMsg) {
      const errorText = await errorMsg.textContent();
      console.log(`   ❌ 错误消息: ${errorText}`);
    }

    // 检查是否成功跳转
    if (currentUrl.includes('/setup') || currentUrl.includes('/canvas')) {
      console.log('   ✅ 登录成功！');
    } else if (currentUrl.includes('/login')) {
      console.log('   ❌ 仍在登录页面，登录失败');
    } else {
      console.log(`   ⚠️  跳转到了意外的页面: ${currentUrl}`);
    }

    console.log('\n📍 Step 3: 检查数据库中的用户');
    console.log('   提示：如果登录失败，可能需要先注册一个账号\n');

    console.log('✅ 登录调试完成');
  });

  test('先注册再登录', async ({ page }) => {
    console.log('🔍 测试完整流程：注册 -> 登出 -> 登录\n');

    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'testpassword123';

    // 步骤 1: 注册
    console.log('📍 Step 1: 注册新用户');
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');

    await page.fill('input#name', 'Test User');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);
    console.log(`   注册完成，邮箱: ${testEmail}\n`);

    // 步骤 2: 登出（如果有登出功能）
    console.log('📍 Step 2: 查找登出按钮');
    const logoutBtn = await page.$('button:has-text("登出"), button:has-text("退出"), a:has-text("登出"), a:has-text("退出")');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 已登出\n');
    } else {
      console.log('   ⚠️  未找到登出按钮，手动访问登录页面\n');
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({ path: 'screenshots/login-debug-04-logout.png', fullPage: true });

    // 步骤 3: 重新登录
    console.log('📍 Step 3: 使用刚注册的账号登录');

    // 确保在登录页面
    if (!page.url().includes('/login')) {
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
    }

    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);

    await page.screenshot({ path: 'screenshots/login-debug-05-relogin-filled.png', fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log(`   最终 URL: ${finalUrl}`);

    await page.screenshot({ path: 'screenshots/login-debug-06-relogin-result.png', fullPage: true });

    if (finalUrl.includes('/setup') || finalUrl.includes('/canvas')) {
      console.log('   ✅ 重新登录成功！\n');
    } else {
      console.log('   ❌ 重新登录失败\n');

      // 检查错误消息
      const errorMsg = await page.$('text=/错误|失败|invalid|error/i');
      if (errorMsg) {
        const errorText = await errorMsg.textContent();
        console.log(`   错误消息: ${errorText}`);
      }
    }

    console.log('✅ 完整流程测试完成');
  });
});
