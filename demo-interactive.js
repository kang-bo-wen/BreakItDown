const { spawn } = require('child_process');

console.log('🎮 Playwright MCP 互动演示\n');
console.log('这个演示会自动访问网站并进行交互...\n');

const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--browser', 'chromium'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let outputBuffer = '';
let requestId = 0;
const pendingRequests = new Map();

function sendRequest(method, params = {}) {
  requestId++;
  const request = {
    jsonrpc: '2.0',
    id: requestId,
    method,
    params
  };

  mcp.stdin.write(JSON.stringify(request) + '\n');

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject, method });
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`超时: ${method}`));
      }
    }, 30000);
  });
}

mcp.stdout.on('data', (data) => {
  const text = data.toString();
  outputBuffer += text;

  const lines = outputBuffer.split('\n');
  outputBuffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        if (response.id && pendingRequests.has(response.id)) {
          const { resolve } = pendingRequests.get(response.id);
          pendingRequests.delete(response.id);
          resolve(response);
        }
      } catch (e) {
        // 忽略
      }
    }
  }
});

mcp.stderr.on('data', (data) => {
  const text = data.toString();
  if (!text.includes('DeprecationWarning')) {
    console.error('[错误]:', text);
  }
});

mcp.on('close', () => {
  console.log('\n\n🎉 演示结束！');
});

async function runDemo() {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📡 初始化 MCP 服务器...');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'demo-client', version: '1.0.0' }
    });

    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    console.log('✓ 初始化完成\n');

    // 演示 1: 访问 Example.com
    console.log('🌐 演示 1: 访问 Example.com');
    await sendRequest('tools/call', {
      name: 'browser_navigate',
      arguments: { url: 'https://example.com' }
    });
    console.log('✓ 页面加载完成');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const snapshot1 = await sendRequest('tools/call', {
      name: 'browser_snapshot',
      arguments: {}
    });

    if (snapshot1.result && snapshot1.result.content) {
      const content = snapshot1.result.content[0];
      if (content.text) {
        console.log('\n📄 页面内容:');
        console.log(content.text.substring(0, 400));
        console.log('...\n');
      }
    }

    // 演示 2: 执行 JavaScript
    console.log('💻 演示 2: 执行 JavaScript 获取页面信息');
    const evalResult = await sendRequest('tools/call', {
      name: 'browser_evaluate',
      arguments: {
        function: '() => { return { title: document.title, url: window.location.href, links: document.querySelectorAll("a").length }; }'
      }
    });

    if (evalResult.result && evalResult.result.content) {
      const content = evalResult.result.content[0];
      if (content.text) {
        console.log('✓ JavaScript 执行结果:');
        console.log(content.text);
        console.log('');
      }
    }

    // 演示 3: 访问 GitHub
    console.log('🐙 演示 3: 访问 GitHub');
    await sendRequest('tools/call', {
      name: 'browser_navigate',
      arguments: { url: 'https://github.com' }
    });
    console.log('✓ GitHub 页面加载完成');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const snapshot2 = await sendRequest('tools/call', {
      name: 'browser_snapshot',
      arguments: {}
    });

    if (snapshot2.result && snapshot2.result.content) {
      const content = snapshot2.result.content[0];
      if (content.text) {
        console.log('\n📄 GitHub 页面快照:');
        console.log(content.text.substring(0, 500));
        console.log('...\n');
      }
    }

    // 演示 4: 调整窗口大小
    console.log('📐 演示 4: 调整浏览器窗口');
    await sendRequest('tools/call', {
      name: 'browser_resize',
      arguments: { width: 1280, height: 720 }
    });
    console.log('✓ 窗口已调整为 1280x720\n');

    // 演示 5: 获取控制台消息
    console.log('📝 演示 5: 获取控制台消息');
    const consoleResult = await sendRequest('tools/call', {
      name: 'browser_console_messages',
      arguments: { level: 'info' }
    });

    if (consoleResult.result && consoleResult.result.content) {
      const content = consoleResult.result.content[0];
      if (content.text) {
        console.log('✓ 控制台消息:');
        console.log(content.text.substring(0, 300));
        console.log('...\n');
      }
    }

    // 演示 6: 获取网络请求
    console.log('🌐 演示 6: 获取网络请求');
    const networkResult = await sendRequest('tools/call', {
      name: 'browser_network_requests',
      arguments: { includeStatic: false }
    });

    if (networkResult.result && networkResult.result.content) {
      const content = networkResult.result.content[0];
      if (content.text) {
        console.log('✓ 网络请求:');
        console.log(content.text.substring(0, 400));
        console.log('...\n');
      }
    }

    console.log('🎬 演示完成！正在关闭浏览器...');
    await sendRequest('tools/call', {
      name: 'browser_close',
      arguments: {}
    });

    console.log('\n✅ 所有演示项目完成！');
    console.log('\n你可以修改这个脚本来尝试其他功能：');
    console.log('  - browser_click: 点击元素');
    console.log('  - browser_type: 输入文本');
    console.log('  - browser_take_screenshot: 截图');
    console.log('  - browser_tabs: 管理标签页');

  } catch (error) {
    console.error('\n❌ 演示出错:', error.message);
  } finally {
    setTimeout(() => {
      mcp.kill('SIGTERM');
    }, 1000);
  }
}

runDemo();

process.on('SIGINT', () => {
  console.log('\n\n中断演示...');
  mcp.kill();
  process.exit();
});
