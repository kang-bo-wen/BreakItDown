const { spawn } = require('child_process');

console.log('=== Playwright MCP 完整功能测试 ===\n');

// 启动 MCP 服务器
const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--headless'], {
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

  console.log(`\n>>> 发送请求 [${method}]:`, JSON.stringify(params, null, 2));
  mcp.stdin.write(JSON.stringify(request) + '\n');

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject, method });
  });
}

// 监听标准输出
mcp.stdout.on('data', (data) => {
  const text = data.toString();
  outputBuffer += text;

  // 尝试解析 JSON-RPC 响应
  const lines = outputBuffer.split('\n');
  outputBuffer = lines.pop() || ''; // 保留最后一个不完整的行

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log(`\n<<< 收到响应 [ID: ${response.id}]:`, JSON.stringify(response, null, 2));

        if (response.id && pendingRequests.has(response.id)) {
          const { resolve } = pendingRequests.get(response.id);
          pendingRequests.delete(response.id);
          resolve(response);
        }
      } catch (e) {
        console.error('解析 JSON 失败:', line);
      }
    }
  }
});

// 监听错误输出
mcp.stderr.on('data', (data) => {
  console.error('[错误]:', data.toString());
});

// 监听进程退出
mcp.on('close', (code) => {
  console.log(`\n\n=== 测试完成 ===`);
  console.log(`进程退出码: ${code}`);
});

// 监听错误
mcp.on('error', (error) => {
  console.error('启动 MCP 服务器时出错:', error);
  process.exit(1);
});

// 运行测试序列
async function runTests() {
  try {
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. 初始化
    console.log('\n【测试 1】初始化 MCP 服务器');
    const initResponse = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
    console.log('✓ 初始化成功');

    // 2. 发送 initialized 通知
    console.log('\n【测试 2】发送 initialized 通知');
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');
    console.log('✓ 通知已发送');

    // 3. 列出可用工具
    console.log('\n【测试 3】列出可用工具');
    const toolsResponse = await sendRequest('tools/list');
    console.log('✓ 工具列表获取成功');
    if (toolsResponse.result && toolsResponse.result.tools) {
      console.log(`\n可用工具数量: ${toolsResponse.result.tools.length}`);
      toolsResponse.result.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}: ${tool.description || '无描述'}`);
      });
    }

    // 4. 测试完成
    console.log('\n\n✓ 所有测试通过！');

  } catch (error) {
    console.error('\n✗ 测试失败:', error);
  } finally {
    // 关闭服务器
    setTimeout(() => {
      console.log('\n关闭 MCP 服务器...');
      mcp.kill('SIGTERM');
    }, 1000);
  }
}

// 启动测试
runTests();

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n收到中断信号，关闭 MCP 服务器...');
  mcp.kill();
  process.exit();
});
