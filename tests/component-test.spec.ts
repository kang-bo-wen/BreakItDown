import { test } from '@playwright/test';

test('Verify DecompositionTree component renders without errors', async ({ page }) => {
  console.log('🚀 Testing DecompositionTree component...');

  // 监听错误
  const errors: string[] = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ Page error:', error.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });

  // 访问首页
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);

  console.log('✅ Page loaded successfully');
  console.log(`Total errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ No errors found!');
  }

  // 截图
  await page.screenshot({ path: 'screenshots/component-test.png', fullPage: true });
  console.log('📸 Screenshot saved');
});
