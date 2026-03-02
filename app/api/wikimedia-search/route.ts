// app/api/wikimedia-search/route.ts
/**
 * Unsplash Image Search API
 * Searches for images on Unsplash and returns the best match
 */

import { NextRequest, NextResponse } from 'next/server';

interface UnsplashSearchResult {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  alt_description: string;
  description: string;
  tags?: { title: string }[];
}

/**
 * Search Unsplash for images
 * @param searchTerm - The search term (English works best)
 * @param limit - Number of results to return (default: 1)
 */
async function searchUnsplash(searchTerm: string, limit: number = 1): Promise<UnsplashSearchResult[]> {
  try {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY?.trim();

    if (!apiKey) {
      console.error('❌ UNSPLASH_ACCESS_KEY is not configured');
      return [];
    }

    // Unsplash API endpoint
    const apiUrl = 'https://api.unsplash.com/search/photos';

    const params = new URLSearchParams({
      query: searchTerm,
      per_page: String(Math.min(30, limit * 3)), // 获取更多结果用于筛选
      page: '1',
      orientation: 'squarish', // 优先方形图片，适合物体展示
      order_by: 'relevant' // 按相关性排序
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Unsplash API error:', response.status, errorText);
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return (data.results as UnsplashSearchResult[]).slice(0, limit);
  } catch (error) {
    console.error('❌ Unsplash search error:', error);
    return [];
  }
}

/**
 * Generate fallback search terms when the original search fails
 * @param originalTerm - The original search term
 * @returns Array of fallback search terms
 */
function generateFallbackTerms(originalTerm: string): string[] {
  const term = originalTerm.toLowerCase().trim();
  const fallbacks: string[] = [];

  // 1. Remove technical modifiers
  const simplified = term
    .replace(/\b(pro|plus|max|ultra|mini|air)\b/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (simplified !== term && simplified.length > 2) {
    fallbacks.push(simplified);
  }

  // 2. Extract the first 1-2 core words (most common)
  const words = term.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 1) {
    fallbacks.push(words.slice(0, 2).join(' '));
    fallbacks.push(words[0]);
  } else if (words.length === 1) {
    // 3. Try related common terms
    const word = words[0];
    const commonMappings: Record<string, string[]> = {
      'battery': ['battery', 'power bank'],
      'chip': ['chip', 'integrated circuit', 'electronics'],
      'processor': ['processor', 'cpu', 'computer chip'],
      'display': ['display', 'screen', 'monitor'],
      'glass': ['glass', 'window glass'],
      'metal': ['metal', 'steel', 'aluminum'],
      'plastic': ['plastic', 'plastic bottle'],
      'wire': ['wire', 'cable', 'electric wire'],
      'sensor': ['sensor', 'camera sensor'],
      'camera': ['camera', 'digital camera'],
      'memory': ['memory', 'ram', 'computer memory'],
      'storage': ['storage', 'hard disk', 'ssd'],
      'screen': ['screen', 'display', 'monitor'],
      'lens': ['lens', 'camera lens'],
      'antenna': ['antenna', 'satellite dish'],
      'connector': ['connector', 'plug', 'socket'],
      'motor': ['motor', 'electric motor'],
      'speaker': ['speaker', 'audio speaker'],
      'microphone': ['microphone', 'mic'],
      'vibration': ['vibration', 'motor'],
    };

    if (commonMappings[word]) {
      fallbacks.push(...commonMappings[word]);
    }
  }

  // 4. Generic category as last resort
  const genericTerms = ['technology', 'electronics', 'machine', 'device', 'product', 'object'];
  fallbacks.push(genericTerms[Math.floor(Math.random() * genericTerms.length)]);

  // Remove duplicates and limit
  return [...new Set(fallbacks)].slice(0, 4);
}

/**
 * POST /api/wikimedia-search
 * Request body: { searchTerm: string }
 * Response: { imageUrl: string | null, thumbnail: string | null, photographer?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json();

    if (!searchTerm || typeof searchTerm !== 'string') {
      return NextResponse.json(
        { error: 'Invalid search term' },
        { status: 400 }
      );
    }

    // Try original term first
    let results = await searchUnsplash(searchTerm, 3);
    let usedTerm = searchTerm;

    // If no results, try fallback terms
    if (results.length === 0) {
      console.log(`🔄 No results for "${searchTerm}", trying fallback terms...`);
      const fallbackTerms = generateFallbackTerms(searchTerm);

      for (const fallback of fallbackTerms) {
        console.log(`🔄 Trying fallback term: "${fallback}"`);
        results = await searchUnsplash(fallback, 3);
        if (results.length > 0) {
          usedTerm = fallback;
          console.log(`✅ Found results with fallback term: "${fallback}"`);
          break;
        }
      }
    }

    if (results.length === 0) {
      return NextResponse.json({
        imageUrl: null,
        thumbnail: null
      });
    }

    // 选择最佳匹配：优先选择描述中包含搜索词的图片
    const searchWords = usedTerm.toLowerCase().split(' ');
    let bestMatch = results[0];
    let bestScore = 0;

    for (const result of results) {
      const description = (result.alt_description || result.description || '').toLowerCase();
      let score = 0;

      // 计算匹配分数：描述中包含的搜索词越多，分数越高
      for (const word of searchWords) {
        if (description.includes(word)) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }
    }

    return NextResponse.json({
      imageUrl: bestMatch.urls.regular,
      thumbnail: bestMatch.urls.small,
      photographer: bestMatch.user.name,
      usedTerm // 返回实际使用的搜索词（用于调试）
    });
  } catch (error: any) {
    console.error('Unsplash search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
