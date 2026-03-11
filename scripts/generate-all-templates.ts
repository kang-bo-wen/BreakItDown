// scripts/generate-all-templates.ts
/**
 * 批量生成所有 20 个模板
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateCompleteTemplate } from '../lib/template-generator';
import * as fs from 'fs';

// 20 大模板配置
const TEMPLATES = [
  // 【大国重器】
  {
    templateKey: 'ar-headset',
    displayName: '空间计算头显',
    category: '大国重器',
    keywords: ['ar headset', 'vr headset', '空间计算', 'AR头显', 'VR头显', '混合现实']
  },
  {
    templateKey: 'rocket-engine',
    displayName: '可回收液氧甲烷火箭发动机',
    category: '大国重器',
    keywords: ['rocket engine', '火箭发动机', '液氧甲烷', '可回收火箭']
  },
  {
    templateKey: 'robot-dog',
    displayName: '高动态四足机器狗',
    category: '大国重器',
    keywords: ['robot dog', '机器狗', '四足机器人', 'quadruped robot']
  },
  {
    templateKey: 'reconnaissance-drone',
    displayName: '军用级微型侦察无人机',
    category: '大国重器',
    keywords: ['drone', '无人机', '侦察无人机', 'reconnaissance drone']
  },
  {
    templateKey: 'ship-propulsion',
    displayName: '大型船舶电动吊舱推进器',
    category: '大国重器',
    keywords: ['ship propulsion', '船舶推进器', '吊舱推进', 'azimuth thruster']
  },

  // 【极客定制】
  {
    templateKey: 'mechanical-keyboard',
    displayName: '客制化机械键盘',
    category: '极客定制',
    keywords: ['mechanical keyboard', '机械键盘', '客制化键盘', '定制键盘', 'custom keyboard']
  },
  {
    templateKey: 'espresso-machine',
    displayName: '发烧级全自动意式咖啡机',
    category: '极客定制',
    keywords: ['espresso machine', '咖啡机', '意式咖啡机', 'coffee machine']
  },
  {
    templateKey: 'mirrorless-camera',
    displayName: '模块化微单相机',
    category: '极客定制',
    keywords: ['mirrorless camera', '微单相机', '无反相机', 'camera']
  },
  {
    templateKey: 'carbon-bike',
    displayName: '碳纤维公路自行车',
    category: '极客定制',
    keywords: ['carbon bike', '碳纤维自行车', '公路自行车', 'road bike']
  },
  {
    templateKey: 'noise-cancelling-headphones',
    displayName: '全景声降噪头戴式耳机',
    category: '极客定制',
    keywords: ['headphones', '降噪耳机', '头戴式耳机', 'noise cancelling']
  },

  // 【生活黑科技】
  {
    templateKey: 'smart-mattress',
    displayName: '智能仿生睡眠床垫',
    category: '生活黑科技',
    keywords: ['smart mattress', '智能床垫', '睡眠床垫', 'sleep mattress']
  },
  {
    templateKey: 'bladeless-fan',
    displayName: '高速无叶吹风机',
    category: '生活黑科技',
    keywords: ['bladeless fan', '无叶吹风机', '吹风机', 'hair dryer']
  },
  {
    templateKey: 'pet-feeder',
    displayName: 'AI视觉智能宠物喂食器',
    category: '生活黑科技',
    keywords: ['pet feeder', '宠物喂食器', '智能喂食器', 'automatic feeder']
  },
  {
    templateKey: 'gaming-chair',
    displayName: '电竞级人体工学椅',
    category: '生活黑科技',
    keywords: ['gaming chair', '电竞椅', '人体工学椅', 'ergonomic chair']
  },
  {
    templateKey: 'ar-ski-goggles',
    displayName: 'AR全息滑雪护目镜',
    category: '生活黑科技',
    keywords: ['ski goggles', '滑雪护目镜', 'AR护目镜', 'smart goggles']
  },

  // 【绿色新消费】
  {
    templateKey: 'lab-diamond-ring',
    displayName: '培育钻石订婚戒指',
    category: '绿色新消费',
    keywords: ['lab diamond', '培育钻石', '人造钻石', 'synthetic diamond', '订婚戒指']
  },
  {
    templateKey: 'plant-based-burger',
    displayName: '植物基人造肉汉堡',
    category: '绿色新消费',
    keywords: ['plant based burger', '人造肉', '植物肉', 'vegan burger', '素食汉堡']
  },
  {
    templateKey: 'eco-sneakers',
    displayName: '环保降解跑鞋',
    category: '绿色新消费',
    keywords: ['eco sneakers', '环保跑鞋', '可降解鞋', 'sustainable shoes']
  },
  {
    templateKey: 'blind-box-toy',
    displayName: '限量版潮玩盲盒公仔',
    category: '绿色新消费',
    keywords: ['blind box', '盲盒', '潮玩', 'collectible toy', '手办']
  },
  {
    templateKey: 'smart-stroller',
    displayName: '智能恒温婴儿车',
    category: '绿色新消费',
    keywords: ['smart stroller', '智能婴儿车', '婴儿推车', 'baby stroller']
  }
];

async function main() {
  console.log('🚀 开始批量生成 20 个模板...\n');

  const outputDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TEMPLATES.length; i++) {
    const config = TEMPLATES[i];
    console.log(`\n[${i + 1}/${TEMPLATES.length}] 生成: ${config.displayName}`);
    console.log(`  分类: ${config.category}`);

    try {
      const template = await generateCompleteTemplate(config);

      const outputPath = path.join(outputDir, `${config.templateKey}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), 'utf-8');

      console.log(`  ✅ 成功保存到: ${config.templateKey}.json`);
      successCount++;

      // 添加延迟避免 API 限流
      if (i < TEMPLATES.length - 1) {
        console.log('  ⏳ 等待 3 秒...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`  ❌ 失败:`, error);
      failCount++;
    }
  }

  console.log(`\n\n📊 生成统计:`);
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log(`  📁 输出目录: ${outputDir}`);

  console.log(`\n💡 下一步: 运行 "npm run db:seed" 将模板加载到数据库`);
}

main().catch(console.error);
