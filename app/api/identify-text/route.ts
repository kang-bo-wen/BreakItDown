// app/api/identify-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callTextAPI } from '@/lib/ai-client';
import { IdentificationResponse } from '@/types/graph';
import {
  detectTemplateMatch,
  extractIdentificationFromTemplate
} from '@/lib/template-interceptor';

// Prompt for text-based identification
const TEXT_IDENTIFICATION_PROMPT = `根据用户输入的物品名称，识别该物品并返回JSON格式（中文）：

用户输入：{{INPUT}}

请返回以下JSON格式：
{
  "name": "具体名称（如'iPhone 15 Pro'而非'手机'）",
  "category": "类别（如'电子产品'、'交通工具'、'家具'）",
  "brief_description": "客观描述（2-3句话，包含材料、功能）",
  "icon": "一个最能代表该物体的emoji图标",
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

export async function POST(request: NextRequest) {
  // 检查认证
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { text } = body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // ✨ 新增：模板拦截逻辑
    const templateMatch = await detectTemplateMatch(text);

    if (templateMatch && templateMatch.confidence >= 0.8) {
      console.log(`🎯 Template hit: ${templateMatch.template.displayName}`);

      // 直接返回模板数据，无需 AI 延迟或 Wikimedia 搜索
      const identificationData = extractIdentificationFromTemplate(templateMatch.template);

      return NextResponse.json({
        ...identificationData,
        _isTemplate: true,
        _templateKey: templateMatch.template.templateKey
      });
    }

    // 未命中模板，继续原有的 AI 识别流程
    console.log('🤖 Using real AI identification...');

    // Generate prompt with user input
    const prompt = TEXT_IDENTIFICATION_PROMPT.replace('{{INPUT}}', text.trim());

    // Call Text API
    const result = await callTextAPI(prompt);

    // Clean up markdown code blocks if present
    let cleanedText = result.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    let identificationData: IdentificationResponse;
    try {
      identificationData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanedText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: cleanedText },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!identificationData.name || !identificationData.category) {
      return NextResponse.json(
        { error: 'Invalid response structure from AI', data: identificationData },
        { status: 500 }
      );
    }

    // Search for image on Wikimedia Commons if searchTerm is provided
    let imageUrl: string | undefined;
    if (identificationData.searchTerm) {
      try {
        const wikimediaResponse = await fetch(`${request.nextUrl.origin}/api/wikimedia-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchTerm: identificationData.searchTerm })
        });

        if (wikimediaResponse.ok) {
          const wikimediaData = await wikimediaResponse.json();
          imageUrl = wikimediaData.thumbnail || wikimediaData.imageUrl;
        } else {
          console.warn(`Wikimedia search failed for "${identificationData.searchTerm}"`);
        }
      } catch (wikimediaError) {
        console.error('Error searching Wikimedia:', wikimediaError);
        // Continue without image - will fall back to emoji icon
      }
    }

    return NextResponse.json({
      ...identificationData,
      imageUrl
    });
  } catch (error) {
    console.error('Error in identify-text API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
