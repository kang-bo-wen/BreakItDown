// scripts/watch-progress.ts
/**
 * 实时监控模板生成进度
 */

import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');

let lastCount = 0;

function checkProgress() {
  if (!fs.existsSync(templatesDir)) {
    console.log('❌ 模板目录不存在');
    return;
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  const currentCount = files.length;

  if (currentCount !== lastCount) {
    const progress = ((currentCount / 20) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(currentCount / 2)) + '░'.repeat(10 - Math.floor(currentCount / 2));

    console.clear();
    console.log('🚀 模板生成进度监控\n');
    console.log(`进度: [${bar}] ${currentCount}/20 (${progress}%)\n`);

    if (currentCount > lastCount) {
      const newFiles = files.slice(lastCount);
      console.log('✨ 新生成的模板:');
      newFiles.forEach(file => {
        const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
        const data = JSON.parse(content);
        console.log(`  ✓ ${data.displayName} (${data.category})`);
      });
    }

    lastCount = currentCount;

    if (currentCount === 20) {
      console.log('\n🎉 所有模板生成完成！');
      console.log('\n下一步: 运行 "npm run db:seed" 加载到数据库');
      process.exit(0);
    }
  }
}

console.log('⏳ 开始监控模板生成进度...\n');
console.log('按 Ctrl+C 停止监控\n');

// 每 5 秒检查一次
setInterval(checkProgress, 5000);
checkProgress();
