const { spawn } = require('child_process');
const readline = require('readline');

console.log('启动 Playwright MCP 服务器测试...\n');

// 启动 MCP 服务器
const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--headless'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';
let errorOutput = '';

// 监听标准输出
mcp.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('[MCP 输出]:', text.trim());
});

// 监听错误输出
mcp.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  console.error('[MCP 错误]:', text.trim());
});

// 监听进程退出
mcp.on('close', (code) => {
  console.log(`\n进程退出，退出码: ${code}`);

  if (code === 0) {
    console.log('✓ MCP 服务器测试成功！');
  } else {
    console.log('✗ MCP 服务器测试失败');
  }
});

// 监听错误
mcp.on('error', (error) => {
  console.error('启动 MCP 服务器时出错:', error);
});

// 5秒后发送退出信号
setTimeout(() => {
  console.log('\n发送退出信号...');
  mcp.kill('SIGTERM');
}, 5000);

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n收到中断信号，关闭 MCP 服务器...');
  mcp.kill();
  process.exit();
});
