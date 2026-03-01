import { chromium } from 'playwright';

async function debugWebSocket() {
  console.log('开始调试WebSocket连接...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听所有控制台消息
  page.on('console', msg => {
    console.log(`[浏览器 ${msg.type()}]:`, msg.text());
  });

  // 监听WebSocket
  page.on('websocket', ws => {
    console.log('WebSocket连接:', ws.url());

    ws.on('framesent', event => {
      console.log('→ 发送:', event.payload);
    });

    ws.on('framereceived', event => {
      console.log('← 接收:', event.payload);
    });

    ws.on('close', () => {
      console.log('WebSocket连接已关闭');
    });
  });

  try {
    await page.goto('http://localhost:4000');
    console.log('页面已加载\n');

    await page.waitForTimeout(2000);

    console.log('输入产品名称并开始分析...');
    await page.fill('#productName', '白色金属闹钟');
    await page.click('#startBtn');

    console.log('等待响应...\n');
    await page.waitForTimeout(15000);

    console.log('\n调试完成');

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await browser.close();
  }
}

debugWebSocket().catch(console.error);
