// scripts/test-template-interceptor.ts
/**
 * 测试模板拦截器
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { detectTemplateMatch } from '../lib/template-interceptor';

async function test() {
  console.log('🧪 测试模板拦截器\n');

  const testCases = [
    '机械键盘',
    '客制化键盘',
    'mechanical keyboard',
    '键盘',
    '手机', // 应该不匹配
    '笔记本电脑', // 应该不匹配
  ];

  for (const input of testCases) {
    console.log(`\n测试输入: "${input}"`);
    const match = await detectTemplateMatch(input);

    if (match) {
      console.log(`  ✅ 命中模板: ${match.template.displayName}`);
      console.log(`  📊 置信度: ${match.confidence}`);
      console.log(`  🏷️  分类: ${match.template.category}`);
    } else {
      console.log(`  ❌ 未命中模板`);
    }
  }

  console.log('\n✅ 测试完成');
  process.exit(0);
}

test().catch(console.error);
