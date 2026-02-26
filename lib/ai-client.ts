// lib/ai-client.ts
/**
 * AI Client for Break It Down Project
 * Supports: Custom AI API (OpenAI-compatible) or Alibaba Cloud Qwen
 */

// 检查是否使用自定义AI接口
const useCustomAI = !!process.env.AI_BASE_URL && !!process.env.AI_API_KEY;

// 自定义AI配置
const AI_BASE_URL = process.env.AI_BASE_URL;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL_VISION = process.env.AI_MODEL_VISION || 'gpt-4-vision-preview';
const AI_MODEL_TEXT = process.env.AI_MODEL_TEXT || 'gpt-4';

// 阿里云通义千问配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const DASHSCOPE_TEXT_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 验证配置（延迟到运行时）
function validateConfig() {
  if (!useCustomAI && !DASHSCOPE_API_KEY) {
    throw new Error('Please configure either custom AI (AI_BASE_URL + AI_API_KEY) or DASHSCOPE_API_KEY');
  }
}

/**
 * 调用自定义AI视觉模型（OpenAI兼容格式）
 */
async function callCustomVision(imageBase64: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时（视觉模型通常较慢）

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL_VISION,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 1000,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Vision API request timeout (120s)');
    }
    throw error;
  }
}

/**
 * 调用自定义AI文本模型（OpenAI兼容格式）
 */
async function callCustomText(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90秒超时

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL_TEXT,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that returns responses in JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('AI API request timeout (90s)');
    }
    throw error;
  }
}

/**
 * 调用通义千问视觉模型
 */
async function callQwenVision(imageBase64: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时

  try {
    const response = await fetch(DASHSCOPE_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { text: prompt },
                { image: `data:image/jpeg;base64,${imageBase64}` }
              ]
            }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.output?.choices?.[0]?.message?.content?.[0]?.text) {
      return data.output.choices[0].message.content[0].text;
    }

    throw new Error('Invalid response format from Qwen API');
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Qwen Vision API request timeout (120s)');
    }
    throw error;
  }
}

/**
 * 调用通义千问文本模型
 */
async function callQwenText(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90秒超时

  try {
    const response = await fetch(DASHSCOPE_TEXT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that returns responses in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          result_format: 'message',
          temperature: 0.8
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.output?.choices?.[0]?.message?.content) {
      return data.output.choices[0].message.content;
    }

    throw new Error('Invalid response format from Qwen API');
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Qwen API request timeout (90s)');
    }
    throw error;
  }
}

/**
 * 统一的视觉API调用接口
 * 识图固定使用千问，不使用自定义 AI
 */
export async function callVisionAPI(imageBase64: string, prompt: string): Promise<string> {
  validateConfig();
  // 识图固定使用千问
  console.log('Using Qwen vision model (fixed for image identification)');
  return callQwenVision(imageBase64, prompt);
}

/**
 * 统一的文本API调用接口
 * 拆解可以使用自定义 AI 或千问
 */
export async function callTextAPI(prompt: string): Promise<string> {
  validateConfig();
  if (useCustomAI) {
    console.log('Using custom AI text model:', AI_MODEL_TEXT);
    return callCustomText(prompt);
  } else {
    console.log('Using Qwen text model');
    return callQwenText(prompt);
  }
}

/**
 * System prompt for image identification
 */
export const IDENTIFICATION_PROMPT = `识别图片中的主要物体，返回JSON格式（中文）：

{
  "name": "具体名称（如'iPhone 15 Pro'而非'手机'）",
  "category": "类别（如'电子产品'、'交通工具'、'家具'）",
  "brief_description": "客观描述（2-3句话，包含材料、功能）",
  "icon": "一个最能代表该物体的emoji图标",
  "searchTerm": "English search term for Pixabay (e.g., 'smartphone', 'basketball player', 'assault rifle')"
}

要求：
1. 名称要准确、具体、客观，使用专业中文
2. **图标必须精准匹配物体特征，一看就知道是什么**
3. **searchTerm 搜索词规则（非常重要）：**
   - 必须是英文
   - 只使用 1-3 个最核心的关键词
   - 优先使用通用词汇，不要太具体的型号
   - 示例：
     * ✅ "smartphone" (而不是 "iPhone 15 Pro smartphone")
     * ✅ "basketball player" (而不是 "Kobe Bryant Los Angeles Lakers")
     * ✅ "assault rifle" (而不是 "QBZ-95 Chinese assault rifle")
     * ✅ "laptop computer" (而不是 "MacBook Pro M3 laptop")
     * ✅ "sports car" (而不是 "Ferrari F8 Tributo sports car")
   - 如果是人物，使用"职业/特征"而不是具体姓名
   - 如果是产品，使用"类别"而不是品牌型号

图标选择指南：
- 电子产品：📱(手机)、💻(笔记本)、🖥️(台式机)、⌚(手表)、📷(相机)、🎧(耳机)、⌨️(键盘)、🖱️(鼠标)
- 交通工具：🚗(汽车)、🚙(SUV)、🚕(出租车)、🚌(公交)、🚂(火车)、✈️(飞机)、🚁(直升机)、🚀(火箭)、🚲(自行车)、🛵(摩托)、🚢(船)
- 家具家电：🪑(椅子)、🛋️(沙发)、🛏️(床)、🚪(门)、🪟(窗)、📺(电视)、🔌(插座)、💡(灯)
- 工具器械：🔧(扳手)、🔨(锤子)、🪛(螺丝刀)、⚙️(齿轮)、🔩(螺丝)
- 武器装备：🔫(枪械)、🗡️(刀剑)
- 食品饮料：🍔(汉堡)、🍕(披萨)、🍎(苹果)、🥤(饮料)、☕(咖啡)
- 服装配饰：👕(衣服)、👖(裤子)、👟(鞋)、👓(眼镜)、⌚(手表)、💼(包)
- 文具书籍：📚(书)、📖(笔记本)、✏️(铅笔)、🖊️(钢笔)、📏(尺子)
- 运动器材：⚽(足球)、🏀(篮球)、🎾(网球)、🏓(乒乓球)、🎯(飞镖)
- 乐器：🎸(吉他)、🎹(钢琴)、🎺(小号)、🥁(鼓)、🎻(小提琴)

**关键：选择最具体、最有代表性的图标，让用户一眼就能认出物体！**
**searchTerm 要简洁通用，便于在图库中找到相关图片！**`;

/**
 * Generate system prompt for deconstruction
 * @param currentItem - The item to deconstruct
 * @param parentContext - Optional parent context for better understanding
 */
export function getDeconstructionPrompt(currentItem: string, parentContext?: string): string {
  const contextNote = parentContext ? `\nContext: This item is part of "${parentContext}".` : '';

  return `Role: You are a manufacturing and materials expert analyzing product composition and supply chains.

Task: Break down "${currentItem}" into its constituent components or materials (one level only).${contextNote}

CRITICAL CONSTRAINTS:
1. Maximum decomposition depth: 6 levels total
2. Final leaf nodes MUST be from the Basic Elements List below
3. Be LESS detailed - skip minor components, focus on major materials
4. When close to basic elements, jump directly to them (don't over-decompose)

BASIC ELEMENTS LIST (Final Leaf Nodes MUST be from this list):
🌿 Organic/Biological:
- Wood (木材)
- Cotton/Fiber (棉/植物纤维)
- Natural Rubber (天然橡胶)
- Biomass (生物质/食物)

🛢️ Fossil/Chemical:
- Crude Oil (原油)
- Coal (煤炭)

💎 Minerals/Metals:
- Iron Ore (铁矿石)
- Copper Ore (铜矿石)
- Bauxite (铝土矿)
- Silica Sand (硅砂/石英)
- Gold (金)
- Lithium (锂)

💧 Basic Elements:
- Water (水)
- Clay/Stone (黏土/石头)

DECOMPOSITION STRATEGY (Maximum 6 levels):

Level 1 - ASSEMBLED PRODUCTS:
→ Break into 3-5 major functional components only
→ Example: "Smartphone" → Display, Battery, Circuit board, Housing

Level 2-3 - MAJOR COMPONENTS:
→ Break into main material types (skip minor parts)
→ Example: "Display" → Glass, Plastic frame, Metal connectors

Level 4-5 - MATERIALS:
→ Identify the material category
→ Example: "Glass" → Silica Sand, Soda ash (from Clay/Stone)
→ Example: "Plastic" → Crude Oil

Level 6 - BASIC ELEMENTS:
→ MUST be from the Basic Elements List above
→ Mark is_raw_material = true

IMPORTANT RULES:
1. Use Chinese for all names and descriptions (中文输出)
2. Be LESS precise - combine similar materials, skip minor components
3. When you reach a material that's 1-2 steps from basic elements, jump directly
4. NEVER exceed 6 levels of decomposition
5. Final nodes MUST match the Basic Elements List exactly
6. Skip chemical synthesis steps - go straight to basic elements

EXAMPLES:

✓ "塑料瓶" → 塑料 → 原油 (2 levels, good!)
✓ "玻璃窗" → 玻璃 → 硅砂 (2 levels, good!)
✓ "钢架" → 钢材 → 铁矿石, 煤炭 (2 levels, good!)
✓ "电路板" → PCB基板, 铜线, 焊料 → (next level: 硅砂, 铜矿石, etc.)

❌ "塑料瓶" → 聚乙烯树脂 → 聚合物颗粒 → 精炼石油 → 原油 (TOO DETAILED!)

Output Format: JSON only (Chinese names and descriptions).
{
  "parent_item": "${currentItem}",
  "parts": [
    {
      "name": "组件或材料名称（中文）",
      "description": "功能或特性（中文）",
      "is_raw_material": true or false,
      "icon": "一个最能代表该组件的emoji图标（如：🚀火箭、💻电脑、🔋电池、⚙️齿轮、🔌电线等）",
      "searchTerm": "English search term for Wikimedia Commons (e.g., 'lithium battery', 'aluminum alloy', 'silicon wafer', 'iron ore')"
    }
  ]
}

**IMPORTANT: searchTerm must be in English and suitable for searching professional/technical images on Wikimedia Commons.**

ICON SELECTION GUIDELINES (CRITICAL - 图标必须精准匹配):
**核心原则：图标必须精准、具体、一目了然，避免模糊抽象**

1. 精准匹配原则：
   - ✅ 好例子：屏幕→📱、电池→🔋、轮胎→🛞、火箭引擎→🚀、芯片→💾
   - ❌ 坏例子：屏幕→📦、电池→⚡、轮胎→⚙️（太抽象）

2. 具体物体优先于抽象符号：
   - 优先选择具体物体的图标（📱💻🔋🛞🪟）
   - 避免使用过于抽象的符号（⚙️🔧只在确实是齿轮/工具时使用）

3. 分类指南：
   - 电子屏幕类：📱(手机屏)、💻(电脑屏)、📺(电视屏)、⌚(手表屏)
   - 电池能源类：🔋(电池)、🔌(充电器/电源)、⚡(电路/电流)、☀️(太阳能)
   - 芯片电路类：💾(芯片/存储)、💿(光盘/存储)、🔲(处理器)、⚡(电路板)
   - 机械部件类：⚙️(齿轮)、🔩(螺丝)、🛞(轮胎)、🔧(扳手/工具)
   - 外壳结构类：📦(外壳/包装)、🏗️(框架/结构)、🪟(玻璃/窗)
   - 连接线缆类：🔌(电源线)、🔗(连接器)、📡(天线/信号)
   - 光学镜头类：📷(相机)、🔍(镜头)、👁️(传感器)
   - 原材料类：
     * 金属：🪙(金属片)、⚙️(金属件)、🔩(金属紧固件)
     * 塑料：🧱(塑料块)、⚫(橡胶)
     * 玻璃：🔷(玻璃)、💎(晶体)
     * 自然材料：🌿(植物)、🪵(木材)、💧(水)、⛰️(矿石)、🛢️(石油)

4. 特殊情况处理：
   - 如果组件名称包含具体物体（如"iPhone屏幕"），使用该物体的图标（📱）
   - 如果是材料（如"铝合金"），使用材料相关图标（🪙）
   - 如果是抽象概念（如"控制系统"），选择最相关的具体物体（💻）

5. 避免使用的通用图标（除非确实合适）：
   - 📦 只用于外壳/包装，不要用于所有不知道的东西
   - ⚙️ 只用于齿轮/机械传动，不要用于所有机械部件
   - 🔧 只用于工具本身，不要用于需要工具的部件

6. **关键：基于上下文选择图标（功能优先于材料）**
   - 制造组件：根据其**用途/功能**选择图标，而非材料
     * ✅ 枪管 → 🔫 (因为它是枪的一部分)
     * ❌ 枪管 → 🪙 (虽然是金属，但不能体现其功能)
     * ✅ 发动机缸体 → 🚗 (因为是汽车部件)
     * ❌ 发动机缸体 → ⚙️ (太抽象)
     * ✅ 手机外壳 → 📱 (因为是手机部件)
     * ❌ 手机外壳 → 📦 (太通用)

   - 原材料：根据其**来源/外观**选择图标
     * ✅ 铝合金 → 🪙 (金属材料)
     * ✅ 塑料颗粒 → 🧱 (塑料材料)
     * ✅ 玻璃 → 🔷 (透明晶体)

7. **区分相似原材料（必须精确区分）**
   - 矿石类（必须根据矿石类型区分）：
     * 铁矿石 → ⛏️ (采矿/铁矿)
     * 煤炭 → ⚫ (黑色/煤)
     * 铜矿石 → 🟤 (棕色/铜)
     * 铝土矿 → 🪨 (矿石/岩石)
     * 硅砂 → 🏖️ (沙子)
     * 石灰石 → 🪨 (石头)

   - 金属材料（必须根据金属类型区分）：
     * 钢材/钢铁 → 🔩 (钢制品)
     * 铝合金 → 🪙 (轻金属)
     * 铜 → 🟤 (铜色金属)
     * 钛合金 → ✈️ (航空金属)

   - 化工材料（必须根据材料特性区分）：
     * 原油 → 🛢️ (石油)
     * 天然气 → 🔥 (气体燃料)
     * 橡胶 → ⚫ (黑色弹性)
     * 塑料 → 🧱 (塑料块)

8. **常见错误对比（学习这些例子）**
   - ❌ 所有金属部件都用 ⚙️ → ✅ 根据部件功能选择（枪管🔫、车轮🛞、外壳📱）
   - ❌ 所有矿石都用 ⛰️ → ✅ 根据矿石类型选择（铁矿⛏️、煤炭⚫、硅砂🏖️）
   - ❌ 所有塑料都用 📦 → ✅ 根据塑料用途选择（外壳📱、瓶子🧴、管道🔧）
   - ❌ 所有电子元件都用 💾 → ✅ 根据元件类型选择（屏幕📱、电池🔋、芯片💾）

**记住：用户应该看到图标就能立即知道这是什么，不需要看名字！**
**关键思考：这个东西的主要特征是什么？它用来做什么？它看起来像什么？**`;
}

/**
 * Generate custom deconstruction prompt based on user preferences
 * @param currentItem - The item to deconstruct
 * @param parentContext - Optional parent context
 * @param options - Customization options
 */
export function generateCustomDeconstructionPrompt(
  currentItem: string,
  parentContext: string | undefined,
  options: {
    humorLevel: number;      // 0-100
    professionalLevel: number; // 0-100
    detailLevel: number;     // 0-100 细致度
    customTemplate?: string;  // If provided, use custom template
  }
): string {
  // If custom template is provided, use it
  if (options.customTemplate && options.customTemplate.trim()) {
    return options.customTemplate
      .replace(/\{\{ITEM\}\}/g, currentItem)
      .replace(/\{\{CONTEXT\}\}/g, parentContext || '无');
  }

  // Otherwise, generate prompt based on parameters
  const basePrompt = getDeconstructionPrompt(currentItem, parentContext);

  // Add style instructions based on humor level
  let styleInstructions = '';
  if (options.humorLevel > 70) {
    styleInstructions += '\n\n风格要求：使用幽默、有趣的语言描述，可以加入比喻和俏皮话，让拆解过程更有趣。';
  } else if (options.humorLevel > 40) {
    styleInstructions += '\n\n风格要求：保持轻松友好的语气，适当使用生动的表达。';
  } else if (options.humorLevel < 20) {
    styleInstructions += '\n\n风格要求：使用严肃、正式的语言，保持专业性。';
  }

  // Add detail level based on professional level
  if (options.professionalLevel > 70) {
    styleInstructions += '\n专业度：提供详细的技术规格、材料特性和制造工艺说明。';
  } else if (options.professionalLevel < 30) {
    styleInstructions += '\n专业度：使用通俗易懂的语言，避免专业术语，用日常用语解释。';
  }

  // Add detail level instructions based on detailLevel parameter
  if (options.detailLevel > 70) {
    styleInstructions += '\n\n细致度：高细致度拆解\n- 包含更多子组件和中间材料\n- 拆解层次更深，展示更多细节\n- 每层可以包含 5-7 个组件\n- 适当包含次要组件和辅助材料';
  } else if (options.detailLevel < 30) {
    styleInstructions += '\n\n**细致度：极简拆解模式（强制执行）**\n- **强制要求：每层最多 2-3 个核心组件**\n- **强制要求：尽可能快速跳到自然元素，最多 3-4 层**\n- **强制要求：跳过所有次要组件、辅助材料、中间步骤**\n- **强制要求：看到任何材料立即跳到自然元素，不要犹豫**\n- 示例：\n  * "笔记本电脑" → 屏幕、主板、电池（只保留核心）\n  * "屏幕" → 玻璃、液晶（跳过背光等次要组件）\n  * "玻璃" → 硅砂（立即到自然元素）';
  } else {
    styleInstructions += '\n\n细致度：中等细致度拆解\n- 包含主要组件和关键材料\n- 保持合理的拆解层次\n- 每层包含 3-5 个主要组件';
  }

  return basePrompt + styleInstructions;
}
