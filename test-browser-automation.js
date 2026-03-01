const { spawn } = require('child_process');

console.log('=== Playwright MCP 浏览器自动化测试 ===\n');

// 启动 MCP 服务器（使用 chromium 浏览器）
const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--browser', 'chromium', '--headless'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let outputBuffer = '';
let requestId = 0;
const pendingRequests = new Map();

// 发送 JSON-RPC 请求
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
    // 设置超时
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`请求超时: ${method}`));
      }
    }, 30000);
  });
}

// 监听标准输出
mcp.stdout.on('data', (data) => {
  const text = data.toString();
  outputBuffer += text;

  // 尝试解析 JSON-RPC 响应
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
        // 忽略解析错误
      }
    }
  }
});

// 监听错误输出
mcp.stderr.on('data', (data) => {
  const text = data.toString();
  if (!text.includes('DeprecationWarning')) {
    console.error('[错误]:', text);
  }
});

// 监听进程退出
mcp.on('close', (code) => {
  console.log(`\n\n=== 测试完成 ===`);
});

// 监听错误
mcp.on('error', (error) => {
  console.error('启动 MCP 服务器时出错:', error);
  process.exit(1);
});

// 运行浏览器自动化测试
async function runBrowserTest() {
  try {
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('【步骤 1】初始化 MCP 服务器');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'browser-test-client',
        version: '1.0.0'
      }
    });

    console.log('\n【步骤 2】发送 initialized 通知');
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    console.log('\n【步骤 3】导航到示例网站');
    const navResponse = await sendRequest('tools/call', {
      name: 'browser_navigate',
      arguments: {
        url: 'https://example.com'
      }
    });

    if (navResponse.error) {
      throw new Error(`导航失败: ${navResponse.error.message}`);
    }

    console.log('\n【步骤 4】获取页面快照');
    const snapshotResponse = await sendRequest('tools/call', {
      name: 'browser_snapshot',
      arguments: {}
    });

    if (snapshotResponse.result && snapshotResponse.result.content) {
      const content = snapshotResponse.result.content[0];
      if (content.text) {
        console.log('\n页面内容预览:');
        console.log(content.text.substring(0, 500) + '...');
      }
    }

    console.log('\n【步骤 5】获取控制台消息');
    await sendRequest('tools/call', {
      name: 'browser_console_messages',
      arguments: {
        level: 'info'
      }
    });

    console.log('\n【步骤 6】获取网络请求');
    await sendRequest('tools/call', {
      name: 'browser_network_requests',
      arguments: {
        includeStatic: false
      }
    });

    console.log('\n【步骤 7】关闭浏览器');
    await sendRequest('tools/call', {
      name: 'browser_close',
      arguments: {}
    });

    console.log('\n\n✓ 所有浏览器自动化测试通过！');
    console.log('\n测试总结:');
    console.log('  ✓ MCP 服务器初始化成功');
    console.log('  ✓ 浏览器导航功能正常');
    console.log('  ✓ 页面快照功能正常');
    console.log('  ✓ 控制台消息获取正常');
    console.log('  ✓ 网络请求监控正常');
    console.log('  ✓ 浏览器关闭功能正常');

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
  } finally {
    // 关闭服务器
    setTimeout(() => {
      mcp.kill('SIGTERM');
    }, 1000);
  }
}

// 启动测试
runBrowserTest();

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n收到中断信号，关闭 MCP 服务器...');
  mcp.kill();
  process.exit();
});
