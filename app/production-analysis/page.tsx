'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 步骤类型
type AnalysisStep =
  | 'supplier-select'  // 选择供应商
  | 'customization'     // 回答定制问题
  | 'process-select'   // 选择工艺方案
  | 'analyzing'        // 分析中
  | 'result';          // 显示结果

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

function ProductionAnalysisPage() {
  const searchParams = useSearchParams();

  const sessionId = searchParams.get('sessionId') || '';
  const partName = searchParams.get('partName') || '';
  const partId = searchParams.get('partId') || '';

  // 当前步骤
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('supplier-select');

  // 数据状态
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [customizationQuestions, setCustomizationQuestions] = useState<CustomizationQuestion[]>([]);
  const [customizationAnswers, setCustomizationAnswers] = useState<Record<string, string>>({});

  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载进度
  useEffect(() => {
    if (!sessionId || !partId || isLoaded) return;

    const loadProgress = async () => {
      try {
        const res = await fetch(`/api/production-analysis-progress?sessionId=${sessionId}&partId=${partId}`);
        const data = await res.json();
        if (data.data) {
          const progress = data.data;
          setCurrentStep(progress.currentStep as AnalysisStep || 'supplier-select');
          setSuppliers(progress.suppliers || []);
          setSelectedSupplier(progress.selectedSupplier || null);
          setCustomizationQuestions(progress.customizationQuestions || []);
          setCustomizationAnswers(progress.customizationAnswers || {});
          setProcesses(progress.processes || []);
          setSelectedProcess(progress.selectedProcess || null);
          setAnalysisResult(progress.analysisResult || null);
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
          suppliers,
          selectedSupplier,
          customizationQuestions,
          customizationAnswers,
          processes,
          selectedProcess,
          analysisResult,
          isCompleted: completed
        })
      });
    } catch (err) {
      console.error('保存进度失败:', err);
    }
  }, [sessionId, partId, partName, currentStep, suppliers, selectedSupplier, customizationQuestions, customizationAnswers, processes, selectedProcess, analysisResult]);

  // 自动保存进度（当状态变化时）
  useEffect(() => {
    if (!isLoaded || !sessionId || !partId) return;

    const timer = setTimeout(() => {
      saveProgress(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentStep, suppliers, selectedSupplier, customizationQuestions, customizationAnswers, processes, selectedProcess, analysisResult, isLoaded, sessionId, partId, saveProgress]);

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

  // 步骤1: 搜索供应商
  const handleFindSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callAPI('find_suppliers', { partName });
      setSuppliers(result.suppliers || []);
    } catch (err) {
      setError('搜索供应商失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 选择供应商后，进入下一步
  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setCurrentStep('customization');
  };

  // 步骤2: 生成定制问题
  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callAPI('start_customization', { partName });
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
    setCurrentStep('process-select');
  };

  // 步骤3: 生成工艺方案
  const handleGenerateProcesses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callAPI('generate_processes', {
        partName,
        customizedParams: customizationAnswers
      });
      setProcesses(result.processes || []);
    } catch (err) {
      setError('生成工艺方案失败，请重试');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 选择工艺后，开始分析
  const handleSelectProcess = (process: Process) => {
    setSelectedProcess(process);
    setCurrentStep('analyzing');
    runAnalysis(process);
  };

  // 步骤4: 运行分析（成本、风险、碳排放）
  const runAnalysis = async (process: Process) => {
    setIsLoading(true);
    setError(null);
    try {
      // 并行执行成本、风险、碳排放分析
      const [costRes, riskRes, carbonRes] = await Promise.all([
        callAPI('analyze_cost', { option: process, optionType: 'process' }),
        callAPI('assess_risk', { option: process, optionType: 'process' }),
        callAPI('assess_carbon', { option: process, optionType: 'process' })
      ]);

      // 综合决策
      const breakingRes = await callAPI('recommend', {
        costData: costRes,
        riskData: riskRes,
        carbonData: carbonRes
      });

      setAnalysisResult({
        cost: costRes?.cost || null,
        risk: riskRes?.risk || null,
        carbon: carbonRes?.carbon || null,
        breaking: breakingRes?.recommendation || null
      });

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

  // 重新开始
  const handleRestart = async () => {
    setCurrentStep('supplier-select');
    setSuppliers([]);
    setSelectedSupplier(null);
    setCustomizationQuestions([]);
    setCustomizationAnswers({});
    setProcesses([]);
    setSelectedProcess(null);
    setAnalysisResult(null);
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
      { key: 'supplier-select', label: '1. 选择供应商' },
      { key: 'customization', label: '2. 定制参数' },
      { key: 'process-select', label: '3. 选择工艺' },
      { key: 'analyzing', label: '4. 分析中' },
      { key: 'result', label: '5. 结果' }
    ];

    return (
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`px-3 py-1 rounded-full text-sm ${
              currentStep === step.key
                ? 'bg-purple-500 text-white'
                : steps.findIndex(s => s.key === currentStep) > index
                  ? 'bg-green-500/30 text-green-300'
                  : 'bg-white/10 text-gray-400'
            }`}>
              {step.label}
            </div>
            {index < steps.length - 1 && <span className="text-gray-600 mx-1">→</span>}
          </div>
        ))}
      </div>
    );
  };

  // 渲染供应商选择
  const renderSupplierSelect = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">选择供应商</h2>
        <p className="text-gray-400">为 "{partName}" 选择供应商</p>
      </div>

      {!suppliers.length ? (
        <div className="text-center py-8">
          <button
            onClick={handleFindSuppliers}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 rounded-lg text-white font-medium transition-colors"
          >
            {isLoading ? '搜索中...' : '🔍 搜索供应商'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier, index) => (
            <button
              key={index}
              onClick={() => handleSelectSupplier(supplier)}
              className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl text-left transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-white">{supplier.name}</div>
                  <div className="text-sm text-gray-400">{supplier.specs}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">¥{supplier.price}</div>
                  <div className="text-xs text-gray-500">可靠性: {supplier.reliability}/10</div>
                  <div className="text-xs text-gray-500">交货: {supplier.leadTime}天</div>
                </div>
              </div>
            </button>
          ))}

          <button
            onClick={handleFindSuppliers}
            className="w-full py-2 text-gray-400 hover:text-white text-sm"
          >
            🔄 重新搜索
          </button>
        </div>
      )}
    </div>
  );

  // 渲染定制问题
  const renderCustomization = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">定制参数</h2>
        <p className="text-gray-400">回答以下问题以优化方案</p>
      </div>

      {!customizationQuestions.length ? (
        <div className="text-center py-8">
          <button
            onClick={handleGenerateQuestions}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 rounded-lg text-white font-medium transition-colors"
          >
            {isLoading ? '生成中...' : '❓ 生成定制问题'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customizationQuestions.map((q, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-4">
              <div className="text-white mb-2">{q.question}</div>
              {q.type === 'select' && q.options ? (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => setCustomizationAnswers(prev => ({ ...prev, [index]: opt }))}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        customizationAnswers[index] === opt
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type={q.type === 'number' ? 'number' : 'text'}
                  placeholder="请输入..."
                  value={customizationAnswers[index] || ''}
                  onChange={(e) => setCustomizationAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSubmitCustomization}
            className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
          >
            继续 →
          </button>
        </div>
      )}
    </div>
  );

  // 渲染工艺方案选择
  const renderProcessSelect = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">选择工艺方案</h2>
        <p className="text-gray-400">选择最适合的制造工艺</p>
      </div>

      {!processes.length ? (
        <div className="text-center py-8">
          <button
            onClick={handleGenerateProcesses}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 rounded-lg text-white font-medium transition-colors"
          >
            {isLoading ? '生成中...' : '⚙️ 生成工艺方案'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {processes.map((process, index) => (
            <button
              key={index}
              onClick={() => handleSelectProcess(process)}
              className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 rounded-xl text-left transition-all"
            >
              <div className="font-medium text-white">{process.name}</div>
              <div className="text-sm text-gray-400 mb-2">{process.description}</div>
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-400">¥{process.cost}</span>
                <span className="text-yellow-400">{process.risk}</span>
                <span className="text-cyan-400">{process.carbonEmission}kg CO₂</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染分析中
  const renderAnalyzing = () => (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-6"></div>
      <h2 className="text-2xl font-bold text-white mb-2">分析中...</h2>
      <p className="text-gray-400">正在分析成本、风险和碳排放</p>
    </div>
  );

  // 渲染结果
  const renderResult = () => (
    <div className="space-y-4">
      {/* 综合决策 */}
      {analysisResult?.breaking && (
        <div className={`rounded-xl p-6 border ${
          analysisResult.breaking.recommendation === 'break'
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50'
            : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`text-2xl font-bold ${
              analysisResult.breaking.recommendation === 'break' ? 'text-purple-300' : 'text-amber-300'
            }`}>
              {analysisResult.breaking.recommendation === 'break' ? '🔨 建议继续拆分' : '📦 建议保持当前'}
            </div>
            <div className="text-gray-400">置信度: {analysisResult.breaking.confidence}%</div>
          </div>
          <div className="text-gray-300 mb-4">{analysisResult.breaking.reasoning}</div>
          <div className="flex flex-wrap gap-2">
            {analysisResult.breaking.keyFactors?.map((factor, i) => (
              <span key={i} className="px-2 py-1 bg-white/10 rounded text-sm text-gray-300">{factor}</span>
            ))}
          </div>
        </div>
      )}

      {/* 成本分析 */}
      {analysisResult?.cost && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/30">
          <div className="text-lg font-bold text-emerald-300 mb-3">💰 成本分析</div>
          <div className="text-3xl font-bold text-white mb-3">¥{analysisResult.cost.totalCost?.toFixed(0)}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-black/30 rounded p-2">
              <div className="text-gray-500">材料</div>
              <div className="text-white">¥{analysisResult.cost.breakdown?.material?.toFixed(0)}</div>
            </div>
            <div className="bg-black/30 rounded p-2">
              <div className="text-gray-500">加工</div>
              <div className="text-white">¥{analysisResult.cost.breakdown?.processing?.toFixed(0)}</div>
            </div>
            <div className="bg-black/30 rounded p-2">
              <div className="text-gray-500">运输</div>
              <div className="text-white">¥{analysisResult.cost.breakdown?.shipping?.toFixed(0)}</div>
            </div>
            <div className="bg-black/30 rounded p-2">
              <div className="text-gray-500">其他</div>
              <div className="text-white">¥{analysisResult.cost.breakdown?.other?.toFixed(0)}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-400">{analysisResult.cost.analysis}</div>
        </div>
      )}

      {/* 风险评估 */}
      {analysisResult?.risk && (
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-bold text-red-300">⚠️ 风险评估</div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              analysisResult.risk.riskLevel === '低' ? 'bg-green-500/30 text-green-300' :
              analysisResult.risk.riskLevel === '中' ? 'bg-yellow-500/30 text-yellow-300' :
              'bg-red-500/30 text-red-300'
            }`}>
              {analysisResult.risk.riskLevel}风险
            </span>
          </div>
          <div className="space-y-2">
            {analysisResult.risk.risks?.map((r, i) => (
              <div key={i} className="bg-black/30 rounded-lg p-2 text-sm">
                <div className="text-white">{r.type}</div>
                <div className="text-gray-400">{r.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 碳排放 */}
      {analysisResult?.carbon && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-bold text-cyan-300">🌍 碳排放</div>
            <span className="px-3 py-1 rounded-full bg-cyan-500/30 text-cyan-300">
              等级 {analysisResult.carbon.rating}
            </span>
          </div>
          <div className="text-2xl font-bold text-white mb-3">{analysisResult.carbon.totalEmission?.toFixed(1)} kg CO₂</div>
          <div className="text-sm text-gray-400">{analysisResult.carbon.analysis}</div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleRestart}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
        >
          🔄 重新分析
        </button>
        <Link
          href={sessionId ? `/canvas?sessionId=${sessionId}` : '/canvas'}
          className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium text-center transition-colors"
        >
          ← 返回画布
        </Link>
      </div>
    </div>
  );

  // 错误提示
  const renderError = () => error ? (
    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300 text-center">
      {error}
    </div>
  ) : null;

  // 没有零件信息
  if (!partName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">缺少零件信息</p>
          <Link href="/setup" className="text-purple-400 hover:text-purple-300">
            返回调制界面
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white">
      {/* 头部 */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={sessionId ? `/canvas?sessionId=${sessionId}` : '/canvas'}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← 返回
            </Link>
            <div className="w-px h-8 bg-white/20" />
            <h1 className="text-xl font-bold">🏭 生产分析</h1>
          </div>
          <div className="text-gray-400">
            {partName}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* 步骤指示器 */}
        {renderStepIndicator()}

        {/* 错误提示 */}
        {renderError()}

        {/* 步骤内容 */}
        {currentStep === 'supplier-select' && renderSupplierSelect()}
        {currentStep === 'customization' && renderCustomization()}
        {currentStep === 'process-select' && renderProcessSelect()}
        {currentStep === 'analyzing' && renderAnalyzing()}
        {currentStep === 'result' && renderResult()}
      </main>
    </div>
  );
}

export default function ProductionAnalysis() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <ProductionAnalysisPage />
    </Suspense>
  );
}
