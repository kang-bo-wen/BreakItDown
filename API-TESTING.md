# API 测试指南

本文档说明如何测试 Entropy Reverse 项目的 API 端点。

## 📋 前置准备

### 1. 获取阿里云通义千问 API Key

1. 访问 [阿里云DashScope控制台](https://dashscope.console.aliyun.com/apiKey)
2. 登录你的阿里云账号（如果没有，需要先注册）
3. 创建或复制你的 API Key
4. 新用户通常有免费额度可以使用

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.local.example .env.local

# 编辑 .env.local 文件，填入你的 API Key
# DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### 3. 安装依赖并启动服务

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

服务器将在 http://localhost:3000 启动。

## 🧪 测试方法

### 方法 1: 使用 curl 命令行测试

#### 测试物体拆解 API

```bash
curl -X POST http://localhost:3000/api/deconstruct \
  -H "Content-Type: application/json" \
  -d '{
    "itemName": "iPhone 15"
  }'
```

**预期响应:**
```json
{
  "parent_item": "iPhone 15",
  "parts": [
    {
      "name": "Screen",
      "description": "OLED display component",
      "is_raw_material": false
    },
    {
      "name": "Battery",
      "description": "Lithium-ion power source",
      "is_raw_material": false
    },
    ...
  ]
}
```

#### 测试图片识别 API

```bash
# 准备一张测试图片（例如 test-image.jpg）
curl -X POST http://localhost:3000/api/identify \
  -F "image=@test-image.jpg"
```

**预期响应:**
```json
{
  "name": "Coffee Cup",
  "category": "Kitchenware",
  "brief_description": "A ceramic cup used for drinking coffee"
}
```

### 方法 2: 使用 Postman 或 Insomnia

#### 测试 /api/deconstruct

1. 创建新的 POST 请求
2. URL: `http://localhost:3000/api/deconstruct`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "itemName": "Paper Coffee Cup",
  "parentContext": "Disposable Kitchenware"
}
```
5. 点击 Send

#### 测试 /api/identify

1. 创建新的 POST 请求
2. URL: `http://localhost:3000/api/identify`
3. Body: 选择 `form-data`
4. 添加字段: key=`image`, type=`File`, value=选择一张图片
5. 点击 Send

### 方法 3: 创建测试脚本

创建文件 `test-api.js`:

```javascript
// test-api.js
const fs = require('fs');
const FormData = require('form-data');

// 测试拆解 API
async function testDeconstruct() {
  console.log('🧪 Testing Deconstruct API...');

  const response = await fetch('http://localhost:3000/api/deconstruct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemName: 'Smartphone',
    }),
  });

  const data = await response.json();
  console.log('✅ Deconstruct Response:', JSON.stringify(data, null, 2));
}

// 测试图片识别 API
async function testIdentify() {
  console.log('🧪 Testing Identify API...');

  const form = new FormData();
  // 替换为你的测试图片路径
  form.append('image', fs.createReadStream('./test-image.jpg'));

  const response = await fetch('http://localhost:3000/api/identify', {
    method: 'POST',
    body: form,
  });

  const data = await response.json();
  console.log('✅ Identify Response:', JSON.stringify(data, null, 2));
}

// 运行测试
async function runTests() {
  try {
    await testDeconstruct();
    console.log('\n');
    await testIdentify();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
```

运行测试:
```bash
node test-api.js
```

## 🔍 测试示例场景

### 场景 1: 拆解一个咖啡杯

```bash
# 第一层
curl -X POST http://localhost:3000/api/deconstruct \
  -H "Content-Type: application/json" \
  -d '{"itemName": "Paper Coffee Cup"}'

# 响应可能包含: Paper Body, Plastic Lid, Wax Lining

# 第二层 - 拆解 Paper Body
curl -X POST http://localhost:3000/api/deconstruct \
  -H "Content-Type: application/json" \
  -d '{"itemName": "Paper Body", "parentContext": "Paper Coffee Cup"}'

# 响应可能包含: Wood Pulp (is_raw_material: true)
```

### 场景 2: 拆解电子产品

```bash
curl -X POST http://localhost:3000/api/deconstruct \
  -H "Content-Type: application/json" \
  -d '{"itemName": "Laptop Computer"}'

# 响应可能包含: Screen, Keyboard, Battery, Motherboard, etc.
```

## ⚠️ 常见问题

### 1. API Key 错误
```json
{
  "error": "Internal server error",
  "message": "DASHSCOPE_API_KEY is not defined in environment variables"
}
```
**解决方案**: 检查 `.env.local` 文件是否存在且包含正确的 API Key。

### 2. API 调用失败
```json
{
  "error": "Internal server error",
  "message": "Qwen API error: 401 - ..."
}
```
**解决方案**:
- 检查 API Key 是否正确
- 检查账号是否有足够的额度
- 检查网络连接

### 3. JSON 解析失败
```json
{
  "error": "Failed to parse AI response",
  "details": "..."
}
```
**解决方案**:
- AI 可能返回了非 JSON 格式的内容
- 尝试调整 prompt 或重试
- 检查 AI 返回的原始内容（在 details 字段中）

## 📊 性能测试

测试 API 响应时间:

```bash
# 使用 time 命令
time curl -X POST http://localhost:3000/api/deconstruct \
  -H "Content-Type: application/json" \
  -d '{"itemName": "iPhone"}'
```

通义千问的预期响应时间:
- **qwen-vl-plus** (图片识别): 2-5秒
- **qwen-plus** (文本拆解): 1-3秒

## ✅ 测试检查清单

- [ ] API Key 已正确配置
- [ ] 开发服务器正常启动
- [ ] `/api/deconstruct` 端点返回正确的 JSON 结构
- [ ] `/api/identify` 端点能够识别图片
- [ ] 错误处理正常工作
- [ ] `is_raw_material` 标记正确识别原材料
- [ ] 响应时间在可接受范围内

## 🚀 下一步

测试通过后，你可以:
1. 开始开发前端 UI 组件
2. 集成 React Flow 可视化
3. 添加更多测试用例
4. 优化 prompt 以提高准确性

---

**提示**: 如果遇到问题，检查浏览器控制台或终端的错误日志。
