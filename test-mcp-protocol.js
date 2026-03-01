const { spawn } = require('child_process');

console.log('启动 Playwright MCP 服务器协议测试...\n');

// 启动 MCP 服务器
const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--headless'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let outputBuffer = '';
let errorBuffer = '';

// 监听标准输出
mcp.stdout.on('data', (data) => {
  const text = data.toString();
  outputBuffer += text;
  console.log('[MCP 输出]:', text);

  // 尝试解析 JSON-RPC 响应
  try {
    const lines = outputBuffer.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const json = JSON.parse(line);
        console.log('[解析的 JSON]:', JSON.stringify(json, null, 2));
      }
    }
  } catch (e) {
    // 不是完整的 JSON，继续等待
  }
});

// 监听错误输出
mcp.stderr.on('data', (data) => {
  const text = data.toString();
  errorBuffer += text;
  console.error('[MCP 错误]:', text);
});

// 监听进程退出
mcp.on('close', (code) => {
  console.log(`\n进程退出，退出码: ${code}`);
  console.log('\n完整输出:');
  console.log(outputBuffer);
  console.log('\n完整错误:');
  console.log(errorBuffer);
});

// 监听错误
mcp.on('error', (error) => {
  console.error('启动 MCP 服务器时出错:', error);
});

// 发送初始化请求
setTimeout(() => {
  console.log('\n发送初始化请求...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  mcp.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// 5秒后关闭
setTimeout(() => {
  console.log('\n关闭 MCP 服务器...');
  mcp.kill('SIGTERM');
}, 5000);

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n收到中断信号，关闭 MCP 服务器...');
  mcp.kill();
  process.exit();
});
