// scripts/generate-new-templates.ts
/**
 * 新生态模板批量生成脚本
 * 运行: npx tsx scripts/generate-new-templates.ts
 * 可选: npx tsx scripts/generate-new-templates.ts --key <anti-aging-cream> 只生成单个
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateCompleteTemplate } from '../lib/template-generator';
import * as fs from 'fs';

// ─── 40 大模板清单 ────────────────────────────────────────────────────────────
const NEW_TEMPLATES = [
  // 【国民级消费电子】
  {
    templateKey: 'titanium-flagship-phone',
    displayName: '某果最新款钛金属旗舰手机',
    category: '国民级消费电子',
    icon: '📱',
    keywords: ['苹果手机', '钛金属手机', '旗舰手机', '苹果旗舰', 'titanium phone', 'iPhone', 'iphone', '苹果', '手机'],
  },
  {
    templateKey: 'anc-headphones',
    displayName: '某为头戴式降噪耳机',
    category: '国民级消费电子',
    icon: '🎧',
    keywords: ['华为耳机', '降噪耳机', '头戴耳机', 'ANC耳机', 'noise cancelling headphones', '华为', '降噪'],
  },
  {
    templateKey: 'foldable-hinge',
    displayName: '旗舰级折叠屏铰链',
    category: '国民级消费电子',
    icon: '📲',
    keywords: ['折叠屏', '折叠手机铰链', '折叠屏铰链', 'foldable hinge', '铰链', '折叠'],
  },
  {
    templateKey: 'full-frame-mirrorless',
    displayName: '全画幅微单相机',
    category: '国民级消费电子',
    icon: '📷',
    keywords: ['全画幅相机', '微单相机', '全画幅微单', 'full frame mirrorless', '相机', '微单'],
  },
  {
    templateKey: 'smart-desk-lamp',
    displayName: '智能护眼台灯',
    category: '国民级消费电子',
    icon: '💡',
    keywords: ['护眼台灯', '智能台灯', 'smart desk lamp', '台灯', '护眼灯'],
  },

  // 【海陆空大交通】
  {
    templateKey: 'ev-chassis',
    displayName: '新能源汽车线控底盘',
    category: '海陆空大交通',
    icon: '🚗',
    keywords: ['线控底盘', '新能源底盘', 'EV chassis', '电动车底盘', '线控', '底盘'],
  },
  {
    templateKey: 'high-speed-rail-bogie',
    displayName: '复兴号高铁转向架',
    category: '海陆空大交通',
    icon: '🚄',
    keywords: ['高铁转向架', '复兴号', '转向架', 'bogie', '高铁', '动车'],
  },
  {
    templateKey: 'c919-engine',
    displayName: '大型客机C919涡扇发动机',
    category: '海陆空大交通',
    icon: '✈️',
    keywords: ['C919发动机', '涡扇发动机', 'C919', '飞机发动机', 'turbofan engine', '航空发动机'],
  },
  {
    templateKey: 'nuclear-icebreaker-propulsion',
    displayName: '核动力破冰船推进器',
    category: '海陆空大交通',
    icon: '🚢',
    keywords: ['破冰船', '核动力推进', '破冰船推进器', 'nuclear icebreaker', '推进器'],
  },
  {
    templateKey: 'carbon-commuter-bike',
    displayName: '城市碳纤维通勤自行车',
    category: '海陆空大交通',
    icon: '🚲',
    keywords: ['碳纤维自行车', '通勤自行车', 'carbon fiber bike', '碳纤维单车', '自行车'],
  },

  // 【现代建筑与空间】
  {
    templateKey: 'seismic-damper',
    displayName: '超高层抗震阻尼器系统',
    category: '现代建筑与空间',
    icon: '🏗️',
    keywords: ['抗震阻尼器', '阻尼器', 'seismic damper', '减震器', '抗震'],
  },
  {
    templateKey: 'modular-housing',
    displayName: '模块化装配式低碳住宅',
    category: '现代建筑与空间',
    icon: '🏠',
    keywords: ['装配式住宅', '模块化建筑', 'modular housing', '低碳住宅', '装配式'],
  },
  {
    templateKey: 'tensile-roof',
    displayName: '大型体育馆索膜结构',
    category: '现代建筑与空间',
    icon: '🏟️',
    keywords: ['索膜结构', '体育馆屋顶', 'tensile membrane structure', '膜结构', '索膜'],
  },
  {
    templateKey: 'subsea-tunnel-seal',
    displayName: '深海沉管隧道密封段',
    category: '现代建筑与空间',
    icon: '🌊',
    keywords: ['沉管隧道', '海底隧道密封', 'immersed tunnel', '隧道密封', '沉管'],
  },
  {
    templateKey: 'passive-glass-curtain',
    displayName: '被动式恒温玻璃幕墙',
    category: '现代建筑与空间',
    icon: '🪟',
    keywords: ['玻璃幕墙', '被动式幕墙', 'passive glass curtain wall', '恒温幕墙', '幕墙'],
  },

  // 【航天军工与大国重器】
  {
    templateKey: 'leo-satellite',
    displayName: '低轨宽带通信卫星',
    category: '航天军工与大国重器',
    icon: '🛰️',
    keywords: ['通信卫星', '低轨卫星', 'LEO satellite', '宽带卫星', '卫星'],
  },
  {
    templateKey: 'aesa-radar',
    displayName: '有源相控阵雷达天线阵列',
    category: '航天军工与大国重器',
    icon: '📡',
    keywords: ['相控阵雷达', 'AESA雷达', 'phased array radar', '有源相控阵', '雷达'],
  },
  {
    templateKey: 'space-station-arm',
    displayName: '空间站核心舱机械臂',
    category: '航天军工与大国重器',
    icon: '🦾',
    keywords: ['空间站机械臂', '机械臂', 'space station robotic arm', '天宫机械臂', '航天机械臂'],
  },
  {
    templateKey: 'deep-space-rover',
    displayName: '深空探测巡视器',
    category: '航天军工与大国重器',
    icon: '🌕',
    keywords: ['月球车', '火星车', '巡视器', 'space rover', '深空探测', '祝融号', '玉兔'],
  },
  {
    templateKey: 'quadruped-robot',
    displayName: '高动态四足机器狗',
    category: '航天军工与大国重器',
    icon: '🤖',
    keywords: ['机器狗', '四足机器人', 'quadruped robot', '机械狗', '仿生机器人'],
  },

  // 【半导体与微电子】
  {
    templateKey: '3nm-soc',
    displayName: '3nm旗舰智能手机核心芯片',
    category: '半导体与微电子',
    icon: '💾',
    keywords: ['3nm芯片', '手机芯片', 'SoC', '旗舰芯片', '3nm', '芯片', 'A17', '骁龙8'],
  },
  {
    templateKey: 'hbm3e-memory',
    displayName: '高带宽存储器HBM3e',
    category: '半导体与微电子',
    icon: '🧠',
    keywords: ['HBM', 'HBM3e', '高带宽存储器', 'high bandwidth memory', '显存', 'HBM内存'],
  },
  {
    templateKey: 'solid-state-lidar',
    displayName: '固态激光雷达',
    category: '半导体与微电子',
    icon: '🔭',
    keywords: ['固态激光雷达', 'LiDAR', '激光雷达', 'solid state lidar', '雷达传感器'],
  },
  {
    templateKey: 'drone-gimbal',
    displayName: '折叠无人机三轴机械增稳云台',
    category: '半导体与微电子',
    icon: '🚁',
    keywords: ['无人机云台', '三轴云台', 'gimbal', '增稳云台', '大疆云台', '云台'],
  },

  // 【服饰科技与纺织】
  {
    templateKey: 'hardshell-jacket',
    displayName: '极寒保暖三合一冲锋衣',
    category: '服饰科技与纺织',
    icon: '🧥',
    keywords: ['冲锋衣', '三合一冲锋衣', 'hardshell jacket', '户外冲锋衣', '防水冲锋衣'],
  },
  {
    templateKey: 'graphene-thermal-wear',
    displayName: '石墨烯发热保暖内衣',
    category: '服饰科技与纺织',
    icon: '🔥',
    keywords: ['石墨烯内衣', '发热内衣', 'graphene thermal wear', '石墨烯保暖', '石墨烯'],
  },
  {
    templateKey: 'carbon-plate-shoe',
    displayName: '全掌碳板竞速跑鞋',
    category: '服饰科技与纺织',
    icon: '👟',
    keywords: ['碳板跑鞋', '竞速跑鞋', 'carbon plate running shoe', '马拉松跑鞋', '碳板鞋'],
  },
  {
    templateKey: 'seamless-sportswear',
    displayName: '无缝针织运动内衣',
    category: '服饰科技与纺织',
    icon: '👙',
    keywords: ['无缝内衣', '运动内衣', 'seamless sportswear', '针织运动内衣', '无缝针织'],
  },
  {
    templateKey: 'spacesuit-life-support',
    displayName: '宇航服生命保障背包',
    category: '服饰科技与纺织',
    icon: '👨‍🚀',
    keywords: ['宇航服', '生命保障系统', 'spacesuit life support', 'EMU backpack', '航天服'],
  },

  // 【诱惑系新餐饮】
  {
    templateKey: 'lava-cheese-croissant',
    displayName: '爆浆熔岩芝士牛角包',
    category: '诱惑系新餐饮',
    icon: '🥐',
    keywords: ['牛角包', '芝士牛角包', '爆浆牛角包', 'cheese croissant', '熔岩芝士'],
  },
  {
    templateKey: 'grape-boba-tea',
    displayName: '多肉葡萄波波冰',
    category: '诱惑系新餐饮',
    icon: '🍇',
    keywords: ['波波冰', '多肉葡萄', '葡萄奶茶', 'boba tea', '珍珠奶茶', '波波'],
  },
  {
    templateKey: 'nitrogen-packed-chips',
    displayName: '原切薯片充氮包装系统',
    category: '诱惑系新餐饮',
    icon: '🥔',
    keywords: ['薯片', '充氮包装', 'nitrogen packed chips', '原切薯片', '薯片包装'],
  },
  {
    templateKey: 'freeze-dried-coffee',
    displayName: '冻干即溶咖啡胶囊',
    category: '诱惑系新餐饮',
    icon: '☕',
    keywords: ['冻干咖啡', '咖啡胶囊', 'freeze dried coffee', '即溶咖啡', '冻干'],
  },
  {
    templateKey: 'protein-meal-shake',
    displayName: '高蛋白代餐奶昔粉',
    category: '诱惑系新餐饮',
    icon: '🥤',
    keywords: ['代餐奶昔', '蛋白粉', 'protein shake', '高蛋白代餐', '代餐粉'],
  },

  // 【高端美妆与新能源材料】
  {
    templateKey: 'anti-aging-cream',
    displayName: '微囊精华抗老面霜',
    category: '高端美妆与新能源材料',
    icon: '🧴',
    keywords: ['微囊面霜', '抗老面霜', '精华面霜', '微囊精华', 'anti-aging cream', '抗衰老面霜', '微胶囊护肤品', '面霜'],
  },
  {
    templateKey: 'cushion-foundation',
    displayName: '多色气垫粉底液盒',
    category: '高端美妆与新能源材料',
    icon: '💄',
    keywords: ['气垫粉底', '气垫BB', 'cushion foundation', '气垫', '粉底液'],
  },
  {
    templateKey: 'matte-lipstick',
    displayName: '高显色哑光口红',
    category: '高端美妆与新能源材料',
    icon: '💋',
    keywords: ['哑光口红', '口红', 'matte lipstick', '高显色口红', '唇膏'],
  },
  {
    templateKey: 'high-nickel-battery',
    displayName: '高镍三元锂电池电芯',
    category: '高端美妆与新能源材料',
    icon: '🔋',
    keywords: ['三元锂电池', '高镍电池', 'NMC battery', '锂电池', '电芯', '动力电池'],
  },
  {
    templateKey: 'hydrogen-fuel-cell-mea',
    displayName: '氢燃料电池膜电极组件',
    category: '高端美妆与新能源材料',
    icon: '⚡',
    keywords: ['燃料电池', '膜电极', 'MEA', 'hydrogen fuel cell', '氢燃料电池', '质子交换膜'],
  },
];

// ─── 主函数 ───────────────────────────────────────────────────────────────────
async function main() {
  const outputDir = path.join(process.cwd(), 'prisma', 'seeds', 'templates');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // 支持 --key 参数只生成单个模板
  const keyArg = process.argv.indexOf('--key');
  const targetKey = keyArg !== -1 ? process.argv[keyArg + 1] : null;
  const targets = targetKey
    ? NEW_TEMPLATES.filter(t => t.templateKey === targetKey)
    : NEW_TEMPLATES;

  if (targets.length === 0) {
    console.error(`❌ 未找到 templateKey="${targetKey}" 的模板`);
    process.exit(1);
  }

  console.log(`🚀 开始生成 ${targets.length} 个模板...\n`);

  let success = 0;
  let failed = 0;

  for (const config of targets) {
    const outputPath = path.join(outputDir, `${config.templateKey}.json`);

    // 已存在则跳过（除非加 --force）
    if (fs.existsSync(outputPath) && !process.argv.includes('--force')) {
      console.log(`⏭️  跳过（已存在）: ${config.displayName}`);
      continue;
    }

    try {
      console.log(`\n📦 生成中: ${config.displayName}`);
      const template = await generateCompleteTemplate({
        templateKey: config.templateKey,
        displayName: config.displayName,
        category: config.category,
        keywords: config.keywords,
      });

      // 补充 icon 到 identificationResult
      template.identificationResult.icon = config.icon;

      fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), 'utf-8');
      console.log(`✅ 已保存: ${outputPath}`);
      success++;
    } catch (err) {
      console.error(`❌ 失败: ${config.displayName}`, err);
      failed++;
    }
  }

  console.log(`\n🎉 完成！成功: ${success}，失败: ${failed}`);
  console.log('\n下一步：运行 npx prisma db seed 将模板写入数据库');
}

main().catch(console.error);
