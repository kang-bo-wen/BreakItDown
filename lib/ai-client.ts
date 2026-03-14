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

  return `Role: You are a manufacturing expert. Break down products into concrete customizable parts.

Task: Break down "${currentItem}" into its concrete customizable parts (one level only).${contextNote}

CRITICAL CONSTRAINTS:
1. Maximum decomposition depth: 6 levels total
2. Final leaf nodes MUST be from the Basic Elements List below
3. Break down into 3-6 concrete parts that ARE themselves customizable
4. Each part should be a real, physical component that user can see/touch
5. When close to basic elements, jump directly to them

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

Level 1 - CONCRETE CUSTOMIZABLE PARTS:
→ Break into real, physical parts that CAN BE CUSTOMIZED
→ Each part should be a tangible component user can customize
→ Example: "T恤" → 面料, 颜色, 尺码, 领型, 袖口, 下摆
→ Example: "手机壳" → 材质, 外观, 厚度, 结构, 工艺
→ Example: "运动鞋" → 鞋面, 鞋底, 鞋带, 鞋垫, 装饰

Level 2-3 - SUB-PARTS:
→ Break into material or sub-components
→ Example: "面料" → 棉布, 涤纶, 混纺

Level 4-5 - MATERIALS:
→ Identify material category
→ Example: "棉布" → 棉花, 纱线

Level 6 - BASIC ELEMENTS:
→ MUST be from the Basic Elements List
→ Mark is_raw_material = true

IMPORTANT RULES:
1. Use Chinese for all names and descriptions (中文输出)
2. **Each part should be a concrete, customizable thing itself** - not "color" but the thing that gets colored
3. Description: briefly describe what this part is (中文)
4. Be LESS detailed - skip minor components
5. When you reach a material that's 1-2 steps from basic elements, jump directly
6. NEVER exceed 6 levels
7. Final nodes MUST match the Basic Elements List

EXAMPLES:

✓ "T恤" → 面料, 颜色, 尺码, 领型, 袖口 (都是具体的可定制部件!)
✓ "手机壳" → 材质, 外观, 厚度, 结构
✓ "运动鞋" → 鞋面, 鞋底, 鞋带, 鞋垫
✓ "塑料瓶" → 塑料 → 原油 (2 levels)
✓ "玻璃窗" → 玻璃 → 硅砂 (2 levels)

Output Format: JSON only (Chinese names and descriptions).
{
  "parent_item": "${currentItem}",
  "parts": [
    {
      "name": "具体部件名称（中文）",
      "description": "这个部件是什么，用于什么（中文）",
      "is_raw_material": true or false,
      "icon": "一个最能代表该部件的emoji图标",
      "searchTerm": "English search term for image search"
    }
  ]
}

**IMPORTANT: searchTerm must be in English and suitable for searching images on Unsplash.**

ICON SELECTION GUIDELINES (CRITICAL):
1. 精准匹配原则：
   - ✅ 好例子：屏幕→📱、电池→🔋、轮胎→🛞、芯片→💾
   - ❌ 坏例子：屏幕→📦、电池→⚡、轮胎→⚙️（太抽象）

2. 具体物体优先于抽象符号

3. 分类指南：
   - 电子：📱💻🔋💾⌚📷
   - 机械：⚙️🔩🛞🔧
   - 原材料：🧵🪵🧱🪙🔷🌿💧⛰️🛢️

4. 避免：
   - 📦 只用于包装
   - ⚙️ 只用于齿轮
   - 🔧 只用于工具本身

**记住：每个节点都应该是具体的、可以触摸的、可定制的部件！**`;
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
