'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../hooks/useTheme';

// 步骤类型
type AnalysisStep =
  | 'product-planning'   // 产品雏形规划
  | 'competitor-analysis' // 竞品分析
  | 'supplier-select'   // 选择供应商
  | 'customization'      // 回答定制问题
  | 'process-select'    // 选择工艺方案
  | 'result'            // 评估结果
  | 'final-report';     // 最终报告

// 产品雏形规划
interface ProductPlan {
  useCases: string[];
  targetPriceRange: { min: number; max: number; currency: string };
  materials: string[];
  features: string[];
}

// 竞品分析
interface CompetitorAnalysis {
  marketPrice: { low: number; mid: number; high: number; currency: string };
  competitors: { name: string; price: number; features: string[]; marketShare: string; brand?: string; taobaoUrl?: string; '1688Url'?: string }[];
  pricingAdvice: string;
  marketTrends: string;
  searchKeyword: string; // 用于1688搜索的关键字
}

// 供应商
interface Supplier {
  name: string;
  specs: string;
  price: number;
  reliability: number;
  leadTime: number;
}

// 定制问题
interface CustomizationQuestion {
  question: string;
  type: string;
  options?: string[];
}

// 工艺方案
interface Process {
  name: string;
  description: string;
  cost: number;
  risk: string;
  carbonEmission: number;
}

// 分析结果
interface AnalysisResult {
  cost: {
    totalCost: number;
    breakdown: { material: number; processing: number; shipping: number; other: number };
    analysis: string;
  } | null;
  risk: {
    riskLevel: string;
    risks: { type: string; description: string; impact: string; mitigation: string }[];
    overallAssessment: string;
  } | null;
  carbon: {
    totalEmission: number;
    breakdown: { production: number; transportation: number; material: number };
    rating: string;
    analysis: string;
  } | null;
  breaking: {
    recommendation: string;
    confidence: number;
    reasoning: string;
    keyFactors: string[];
  } | null;
}

// 最终报告
interface FinalReport {
  businessBase: {
    marketPosition: string;
    competitiveAdvantages: string[];
    targetCustomers: string;
    priceStrategy: string;
  };
  supplyChain: {
    supplierOverview: string;
    costStructure: string;
    riskAssessment: string;
    optimization: string;
  };
  productionTimeline: {
    phases: { phase: string; duration: string; milestones: string[] }[];
    bottleneck: string;
    recommendations: string;
  };
  lifecycle: {
    launchPlan: string;
    expectedLifecycle: string;
    updatePlan: string;
    endOfLife: string;
  };
}

function ProductionAnalysisPage() {
  const { theme, themeConfig } = useTheme();
  const isDarkTheme = theme === 'dark';
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('sessionId') || '';
  const partName = searchParams.get('partName') || '';
  const partId = searchParams.get('partId') || '';

  // 确认弹窗状态
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // 完成定制并返回 canvas
  const handleCompleteClick = () => {
    // 显示确认弹窗
    setShowCompleteConfirm(true);
  };

  // 确认完成
  const confirmComplete = () => {
    // 保存完成状态到 localStorage，供 canvas 页面读取
    const completeData = {
      partId,
      isCompleted: true,
      timestamp: Date.now()
    };
    localStorage.setItem('nodeCompleted', JSON.stringify(completeData));
    // 跳转到 canvas 页面
    router.push(`/canvas?sessionId=${sessionId}`);
  };

  // 导出用户偏好数据
  const handleExportData = () => {
    // 构建导出数据
    const exportData = {
      // 基本信息
      partName,
      partId,

      // 产品雏形规划
      productPlan: productPlan ? {
        useCases: productPlan.useCases,
        targetPriceRange: productPlan.targetPriceRange,
        materials: productPlan.materials,
        features: productPlan.features
      } : null,

      // 用户选择（使用场景、预算、材料、特性）
      selectedUseCases,
      selectedBudget,
      selectedMaterials,
      selectedFeatures,

      // 供应商选择
      selectedSupplier: selectedSupplier ? {
        name: selectedSupplier.name,
        specs: selectedSupplier.specs,
        price: selectedSupplier.price,
        reliability: selectedSupplier.reliability,
        leadTime: selectedSupplier.leadTime
      } : null,

      // 定制参数与问答
      customizationQuestions,
      customizationAnswers,

      // 生产工艺选择
      selectedProcess: selectedProcess ? {
        name: selectedProcess.name,
        description: selectedProcess.description,
        cost: selectedProcess.cost,
        risk: selectedProcess.risk,
        carbonEmission: selectedProcess.carbonEmission
      } : null,

      exportedAt: new Date().toISOString()
    };

    // 转换为 JSON 字符串并格式化
    const jsonString = JSON.stringify(exportData, null, 2);

    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${partName || 'production-analysis'}-偏好数据-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 当前步骤
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('product-planning');

  // 进入最终报告后，3秒自动弹出确认框
  useEffect(() => {
    if (currentStep === 'final-report') {
      const timer = setTimeout(() => {
        setShowCompleteConfirm(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // 数据状态
  const [productPlan, setProductPlan] = useState<ProductPlan | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);

  // 用户选择状态
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [customizationQuestions, setCustomizationQuestions] = useState<CustomizationQuestion[]>([]);
  const [customizationAnswers, setCustomizationAnswers] = useState<Record<string, string>>({});

  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);

  // 当前分析的Agent进度
  const [currentAgent, setCurrentAgent] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // AI思考过程流式内容
  const [aiThinkingContent, setAiThinkingContent] = useState<string>('');

  // 加载进度
  useEffect(() => {
    if (!sessionId || !partId || isLoaded) return;

    const loadProgress = async () => {
      try {
        const res = await fetch(`/api/production-analysis-progress?sessionId=${sessionId}&partId=${partId}`);
        const data = await res.json();
        if (data.data) {
          const progress = data.data;
          setCurrentStep(progress.currentStep as AnalysisStep || 'product-planning');
          setProductPlan(progress.productPlan || null);
          setCompetitorAnalysis(progress.competitorAnalysis || null);
          setSuppliers(progress.suppliers || []);
          setSelectedSupplier(progress.selectedSupplier || null);
          setCustomizationQuestions(progress.customizationQuestions || []);
          setCustomizationAnswers(progress.customizationAnswers || {});
          setProcesses(progress.processes || []);
          setSelectedProcess(progress.selectedProcess || null);
          setAnalysisResult(progress.analysisResult || null);
          setFinalReport(progress.finalReport || null);
        }
        setIsLoaded(true);
      } catch (err) {
        console.error('加载进度失败:', err);
        setIsLoaded(true);
      }
    };

    loadProgress();
  }, [sessionId, partId, isLoaded]);

  // 保存进度到数据库
  const saveProgress = useCallback(async (completed: boolean = false) => {
    if (!sessionId) return;

    try {
      await fetch('/api/production-analysis-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          partId,
          partName,
          currentStep,
          productPlan,
          competitorAnalysis,
          suppliers,
          selectedSupplier,
          customizationQuestions,
          customizationAnswers,
          processes,
          selectedProcess,
          analysisResult,
          finalReport,
          isCompleted: completed
        })
      });
    } catch (err) {
      console.error('保存进度失败:', err);
    }
  }, [sessionId, partId, partName, currentStep, productPlan, competitorAnalysis, suppliers, selectedSupplier, customizationQuestions, customizationAnswers, processes, selectedProcess, analysisResult, finalReport]);

  // 自动保存进度（当状态变化时）
  useEffect(() => {
    if (!isLoaded || !sessionId || !partId) return;

    const timer = setTimeout(() => {
      saveProgress(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentStep, productPlan, competitorAnalysis, suppliers, selectedSupplier, customizationQuestions, customizationAnswers, processes, selectedProcess, analysisResult, finalReport, isLoaded, sessionId, partId, saveProgress]);

  // 调用 API
  const callAPI = async (action: string, data: any) => {
    const response = await fetch('/api/plugins/smart-manufacturing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    if (!response.ok) throw new Error('API请求失败');
    const result = await response.json();
    return result.data;
  };

  // AI思考过程流式输出组件
  // 骨架屏加载组件
  const renderSkeletonCard = (width: string = 'full') => (
    <div className={`rounded-xl p-5 animate-pulse ${width === 'half' ? 'md:col-span-1' : 'md:col-span-2'} ${
      isDarkTheme ? 'bg-white/5' : 'bg-slate-100 border border-slate-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className={`h-5 w-32 rounded ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
      </div>
      <div className="space-y-3">
        <div className={`h-4 w-full rounded ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className={`h-4 w-3/4 rounded ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
        <div className="flex gap-2 mt-4">
          <div className={`h-8 w-20 rounded-lg ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className={`h-8 w-20 rounded-lg ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className={`h-8 w-20 rounded-lg ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
        </div>
      </div>
    </div>
  );

  const renderSkeletonCards = (count: number = 3) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${i === 0 && count % 2 === 1 ? 'md:col-span-2' : ''}`}>
          {renderSkeletonCard(i === 0 && count % 2 === 1 ? 'full' : 'half')}
        </div>
      ))}
    </div>
  );

  const renderAIThinking = () => (
    <div className={`rounded-2xl border overflow-hidden shadow-lg ${
      isDarkTheme
        ? 'bg-gradient-to-br from-cyan-950/50 via-black/60 to-blue-950/30 border-cyan-500/20 shadow-cyan-500/10'
        : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      {/* 顶部装饰条 */}
      <div className={`h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-pulse ${isDarkTheme ? '' : 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500'}`} />

      <div className={`px-5 py-3 flex items-center gap-3 border-b ${
        isDarkTheme ? 'bg-cyan-500/10 border-white/5' : 'bg-cyan-50 border-slate-100'
      }`}>
        <div className="flex gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${
            isDarkTheme ? 'bg-cyan-500 shadow-cyan-400/50' : 'bg-cyan-500 shadow-cyan-300/50'
          }`}></div>
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${
            isDarkTheme ? 'bg-blue-500 shadow-cyan-400/50' : 'bg-cyan-500 shadow-cyan-300/50'
          }`} style={{animationDelay: '0.2s'}}></div>
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${
            isDarkTheme ? 'bg-cyan-500 shadow-cyan-400/50' : 'bg-cyan-500 shadow-cyan-300/50'
          }`} style={{animationDelay: '0.4s'}}></div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
            isDarkTheme ? 'bg-gradient-to-br from-cyan-500 to-cyan-500' : 'bg-gradient-to-br from-cyan-500 to-cyan-600'
          }`}>
            <svg className={`w-3 h-3 ${isDarkTheme ? 'text-white' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className={`text-sm font-medium ${isDarkTheme ? 'text-cyan-300' : 'text-cyan-700'}`}>AI 智能分析中</span>
        </div>

        {/* Agent进度指示器 */}
        {currentAgent && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex gap-1">
              {['cost', 'risk', 'carbon', 'recommend'].map((agent, index) => {
                const agentNames: Record<string, string> = {
                  cost: '成本分析',
                  risk: '风险评估',
                  carbon: '碳排放',
                  recommend: '综合决策'
                };
                const isActive = currentAgent === agent;
                const isCompleted = (['cost', 'risk', 'carbon', 'recommend'].indexOf(currentAgent) > index);
                return (
                  <div
                    key={agent}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isActive ? (isDarkTheme ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-600 animate-pulse') :
                      isCompleted ? (isDarkTheme ? 'bg-green-400' : 'bg-green-500') :
                      (isDarkTheme ? 'bg-gray-600' : 'bg-slate-300')
                    }`}
                    title={agentNames[agent]}
                  />
                );
              })}
            </div>
            <span className={`text-xs ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {currentAgent === 'cost' && '分析成本中...'}
              {currentAgent === 'risk' && '评估风险中...'}
              {currentAgent === 'carbon' && '计算碳排放中...'}
              {currentAgent === 'recommend' && '生成决策中...'}
            </span>
          </div>
        )}
      </div>

      <div className={`p-5 font-mono text-sm max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed ${
        isDarkTheme ? 'text-gray-300' : 'text-slate-700'
      }`}>
        <span className={isDarkTheme ? 'text-gray-300' : 'text-slate-700'}>
          {aiThinkingContent || (isLoading ? '正在深度分析...' : '')}
        </span>
        {isLoading && (
          <span className="inline-flex gap-1 ml-1">
            <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkTheme ? 'bg-cyan-400' : 'bg-cyan-600'}`}></span>
            <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkTheme ? 'bg-cyan-400' : 'bg-cyan-600'}`} style={{animationDelay: '0.1s'}}></span>
            <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkTheme ? 'bg-cyan-400' : 'bg-cyan-600'}`} style={{animationDelay: '0.2s'}}></span>
          </span>
        )}
      </div>
    </div>
  );

  // 调用流式 API (使用 fetch 读取流)
  const callStreamingAPI = async (action: string, data: any): Promise<any> => {
    setAiThinkingContent('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/plugins/smart-manufacturing/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let jsonResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.type === 'content') {
                setAiThinkingContent(prev => prev + parsed.content);
              } else if (parsed.type === 'json') {
                jsonResult = parsed.data;
              } else if (parsed.type === 'end') {
                setIsLoading(false);
                // 检查是否成功获取数据
                if (!jsonResult) {
                  throw new Error('AI解析失败，请重试');
                }
                return jsonResult;
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message);
              }
            } catch (e) {
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      }

      setIsLoading(false);
      return jsonResult;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  // 步骤1: 产品雏形规划
  const handleProductPlanning = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callStreamingAPI('product_planning', { partName });
      if (result?.productPlan) {
        setProductPlan(result.productPlan);
        // 默认不选中任何选项，让用户自己选择
        setSelectedUseCases([]);
        if (result.productPlan.targetPriceRange) {
          setSelectedBudget(`${result.productPlan.targetPriceRange.min}-${result.productPlan.targetPriceRange.max}`);
        }
        setSelectedMaterials([]);
        setSelectedFeatures([]);
      }
    } catch (err) {
      setError('生成产品规划失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存产品规划选择并进入下一步
  const handleConfirmProductPlan = () => {
    if (productPlan) {
      setProductPlan({
        ...productPlan,
        useCases: selectedUseCases,
        targetPriceRange: {
          min: parseInt(selectedBudget.split('-')[0]) || 0,
          max: parseInt(selectedBudget.split('-')[1]) || 9999,
          currency: 'CNY'
        },
        materials: selectedMaterials,
        features: selectedFeatures
      });
    }
    setAiThinkingContent('');
    setCurrentStep('competitor-analysis');
  };

  // 步骤2: 竞品分析
  const handleCompetitorAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callStreamingAPI('market_research', { partName, productPlan });
      if (result?.marketResearch) {
        setCompetitorAnalysis(result.marketResearch);
      }
    } catch (err) {
      setError('竞品分析失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 步骤3: 搜索供应商
  const handleFindSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 传递产品规划信息（材料、预算等）以便更精准地搜索供应商
      const result = await callStreamingAPI('find_suppliers', {
        partName,
        selectedMaterials,
        selectedBudget,
        selectedFeatures
      });
      setSuppliers(result.suppliers || []);
    } catch (err) {
      setError('搜索供应商失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 选择供应商（不跳转到下一步）
  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  // 步骤2: 生成定制问题
  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callStreamingAPI('start_customization', { partName });
      setCustomizationQuestions(result.questions || []);
    } catch (err) {
      setError('生成定制问题失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 提交定制答案后，进入下一步
  const handleSubmitCustomization = () => {
    setAiThinkingContent('');
    setCurrentStep('process-select');
  };

  // 步骤3: 生成工艺方案
  const handleGenerateProcesses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 处理"其他"选项，合并用户输入的内容
      const processedAnswers: Record<string, string> = {};
      Object.keys(customizationAnswers).forEach(key => {
        if (key.endsWith('_other')) return; // 跳过其他输入框的key
        const answer = customizationAnswers[key];
        const otherInput = customizationAnswers[`${key}_other`];
        if (answer === '其他' && otherInput) {
          processedAnswers[key] = `其他: ${otherInput}`;
        } else {
          processedAnswers[key] = answer;
        }
      });

      const result = await callStreamingAPI('generate_processes', {
        partName,
        customizedParams: processedAnswers
      });
      setProcesses(result.processes || []);
    } catch (err) {
      setError('生成工艺方案失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 选择工艺后，跳转到结果页面并开始分析
  const handleSelectProcess = (process: Process) => {
    setSelectedProcess(process);
    // 立即跳转到结果页面，显示分析中的状态
    setCurrentStep('result');
    // 然后开始分析
    runAnalysis(process);
  };

  // 步骤4: 运行分析（成本、风险、碳排放）
  const runAnalysis = async (process: Process) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      // 串行执行各个分析（以便正确显示AI思考过程）
      setCurrentAgent('cost');
      const costRes = await callStreamingAPI('analyze_cost', { option: process, optionType: 'process' });

      setCurrentAgent('risk');
      const riskRes = await callStreamingAPI('assess_risk', { option: process, optionType: 'process' });

      setCurrentAgent('carbon');
      const carbonRes = await callStreamingAPI('assess_carbon', { option: process, optionType: 'process' });

      // 综合决策（显示思考过程）
      setCurrentAgent('recommend');
      const breakingRes = await callStreamingAPI('recommend', {
        costData: costRes,
        riskData: riskRes,
        carbonData: carbonRes
      });

      setCurrentAgent('');

      setAnalysisResult({
        cost: costRes?.cost || costRes || null,
        risk: riskRes?.risk || riskRes || null,
        carbon: carbonRes?.carbon || carbonRes || null,
        breaking: breakingRes || null
      });

      setAiThinkingContent('');
      setCurrentStep('result');

      // 保存为已完成
      if (sessionId) {
        try {
          await fetch('/api/production-analysis-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              partId,
              partName,
              currentStep: 'result',
              productPlan,
              competitorAnalysis,
              suppliers,
              selectedSupplier,
              customizationQuestions,
              customizationAnswers,
              processes,
              selectedProcess: process,
              analysisResult: {
                cost: costRes?.cost || null,
                risk: riskRes?.risk || null,
                carbon: carbonRes?.carbon || null,
                breaking: breakingRes?.recommendation || null
              },
              isCompleted: true
            })
          });
        } catch (err) {
          console.error('保存完成状态失败:', err);
        }
      }
    } catch (err) {
      setError('分析失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成最终报告
  const handleGenerateFinalReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callStreamingAPI('generate_final_report', {
        partName,
        productPlan,
        competitorAnalysis,
        selectedSupplier,
        customizationAnswers,
        selectedProcess,
        analysisResult
      });
      if (result?.finalReport) {
        setFinalReport(result.finalReport);
      }
    } catch (err) {
      setError('生成报告失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 重新开始
  const handleRestart = async () => {
    setCurrentStep('product-planning');
    setProductPlan(null);
    setCompetitorAnalysis(null);
    setSelectedUseCases([]);
    setSelectedBudget('');
    setSelectedMaterials([]);
    setSelectedFeatures([]);
    setSuppliers([]);
    setSelectedSupplier(null);
    setCustomizationQuestions([]);
    setCustomizationAnswers({});
    setProcesses([]);
    setSelectedProcess(null);
    setAnalysisResult(null);
    setFinalReport(null);
    setError(null);

    // 删除数据库中的进度
    if (sessionId && partId) {
      try {
        await fetch(`/api/production-analysis-progress?sessionId=${sessionId}&partId=${partId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('删除进度失败:', err);
      }
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    const steps = [
      { key: 'product-planning', label: '产品规划' },
      { key: 'competitor-analysis', label: '竞品分析' },
      { key: 'supplier-select', label: '供应商' },
      { key: 'customization', label: '定制参数' },
      { key: 'process-select', label: '工艺方案' },
      { key: 'result', label: '评估结果' },
      { key: 'final-report', label: '最终报告' }
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="mb-6">
        {/* 移动端：紧凑进度条 */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>进度</span>
            <span className={`text-sm ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`}>{currentIndex + 1} / {steps.length}</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 桌面端：紧凑步骤指示器 - 单行 */}
        <div className={`hidden md:flex items-center justify-between gap-0 rounded-xl p-1.5 ${
          isDarkTheme ? 'bg-white/5' : 'bg-slate-100'
        }`}>
          {steps.map((step, index) => {
            const isCompleted = currentIndex > index;
            const isCurrent = currentStep === step.key;

            return (
              <div key={step.key} className="flex-1 flex items-center">
                <div
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 text-center ${
                    isCurrent
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                      : isCompleted
                        ? (isDarkTheme ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700')
                        : (isDarkTheme ? 'text-gray-500' : 'text-slate-500')
                  }`}
                >
                  {step.label}
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-1 transition-colors ${
                    isCompleted ? (isDarkTheme ? 'text-cyan-500' : 'text-cyan-500') : (isDarkTheme ? 'text-gray-600' : 'text-slate-300')
                  }`}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染产品雏形规划
  const renderProductPlanning = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* 标题装饰 */}
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl border ${
          isDarkTheme
            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
            : 'bg-gradient-to-br from-cyan-100 to-cyan-50 border-cyan-200'
        }`}>
          <svg className={`w-8 h-8 ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${
          isDarkTheme
            ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
            : 'text-slate-800'
        }`}>产品雏形规划</h2>
        <p className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>为 <span className={isDarkTheme ? 'text-cyan-300' : 'text-cyan-600'}>{partName}</span> 规划产品方向</p>
      </div>

      {!productPlan ? (
        <div className="space-y-4">
          {(isLoading || aiThinkingContent) && renderAIThinking()}
          <div className="text-center py-4">
            <button
              onClick={handleProductPlanning}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md shadow-cyan-500/20'
              }`}
            >
              {isLoading ? 'AI 思考中...' : '开始产品规划'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 用途选择 */}
          <div className={`rounded-xl p-5 card-animate-fade-in ${
            isDarkTheme ? 'bg-white/5' : 'bg-white border border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>推荐用途</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {productPlan.useCases.map((useCase, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedUseCases(prev =>
                      prev.includes(useCase)
                        ? prev.filter(u => u !== useCase)
                        : [...prev, useCase]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedUseCases.includes(useCase)
                      ? (isDarkTheme ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-cyan-500 text-white shadow-md')
                      : (isDarkTheme ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  {useCase}
                </button>
              ))}
            </div>
          </div>

          {/* 预算选择 */}
          <div className={`rounded-xl p-5 card-animate-fade-in card-delay-1 ${isDarkTheme ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>目标价格区间</div>
            </div>
            <input
              type="text"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              placeholder="例如: 100-500"
              className={`w-full border rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none ${
                isDarkTheme
                  ? 'bg-white/10 border-white/20 text-white placeholder-gray-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
            <div className={`text-xs mt-2 ${isDarkTheme ? 'text-gray-500' : 'text-slate-500'}`}>格式: 最低价-最高价 (CNY)</div>
          </div>

          {/* 材料选择 */}
          <div className={`rounded-xl p-5 card-animate-fade-in card-delay-2 ${isDarkTheme ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>推荐材料</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {productPlan.materials.map((material, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedMaterials(prev =>
                      prev.includes(material)
                        ? prev.filter(m => m !== material)
                        : [...prev, material]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedMaterials.includes(material)
                      ? (isDarkTheme ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-cyan-500 text-white shadow-md')
                      : (isDarkTheme ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>

          {/* 特性选择 */}
          <div className={`rounded-xl p-5 card-animate-fade-in card-delay-3 ${isDarkTheme ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l707m2.-.707-.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>产品特性</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {productPlan.features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedFeatures(prev =>
                      prev.includes(feature)
                        ? prev.filter(f => f !== feature)
                        : [...prev, feature]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedFeatures.includes(feature)
                      ? (isDarkTheme ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-cyan-500 text-white shadow-md')
                      : (isDarkTheme ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              onClick={() => { setProductPlan(null); handleProductPlanning(); }}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              重新分析
            </button>
            <button
              onClick={handleConfirmProductPlan}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              确认并继续 →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染竞品分析
  const renderCompetitorAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* 标题装饰 */}
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl border ${
          isDarkTheme
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
            : 'bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200'
        }`}>
          <svg className={`w-8 h-8 ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${
          isDarkTheme
            ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
            : 'text-slate-800'
        }`}>竞品分析</h2>
        <p className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>了解市场价格和竞争态势</p>
      </div>

      {!competitorAnalysis ? (
        <div className="space-y-4">
          {(isLoading || aiThinkingContent) && renderAIThinking()}
          <div className="text-center py-4">
            <button
              onClick={handleCompetitorAnalysis}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md'
              }`}
            >
              {isLoading ? 'AI 思考中...' : '开始竞品分析'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 市场价格 - 占据整行 */}
          <div className={`md:col-span-2 rounded-xl p-5 border card-animate-fade-in ${
            isDarkTheme
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
              : 'bg-white border-emerald-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className={`text-lg font-bold ${isDarkTheme ? 'text-emerald-300' : 'text-emerald-700'}`}>价格区间</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-3 text-center ${isDarkTheme ? 'bg-black/40' : 'bg-slate-100'}`}>
                <div className={`text-xs mb-1 ${isDarkTheme ? 'text-gray-500' : 'text-slate-500'}`}>低端</div>
                <div className={`font-bold text-lg ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>¥{competitorAnalysis.marketPrice.low}</div>
              </div>
              <div className={`rounded-xl p-3 text-center border ${isDarkTheme ? 'bg-black/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className={`text-xs mb-1 ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>中端</div>
                <div className={`font-bold text-xl ${isDarkTheme ? 'text-emerald-300' : 'text-emerald-700'}`}>¥{competitorAnalysis.marketPrice.mid}</div>
              </div>
              <div className={`rounded-xl p-3 text-center ${isDarkTheme ? 'bg-black/40' : 'bg-slate-100'}`}>
                <div className={`text-xs mb-1 ${isDarkTheme ? 'text-gray-500' : 'text-slate-500'}`}>高端</div>
                <div className={`font-bold text-lg ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>¥{competitorAnalysis.marketPrice.high}</div>
              </div>
            </div>
          </div>

          {/* 1688批量采购搜索 */}
          {competitorAnalysis.searchKeyword && (
            <div className={`md:col-span-2 rounded-xl p-4 card-animate-fade-in ${
              isDarkTheme ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30' : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div>
                    <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>一站式采购</div>
                    <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>搜索关键字: {competitorAnalysis.searchKeyword}</div>
                  </div>
                </div>
                <a
                  href={`https://s.1688.com/youyuan/index.htm?tab=imageSearch&searchword=${encodeURIComponent(competitorAnalysis.searchKeyword)}&beginPage=1&pageSize=60`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  1688搜索采购
                </a>
              </div>
            </div>
          )}

          {/* 竞品信息 - 占据整行 */}
          <div className={`md:col-span-2 rounded-xl p-5 card-animate-fade-in card-delay-1 ${
            isDarkTheme ? 'bg-white/5' : 'bg-white border border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>主要竞品</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {competitorAnalysis.competitors.map((comp, index) => (
                <div key={index} className={`rounded-xl p-4 transition-colors ${
                  isDarkTheme ? 'bg-black/30 hover:bg-black/40' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{comp.name}</div>
                    <div className={`font-bold ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>¥{comp.price}</div>
                  </div>
                  <div className={`text-sm mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>{comp.features.join(', ')}</div>
                  <div className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>{comp.marketShare}</div>

                  {/* 官网链接 - 优先显示，没有官网时显示淘宝搜索 */}
                  <div className="mt-3">
                    <a
                      href={comp.brand ? `https://www.baidu.com/s?wd=${encodeURIComponent(comp.brand + ' 官网')}` : `https://s.taobao.com/search?q=${encodeURIComponent(comp.name)}&imgfile=&initiative_id=staobaoz&ie=utf8`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      搜索官网
                    </a>
                  </div>

                  {/* 附加链接 - 淘宝和1688 */}
                  <div className="mt-2 flex gap-2">
                    <a
                      href={comp.taobaoUrl || `https://s.taobao.com/search?q=${encodeURIComponent(comp.name)}&imgfile=&initiative_id=staobaoz&ie=utf8`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      </svg>
                      淘宝
                    </a>
                    <a
                      href={comp['1688Url'] || `https://s.1688.com/youyuan/index.htm?tab=imageSearch&searchword=${encodeURIComponent(comp.name)}&beginPage=1&pageSize=60`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      </svg>
                      1688
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 定价建议 */}
          <div className={`rounded-xl p-5 border card-animate-fade-in card-delay-2 ${
            isDarkTheme
              ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30'
              : 'bg-white border-cyan-100'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>定价建议</div>
            </div>
            <div className={`text-sm leading-relaxed ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>{competitorAnalysis.pricingAdvice}</div>
          </div>

          {/* 市场趋势 */}
          <div className={`rounded-xl p-5 border card-animate-fade-in card-delay-3 ${
            isDarkTheme
              ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30'
              : 'bg-white border-blue-100'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <svg className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>市场趋势</div>
            </div>
            <div className={`text-sm leading-relaxed ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>{competitorAnalysis.marketTrends}</div>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              onClick={() => { setCompetitorAnalysis(null); handleCompetitorAnalysis(); }}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              🔄 重新分析
            </button>
            <button
              onClick={() => { setAiThinkingContent(''); setCurrentStep('supplier-select'); }}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              继续 →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染供应商选择
  const renderSupplierSelect = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* 标题装饰 */}
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl ${
          isDarkTheme
            ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30'
            : 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100'
        }`}>
          <svg className={`w-8 h-8 ${isDarkTheme ? 'text-orange-400' : 'text-orange-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${
          isDarkTheme
            ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
            : 'text-slate-900'
        }`}>选择供应商</h2>
        <p className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>为 <span className={isDarkTheme ? 'text-orange-300' : 'text-orange-600'}>{partName}</span> 选择供应商</p>
      </div>

      {!suppliers.length ? (
        <div className="space-y-4">
          {(isLoading || aiThinkingContent) && renderAIThinking()}
          <div className="text-center py-4">
            <button
              onClick={handleFindSuppliers}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isLoading ? 'AI 思考中...' : '搜索供应商'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier, index) => (
            <button
              key={index}
              onClick={() => handleSelectSupplier(supplier)}
              className={`w-full p-4 border rounded-xl text-left transition-all ${
                selectedSupplier?.name === supplier.name
                  ? (isDarkTheme ? 'bg-cyan-500/20 border-cyan-500' : 'bg-cyan-50 border-cyan-500')
                  : (isDarkTheme ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-cyan-300')
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
                    {supplier.name}
                    {selectedSupplier?.name === supplier.name && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isDarkTheme ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-700'
                      }`}>已选择</span>
                    )}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>{supplier.specs}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>¥{supplier.price}</div>
                  <div className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>可靠性: {supplier.reliability}/10</div>
                  <div className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>交货: {supplier.leadTime}天</div>
                </div>
              </div>
            </button>
          ))}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => { setSuppliers([]); setSelectedSupplier(null); handleFindSuppliers(); }}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              🔄 重新分析
            </button>
            <button
              onClick={() => { setAiThinkingContent(''); setCurrentStep('customization'); }}
              disabled={!selectedSupplier}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98] disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              继续 →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染定制问题
  const renderCustomization = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* 标题装饰 */}
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl ${
          isDarkTheme
            ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/20 border border-cyan-500/30'
            : 'bg-gradient-to-br from-cyan-50 to-cyan-50 border border-cyan-100'
        }`}>
          <svg className={`w-8 h-8 ${isDarkTheme ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${
          isDarkTheme
            ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
            : 'text-slate-900'
        }`}>定制参数</h2>
        <p className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>回答以下问题以优化方案</p>
      </div>

      {!customizationQuestions.length ? (
        <div className="space-y-4">
          {(isLoading || aiThinkingContent) && renderAIThinking()}
          <div className="text-center py-4">
            <button
              onClick={handleGenerateQuestions}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isLoading ? 'AI 思考中...' : '❓ 生成定制问题'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {customizationQuestions.map((q, index) => (
            <div key={index} className={`rounded-xl p-4 ${
              isDarkTheme ? 'bg-white/5' : 'bg-white border border-slate-200'
            }`}>
              <div className={`${isDarkTheme ? 'text-white' : 'text-slate-800'} mb-2`}>{q.question}</div>
              {q.type === 'select' && q.options ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => setCustomizationAnswers(prev => ({ ...prev, [index]: opt }))}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          customizationAnswers[index] === opt
                            ? (isDarkTheme ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-700 border border-cyan-200')
                            : (isDarkTheme ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200')
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {/* 如果选择了"其他"，显示输入框 */}
                  {customizationAnswers[index] === '其他' && (
                    <input
                      type="text"
                      placeholder="请输入具体内容..."
                      value={customizationAnswers[`${index}_other`] || ''}
                      onChange={(e) => setCustomizationAnswers(prev => ({ ...prev, [`${index}_other`]: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        isDarkTheme
                          ? 'bg-white/10 border border-white/20 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  )}
                </div>
              ) : (
                <input
                  type={q.type === 'number' ? 'number' : 'text'}
                  placeholder="请输入..."
                  value={customizationAnswers[index] || ''}
                  onChange={(e) => setCustomizationAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 ${
                    isDarkTheme
                      ? 'bg-white/10 border border-white/20 text-white placeholder-gray-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => { setCustomizationQuestions([]); setCustomizationAnswers({}); handleGenerateQuestions(); }}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              🔄 重新分析
            </button>
            <button
              onClick={handleSubmitCustomization}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              继续 →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染工艺方案选择
  const renderProcessSelect = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* 标题装饰 */}
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl ${
          isDarkTheme
            ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/20 border border-cyan-500/30'
            : 'bg-gradient-to-br from-cyan-50 to-cyan-50 border border-cyan-100'
        }`}>
          <svg className={`w-8 h-8 ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${
          isDarkTheme
            ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
            : 'text-slate-900'
        }`}>选择工艺方案</h2>
        <p className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>选择最适合的制造工艺</p>
      </div>

      {!processes.length ? (
        <div className="space-y-4">
          {(isLoading || aiThinkingContent) && renderAIThinking()}
          <div className="text-center py-4">
            <button
              onClick={handleGenerateProcesses}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isLoading ? 'AI 思考中...' : '⚙️ 生成工艺方案'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {processes.map((process, index) => (
            <button
              key={index}
              onClick={() => handleSelectProcess(process)}
              className={`w-full p-4 border rounded-xl text-left transition-all ${
                isDarkTheme
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-orange-500/50'
                  : 'bg-white border-slate-200 hover:border-orange-300'
              }`}
            >
              <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{process.name}</div>
              <div className={`text-sm mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>{process.description}</div>
              <div className="flex gap-4 text-sm">
                <span className={isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}>¥{process.cost}</span>
                <span className={isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'}>{process.risk}</span>
                <span className={isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}>{process.carbonEmission}kg CO₂</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染分析中
  const renderAnalyzing = () => (
    <div className="relative text-center py-16">
      {/* 装饰光效 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative">
        {/* 多层旋转圆环 */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 rounded-full border-4 border-blue-500/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-4 rounded-full border-4 border-cyan-500/30 animate-spin" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50" />
          </div>
        </div>

        <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'} mb-2`}>深度分析中</h2>
        <p className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-500'} mb-6`}>正在综合评估成本、风险与碳排放</p>

        {/* 分析进度指示 */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染结果
  const renderResult = () => (
    <div className="space-y-6">
      {/* 分析中状态 - 显示AI思考过程 */}
      {(isLoading || aiThinkingContent) && renderAIThinking()}

      {/* 综合决策 - 最顶部 */}
      {analysisResult?.breaking && (
        <div className={`relative overflow-hidden rounded-2xl border card-animate-scale-in ${
          analysisResult.breaking.recommendation === 'break'
            ? (isDarkTheme
                ? 'bg-gradient-to-r from-cyan-600/30 via-cyan-500/20 to-blue-600/30 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                : 'bg-gradient-to-r from-cyan-100 via-cyan-50 to-blue-100 border-cyan-200 shadow-lg shadow-cyan-200/50')
            : (isDarkTheme
                ? 'bg-gradient-to-r from-amber-600/30 via-orange-500/20 to-amber-600/30 border-amber-400/50 shadow-lg shadow-amber-500/20'
                : 'bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 border-amber-200 shadow-lg shadow-amber-200/50')
        }`}>
          {/* 装饰光效 */}
          <div className={`absolute top-0 right-0 w-40 h-40 rounded-full ${
            analysisResult.breaking.recommendation === 'break'
              ? (isDarkTheme ? 'bg-cyan-500/20 blur-3xl' : 'bg-cyan-200/50 blur-3xl')
              : (isDarkTheme ? 'bg-amber-500/20 blur-3xl' : 'bg-amber-200/50 blur-3xl')
          }`} />

          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  analysisResult.breaking.recommendation === 'break'
                    ? (isDarkTheme ? 'bg-cyan-500/30' : 'bg-cyan-200')
                    : (isDarkTheme ? 'bg-amber-500/30' : 'bg-amber-200')
                }`}>
                  {analysisResult.breaking.recommendation === 'break' ? (
                    <svg className={`w-8 h-8 ${isDarkTheme ? 'text-cyan-300' : 'text-cyan-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ) : (
                    <svg className={`w-8 h-8 ${isDarkTheme ? 'text-amber-300' : 'text-amber-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  <div>{analysisResult.breaking.recommendation === 'break' ? '建议继续拆分' : '建议保持当前'}</div>
                  <div className={`text-base font-normal mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>基于综合评估结果</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{analysisResult.breaking.confidence}%</div>
                <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>置信度</div>
              </div>
            </div>
            <div className={`text-lg mb-6 leading-relaxed ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>{analysisResult.breaking.reasoning}</div>
            <div className="flex flex-wrap gap-3">
              {analysisResult.breaking.keyFactors?.map((factor, i) => (
                <span key={i} className={`px-4 py-2 rounded-lg text-base border ${
                  isDarkTheme ? 'bg-white/10 text-gray-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {factor}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 分析卡片区域 - 左侧成本+碳排放，右侧风险评估 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧列：成本分析 + 碳排放 */}
        <div className="space-y-6">
          {/* 成本分析 */}
          {analysisResult?.cost && (
            <div className={`relative overflow-hidden rounded-2xl border shadow-lg card-animate-fade-in ${
              isDarkTheme
                ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 via-emerald-900/30 to-teal-950/50 shadow-emerald-500/10'
                : 'border-emerald-200 bg-white shadow-emerald-200/50'
            }`}>
              {/* 装饰光效 */}
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl ${
                isDarkTheme ? 'bg-emerald-500/20' : 'bg-emerald-100'
              }`} />

              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDarkTheme ? 'bg-emerald-500/20' : 'bg-emerald-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className={`text-base font-bold ${isDarkTheme ? 'text-emerald-300' : 'text-emerald-700'}`}>成本分析</div>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>¥{analysisResult.cost.totalCost?.toFixed(0)}</span>
                </div>

                {/* 成本分解比例条 - 酷炫版 */}
                {(() => {
                  const breakdown = analysisResult.cost.breakdown;
                  const total = (breakdown?.material || 0) + (breakdown?.processing || 0) + (breakdown?.shipping || 0) + (breakdown?.other || 0);
                  const items = [
                    { label: '材料', value: breakdown?.material || 0, gradient: 'from-orange-400 to-orange-600', color: 'bg-orange-400' },
                    { label: '加工', value: breakdown?.processing || 0, gradient: 'from-cyan-400 to-cyan-600', color: 'bg-cyan-400' },
                    { label: '运输', value: breakdown?.shipping || 0, gradient: 'from-pink-400 to-pink-600', color: 'bg-pink-400' },
                    { label: '其他', value: breakdown?.other || 0, gradient: 'from-yellow-400 to-yellow-600', color: 'bg-yellow-400' },
                  ];
                  return (
                    <div className="mb-4">
                      {/* 简洁高级比例条 */}
                      <div className="mb-3">
                        <div className={`flex h-3 rounded-full overflow-hidden ${isDarkTheme ? 'bg-black/50' : 'bg-slate-200'}`}>
                          {items.map((item, i) => (
                            <div
                              key={i}
                              className={`transition-all duration-700 ${i < items.length - 1 ? (isDarkTheme ? 'border-r border-black/30' : 'border-r border-white/30') : ''}`}
                              style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }}
                            >
                              <div className={`w-full h-full bg-gradient-to-r ${item.gradient}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* 简洁图例 */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>{item.label}</span>
                            <span className={`${isDarkTheme ? 'text-white' : 'text-slate-800'} font-medium`}>¥{item.value?.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className={`text-sm leading-relaxed ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>{analysisResult.cost.analysis}</div>
              </div>
            </div>
          )}

          {/* 碳排放 - 放在成本分析下方 */}
          {analysisResult?.carbon && (
            <div className={`relative overflow-hidden rounded-2xl border ${
              isDarkTheme ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-950/50 via-cyan-900/30 to-cyan-950/50' : 'border-cyan-100 bg-white'
            } shadow-lg ${isDarkTheme ? 'shadow-cyan-500/10' : 'shadow-cyan-500/5'} card-animate-fade-in card-delay-2`} style={{ minHeight: '340px' }}>
              {/* 装饰光效 */}
              {isDarkTheme && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />}

              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${isDarkTheme ? 'bg-cyan-500/20' : 'bg-cyan-50'} flex items-center justify-center`}>
                      <svg className={`w-6 h-6 ${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className={`text-lg font-bold ${isDarkTheme ? 'text-cyan-300' : 'text-cyan-700'}`}>碳排放</div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-base font-medium ${
                    isDarkTheme ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                  }`}>
                    等级 {analysisResult.carbon.rating}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-4xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{analysisResult.carbon.totalEmission?.toFixed(1)}</span>
                  <span className={`${isDarkTheme ? 'text-cyan-400' : 'text-cyan-600'} text-lg`}>kg CO₂</span>
                </div>

                {/* 碳排放分解 */}
                {analysisResult.carbon.breakdown && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: '生产', value: analysisResult.carbon.breakdown.production },
                      { label: '运输', value: analysisResult.carbon.breakdown.transportation },
                      { label: '材料', value: analysisResult.carbon.breakdown.material },
                    ].map((item, i) => (
                      <div key={i} className={`${isDarkTheme ? 'bg-black/30' : 'bg-slate-50'} rounded-lg p-3`}>
                        <div className={`${isDarkTheme ? 'text-gray-500' : 'text-slate-500'} text-sm mb-1`}>{item.label}</div>
                        <div className={`${isDarkTheme ? 'text-white' : 'text-slate-900'} font-medium`}>{item.value?.toFixed(1)} kg</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`text-base ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>{analysisResult.carbon.analysis}</div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧列：风险评估（高度等于左侧总高度） */}
        <div>
          {/* 风险评估 */}
          {analysisResult?.risk && (
            <div className={`relative overflow-hidden rounded-2xl border ${
              isDarkTheme ? 'border-red-500/30 bg-gradient-to-br from-red-950/50 via-red-900/30 to-orange-950/50' : 'border-red-100 bg-white'
            } shadow-lg ${isDarkTheme ? 'shadow-red-500/10' : 'shadow-red-500/5'} card-animate-fade-in card-delay-1 h-full flex flex-col`}>
              {/* 装饰光效 */}
              {isDarkTheme && <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/20 rounded-full blur-2xl" />}

              <div className="relative p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${isDarkTheme ? 'bg-red-500/20' : 'bg-red-50'} flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div className={`text-base font-bold ${isDarkTheme ? 'text-red-300' : 'text-red-700'}`}>风险评估</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    analysisResult.risk.riskLevel === '低'
                      ? (isDarkTheme ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700 border border-green-200') :
                    analysisResult.risk.riskLevel === '中'
                      ? (isDarkTheme ? 'bg-yellow-500/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-200') :
                      (isDarkTheme ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700 border border-red-200')
                  }`}>
                    {analysisResult.risk.riskLevel}风险
                  </span>
                </div>

                <div className="flex flex-col flex-1 gap-3">
                  {analysisResult.risk.risks?.slice(0, 4)?.map((r, i) => (
                    <div key={i} className={`flex-1 ${isDarkTheme ? 'bg-black/30 border border-white/5' : 'bg-slate-50 border border-slate-100'} rounded-lg p-3 text-sm flex flex-col`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isDarkTheme ? 'bg-red-400' : 'bg-red-500'} flex-shrink-0`} />
                        <div className={`${isDarkTheme ? 'text-white' : 'text-slate-900'} font-medium`}>{r.type}</div>
                      </div>
                      <div className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-600'} ml-4 mt-2`}>{r.description}</div>
                      {r.impact && (
                        <div className={`mt-auto pt-2 ml-4 text-sm`}>
                          <span className={isDarkTheme ? 'text-gray-500' : 'text-slate-500'}>影响：</span>
                          <span className={isDarkTheme ? 'text-red-300' : 'text-red-600'}>{r.impact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 - 仅在分析完成后显示 */}
      {analysisResult && !isLoading && (
        <div className="flex gap-3 pt-4 animate-fade-in">
          <button
            onClick={() => { setAnalysisResult(null); if (selectedProcess) runAnalysis(selectedProcess); }}
            disabled={!selectedProcess}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            重新分析
          </button>
          <button
            onClick={() => setCurrentStep('final-report')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              isDarkTheme
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-md'
            }`}
          >
            查看最终报告
          </button>
        </div>
      )}
    </div>
  );

  // 渲染最终报告
  const renderFinalReport = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* 标题装饰 */}
        <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl ${
          isDarkTheme
            ? 'bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30'
            : 'bg-gradient-to-br from-cyan-50 to-indigo-50 border border-cyan-100'
        }`}>
          <svg className={`w-8 h-8 ${isDarkTheme ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${
          isDarkTheme
            ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
            : 'text-slate-900'
        }`}>产品规划最终报告</h2>
        <p className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>综合分析结果汇总</p>
      </div>

      {!finalReport ? (
        <div className="space-y-4">
          {(isLoading || aiThinkingContent) && renderAIThinking()}
          <div className="text-center py-4">
            <button
              onClick={handleGenerateFinalReport}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 disabled:bg-gray-500 text-white'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 disabled:bg-slate-400 text-white'
              }`}
            >
              {isLoading ? 'AI 思考中...' : '📊 生成最终报告'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 商业底座与定位 */}
          <div className={`rounded-xl p-4 border ${
            isDarkTheme
              ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/20 border-cyan-500/30'
              : 'bg-white border-cyan-100'
          }`}>
            <div className={`text-lg font-bold mb-3 ${isDarkTheme ? 'text-cyan-300' : 'text-cyan-700'}`}>商业底座与定位</div>
            <div className="space-y-3 text-sm">
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>市场定位</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.businessBase.marketPosition}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>竞争优势</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {finalReport.businessBase.competitiveAdvantages.map((adv, i) => (
                    <span key={i} className={`px-2 py-1 rounded ${
                      isDarkTheme ? 'bg-white/10 text-white' : 'bg-cyan-50 text-cyan-700'
                    }`}>{adv}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>目标客户</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.businessBase.targetCustomers}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>定价策略</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.businessBase.priceStrategy}</div>
              </div>
            </div>
          </div>

          {/* 供应链与成本 */}
          <div className={`rounded-xl p-4 border ${
            isDarkTheme
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
              : 'bg-white border-emerald-100'
          }`}>
            <div className={`text-lg font-bold mb-3 ${isDarkTheme ? 'text-emerald-300' : 'text-emerald-700'}`}>供应链与成本</div>
            <div className="space-y-3 text-sm">
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>供应商概述</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.supplyChain.supplierOverview}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>成本结构</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.supplyChain.costStructure}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>风险评估</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.supplyChain.riskAssessment}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>优化建议</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.supplyChain.optimization}</div>
              </div>
            </div>
          </div>

          {/* 生产时间轴与节拍 */}
          <div className={`rounded-xl p-4 border ${
            isDarkTheme
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30'
              : 'bg-white border-amber-100'
          }`}>
            <div className={`text-lg font-bold mb-3 ${isDarkTheme ? 'text-amber-300' : 'text-amber-700'}`}>⏱️ 生产时间轴与节拍</div>
            <div className="space-y-3 text-sm">
              {finalReport.productionTimeline.phases.map((phase, i) => (
                <div key={i} className={`${isDarkTheme ? 'bg-black/30' : 'bg-slate-50'} rounded-lg p-2`}>
                  <div className="flex justify-between">
                    <span className={isDarkTheme ? 'text-white font-medium' : 'text-slate-900 font-medium'}>{phase.phase}</span>
                    <span className={isDarkTheme ? 'text-amber-400' : 'text-amber-600'}>{phase.duration}</span>
                  </div>
                  <div className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-500'} text-xs mt-1`}>{phase.milestones.join(' → ')}</div>
                </div>
              ))}
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>潜在瓶颈</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.productionTimeline.bottleneck}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>建议</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.productionTimeline.recommendations}</div>
              </div>
            </div>
          </div>

          {/* 上市与生命周期 */}
          <div className={`rounded-xl p-4 border ${
            isDarkTheme
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
              : 'bg-white border-cyan-100'
          }`}>
            <div className={`text-lg font-bold mb-3 ${isDarkTheme ? 'text-cyan-300' : 'text-cyan-700'}`}>上市与生命周期</div>
            <div className="space-y-3 text-sm">
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>上市计划</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.lifecycle.launchPlan}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>预期生命周期</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.lifecycle.expectedLifecycle}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>更新计划</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.lifecycle.updatePlan}</div>
              </div>
              <div>
                <div className={isDarkTheme ? 'text-gray-400' : 'text-slate-500'}>生命周期结束</div>
                <div className={isDarkTheme ? 'text-white' : 'text-slate-800'}>{finalReport.lifecycle.endOfLife}</div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleRestart}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-red-500/80 hover:bg-red-500 text-white'
                  : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200'
              }`}
            >
              🗑️ 删除全部分析
            </button>
            <button
              onClick={handleExportData}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                  : 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-700 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              📥 导出用户偏好数据
            </button>
            <button
              onClick={() => { setAiThinkingContent(''); setCurrentStep('result'); }}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 hover:from-cyan-600 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-700 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              ← 返回评估结果
            </button>
            <button
              onClick={handleCompleteClick}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-700 text-white shadow-md'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              ✓ 完成该节点定制，继续定制其他节点
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 错误提示
  const renderError = () => error ? (
    <div className={`rounded-lg p-4 text-center ${
      isDarkTheme
        ? 'bg-red-500/20 border border-red-500/50 text-red-300'
        : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      {error}
    </div>
  ) : null;

  // 没有零件信息
  if (!partName) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeConfig.backgroundGradient} ${themeConfig.textPrimary} flex items-center justify-center relative overflow-hidden`}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className={`mb-6 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>缺少零件信息</p>
          <Link href="/setup" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-500 rounded-xl text-white font-medium hover:from-cyan-600 hover:to-cyan-600 transition-all shadow-lg shadow-cyan-500/25">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回调制界面
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.backgroundGradient} ${themeConfig.textPrimary} relative overflow-hidden`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 动态光效 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl" />

        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* 头部 */}
      <header className={`relative border-b backdrop-blur-xl ${
        isDarkTheme
          ? 'border-white/10 bg-black/20'
          : 'border-slate-200 bg-white/80'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={sessionId ? `/canvas?sessionId=${sessionId}` : '/canvas'}
              className={`group flex items-center gap-2 transition-colors ${
                isDarkTheme
                  ? 'text-gray-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${
                isDarkTheme ? '' : 'text-slate-500'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className={isDarkTheme ? '' : 'text-slate-600'}>返回</span>
            </Link>
            <div className={`w-px h-8 ${isDarkTheme ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDarkTheme
                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-500'
                  : 'bg-gradient-to-br from-cyan-500 to-cyan-600'
              }`}>
                <span className="text-sm">🏭</span>
              </div>
              <h1 className={`text-lg font-bold ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
                  : 'text-slate-900'
              }`}>生产分析</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border ${
              isDarkTheme
                ? 'bg-cyan-500/20 border-cyan-500/30'
                : 'bg-cyan-50 border-cyan-200'
            }`}>
              <span className={`text-sm ${isDarkTheme ? 'text-cyan-300' : 'text-cyan-700'}`}>{partName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-8">
        {/* 步骤指示器 */}
        {renderStepIndicator()}

        {/* 错误提示 */}
        {renderError()}

        {/* 步骤内容 */}
        {currentStep === 'product-planning' && renderProductPlanning()}
        {currentStep === 'competitor-analysis' && renderCompetitorAnalysis()}
        {currentStep === 'supplier-select' && renderSupplierSelect()}
        {currentStep === 'customization' && renderCustomization()}
        {currentStep === 'process-select' && renderProcessSelect()}
        {currentStep === 'result' && renderResult()}
        {currentStep === 'final-report' && renderFinalReport()}
      </main>

      {/* 确认完成弹窗 */}
      {showCompleteConfirm && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowCompleteConfirm(false)}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* 弹窗内容 */}
          <div
            className="relative w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDarkTheme
                ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: isDarkTheme ? '1px solid #334155' : '1px solid #e2e8f0',
            }}
          >
            {/* 装饰图标 */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 border-2 border-green-500/30">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* 标题 */}
            <h3 className={`text-xl font-bold text-center mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              确认完成定制
            </h3>

            {/* 描述 */}
            <p className={`text-center mb-6 ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>
              确定要完成"{partName}"的定制吗？完成后该节点及其所有子节点都将标记为已完成。
            </p>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  isDarkTheme
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                取消
              </button>
              <button
                onClick={confirmComplete}
                className="flex-1 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductionAnalysis() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-2 rounded-full border-4 border-blue-500/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-500 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400">正在加载生产分析...</p>
        </div>
      </div>
    }>
      <ProductionAnalysisPage />
    </Suspense>
  );
}
