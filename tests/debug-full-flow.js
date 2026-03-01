import { chromium } from 'playwright';

async function debugFullFlow() {
  console.log('开始完整流程调试...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  // 监听所有WebSocket消息
  const messages = [];
  page.on('websocket', ws => {
    console.log('WebSocket已连接\n');

    ws.on('framereceived', event => {
      try {
        const data = JSON.parse(event.payload);
        messages.push(data);
        console.log(`← 接收消息 [${data.type}]`);
        if (data.type !== 'thinking') {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (e) {
        // 忽略非JSON消息
      }
    });
  });

  try {
    await page.goto('http://localhost:4000');
    await page.waitForTimeout(1000);

    console.log('输入产品名称并开始分析...\n');
    await page.fill('#productName', '白色金属闹钟');
    await page.click('#startBtn');

    console.log('等待零件树加载...\n');
    await page.waitForSelector('.part-item', { timeout: 15000 });
    console.log('零件树已加载\n');

    console.log('点击第一个零件...\n');
    const partItems = await page.$$('.part-item');
    await partItems[0].click();

    console.log('等待供应商加载...\n');
    await page.waitForSelector('.supplier-item', { timeout: 15000 });
    console.log('供应商已加载\n');

    console.log('点击第一个供应商...\n');
    const supplierItems = await page.$$('.supplier-item');
    await supplierItems[0].click();

    console.log('等待评估结果...\n');
    await page.waitForTimeout(15000);

    // 检查是否收到assessment_complete消息
    const assessmentMsg = messages.find(m => m.type === 'assessment_complete');
    if (assessmentMsg) {
      console.log('\n✓ 收到assessment_complete消息');
      console.log(JSON.stringify(assessmentMsg, null, 2));
    } else {
      console.log('\n✗ 未收到assessment_complete消息');
    }

    // 检查弹窗状态
    const modal = await page.$('#assessmentModal');
    const modalClasses = await modal.getAttribute('class');
    console.log(`\n弹窗class: ${modalClasses}`);

    if (modalClasses.includes('show')) {
      console.log('✓ 弹窗已显示');
    } else {
      console.log('✗ 弹窗未显示');
    }

    console.log('\n所有接收到的消息类型:');
    const messageTypes = [...new Set(messages.map(m => m.type))];
    console.log(messageTypes.join(', '));

    console.log('\n浏览器将保持打开30秒...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n错误:', error.message);
  } finally {
    await browser.close();
  }
}

debugFullFlow().catch(console.error);
