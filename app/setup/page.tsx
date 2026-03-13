'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from '../hooks/useTheme';
import { BoltIcon, MagnifyingGlassIcon, FaceSmileIcon, AcademicCapIcon, CubeIcon, BuildingOffice2Icon, RocketLaunchIcon, PhotoIcon, PencilSquareIcon, DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface IdentificationResult {
  name: string;
  category: string;
  brief_description: string;
  icon: string;
  imageUrl?: string;
  searchTerm?: string;
}

// 输入模式类型
type InputMode = 'image' | 'text' | 'template';

// 模板接口
interface Template {
  id: string;
  templateKey: string;
  displayName: string;
  category: string;
  keywords: string[];
  identificationResult: IdentificationResult;
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // 使用主题 hook
  const { theme, themeConfig } = useTheme();
  const isDarkTheme = theme === 'dark';
  const tc = themeConfig;
  const [mounted, setMounted] = useState(false);

  // 输入模式：图片、文字或模板
  const [inputMode, setInputMode] = useState<InputMode>('template');

  // 拆解模式：基础模式 或 生产模式
  const [breakdownMode, setBreakdownMode] = useState<'basic' | 'production'>('basic');

  // 模板相关状态
  const [templates, setTemplates] = useState<Record<string, Template[]>>({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Only render theme-specific content after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载模板
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates);
        }
      } catch (error) {
        console.error('加载模板失败:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // Step 1: Image upload related state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 1b: Text input related state
  const [textInput, setTextInput] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Step 2: Identification result and prompt settings
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [promptMode, setPromptMode] = useState<'simple' | 'advanced'>('simple');
  const [humorLevel, setHumorLevel] = useState(50);
  const [professionalLevel, setProfessionalLevel] = useState(70);
  const [detailLevel, setDetailLevel] = useState(50);
  const [customPrompt, setCustomPrompt] = useState('');

  // 视频过渡动画状态
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 选中的模板 key
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);

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

  // 选择模板
  const selectTemplate = async (template: Template) => {
    setIsIdentifying(true);
    setSelectedTemplateKey(template.templateKey);
    try {
      const result = template.identificationResult as IdentificationResult;
      setIdentificationResult(result);

      if (result.imageUrl) {
        setImagePreview(result.imageUrl);
      }

      // 预取完整模板数据（含 treeData），存入 localStorage 供 canvas 页面直接使用
      try {
        const response = await fetch(`/api/templates/${template.templateKey}`);
        if (response.ok) {
          const data = await response.json();
          if (data.template?.treeData) {
            localStorage.setItem('templateTreeData', JSON.stringify(data.template.treeData));
            localStorage.setItem('templateKey', template.templateKey);
          }
        }
      } catch (e) {
        console.error('预取模板树数据失败:', e);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      alert('加载模板失败，请重试');
    } finally {
      setIsIdentifying(false);
    }
  };

  // Save state to localStorage and navigate to canvas
  const navigateToCanvas = async () => {
    const doNavigate = async () => {
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
        detailLevel,
        promptMode,
        customPrompt
      },
      breakdownMode,
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

    // 机器狗模板：先播放视频动画
    const templateKey = selectedTemplateKey || localStorage.getItem('templateKey');
    if (templateKey === 'robot-dog') {
      setPendingNavigation(() => doNavigate);
      setShowVideoIntro(true);
    } else {
      doNavigate();
    }
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

      if (session.breakdownMode) {
        setBreakdownMode(session.breakdownMode);
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

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Image Preview + Upload + Identification */}
          <div className="space-y-6">
            {/* Image Preview */}
            {imagePreview && (
              <div className={`tech-card p-4 ${tc.cardBg} ${tc.cardBorder} relative`}>
                <span className={`iconify absolute -right-2 -bottom-2 text-7xl ${tc.decorationIcon}`} data-icon="heroicons:photo" />
                <div className={`relative w-full h-72 mx-auto rounded-xl overflow-hidden border ${
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

            {/* Upload Image / Text Input */}
            {!identificationResult && (
              <div className={`tech-card p-6 ${tc.cardBg} ${tc.cardBorder} relative`}>
                <span className={`iconify absolute -right-2 -bottom-2 text-7xl ${tc.decorationIcon}`} data-icon="heroicons:cloud-arrow-up" />
                {/* 输入模式切换 */}
                <div className={`flex gap-2 p-1 rounded-lg mb-3 ${
                  isDarkTheme ? 'bg-slate-800/70' : 'bg-blue-200'
                }`}>
                  <button
                    onClick={() => {
                      setInputMode('template');
                      setTextInput('');
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                      inputMode === 'template'
                        ? isDarkTheme
                          ? 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white shadow-lg shadow-purple-500/40'
                          : 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white shadow-lg shadow-purple-500/40'
                        : isDarkTheme
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <CubeIcon className="w-4 h-4" />
                      <span>模板</span>
                    </span>
                  </button>
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

                  {/* 模板选择模式 */}
                  {inputMode === 'template' && (
                    <div className="w-full max-h-[600px] overflow-y-auto pr-2">
                      {isLoadingTemplates ? (
                        <div className="flex items-center justify-center py-12">
                          <BoltIcon className="w-6 h-6 animate-spin text-purple-400" />
                          <span className={`ml-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>加载模板中...</span>
                        </div>
                      ) : Object.keys(templates).length === 0 ? (
                        <div className={`text-center py-12 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          <div className="text-4xl mb-3">📦</div>
                          <div>暂无可用模板</div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(templates).map(([category, categoryTemplates]) => (
                            <div key={category}>
                              <h3 className={`text-2xl font-black mb-4 flex items-center gap-3 pb-2 border-b ${
                                isDarkTheme ? 'border-purple-500/30' : 'border-purple-300/40'
                              }`}>
                                <span className="text-3xl drop-shadow-lg">
                                  {category === '大国重器' && '🚀'}
                                  {category === '极客定制' && '⚙️'}
                                  {category === '生活黑科技' && '✨'}
                                  {category === '绿色新消费' && '🌱'}
                                </span>
                                <span className={`tracking-wide ${
                                  isDarkTheme
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-violet-300'
                                    : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600'
                                }`}>
                                  {category}
                                </span>
                              </h3>
                              <div className="grid grid-cols-2 gap-3">
                                {categoryTemplates.map((template) => (
                                  <button
                                    key={template.id}
                                    onClick={() => selectTemplate(template)}
                                    disabled={isIdentifying}
                                    className={`group relative p-4 rounded-xl border-2 transition-all text-left ${
                                      isDarkTheme
                                        ? 'bg-slate-800/50 border-slate-700 hover:border-purple-500 hover:bg-slate-800'
                                        : 'bg-white border-slate-200 hover:border-purple-400 hover:bg-purple-50'
                                    } ${isIdentifying ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                  >
                                    <div className="flex flex-col gap-2">
                                      <div className="text-3xl">{template.identificationResult.icon}</div>
                                      <div className={`font-medium text-sm ${
                                        isDarkTheme ? 'text-white' : 'text-slate-800'
                                      }`}>
                                        {template.displayName}
                                      </div>
                                      <div className={`text-xs ${
                                        isDarkTheme ? 'text-slate-400' : 'text-slate-500'
                                      }`}>
                                        {template.identificationResult.category}
                                      </div>
                                    </div>
                                    <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                      isDarkTheme ? 'text-purple-400' : 'text-purple-600'
                                    }`}>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Identification Result - left column */}
            {identificationResult && (
              <div className={`tech-card p-4 ${tc.cardBg} ${tc.cardBorder} relative`}>
                <span className={`iconify absolute -right-2 -bottom-2 text-7xl ${tc.decorationIcon}`} data-icon="heroicons:sparkles" />
                <button
                  onClick={() => {
                    setIdentificationResult(null);
                    setImageFile(null);
                    setImagePreview(null);
                    setTextInput('');
                  }}
                  className={`mb-3 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    isDarkTheme
                      ? 'text-cyan-300/70 hover:text-cyan-200 hover:bg-cyan-500/10'
                      : 'text-blue-500/70 hover:text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  返回
                </button>
                <div className={`rounded-xl p-4 border ${
                  isDarkTheme
                    ? 'bg-gradient-to-br from-cyan-950/40 to-slate-900/70 border-cyan-500/30'
                    : 'bg-gradient-to-br from-blue-100 to-white border-blue-300'
                }`}>
                  <div className="flex items-start gap-4">
                    {identificationResult.icon && (
                      <div className="text-5xl">{identificationResult.icon}</div>
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
          </div>

          {/* Right column: Mode Toggle + Sliders + Breakdown Mode + Start Button */}
          <div className="space-y-6">
            {/* Parameters Panel */}
            {identificationResult && (
              <>
                <div className={`tech-card p-6 ${tc.cardBg} ${tc.cardBorder} relative`}>
                <span className={`iconify absolute -right-2 -bottom-2 text-7xl ${tc.decorationIcon}`} data-icon="heroicons:sliders" />
                  <div className={`rounded-xl p-6 space-y-6 ${
                    isDarkTheme
                      ? 'bg-slate-900/70 border-cyan-500/20'
                      : 'bg-blue-100 border-blue-300'
                  } border`}>
                    {/* 模式切换 */}
                    <div className={`flex gap-2 p-1 rounded-lg ${
                      isDarkTheme ? 'bg-slate-800/70' : 'bg-blue-200'
                    }`}>
                      <button
                        onClick={() => setPromptMode('simple')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                          promptMode === 'simple'
                            ? isDarkTheme
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30'
                              : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30'
                            : isDarkTheme
                              ? 'text-orange-300/60 hover:text-white'
                              : 'text-orange-600/70 hover:text-orange-800'
                        }`}
                      >
                        简单模式
                      </button>
                      <button
                        onClick={() => setPromptMode('advanced')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                          promptMode === 'advanced'
                            ? isDarkTheme
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                            : isDarkTheme
                              ? 'text-emerald-300/60 hover:text-white'
                              : 'text-emerald-600/70 hover:text-emerald-800'
                        }`}
                      >
                        高级模式
                      </button>
                    </div>

                    {/* 简单模式：滑块 */}
                    {promptMode === 'simple' && (
                      <div className="space-y-6">
                        {/* 幽默度 */}
                        <div>
                          <label className="block text-base font-medium mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <FaceSmileIcon className="w-5 h-5 text-yellow-400" />
                              <span className={isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}>幽默度</span>
                            </span>
                            <span className={`font-mono px-2 py-0.5 rounded-full text-xs transition-colors duration-300 ${
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
                            className={`tech-slider-humor w-full`}
                          />
                          <div className={`flex justify-between text-xs mt-0.5 transition-colors duration-300 ${
                              isDarkTheme ? 'text-cyan-300/50' : 'text-blue-500/70'
                            }`}>
                            <span>严肃</span>
                            <span>幽默</span>
                          </div>
                        </div>

                        {/* 专业度 */}
                        <div>
                          <label className="block text-base font-medium mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <AcademicCapIcon className="w-5 h-5 text-blue-400" />
                              <span className={isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}>专业度</span>
                            </span>
                            <span className={`font-mono px-2 py-0.5 rounded-full text-xs transition-colors duration-300 ${
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
                            className={`tech-slider-professional w-full`}
                          />
                          <div className={`flex justify-between text-xs mt-0.5 transition-colors duration-300 ${
                              isDarkTheme ? 'text-cyan-300/50' : 'text-blue-500/70'
                            }`}>
                            <span>通俗</span>
                            <span>专业</span>
                          </div>
                        </div>

                        {/* 细致度 */}
                        <div>
                          <label className="block text-base font-medium mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <MagnifyingGlassIcon className="w-5 h-5 text-cyan-400" />
                              <span className={isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}>细致度</span>
                            </span>
                            <span className={`font-mono px-2 py-0.5 rounded-full text-xs transition-colors duration-300 ${
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
                            className={`tech-slider-detail w-full`}
                          />
                          <div className={`flex justify-between text-xs mt-0.5 transition-colors duration-300 ${
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
                        <label className={`block text-base font-medium mb-2 ${
                          isDarkTheme ? 'text-cyan-100' : 'text-slate-700'
                        }`}>
                          自定义 Prompt 模板
                        </label>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder={`使用 {{ITEM}} 代表物品名称`}
                          className={`tech-input ${isDarkTheme ? '' : 'tech-input-theme3'} w-full h-40 resize-none font-mono text-sm`}
                        />
                        <button
                          onClick={() => {
                            const template = `请将 {{ITEM}} 拆解为主要组成部分。

要求：
1. 列出所有主要组件或材料
2. 每个部分提供简短描述
3. 标注是否为原材料`;
                            setCustomPrompt(template);
                          }}
                          className={`mt-2 text-xs flex items-center gap-1.5 transition-colors duration-300 ${
                            isDarkTheme
                              ? 'text-cyan-400 hover:text-cyan-300'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          <span>加载默认模板</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 拆解模式选择 */}
                <div className={`tech-card p-4 ${tc.cardBg} ${tc.cardBorder} relative`}>
                <span className={`iconify absolute -right-2 -bottom-2 text-7xl ${tc.decorationIcon}`} data-icon="heroicons:square-3-stack-3d" />
                  <div className="text-sm text-slate-400 mb-3">选择拆解模式</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBreakdownMode('basic')}
                      className={`p-3 rounded-lg border ${
                        breakdownMode === 'basic'
                          ? isDarkTheme
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-gradient-to-r from-cyan-100 to-blue-100 border-cyan-400 text-cyan-600'
                          : isDarkTheme
                            ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <CubeIcon className="w-6 h-6 text-cyan-400" />
                      <div className="font-medium">基础模式</div>
                      <div className="text-xs text-slate-500">知识卡片</div>
                    </button>
                    <button
                      onClick={() => setBreakdownMode('production')}
                      className={`p-3 rounded-lg border ${
                        breakdownMode === 'production'
                          ? isDarkTheme
                            ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400 text-violet-300'
                            : 'bg-gradient-to-r from-violet-100 to-purple-100 border-violet-400 text-violet-600'
                          : isDarkTheme
                            ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <BuildingOffice2Icon className="w-6 h-6 text-violet-400" />
                      <div className="font-medium">生产模式</div>
                      <div className="text-xs text-slate-500">含供应链</div>
                    </button>
                  </div>
                </div>

                {/* 开始按钮 */}
                <button
                  onClick={navigateToCanvas}
                  disabled={isIdentifying}
                  className={`tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-theme3'} w-full py-3 text-base flex items-center justify-center gap-2 ${isIdentifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isIdentifying ? (
                    <>
                      <BoltIcon className="w-5 h-5 animate-spin text-amber-400" />
                      <span>准备中...</span>
                    </>
                  ) : (
                    <>
                      <RocketLaunchIcon className="w-5 h-5 text-emerald-400" />
                      <span>开始拆解</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Placeholder when no identification result */}
            {!identificationResult && (
              <div className={`tech-card p-12 flex items-center justify-center min-h-[500px] ${tc.cardBg} ${tc.cardBorder} relative`}>
                <span className={`iconify absolute -right-2 -bottom-2 text-7xl ${tc.decorationIcon}`} data-icon="heroicons:arrow-right" />
                <div className={`text-center ${
                  isDarkTheme ? 'text-cyan-300/40' : 'text-blue-400/50'
                }`}>
                  <div className="text-5xl mb-3">⬅️</div>
                  <div className="text-base">请先上传图片或输入文字进行识别</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 机器狗视频过渡动画遮罩 */}
      {showVideoIntro && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src="/videos/robot-dog-intro.mp4"
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            onEnded={() => {
              setShowVideoIntro(false);
              if (pendingNavigation) pendingNavigation();
            }}
          />
          {/* 跳过按钮 */}
          <button
            onClick={() => {
              setShowVideoIntro(false);
              if (pendingNavigation) pendingNavigation();
            }}
            className="absolute bottom-8 right-8 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full backdrop-blur-sm border border-white/20 transition-all"
          >
            跳过 →
          </button>
        </div>
      )}
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
