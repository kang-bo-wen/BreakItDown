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

// 输入模式类型
type InputMode = 'image' | 'text';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // 输入模式：图片或文字
  const [inputMode, setInputMode] = useState<InputMode>('image');

  // 拆解模式：基础模式 或 生产模式
  const [breakdownMode, setBreakdownMode] = useState<'basic' | 'production'>('basic');

  // Theme state (true = dark, false = light)
  // Default to dark theme to match SSR, then sync with localStorage after mount
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

  // Load theme from localStorage after mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setIsDarkTheme(saved ? saved === 'dark' : true);
  }, []);

  // Sync theme with localStorage and listen for changes from other pages
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('theme');
      setIsDarkTheme(saved ? saved === 'dark' : true);
    };

    // Check for theme changes periodically (since storage event doesn't work in same window)
    const interval = setInterval(handleStorageChange, 500);

    return () => clearInterval(interval);
  }, []);

  // Step 1: Image upload related state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 1b: Text input related state
  const [textInput, setTextInput] = useState('');
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
    // Get existingSessionId if any
    const existingSetupData = localStorage.getItem('setupState');
    let existingSessionId = null;
    if (existingSetupData) {
      try {
        const parsed = JSON.parse(existingSetupData);
        existingSessionId = parsed.existingSessionId || null;
      } catch (e) {}
    }

    // Always save current setup state first (including breakdownMode and existingSessionId)
    const setupState = {
      identificationResult,
      imagePreview,
      promptSettings: {
        humorLevel,
        professionalLevel,
        detailLevel,
        promptMode,
        customPrompt
      },
      breakdownMode,
      existingSessionId
    };
    localStorage.setItem('setupState', JSON.stringify(setupState));

    // If we have an existing session, save to database first
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
              detailLevel,
              promptMode,
              customPrompt: promptMode === 'advanced' ? customPrompt : undefined
            },
            breakdownMode,
            identificationResult
          })
        });

      } catch (error) {
        console.error('保存设置失败:', error);
      }
    }

    // Check URL for sessionId first (higher priority)
    if (urlSessionId) {
      // Go directly to existing session
      router.push(`/canvas?sessionId=${urlSessionId}`);
      return;
    }

    // Check localStorage for existingSessionId
    if (existingSessionId) {
      router.push(`/canvas?sessionId=${existingSessionId}`);
      return;
    }

    // New session - mark and navigate

    // Mark that this is a fresh navigation from setup (to prevent duplicate session creation)
    localStorage.setItem('fromSetup', 'true');

    // Clear sidebar cache before navigating to ensure fresh data
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
          setHumorLevel(parsed.promptSettings.humorLevel ?? 50);
          setProfessionalLevel(parsed.promptSettings.professionalLevel ?? 70);
          setDetailLevel(parsed.promptSettings.detailLevel ?? 50);
          setPromptMode(parsed.promptSettings.promptMode ?? 'simple');
          setCustomPrompt(parsed.promptSettings.customPrompt ?? '');
        }
        if (parsed.breakdownMode) {
          setBreakdownMode(parsed.breakdownMode);
        }
      } catch (error) {
        console.error('恢复设置状态失败:', error);
      }
    }
  }, []); // Run on mount - empty array ensures it runs when returning from canvas

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
      // Fetch from database
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

      // Restore breakdown mode from session
      if (session.breakdownMode) {
        setBreakdownMode(session.breakdownMode);
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
        },
        breakdownMode: session.breakdownMode || 'basic',
        existingSessionId: sessionId
      };
      localStorage.setItem('setupState', JSON.stringify(setupState));
    } catch (error) {
      console.error('加载会话错误:', error);
    }
  };

  // Auto-save prompt settings to localStorage (debounced)
  useEffect(() => {
    // Get existingSessionId from localStorage
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
          detailLevel,
          promptMode,
          customPrompt
        },
        breakdownMode,
        existingSessionId
      };
      localStorage.setItem('setupState', JSON.stringify(setupState));
    }, 500);

    return () => clearTimeout(timer);
  }, [humorLevel, professionalLevel, detailLevel, promptMode, customPrompt, identificationResult, imagePreview, breakdownMode]);

  return (
    <div className={`min-h-screen p-8 relative overflow-hidden transition-colors duration-300 ${
      isDarkTheme
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800'
    }`}>
      {/* 背景装饰 */}
      <div className={`absolute inset-0 tech-grid pointer-events-none transition-opacity duration-300 ${isDarkTheme ? 'opacity-30' : 'opacity-10'}`} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDarkTheme
          ? 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
      }} />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title area */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isDarkTheme
                ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-lg shadow-cyan-500/30'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
            }`}>
              <span className="text-2xl">⚙️</span>
            </div>
            <h1 className={`text-4xl font-bold bg-clip-text text-transparent transition-colors duration-300 ${
              isDarkTheme
                ? 'bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500'
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600'
            }`}>
              调制界面
            </h1>
          </div>
          <p className={`text-sm transition-colors duration-300 ${isDarkTheme ? 'text-cyan-300/60' : 'text-blue-600/70'}`}>上传图片，识别物体，调整参数，开始拆解</p>
        </div>

        {/* Image Preview - always show if available */}
        {imagePreview && (
          <div className={`tech-card ${isDarkTheme ? '' : 'tech-card-light'} p-6 mb-6 transition-all ${isDarkTheme ? '' : 'bg-white/80'}`}>
            <div className={`relative w-full max-w-sm h-48 mx-auto rounded-xl overflow-hidden border transition-colors duration-300 ${
              isDarkTheme
                ? 'bg-black/40 border-cyan-500/20'
                : 'bg-blue-50 border-blue-200'
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

        {/* Upload Image / Text Input - only show if no identification result yet */}
        {!identificationResult && (
          <div className={`tech-card ${isDarkTheme ? '' : 'tech-card-light'} p-8 mb-6 ${isDarkTheme ? '' : 'bg-white/80'}`}>
            {/* 输入模式切换 */}
            <div className={`flex gap-2 p-1 rounded-lg mb-6 transition-colors duration-300 ${
              isDarkTheme ? 'bg-slate-800/70' : 'bg-blue-200'
            }`}>
              <button
                onClick={() => {
                  setInputMode('image');
                  setTextInput('');
                }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                  inputMode === 'image'
                    ? isDarkTheme
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : isDarkTheme
                      ? 'text-cyan-300/60 hover:text-white'
                      : 'text-blue-600/70 hover:text-blue-800'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🖼️</span>
                  <span>图片上传</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setInputMode('text');
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                  inputMode === 'text'
                    ? isDarkTheme
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : isDarkTheme
                      ? 'text-cyan-300/60 hover:text-white'
                      : 'text-blue-600/70 hover:text-blue-800'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>✏️</span>
                  <span>文字输入</span>
                </span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-6">
              {/* 图片上传模式 */}
              {inputMode === 'image' && (
                <>
                  {/* 上传区域 */}
                  <div className="w-full">
                    <label className={`cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all group ${
                      isDarkTheme
                        ? 'border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/5'
                        : 'border-blue-300 hover:border-blue-400 hover:bg-blue-500/5'
                    }`}>
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                          isDarkTheme ? 'bg-cyan-500/10' : 'bg-blue-500/10'
                        }`}>
                          <span className="text-3xl">📤</span>
                        </div>
                        <span className={`font-medium transition-colors duration-300 ${
                          isDarkTheme ? 'text-cyan-300' : 'text-blue-600'
                        }`}>点击上传图片</span>
                        <span className={`text-xs transition-colors duration-300 ${
                          isDarkTheme ? 'text-cyan-300/50' : 'text-blue-500/70'
                        }`}>支持 JPG, PNG, WEBP 格式</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* 图片预览 */}
                  {imagePreview && (
                    <div className={`relative w-full max-w-sm h-48 rounded-xl overflow-hidden border transition-colors duration-300 ${
                      isDarkTheme
                        ? 'bg-black/40 border-cyan-500/20'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <Image
                        src={imagePreview}
                        alt="预览"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  {/* 识别按钮 */}
                  {imageFile && !identificationResult && (
                    <button
                      onClick={identifyImage}
                      disabled={isIdentifying}
                      className={`tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-light'} flex items-center gap-3 px-8 py-4 text-lg`}
                    >
                      {isIdentifying ? (
                        <>
                          <span className="inline-block animate-spin text-xl">⚡</span>
                          <span>AI 识别中...</span>
                        </>
                      ) : (
                        <>
                          <span>🔍</span>
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
                    <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                      isDarkTheme ? 'text-cyan-100' : 'text-slate-700'
                    }`}>
                      输入物品名称或描述
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="例如：iPhone 15 Pro、一杯咖啡、汽车发动机..."
                      className={`tech-input ${isDarkTheme ? '' : 'tech-input-light'} w-full h-32 resize-none`}
                    />
                  </div>

                  {/* 识别按钮 */}
                  {textInput.trim() && !identificationResult && (
                    <button
                      onClick={identifyText}
                      disabled={isIdentifying}
                      className={`tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-light'} flex items-center gap-3 px-8 py-4 text-lg`}
                    >
                      {isIdentifying ? (
                        <>
                          <span className="inline-block animate-spin text-xl">⚡</span>
                          <span>AI 识别中...</span>
                        </>
                      ) : (
                        <>
                          <span>🔍</span>
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

        {/* Identification Result and Prompt Settings */}
        {identificationResult && (
          <div className={`tech-card ${isDarkTheme ? '' : 'tech-card-light'} p-6 mb-6 ${isDarkTheme ? '' : 'bg-white/80'}`}>
            {/* 识别结果展示 */}
            <div className={`rounded-xl p-5 border mb-6 transition-colors duration-300 ${
              isDarkTheme
                ? 'bg-gradient-to-br from-cyan-950/40 to-slate-900/70 border-cyan-500/30'
                : 'bg-gradient-to-br from-blue-100 to-white border-blue-300'
            }`}>
              <div className="flex items-start gap-4">
                {identificationResult.icon && (
                  <div className="text-4xl">{identificationResult.icon}</div>
                )}
                <div className="flex-1">
                  <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                    isDarkTheme ? 'text-white' : 'text-slate-800'
                  }`}>{identificationResult.name}</div>
                  <div className={`text-sm mb-2 transition-colors duration-300 ${
                    isDarkTheme ? 'text-cyan-300/70' : 'text-blue-600/70'
                  }`}>
                    分类: {identificationResult.category}
                  </div>
                  <div className={`text-sm leading-relaxed transition-colors duration-300 ${
                    isDarkTheme ? 'text-gray-300' : 'text-slate-600'
                  }`}>
                    {identificationResult.brief_description}
                  </div>
                </div>
              </div>
            </div>

            {/* 参数设置面板 */}
            <div className={`rounded-xl p-5 space-y-5 transition-colors duration-300 ${
              isDarkTheme
                ? 'bg-slate-900/70 border-cyan-500/20'
                : 'bg-blue-100 border-blue-300'
            } border`}>
              {/* 模式切换 */}
              <div className={`flex gap-2 p-1 rounded-lg transition-colors duration-300 ${
                isDarkTheme ? 'bg-slate-800/70' : 'bg-blue-200'
              }`}>
                <button
                  onClick={() => setPromptMode('simple')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    promptMode === 'simple'
                      ? isDarkTheme
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isDarkTheme
                        ? 'text-cyan-300/60 hover:text-white'
                        : 'text-blue-600/70 hover:text-blue-800'
                  }`}
                >
                  简单模式
                </button>
                <button
                  onClick={() => setPromptMode('advanced')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    promptMode === 'advanced'
                      ? isDarkTheme
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isDarkTheme
                        ? 'text-cyan-300/60 hover:text-white'
                        : 'text-blue-600/70 hover:text-blue-800'
                  }`}
                >
                  高级模式
                </button>
              </div>

              {/* 简单模式：滑块 */}
              {promptMode === 'simple' && (
                <div className="space-y-5">
                  {/* 幽默度 */}
                  <div>
                    <label className="block text-sm font-medium mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>😄</span>
                        <span className={isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}>幽默度</span>
                      </span>
                      <span className={`font-mono px-3 py-1 rounded-full transition-colors duration-300 ${
                        isDarkTheme
                          ? 'text-cyan-400 bg-cyan-500/10'
                          : 'text-blue-600 bg-blue-100'
                      }`}>{humorLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={humorLevel}
                      onChange={(e) => setHumorLevel(Number(e.target.value))}
                      className={`tech-slider ${isDarkTheme ? '' : 'tech-slider-light'}`}
                    />
                    <div className={`flex justify-between text-xs mt-2 transition-colors duration-300 ${
                      isDarkTheme ? 'text-cyan-300/50' : 'text-blue-500/70'
                    }`}>
                      <span>严肃</span>
                      <span>幽默</span>
                    </div>
                  </div>

                  {/* 专业度 */}
                  <div>
                    <label className="block text-sm font-medium mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>🎓</span>
                        <span className={isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}>专业度</span>
                      </span>
                      <span className={`font-mono px-3 py-1 rounded-full transition-colors duration-300 ${
                        isDarkTheme
                          ? 'text-cyan-400 bg-cyan-500/10'
                          : 'text-blue-600 bg-blue-100'
                      }`}>{professionalLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={professionalLevel}
                      onChange={(e) => setProfessionalLevel(Number(e.target.value))}
                      className={`tech-slider ${isDarkTheme ? '' : 'tech-slider-light'}`}
                    />
                    <div className={`flex justify-between text-xs mt-2 transition-colors duration-300 ${
                      isDarkTheme ? 'text-cyan-300/50' : 'text-blue-500/70'
                    }`}>
                      <span>通俗</span>
                      <span>专业</span>
                    </div>
                  </div>

                  {/* 细致度 */}
                  <div>
                    <label className="block text-sm font-medium mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>🔍</span>
                        <span className={isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}>细致度</span>
                      </span>
                      <span className={`font-mono px-3 py-1 rounded-full transition-colors duration-300 ${
                        isDarkTheme
                          ? 'text-cyan-400 bg-cyan-500/10'
                          : 'text-blue-600 bg-blue-100'
                      }`}>{detailLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={detailLevel}
                      onChange={(e) => setDetailLevel(Number(e.target.value))}
                      className={`tech-slider ${isDarkTheme ? '' : 'tech-slider-light'}`}
                    />
                    <div className={`flex justify-between text-xs mt-2 transition-colors duration-300 ${
                      isDarkTheme ? 'text-cyan-300/50' : 'text-blue-500/70'
                    }`}>
                      <span>简化</span>
                      <span>详细</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 高级模式：自定义 Prompt */}
              {promptMode === 'advanced' && (
                <div>
                  <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                    isDarkTheme ? 'text-cyan-100' : 'text-slate-700'
                  }`}>
                    自定义 Prompt 模板
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`使用 {{ITEM}} 代表物品名称，{{CONTEXT}} 代表上下文`}
                    className={`tech-input ${isDarkTheme ? '' : 'tech-input-light'} w-full h-40 resize-none font-mono text-sm`}
                  />
                  <button
                    onClick={() => {
                      const template = `请将 {{ITEM}} 拆解为主要组成部分。

要求：
1. 列出所有主要组件或材料
2. 每个部分提供简短描述
3. 标注是否为原材料（is_raw_material: true/false）
4. 为每个部分选择合适的 emoji 图标`;
                      setCustomPrompt(template);
                    }}
                    className={`mt-3 text-sm flex items-center gap-2 transition-colors duration-300 ${
                      isDarkTheme
                        ? 'text-cyan-400 hover:text-cyan-300'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <span>📋</span>
                    <span>加载默认模板</span>
                  </button>
                </div>
              )}
            </div>

            {/* 拆解模式选择 */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-400 mb-3">选择拆解模式</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBreakdownMode('basic')}
                  className={`p-3 rounded-lg border transition-all ${
                    breakdownMode === 'basic'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-lg mb-1">📦</div>
                  <div className="font-medium">基础模式</div>
                  <div className="text-xs text-slate-500">知识卡片展示</div>
                </button>
                <button
                  onClick={() => setBreakdownMode('production')}
                  className={`p-3 rounded-lg border transition-all ${
                    breakdownMode === 'production'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-lg mb-1">🏭</div>
                  <div className="font-medium">生产模式</div>
                  <div className="text-xs text-slate-500">含供应链分析</div>
                </button>
              </div>
            </div>

            {/* 开始按钮 */}
            <button
              onClick={navigateToCanvas}
              className={`mt-4 tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-light'} w-full py-4 text-lg flex items-center justify-center gap-3`}
            >
              <span className="text-xl">🚀</span>
              <span>开始拆解</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams support
export default function SetupPage() {
  // Read theme from localStorage on server/initial render
  const isDarkTheme = typeof window !== 'undefined'
    ? (localStorage.getItem('theme') !== 'light')
    : true;

  return (
    <Suspense fallback={
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
        isDarkTheme
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white'
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800'
      }`}>
      {/* 背景装饰 */}
      <div className={`absolute inset-0 tech-grid pointer-events-none transition-opacity duration-300 ${isDarkTheme ? 'opacity-30' : 'opacity-10'}`} />
      <div className="text-center relative z-10">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full border-4 animate-spin transition-colors duration-300 ${
          isDarkTheme
            ? 'border-cyan-500/30 border-t-cyan-400'
            : 'border-blue-300 border-t-blue-500'
        }`}></div>
        <p className={isDarkTheme ? 'text-cyan-300/60' : 'text-blue-600/70'}>加载中...</p>
      </div>
    </div>
  }>
      <SetupContent />
    </Suspense>
  );
}
