// scripts/check-templates.ts
/**
 * 检查已生成的模板数量和状态
 */

import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');

console.log('📊 模板生成进度检查\n');

if (!fs.existsSync(templatesDir)) {
  console.log('❌ 模板目录不存在');
  process.exit(1);
}

const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

console.log(`✅ 已生成模板数量: ${files.length} / 20\n`);

if (files.length > 0) {
  console.log('📁 已生成的模板:\n');

  const templates = files.map(file => {
    const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
    const data = JSON.parse(content);
    return {
      file,
      displayName: data.displayName,
      category: data.category,
      size: (content.length / 1024).toFixed(2) + ' KB'
    };
  });

  // 按分类分组
  const categories = ['大国重器', '极客定制', '生活黑科技', '绿色新消费'];

  categories.forEach(category => {
    const categoryTemplates = templates.filter(t => t.category === category);
    if (categoryTemplates.length > 0) {
      console.log(`\n【${category}】 (${categoryTemplates.length}/5)`);
      categoryTemplates.forEach(t => {
        console.log(`  ✓ ${t.displayName} (${t.size})`);
      });
    }
  });
}

console.log(`\n\n💡 提示:`);
console.log(`  - 运行 "npm run db:seed" 将模板加载到数据库`);
console.log(`  - 访问 http://localhost:8000/test-template.html 测试拦截器`);
