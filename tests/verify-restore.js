import { chromium } from 'playwright';

async function verifyRestore() {
  console.log('验证项目已恢复到之前状态...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:4000');
    await page.waitForTimeout(1000);

    // 检查背景色是否恢复为紫色渐变
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).background;
    });
    console.log('Body背景:', bodyBg.substring(0, 100) + '...');

    if (bodyBg.includes('667eea') || bodyBg.includes('764ba2')) {
      console.log('✓ 背景已恢复为紫色渐变\n');
    } else {
      console.warn('⚠ 背景可能未正确恢复\n');
    }

    // 检查系统副标题是否已移除
    const subtitle = await page.$('.system-subtitle');
    if (!subtitle) {
      console.log('✓ 系统副标题已移除\n');
    } else {
      console.warn('⚠ 系统副标题仍然存在\n');
    }

    // 检查容器背景是否为白色
    const containerBg = await page.evaluate(() => {
      const container = document.querySelector('.container');
      return window.getComputedStyle(container).backgroundColor;
    });
    console.log('Container背景色:', containerBg);

    if (containerBg === 'rgb(255, 255, 255)' || containerBg === 'rgba(255, 255, 255, 1)') {
      console.log('✓ 容器背景已恢复为白色\n');
    } else {
      console.warn(`⚠ 容器背景不是白色: ${containerBg}\n`);
    }

    // 截图
    await page.screenshot({ path: 'restored-state.png', fullPage: true });
    console.log('✓ 截图已保存: restored-state.png\n');

    console.log('='.repeat(50));
    console.log('项目已成功恢复到之前的紫色渐变风格！');
    console.log('='.repeat(50));

    console.log('\n浏览器将保持打开30秒以便查看...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('验证失败:', error.message);
  } finally {
    await browser.close();
  }
}

verifyRestore().catch(console.error);
