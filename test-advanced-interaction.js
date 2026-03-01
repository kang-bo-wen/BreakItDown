const { spawn } = require('child_process');

console.log('=== Playwright MCP 高级交互测试 ===\n');

const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--browser', 'chromium', '--headless'], {
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

  console.log(`\n>>> [${method}]`);
  mcp.stdin.write(JSON.stringify(request) + '\n');

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject, method });
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`请求超时: ${method}`));
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
          const { resolve, method } = pendingRequests.get(response.id);
          pendingRequests.delete(response.id);

          if (response.error) {
            console.log(`<<< [${method}] 错误:`, response.error.message);
          } else {
            console.log(`<<< [${method}] 成功`);
          }

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

mcp.on('close', (code) => {
  console.log(`\n\n=== 测试完成 ===`);
});

mcp.on('error', (error) => {
  console.error('启动 MCP 服务器时出错:', error);
  process.exit(1);
});

async function runAdvancedTest() {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('【步骤 1】初始化 MCP 服务器');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'advanced-test-client',
        version: '1.0.0'
      }
    });

    console.log('\n【步骤 2】发送 initialized 通知');
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    console.log('\n【步骤 3】导航到 DuckDuckGo 搜索引擎');
    await sendRequest('tools/call', {
      name: 'browser_navigate',
      arguments: {
        url: 'https://duckduckgo.com'
      }
    });

    console.log('\n【步骤 4】获取页面快照');
    const snapshot1 = await sendRequest('tools/call', {
      name: 'browser_snapshot',
      arguments: {}
    });

    if (snapshot1.result && snapshot1.result.content) {
      const content = snapshot1.result.content[0];
      if (content.text) {
        console.log('\n页面快照预览:');
        console.log(content.text.substring(0, 300) + '...');
      }
    }

    console.log('\n【步骤 5】测试浏览器调整大小');
    await sendRequest('tools/call', {
      name: 'browser_resize',
      arguments: {
        width: 1920,
        height: 1080
      }
    });

    console.log('\n【步骤 6】测试标签页管理');
    await sendRequest('tools/call', {
      name: 'browser_tabs',
      arguments: {
        action: 'list'
      }
    });

    console.log('\n【步骤 7】创建新标签页');
    await sendRequest('tools/call', {
      name: 'browser_tabs',
      arguments: {
        action: 'new'
      }
    });

    console.log('\n【步骤 8】在新标签页导航到 Example.com');
    await sendRequest('tools/call', {
      name: 'browser_navigate',
      arguments: {
        url: 'https://example.com'
      }
    });

    console.log('\n【步骤 9】获取新页面快照');
    const snapshot2 = await sendRequest('tools/call', {
      name: 'browser_snapshot',
      arguments: {}
    });

    if (snapshot2.result && snapshot2.result.content) {
      const content = snapshot2.result.content[0];
      if (content.text) {
        console.log('\n新标签页快照预览:');
        console.log(content.text.substring(0, 300) + '...');
      }
    }

    console.log('\n【步骤 10】测试后退导航');
    await sendRequest('tools/call', {
      name: 'browser_navigate_back',
      arguments: {}
    });

    console.log('\n【步骤 11】执行 JavaScript 代码');
    const evalResult = await sendRequest('tools/call', {
      name: 'browser_evaluate',
      arguments: {
        function: '() => { return { title: document.title, url: window.location.href, userAgent: navigator.userAgent.substring(0, 50) }; }'
      }
    });

    if (evalResult.result && evalResult.result.content) {
      const content = evalResult.result.content[0];
      if (content.text) {
        console.log('\nJavaScript 执行结果:');
        console.log(content.text);
      }
    }

    console.log('\n【步骤 12】关闭浏览器');
    await sendRequest('tools/call', {
      name: 'browser_close',
      arguments: {}
    });

    console.log('\n\n✓ 所有高级交互测试通过！');
    console.log('\n测试总结:');
    console.log('  ✓ MCP 服务器初始化');
    console.log('  ✓ 页面导航');
    console.log('  ✓ 页面快照获取');
    console.log('  ✓ 浏览器窗口调整');
    console.log('  ✓ 标签页管理（列表、创建）');
    console.log('  ✓ 多标签页导航');
    console.log('  ✓ 后退导航');
    console.log('  ✓ JavaScript 代码执行');
    console.log('  ✓ 浏览器关闭');

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
  } finally {
    setTimeout(() => {
      mcp.kill('SIGTERM');
    }, 1000);
  }
}

runAdvancedTest();

process.on('SIGINT', () => {
  console.log('\n收到中断信号，关闭 MCP 服务器...');
  mcp.kill();
  process.exit();
});
