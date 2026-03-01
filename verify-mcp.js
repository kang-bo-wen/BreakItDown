#!/usr/bin/env node

/**
 * Playwright MCP 快速验证脚本
 * 用于快速检查 MCP 服务器是否正常工作
 */

const { spawn } = require('child_process');

console.log('🔍 Playwright MCP 快速验证\n');

const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--browser', 'chromium', '--headless'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let outputBuffer = '';
let requestId = 0;
const pendingRequests = new Map();
let testsPassed = 0;
let testsFailed = 0;

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
    }, 15000);
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
  if (!text.includes('DeprecationWarning') && !text.includes('ExperimentalWarning')) {
    console.error('❌ 错误:', text);
  }
});

mcp.on('close', () => {
  console.log('\n' + '='.repeat(50));
  console.log(`测试结果: ${testsPassed} 通过, ${testsFailed} 失败`);
  if (testsFailed === 0) {
    console.log('✅ Playwright MCP 工作正常！');
    process.exit(0);
  } else {
    console.log('❌ 发现问题，请检查配置');
    process.exit(1);
  }
});

async function runQuickTest() {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试 1: 初始化
    process.stdout.write('测试 1: 初始化 MCP 服务器... ');
    try {
      await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'quick-test', version: '1.0.0' }
      });
      console.log('✓');
      testsPassed++;
    } catch (e) {
      console.log('✗');
      testsFailed++;
    }

    // 发送 initialized 通知
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    // 测试 2: 列出工具
    process.stdout.write('测试 2: 列出可用工具... ');
    try {
      const toolsResponse = await sendRequest('tools/list');
      if (toolsResponse.result && toolsResponse.result.tools && toolsResponse.result.tools.length > 0) {
        console.log(`✓ (${toolsResponse.result.tools.length} 个工具)`);
        testsPassed++;
      } else {
        console.log('✗ (无工具)');
        testsFailed++;
      }
    } catch (e) {
      console.log('✗');
      testsFailed++;
    }

    // 测试 3: 导航
    process.stdout.write('测试 3: 浏览器导航... ');
    try {
      const navResponse = await sendRequest('tools/call', {
        name: 'browser_navigate',
        arguments: { url: 'https://example.com' }
      });
      if (!navResponse.error) {
        console.log('✓');
        testsPassed++;
      } else {
        console.log('✗');
        testsFailed++;
      }
    } catch (e) {
      console.log('✗');
      testsFailed++;
    }

    // 测试 4: 页面快照
    process.stdout.write('测试 4: 获取页面快照... ');
    try {
      const snapshotResponse = await sendRequest('tools/call', {
        name: 'browser_snapshot',
        arguments: {}
      });
      if (!snapshotResponse.error && snapshotResponse.result) {
        console.log('✓');
        testsPassed++;
      } else {
        console.log('✗');
        testsFailed++;
      }
    } catch (e) {
      console.log('✗');
      testsFailed++;
    }

    // 测试 5: 关闭浏览器
    process.stdout.write('测试 5: 关闭浏览器... ');
    try {
      await sendRequest('tools/call', {
        name: 'browser_close',
        arguments: {}
      });
      console.log('✓');
      testsPassed++;
    } catch (e) {
      console.log('✗');
      testsFailed++;
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    testsFailed++;
  } finally {
    setTimeout(() => {
      mcp.kill('SIGTERM');
    }, 500);
  }
}

runQuickTest();

process.on('SIGINT', () => {
  mcp.kill();
  process.exit(1);
});
