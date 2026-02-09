// app/api/env-check/route.ts
/**
 * Environment Variables Check Endpoint
 * 用于检查环境变量是否正确配置
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const envStatus = {
    PEXELS_API_KEY: !!process.env.PEXELS_API_KEY,
    PEXELS_API_KEY_LENGTH: process.env.PEXELS_API_KEY?.length || 0,
    PEXELS_API_KEY_PREFIX: process.env.PEXELS_API_KEY?.substring(0, 8) || 'NOT_SET',

    AI_BASE_URL: !!process.env.AI_BASE_URL,
    AI_API_KEY: !!process.env.AI_API_KEY,
    AI_MODEL_VISION: process.env.AI_MODEL_VISION || 'NOT_SET',
    AI_MODEL_TEXT: process.env.AI_MODEL_TEXT || 'NOT_SET',

    DASHSCOPE_API_KEY: !!process.env.DASHSCOPE_API_KEY,

    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
  };

  return NextResponse.json({
    message: '环境变量检查',
    status: envStatus,
    timestamp: new Date().toISOString(),
  });
}
