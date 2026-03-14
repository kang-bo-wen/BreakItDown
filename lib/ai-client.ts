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
        max_tokens: 4000,
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
  "icon": "一个最能代表该物体的Heroicons图标名称（如 cpu-chip、cube、device-phone-mobile、globe-alt 等）",
  "searchTerm": "English search term - use popular words with lots of photos (e.g., 'smartphone', 'car', 'laptop', 'watch', 'headphones')"
}

要求：
1. 名称要准确、具体、客观，使用专业中文
2. **图标必须精准匹配物体特征，一看就知道是什么**
3. **searchTerm 搜索词规则（非常重要，必须严格遵守）：**
   - 必须是英文
   - 只使用 1-3 个最核心的关键词
   - **必须选择图片多的热门词汇**（如 "battery" 图片比 "lithium battery" 多很多）
   - 优先使用通用词汇，不要太具体的型号
   - 示例：
     * ✅ "smartphone" (图片最多，最推荐)
     * ✅ "battery" (比 "lithium battery" 图片多)
     * ✅ "laptop" (比 "MacBook Pro" 图片多)
     * ✅ "car" (比具体车型图片多)
     * ✅ "processor chip" (比具体型号图片多)
     * ❌ "iPhone 15 Pro" (图片太少)
     * ❌ "QBZ-95" (几乎没有图片)
     * ❌ "M3 chip" (图片太少)
   - 如果不确定，选择更通用、更常见的词汇

图标选择指南（使用 Heroicons 图标名称）：
- 电子产品：cpu-chip(芯片)、device-phone-mobile(手机)、computer-desktop(台式机)、laptop(笔记本)、watch(手表)、camera(相机)、speakerphone(耳机/音箱)、keyboard(键盘)、mouse(鼠标)、tv(电视)、printer(打印机)
- 交通工具：truck(卡车)、car(汽车)、taxi(出租车)、bus(公交车)、train(火车)、paper-airplane(飞机)、rocket-launch(火箭)、globe-alt(地球/自行车)、ship(船)
- 家具家电：chair(椅子)、sofa(沙发)、bed(床)、door-open(门)、window(窗)、tv(电视)、bolt(插座/电源)、light-bulb(灯)、refrigerator(冰箱)、washing-machine(洗衣机)
- 工具器械：wrench(扳手)、hammer(锤子)、screwdriver(螺丝刀)、cog(齿轮)、scissors(剪刀)、paint-brush(刷子)
- 武器装备：shield(盾牌)、sword(剑)
- 食品饮料：burger(汉堡)、pizza(披萨)、apple(苹果)、cup-and-saucer(饮料/咖啡)、cake(蛋糕)
- 服装配饰：tshirt(衣服)、shopping-bag(包)、shoe(鞋)、glasses(眼镜)、watch(手表)
- 文具书籍：book-open(书)、document-text(文档)、pencil(铅笔)、ruler(尺子)、paper-clip(回形针)
- 运动器材：trophy(奖杯/足球)、basketball(篮球)、tennis-ball(网球)
- 乐器：musical-note(音乐/吉他)、piano(钢琴)

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
      "searchTerm": "English search term for image search - use popular words with lots of photos (e.g., 'battery', 'metal', 'glass', 'plastic', 'wire', 'chip', 'screen')"
    }
  ]
}

**IMPORTANT: searchTerm must be in English and suitable for searching images on Unsplash (choose popular, common words with lots of photos - e.g., "battery" instead of "lithium battery", "metal" instead of "aluminum alloy").**

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

  // Fixed prompt settings: humor=0 (严肃), professional=100 (专业), detail=100 (高细致度)
  const basePrompt = getDeconstructionPrompt(currentItem, parentContext);

  // 固定使用：严肃、专业、高细致度
  const styleInstructions = '\n\n风格要求：使用严肃、正式的语言，保持专业性。' +
    '\n专业度：提供详细的技术规格、材料特性和制造工艺说明。' +
    '\n\n细致度：高细致度拆解' +
    '\n- 包含更多子组件和中间材料' +
    '\n- 拆解层次更深，展示更多细节' +
    '\n- 每层可以包含 5-7 个组件' +
    '\n- 适当包含次要组件和辅助材料';

  return basePrompt + styleInstructions;
}
