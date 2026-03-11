import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// 辅助：获取可见的步骤按钮
const stepBtn = (page: any, label: string) =>
  page.locator(`button:has-text("${label}")`).filter({ visible: true }).first();

test.describe('生产分析步骤导航 - 可直接点击切换', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input#email, input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input#password, input[name="password"]').first();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/setup**', { timeout: 15000 }).catch(() => {});
  });

  test('步骤按钮全部可见且可点击', async ({ page }) => {
    await page.goto(`${BASE_URL}/production-analysis?partId=test-part&partName=测试零件`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.screenshot({ path: 'screenshots/step-nav-01-initial.png', fullPage: true });

    const stepLabels = ['产品规划', '竞品分析', '供应商', '定制参数', '工艺方案', '评估结果', '最终报告'];

    for (const label of stepLabels) {
      const btn = stepBtn(page, label);
      await expect(btn).toBeVisible({ timeout: 5000 });
      console.log(`✅ 步骤按钮可见: ${label}`);
    }
  });

  test('点击任意步骤按钮可直接切换', async ({ page }) => {
    await page.goto(`${BASE_URL}/production-analysis?partId=test-part&partName=测试零件`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.screenshot({ path: 'screenshots/step-nav-02-step1.png', fullPage: true });

    // 直接点击 竞品分析（第2步，跳过顺序）
    await stepBtn(page, '竞品分析').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step-nav-03-step2.png', fullPage: true });
    console.log('✅ 切换到竞品分析');

    // 直接跳到 最终报告（第7步）
    await stepBtn(page, '最终报告').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step-nav-04-step7.png', fullPage: true });
    console.log('✅ 切换到最终报告');

    // 往回跳到 供应商（第3步）
    await stepBtn(page, '供应商').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step-nav-05-step3.png', fullPage: true });
    console.log('✅ 切换到供应商');

    // 验证供应商按钮高亮
    const supplierBtn = stepBtn(page, '供应商');
    const cls = await supplierBtn.getAttribute('class');
    expect(cls).toMatch(/from-cyan-500|to-blue-500/);
    console.log('✅ 供应商按钮高亮正确');
  });

  test('步骤按钮高亮状态正确', async ({ page }) => {
    await page.goto(`${BASE_URL}/production-analysis?partId=test-part&partName=测试零件`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 点击 工艺方案
    await stepBtn(page, '工艺方案').click();
    await page.waitForTimeout(500);

    const processBtn = stepBtn(page, '工艺方案');
    const cls = await processBtn.getAttribute('class');
    console.log('工艺方案按钮 class:', cls);
    expect(cls).toMatch(/from-cyan-500|to-blue-500/);

    await page.screenshot({ path: 'screenshots/step-nav-06-highlight.png', fullPage: true });
    console.log('✅ 步骤按钮高亮状态正确');
  });
});
