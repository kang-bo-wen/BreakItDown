# 递归拆解测试指南

## 🧪 测试方法

### 方法 1: 在浏览器 Console 中测试（推荐）

打开浏览器开发者工具（F12），在 Console 中粘贴以下代码：

```javascript
// 递归拆解函数
async function deconstructRecursive(itemName, parentContext = null, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}🔍 正在拆解: ${itemName}`);

  try {
    const response = await fetch('/api/deconstruct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName, parentContext })
    });

    const data = await response.json();
    console.log(`${indent}✅ 找到 ${data.parts.length} 个组成部分`);

    for (const part of data.parts) {
      const partIndent = '  '.repeat(depth + 1);

      if (part.is_raw_material) {
        console.log(`${partIndent}🌿 ${part.name} (原材料) - ${part.description}`);
      } else {
        console.log(`${partIndent}📦 ${part.name} - ${part.description}`);
        // 递归拆解
        await deconstructRecursive(part.name, itemName, depth + 1);
      }
    }
  } catch (error) {
    console.error(`${indent}❌ 错误:`, error.message);
  }
}

// 开始测试
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     Entropy Reverse - 递归拆解测试                    ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

deconstructRecursive('智能手机');
```

### 方法 2: 使用 Node.js 运行测试脚本

在项目根目录打开新终端，运行：

```bash
node test-recursive-deconstruct.js
```

## 📊 测试不同物体

修改测试脚本中的物体名称来测试不同的拆解：

```javascript
// 测试智能手机
deconstructRecursive('智能手机');

// 测试咖啡杯
deconstructRecursive('咖啡杯');

// 测试汽车
deconstructRecursive('汽车');

// 测试笔记本电脑
deconstructRecursive('笔记本电脑');
```

## 🎯 预期结果示例

```
🔍 正在拆解: 智能手机
✅ 找到 5 个组成部分
  📦 屏幕 - 显示组件
    🔍 正在拆解: 屏幕
    ✅ 找到 3 个组成部分
      📦 玻璃面板 - 保护层
        🔍 正在拆解: 玻璃面板
        ✅ 找到 3 个组成部分
          🌿 二氧化硅 (原材料) - 玻璃主要成分
          🌿 碳酸钠 (原材料) - 助熔剂
          🌿 石灰石 (原材料) - 稳定剂
      📦 液晶层 - 显示层
        ...
  📦 电池 - 电源
    🔍 正在拆解: 电池
    ✅ 找到 4 个组成部分
      🌿 锂 (原材料) - 电池核心材料
      🌿 钴 (原材料) - 正极材料
      ...
```

## ⚠️ 注意事项

1. **API调用频率**: 递归拆解会产生大量API调用，请注意通义千问的API限额
2. **拆解深度**: 某些物体可能需要拆解3-5层才能到达原材料
3. **响应时间**: 每次API调用需要1-3秒，完整拆解可能需要几分钟
4. **原材料判断**: AI会自动判断是否为原材料（is_raw_material: true）

## 🔍 调试技巧

如果想查看完整的JSON响应：

```javascript
async function deconstructWithDetails(itemName) {
  const response = await fetch('/api/deconstruct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemName })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
  return data;
}

// 使用
deconstructWithDetails('智能手机');
```

## 📈 下一步

测试成功后，你可以：
1. 开发可视化界面展示拆解树
2. 添加拆解历史记录
3. 实现拆解进度追踪
4. 创建"收集"原材料的游戏机制
