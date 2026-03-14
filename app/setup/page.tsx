'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from '../hooks/useTheme';
import { getDisplayIcon } from '../lib/icon-utils';
import { BoltIcon, MagnifyingGlassIcon, RocketLaunchIcon, PhotoIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface IdentificationResult {
  name: string;
  category: string;
  brief_description: string;
  icon: string;
  imageUrl?: string;
  searchTerm?: string;
}

// 输入模式类型
type InputMode = 'image' | 'text';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // 使用主题 hook
  const { theme, themeConfig } = useTheme();
  const isDarkTheme = theme === 'dark';
  const tc = themeConfig;
  const [mounted, setMounted] = useState(false);

  // 输入模式：图片或文字
  const [inputMode, setInputMode] = useState<InputMode>('image');

  // Only render theme-specific content after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 1: Image upload related state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 1b: Text input related state
  const [textInput, setTextInput] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Step 2: Identification result and prompt settings
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const humorLevel = 0;
  const professionalLevel = 100;
  const detailLevel = 100;

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

  // Identify text input
  const identifyText = async () => {
    if (!textInput.trim()) return;

    setIsIdentifying(true);
    try {
      const response = await fetch('/api/identify-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput.trim() }),
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
  const navigateToCanvas = async () => {
    const existingSetupData = localStorage.getItem('setupState');
    let existingSessionId = null;
    if (existingSetupData) {
      try {
        const parsed = JSON.parse(existingSetupData);
        existingSessionId = parsed.existingSessionId || null;
      } catch (e) {}
    }

    const setupState = {
      identificationResult,
      imagePreview,
      promptSettings: {
        humorLevel,
        professionalLevel,
        detailLevel
      },
      existingSessionId
    };
    localStorage.setItem('setupState', JSON.stringify(setupState));

    const urlSessionId = searchParams.get('sessionId');
    const sessionIdToUse = urlSessionId || existingSessionId;

    if (sessionIdToUse && identificationResult) {
      try {
        await fetch(`/api/sessions/${sessionIdToUse}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptSettings: {
              humorLevel,
              professionalLevel,
              detailLevel
            },
            identificationResult
          })
        });
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    }

    if (urlSessionId) {
      router.push(`/canvas?sessionId=${urlSessionId}`);
      return;
    }

    if (existingSessionId) {
      router.push(`/canvas?sessionId=${existingSessionId}`);
      return;
    }

    localStorage.setItem('fromSetup', 'true');
    sessionStorage.removeItem('sidebar-sessions-cache');
    router.push('/canvas');
  };

  // Load from localStorage on mount
  useEffect(() => {
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
          // 提示词设置已改为固定值
        }
      } catch (error) {
        console.error('恢复设置状态失败:', error);
      }
    }
  }, []);

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

      if (session.rootObjectImage) {
        setImagePreview(session.rootObjectImage);
      }

      if (session.promptSettings) {
        // 提示词设置已改为固定值
      }

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
          humorLevel: 0,
          professionalLevel: 100,
          detailLevel: 100
        },
        existingSessionId: sessionId
      };
      localStorage.setItem('setupState', JSON.stringify(setupState));
    } catch (error) {
      console.error('加载会话错误:', error);
    }
  };

  // Auto-save prompt settings to localStorage (debounced)
  useEffect(() => {
    const existingSetupData = localStorage.getItem('setupState');
    let existingSessionId = null;
    if (existingSetupData) {
      try {
        const parsed = JSON.parse(existingSetupData);
        existingSessionId = parsed.existingSessionId || null;
      } catch (e) {}
    }

    const timer = setTimeout(() => {
      const setupState = {
        identificationResult,
        imagePreview,
        promptSettings: {
          humorLevel,
          professionalLevel,
          detailLevel
        },
        existingSessionId
      };
      localStorage.setItem('setupState', JSON.stringify(setupState));
    }, 500);

    return () => clearTimeout(timer);
  }, [humorLevel, professionalLevel, detailLevel, identificationResult, imagePreview]);

  // Render loading state during SSR/mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`min-h-screen p-6 relative overflow-hidden bg-gradient-to-br ${tc.backgroundGradient} ${tc.textPrimary}`}>
        <div className={`absolute inset-0 tech-grid pointer-events-none ${tc.techGridOpacity}`} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: tc.radialGradient }} />
        <div className="max-w-6xl mx-auto relative z-10 flex items-center justify-center min-h-[60vh]">
          <div className={tc.textMuted}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 relative overflow-hidden bg-gradient-to-br ${tc.backgroundGradient} ${tc.textPrimary}`}>
      {/* 背景装饰 */}
      <div className={`absolute inset-0 tech-grid pointer-events-none ${tc.techGridOpacity}`} style={{ transition: 'opacity 0.3s' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: tc.radialGradient }} />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Single column layout */}
        <div className="space-y-6">
          {/* Image Preview */}
          {imagePreview && (
            <div className={`${isDarkTheme ? 'tech-card' : 'tech-card-light'} p-4 ${tc.cardBorder} relative`}>
              <div className={`relative w-full h-72 mx-auto rounded-xl overflow-hidden border ${
                isDarkTheme
                  ? 'bg-black/40 border-cyan-500/20'
                  : 'bg-white border-slate-200'
              }`}>
                <Image
                  src={imagePreview}
                  alt="预览"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Upload Image / Text Input */}
          {!identificationResult && (
            <div className={`${isDarkTheme ? 'tech-card' : 'tech-card-light'} p-6 ${tc.cardBorder} relative`}>
              {/* 输入模式切换 */}
              <div className={`flex gap-2 p-1 rounded-lg mb-3 ${
                isDarkTheme ? 'bg-slate-800/70' : 'bg-slate-100'
                }`}>
                  <button
                    onClick={() => {
                      setInputMode('image');
                      setTextInput('');
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                      inputMode === 'image'
                        ? isDarkTheme
                          ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/40'
                          : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/40'
                        : isDarkTheme
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <PhotoIcon className="w-4 h-4" />
                      <span>图片</span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setInputMode('text');
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                      inputMode === 'text'
                        ? isDarkTheme
                          ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-lg shadow-rose-500/40'
                          : 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-lg shadow-rose-500/40'
                        : isDarkTheme
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <PencilSquareIcon className="w-4 h-4" />
                      <span>文字</span>
                    </span>
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  {/* 图片上传模式 */}
                  {inputMode === 'image' && (
                    <>
                      <div className="w-full">
                        <label className={`cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all group ${
                          isDarkTheme
                            ? 'border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/5'
                            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-500/5'
                        }`}>
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                              isDarkTheme ? 'bg-cyan-500/10' : 'bg-blue-500/10'
                            }`}>
                              <span className="text-2xl">📤</span>
                            </div>
                            <span className={`font-medium text-sm ${
                              isDarkTheme ? 'text-cyan-300' : 'text-blue-600'
                            }`}>点击上传图片</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {imageFile && !identificationResult && (
                        <button
                          onClick={identifyImage}
                          disabled={isIdentifying}
                          className={`tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-theme3'} flex items-center gap-2 px-5 py-2 text-sm`}
                        >
                          {isIdentifying ? (
                            <>
                              <BoltIcon className="w-4 h-4 animate-spin text-amber-400" />
                              <span>识别中...</span>
                            </>
                          ) : (
                            <>
                              <MagnifyingGlassIcon className="w-5 h-5 text-cyan-400" />
                              <span>开始识别</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}

                  {/* 文字输入模式 */}
                  {inputMode === 'text' && (
                    <>
                      <div className="w-full">
                        <textarea
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="例如：iPhone 15 Pro、一杯咖啡..."
                          className={`tech-input ${isDarkTheme ? '' : 'tech-input-theme3'} w-full h-36 resize-none text-sm`}
                        />
                      </div>

                      {textInput.trim() && !identificationResult && (
                        <button
                          onClick={identifyText}
                          disabled={isIdentifying}
                          className={`tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-theme3'} flex items-center gap-2 px-5 py-2 text-sm`}
                        >
                          {isIdentifying ? (
                            <>
                              <BoltIcon className="w-4 h-4 animate-spin text-amber-400" />
                              <span>识别中...</span>
                            </>
                          ) : (
                            <>
                              <MagnifyingGlassIcon className="w-5 h-5 text-cyan-400" />
                              <span>开始识别</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Identification Result - left column */}
            {identificationResult && (
              <div className={`${isDarkTheme ? 'tech-card' : 'tech-card-light'} p-4 ${tc.cardBorder} relative`}>
                <div className={`rounded-xl p-4 border ${
                  isDarkTheme
                    ? 'bg-gradient-to-br from-cyan-950/40 to-slate-900/70 border-cyan-500/30'
                    : 'bg-white border-cyan-100'
                }`}>
                  <div className="flex items-start gap-4">
                    {identificationResult.icon && (
                      <div className="text-5xl">{getDisplayIcon(identificationResult.icon)}</div>
                    )}
                    <div className="flex-1">
                      <div className={`text-xl font-bold mb-2 ${
                        isDarkTheme ? 'text-white' : 'text-slate-800'
                      }`}>{identificationResult.name}</div>
                      <div className={`text-sm mb-2 ${
                        isDarkTheme ? 'text-cyan-300/70' : 'text-blue-600/70'
                      }`}>
                        分类: {identificationResult.category}
                      </div>
                      <div className={`text-base leading-relaxed ${
                        isDarkTheme ? 'text-gray-300' : 'text-slate-600'
                      }`}>
                        {identificationResult.brief_description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 开始按钮 - 识别后显示 */}
            {identificationResult && (
              <div className={`${isDarkTheme ? 'tech-card' : 'tech-card-light'} p-6 ${tc.cardBorder} relative`}>
                <button
                  onClick={navigateToCanvas}
                  className={`tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-theme3'} w-full py-3 text-base flex items-center justify-center gap-2`}
                >
                  <RocketLaunchIcon className="w-5 h-5 text-emerald-400" />
                  <span>开始拆解</span>
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams support
export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
    </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
