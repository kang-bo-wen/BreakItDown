'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface IdentificationResult {
  name: string;
  category: string;
  brief_description: string;
  icon: string;
  imageUrl?: string;
  searchTerm?: string;
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // Step 1: Image upload related state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Step 2: Identification result and prompt settings
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  // Prompt settings always expanded by default
  const [promptMode, setPromptMode] = useState<'simple' | 'advanced'>('simple');
  const [humorLevel, setHumorLevel] = useState(50);
  const [professionalLevel, setProfessionalLevel] = useState(70);
  const [detailLevel, setDetailLevel] = useState(50);
  const [customPrompt, setCustomPrompt] = useState('');

  // Compress image function
  const compressImage = async (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await compressImage(file);
        setImageFile(compressedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);

        setIdentificationResult(null);
      } catch (error) {
        console.error('图片压缩失败:', error);
        alert('图片处理失败，请重试');
      }
    }
  };

  // Identify image
  const identifyImage = async () => {
    if (!imageFile) return;

    setIsIdentifying(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('识别失败');
      }

      const result: IdentificationResult = await response.json();
      setIdentificationResult(result);
    } catch (error) {
      console.error('识别错误:', error);
      alert('识别失败，请重试');
    } finally {
      setIsIdentifying(false);
    }
  };

  // Save state to localStorage and navigate to canvas
  const navigateToCanvas = () => {
    const setupState = {
      identificationResult,
      imagePreview,
      promptSettings: {
        humorLevel,
        professionalLevel,
        detailLevel,
        promptMode,
        customPrompt
      }
    };
    localStorage.setItem('setupState', JSON.stringify(setupState));

    // Mark that this is a fresh navigation from setup (to prevent duplicate session creation)
    localStorage.setItem('fromSetup', 'true');

    // Clear sidebar cache before navigating to ensure fresh data
    sessionStorage.removeItem('sidebar-sessions-cache');

    router.push('/canvas');
  };

  // Load from localStorage on mount (only if no sessionId - meaning it's a new session)
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');

    // If there's a sessionId, we'll load from database instead
    if (sessionId) {
      return;
    }

    const savedSetup = localStorage.getItem('setupState');
    if (savedSetup) {
      try {
        const parsed = JSON.parse(savedSetup);
        if (parsed.identificationResult) {
          setIdentificationResult(parsed.identificationResult);
        }
        if (parsed.imagePreview) {
          setImagePreview(parsed.imagePreview);
        }
        if (parsed.promptSettings) {
          setHumorLevel(parsed.promptSettings.humorLevel ?? 50);
          setProfessionalLevel(parsed.promptSettings.professionalLevel ?? 70);
          setDetailLevel(parsed.promptSettings.detailLevel ?? 50);
          setPromptMode(parsed.promptSettings.promptMode ?? 'simple');
          setCustomPrompt(parsed.promptSettings.customPrompt ?? '');
        }
      } catch (error) {
        console.error('恢复设置状态失败:', error);
      }
    }
  }, [searchParams]);

  // Check for sessionId in URL and load session from database
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    if (sessionId && status === 'authenticated') {
      loadSession(sessionId);
    }
  }, [searchParams, status]);

  // Load session from database
  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error('加载会话失败');
      }

      const data = await response.json();
      const session = data.session || data;

      // Restore identification result
      if (session.identificationResult) {
        setIdentificationResult(session.identificationResult);
      } else if (session.rootObjectName) {
        setIdentificationResult({
          name: session.rootObjectName,
          category: '',
          brief_description: '',
          icon: session.rootObjectIcon || '',
          imageUrl: session.rootObjectImage
        });
      }

      // Restore image preview
      if (session.rootObjectImage) {
        setImagePreview(session.rootObjectImage);
      }

      // Restore prompt settings
      if (session.promptSettings) {
        setHumorLevel(session.promptSettings.humorLevel || 50);
        setProfessionalLevel(session.promptSettings.professionalLevel || 70);
        setDetailLevel(session.promptSettings.detailLevel || 50);
        if (session.promptSettings.promptMode) {
          setPromptMode(session.promptSettings.promptMode);
        }
        if (session.promptSettings.customPrompt) {
          setCustomPrompt(session.promptSettings.customPrompt);
        }
      }

      // Save to localStorage
      const setupState = {
        identificationResult: session.identificationResult || {
          name: session.rootObjectName,
          category: '',
          brief_description: '',
          icon: session.rootObjectIcon || '',
          imageUrl: session.rootObjectImage
        },
        imagePreview: session.rootObjectImage,
        promptSettings: session.promptSettings || {
          humorLevel: 50,
          professionalLevel: 70,
          detailLevel: 50,
          promptMode: 'simple',
          customPrompt: ''
        }
      };
      localStorage.setItem('setupState', JSON.stringify(setupState));

      console.log('✅ 已从历史会话加载数据到调制界面');
    } catch (error) {
      console.error('加载会话错误:', error);
    }
  };

  // Auto-save prompt settings to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const setupState = {
        identificationResult,
        imagePreview,
        promptSettings: {
          humorLevel,
          professionalLevel,
          detailLevel,
          promptMode,
          customPrompt
        }
      };
      localStorage.setItem('setupState', JSON.stringify(setupState));
    }, 500);

    return () => clearTimeout(timer);
  }, [humorLevel, professionalLevel, detailLevel, promptMode, customPrompt, identificationResult, imagePreview]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Title area */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              调制界面
            </h1>
          </div>
        </div>

        {/* Image Preview - always show if available */}
        {imagePreview && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 mb-6 border-2 border-white/10 hover:border-white/20 transition-all shadow-2xl">
            <div className="relative w-full max-w-md h-64 mx-auto bg-black/30 rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="预览"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Upload Image - only show if no identification result yet */}
        {!identificationResult && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 mb-6 border-2 border-white/10 hover:border-white/20 transition-all shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105">
                选择图片
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="relative w-full max-w-md h-64 bg-black/30 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="预览"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {imageFile && !identificationResult && (
                <button
                  onClick={identifyImage}
                  disabled={isIdentifying}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  {isIdentifying ? (
                    <>
                      <span className="inline-block animate-spin">🔄</span>
                      <span>识别中...</span>
                    </>
                  ) : (
                    '🔍 识别物体'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Identification Result and Prompt Settings */}
        {identificationResult && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 mb-6 border-2 border-white/10 hover:border-white/20 transition-all shadow-2xl">
            {/* Identification Result Display */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-white/10 mb-6">
              <div className="text-2xl font-bold mb-3 text-white">{identificationResult.name}</div>
              <div className="text-sm text-gray-300 mb-3">
                分类: {identificationResult.category}
              </div>
              <div className="text-gray-200">
                {identificationResult.brief_description}
              </div>
            </div>

            {/* Prompt Settings Panel - always expanded */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPromptMode('simple')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    promptMode === 'simple'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  简单模式
                </button>
                <button
                  onClick={() => setPromptMode('advanced')}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    promptMode === 'advanced'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  高级模式
                </button>
              </div>

              {/* Simple Mode: Sliders */}
              {promptMode === 'simple' && (
                <div className="space-y-4">
                  {/* Humor Level Slider */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                      <span>😄 幽默度</span>
                      <span className="text-indigo-400">{humorLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={humorLevel}
                      onChange={(e) => setHumorLevel(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>严肃</span>
                      <span>幽默</span>
                    </div>
                  </div>

                  {/* Professional Level Slider */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                      <span>🎓 专业度</span>
                      <span className="text-indigo-400">{professionalLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={professionalLevel}
                      onChange={(e) => setProfessionalLevel(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>通俗</span>
                      <span>专业</span>
                    </div>
                  </div>

                  {/* Detail Level Slider */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                      <span>🔍 细致度</span>
                      <span className="text-indigo-400">{detailLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={detailLevel}
                      onChange={(e) => setDetailLevel(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>简化</span>
                      <span>详细</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Mode: Custom Prompt */}
              {promptMode === 'advanced' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    自定义 Prompt 模板
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`使用 {{ITEM}} 代表物品名称，{{CONTEXT}} 代表上下文\n\n示例：\n请将 {{ITEM}} 拆解为主要组成部分。要求：\n1. 使用幽默风趣的语言\n2. 每个部分提供详细说明\n3. 标注是否为原材料`}
                    className="w-full h-40 bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      const template = `请将 {{ITEM}} 拆解为主要组成部分。

要求：
1. 列出所有主要组件或材料
2. 每个部分提供简短描述
3. 标注是否为原材料（is_raw_material: true/false）
4. 为每个部分选择合适的 emoji 图标

返回 JSON 格式：
{
  "parent_item": "{{ITEM}}",
  "parts": [
    {
      "name": "组件名称",
      "description": "功能描述",
      "is_raw_material": false,
      "icon": "📦"
    }
  ]
}`;
                      setCustomPrompt(template);
                    }}
                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    📋 加载默认模板
                  </button>
                </div>
              )}
            </div>

            {/* Navigate to Canvas Button */}
            <button
              onClick={navigateToCanvas}
              className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>🚀</span>
              <span>进入操作界面</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams support
export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
