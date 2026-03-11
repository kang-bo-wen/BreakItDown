#!/usr/bin/env node

/**
 * 网站健康检查脚本
 * 检查服务器状态、登录功能和页面加载速度
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      const loadTime = Date.now() - startTime;
      const success = res.statusCode === expectedStatus;

      resolve({
        path,
        status: res.statusCode,
        loadTime,
        success,
      });
    });

    req.on('error', (error) => {
      reject({ path, error: error.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({ path, error: 'Timeout' });
    });
  });
}

async function runHealthCheck() {
  log('\n🔍 开始网站健康检查...\n', colors.blue);

  const checks = [
    { path: '/', name: '首页' },
    { path: '/login', name: '登录页面' },
    { path: '/register', name: '注册页面' },
    { path: '/api/auth/session', name: 'Session API' },
    { path: '/api/env-check', name: '环境变量检查' },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const result = await checkEndpoint(check.path);
      if (result.success) {
        log(`✅ ${check.name}: ${result.status} (${result.loadTime}ms)`, colors.green);
      } else {
        log(`❌ ${check.name}: ${result.status} (${result.loadTime}ms)`, colors.red);
        allPassed = false;
      }
    } catch (error) {
      log(`❌ ${check.name}: ${error.error}`, colors.red);
      allPassed = false;
    }
  }

  log('\n📊 检查结果:', colors.blue);
  if (allPassed) {
    log('✅ 所有检查通过！网站运行正常。', colors.green);
  } else {
    log('❌ 部分检查失败，请查看上面的详细信息。', colors.red);
  }

  log('\n📝 测试账号信息:', colors.blue);
  log('   邮箱: 2506639957@qq.com', colors.yellow);
  log('   密码: test123', colors.yellow);

  log('\n🚀 下一步:', colors.blue);
  log('   1. 访问 http://localhost:3000', colors.yellow);
  log('   2. 使用上面的测试账号登录', colors.yellow);
  log('   3. 测试拆解功能', colors.yellow);

  process.exit(allPassed ? 0 : 1);
}

runHealthCheck();
