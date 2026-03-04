'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Agent 分析状态
interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  content: string;
}

// 生产分析结果
interface ProductionResult {
  suppliers?: {
    name: string;
    specs: string;
    price: number;
    reliability: number;
    leadTime: number;
  }[];
  customization?: {
    questions: {
      question: string;
      type: string;
      options?: string[];
    }[];
  };
  processes?: {
    name: string;
    description: string;
    cost: number;
    risk: string;
    carbonEmission: number;
  }[];
  cost?: {
    totalCost: number;
    breakdown: { material: number; processing: number; shipping: number; other: number };
    analysis: string;
  };
  risk?: {
    riskLevel: string;
    risks: { type: string; description: string; impact: string; mitigation: string }[];
    overallAssessment: string;
  };
  carbon?: {
    totalEmission: number;
    breakdown: { production: number; transportation: number; material: number };
    rating: string;
    analysis: string;
  };
  breaking?: {
    recommendation: string;
    confidence: number;
    reasoning: string;
    keyFactors: string[];
  };
}

// 各个 Agent 的状态
interface AllAgentStates {
  supplier: AgentStatus;
  customization: AgentStatus;
  process: AgentStatus;
  cost: AgentStatus;
  risk: AgentStatus;
  carbon: AgentStatus;
  breaking: AgentStatus;
}

function ProductionAnalysisPage() {
  const searchParams = useSearchParams();
  const partName = searchParams.get('partName') || '';
  const partId = searchParams.get('partId') || '';

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('supplier');

  // 各个 Agent 的状态
  const [agentStates, setAgentStates] = useState<AllAgentStates>({
    supplier: { name: '供应商分析', status: 'idle', content: '' },
    customization: { name: '定制化咨询', status: 'idle', content: '' },
    process: { name: '工艺方案', status: 'idle', content: '' },
    cost: { name: '成本分析', status: 'idle', content: '' },
    risk: { name: '风险评估', status: 'idle', content: '' },
    carbon: { name: '碳排放评估', status: 'idle', content: '' },
    breaking: { name: '综合决策', status: 'idle', content: '' },
  });

  const [result, setResult] = useState<ProductionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 选择供应商后的定制参数
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [customizationAnswers, setCustomizationAnswers] = useState<Record<string, string>>({});
  const [selectedProcess, setSelectedProcess] = useState<any>(null);

  // 开始完整分析流程
  const startFullAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setCurrentStep('supplier');

    // 重置所有状态
    setAgentStates({
      supplier: { name: '供应商分析', status: 'running', content: '🔍 正在搜索供应商信息...' },
      customization: { name: '定制化咨询', status: 'idle', content: '' },
      process: { name: '工艺方案', status: 'idle', content: '' },
      cost: { name: '成本分析', status: 'idle', content: '' },
      risk: { name: '风险评估', status: 'idle', content: '' },
      carbon: { name: '碳排放评估', status: 'idle', content: '' },
      breaking: { name: '综合决策', status: 'idle', content: '' },
    });

    try {
      // 步骤1: 供应商分析
      const supplierRes = await callAPI('find_suppliers', { partName });
      await updateAgentState('supplier', 'completed', formatSupplierContent(supplierRes));

      // 步骤2: 定制化咨询
      setCurrentStep('customization');
      setAgentStates(prev => ({ ...prev, customization: { ...prev.customization, status: 'running', content: '🔍 正在生成定制问题...' } }));
      const customRes = await callAPI('start_customization', { partName });
      await updateAgentState('customization', 'completed', formatCustomizationContent(customRes));

      // 步骤3: 工艺方案（如果已有定制参数）
      setCurrentStep('process');
      setAgentStates(prev => ({ ...prev, process: { ...prev.process, status: 'running', content: '🔍 正在生成工艺方案...' } }));
      const processRes = await callAPI('generate_processes', { partName, customizedParams: customizationAnswers });
      await updateAgentState('process', 'completed', formatProcessContent(processRes));

      // 步骤4: 成本分析
      setCurrentStep('cost');
      setAgentStates(prev => ({ ...prev, cost: { ...prev.cost, status: 'running', content: '🔍 正在分析成本...' } }));
      const option = selectedSupplier || selectedProcess || { price: 200 };
      const costRes = await callAPI('analyze_cost', { option, optionType: selectedSupplier ? 'supplier' : 'process' });
      await updateAgentState('cost', 'completed', formatCostContent(costRes));

      // 步骤5: 风险评估
      setCurrentStep('risk');
      setAgentStates(prev => ({ ...prev, risk: { ...prev.risk, status: 'running', content: '🔍 正在评估风险...' } }));
      const riskRes = await callAPI('assess_risk', { option, optionType: selectedSupplier ? 'supplier' : 'process' });
      await updateAgentState('risk', 'completed', formatRiskContent(riskRes));

      // 步骤6: 碳排放评估
      setCurrentStep('carbon');
      setAgentStates(prev => ({ ...prev, carbon: { ...prev.carbon, status: 'running', content: '🔍 正在评估碳排放...' } }));
      const carbonRes = await callAPI('assess_carbon', { option, optionType: selectedSupplier ? 'supplier' : 'process' });
      await updateAgentState('carbon', 'completed', formatCarbonContent(carbonRes));

      // 步骤7: 综合决策
      setCurrentStep('breaking');
      setAgentStates(prev => ({ ...prev, breaking: { ...prev.breaking, status: 'running', content: '🔍 正在进行综合分析...' } }));
      const breakingRes = await callAPI('recommend', { costData: costRes, riskData: riskRes, carbonData: carbonRes });
      await updateAgentState('breaking', 'completed', formatBreakingContent(breakingRes));

      setResult({
        suppliers: supplierRes?.suppliers || supplierRes,
        customization: customRes,
        processes: processRes?.processes || processRes,
        cost: costRes?.cost || costRes,
        risk: riskRes?.risk || riskRes,
        carbon: carbonRes?.carbon || carbonRes,
        breaking: breakingRes
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  // 更新 Agent 状态
  const updateAgentState = (key: keyof AllAgentStates, status: AgentStatus['status'], content: string) => {
    setAgentStates(prev => ({
      ...prev,
      [key]: { ...prev[key], status, content }
    }));
    return new Promise<void>(resolve => setTimeout(resolve, 800));
  };

  // 格式化供应商内容
  const formatSupplierContent = (data: any) => {
    const suppliers = data?.suppliers || data || [];
    return `✅ 已找到 ${suppliers.length} 个潜在供应商\n\n` +
      suppliers.map((s: any) => `• ${s.name}\n  规格: ${s.specs}\n  价格: ¥${s.price}\n  可靠性: ${s.reliability}/10\n  交货期: ${s.leadTime}天\n`).join('\n');
  };

  // 格式化定制化内容
  const formatCustomizationContent = (data: any) => {
    const questions = data?.questions || [];
    return `✅ 定制问题已生成\n\n` +
      questions.map((q: any, i: number) => `${i + 1}. ${q.question}${q.options ? `\n   选项: ${q.options.join(', ')}` : ''}`).join('\n\n');
  };

  // 格式化工艺方案内容
  const formatProcessContent = (data: any) => {
    const processes = data?.processes || data || [];
    return `✅ 工艺方案已生成\n\n` +
      processes.map((p: any) => `• ${p.name}\n  ${p.description}\n  成本: ¥${p.cost} | 风险: ${p.risk} | 碳排放: ${p.carbonEmission}kg`).join('\n\n');
  };

  // 格式化成本内容
  const formatCostContent = (data: any) => {
    const cost = data?.cost || data || {};
    return `✅ 成本分析完成\n\n总成本: ¥${cost.totalCost?.toFixed?.(2) || 0}\n\n` +
      `材料: ¥${cost.breakdown?.material?.toFixed?.(0) || 0}\n` +
      `加工: ¥${cost.breakdown?.processing?.toFixed?.(0) || 0}\n` +
      `运输: ¥${cost.breakdown?.shipping?.toFixed?.(0) || 0}\n` +
      `其他: ¥${cost.breakdown?.other?.toFixed?.(0) || 0}\n\n` +
      `${cost.analysis || ''}`;
  };

  // 格式化风险内容
  const formatRiskContent = (data: any) => {
    const risk = data?.risk || data || {};
    return `✅ 风险评估完成\n\n风险等级: ${risk.riskLevel || '低'}\n\n` +
      (risk.risks || []).map((r: any) => `• ${r.type}\n  ${r.description}\n  影响: ${r.impact}\n  应对: ${r.mitigation}`).join('\n\n') +
      `\n\n${risk.overallAssessment || ''}`;
  };

  // 格式化碳排放内容
  const formatCarbonContent = (data: any) => {
    const carbon = data?.carbon || data || {};
    return `✅ 碳排放评估完成\n\n总排放: ${carbon.totalEmission?.toFixed?.(1) || 0} kg CO₂\n\n` +
      `生产: ${carbon.breakdown?.production?.toFixed?.(1) || 0}kg\n` +
      `运输: ${carbon.breakdown?.transportation?.toFixed?.(1) || 0}kg\n` +
      `材料: ${carbon.breakdown?.material?.toFixed?.(1) || 0}kg\n\n` +
      `等级: ${carbon.rating || 'A'}\n\n${carbon.analysis || ''}`;
  };

  // 格式化综合决策内容
  const formatBreakingContent = (data: any) => {
    const breaking = data || {};
    return `✅ 综合分析完成\n\n` +
      `建议: ${breaking.recommendation === 'break' ? '🔨 建议继续拆分' : '📦 建议保持当前'}\n` +
      `置信度: ${breaking.confidence || 0}%\n\n` +
      `${breaking.reasoning || ''}\n\n` +
      `关键因素: ${(breaking.keyFactors || []).join(', ')}`;
  };

  if (!partName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">缺少零件信息</p>
          <Link href="/setup" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/canvas" className="text-gray-400 hover:text-white transition-colors">
              ← 返回
            </Link>
            <div className="w-px h-8 bg-white/20" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              🏭 生产分析
            </h1>
          </div>
          <div className="text-gray-400">
            分析对象: <span className="text-white font-medium">{partName}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 开始分析按钮 */}
        {!result && !isAnalyzing && (
          <div className="text-center mb-8">
            <button
              onClick={startFullAnalysis}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              🚀 开始完整生产分析
            </button>
            <p className="text-gray-400 mt-4">
              将依次执行：供应商分析 → 定制化咨询 → 工艺方案 → 成本分析 → 风险评估 → 碳排放评估 → 综合决策
            </p>
          </div>
        )}

        {/* 分析进度 */}
        {isAnalyzing && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
              <span className="text-emerald-400 font-medium">分析中...</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(agentStates).map(([key, state]) => (
                <span
                  key={key}
                  className={`px-3 py-1 rounded-full text-sm ${
                    state.status === 'completed' ? 'bg-emerald-500/30 text-emerald-300' :
                    state.status === 'running' ? 'bg-blue-500/30 text-blue-300 animate-pulse' :
                    'bg-gray-500/30 text-gray-400'
                  }`}
                >
                  {state.status === 'completed' ? '✅' : state.status === 'running' ? '🔄' : '⏳'} {state.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧: Agent 分析过程 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">🤖 Agent 分析过程</h2>

            {Object.entries(agentStates).map(([key, agent]) => (
              <div
                key={key}
                className={`rounded-xl border-2 p-4 transition-all ${
                  agent.status === 'running'
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : agent.status === 'completed'
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : agent.status === 'error'
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xl ${agent.status === 'running' ? 'animate-spin' : ''}`}>
                    {agent.status === 'idle' ? '⏳' :
                     agent.status === 'running' ? '🔄' :
                     agent.status === 'completed' ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">{agent.name}</span>
                </div>
                {agent.content && (
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono mt-2 bg-black/30 p-3 rounded-lg">
                    {agent.content}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {/* 右侧: 分析结果 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">📊 分析结果</h2>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
                ❌ {error}
              </div>
            )}

            {result ? (
              <div className="space-y-4">
                {/* 供应商 */}
                {result.suppliers && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/30">
                    <div className="text-lg font-bold text-blue-300 mb-3">🏢 供应商</div>
                    <div className="space-y-2">
                      {result.suppliers.map((s: any, i: number) => (
                        <div key={i} className="bg-black/30 rounded-lg p-3">
                          <div className="font-medium text-white">{s.name}</div>
                          <div className="text-sm text-gray-400">{s.specs}</div>
                          <div className="flex justify-between mt-2 text-sm">
                            <span className="text-emerald-400">¥{s.price}</span>
                            <span className="text-gray-400">可靠性: {s.reliability}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 定制化问题 */}
                {result.customization && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30">
                    <div className="text-lg font-bold text-purple-300 mb-3">❓ 定制问题</div>
                    <div className="space-y-2">
                      {result.customization.questions?.map((q: any, i: number) => (
                        <div key={i} className="bg-black/30 rounded-lg p-3">
                          <div className="text-white">{q.question}</div>
                          {q.options && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {q.options.map((opt: string, j: number) => (
                                <span key={j} className="text-xs bg-gray-700 px-2 py-1 rounded">{opt}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 工艺方案 */}
                {result.processes && (
                  <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-500/30">
                    <div className="text-lg font-bold text-orange-300 mb-3">⚙️ 工艺方案</div>
                    <div className="space-y-2">
                      {result.processes.map((p: any, i: number) => (
                        <div key={i} className="bg-black/30 rounded-lg p-3">
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-sm text-gray-400">{p.description}</div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-emerald-400">¥{p.cost}</span>
                            <span className="text-yellow-400">{p.risk}</span>
                            <span className="text-cyan-400">{p.carbonEmission}kg CO₂</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 成本 */}
                {result.cost && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30">
                    <div className="text-lg font-bold text-green-300 mb-3">💰 成本: ¥{result.cost.totalCost?.toFixed(2)}</div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="text-center">
                        <div className="text-gray-400">材料</div>
                        <div className="text-white">¥{result.cost.breakdown?.material?.toFixed(0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">加工</div>
                        <div className="text-white">¥{result.cost.breakdown?.processing?.toFixed(0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">运输</div>
                        <div className="text-white">¥{result.cost.breakdown?.shipping?.toFixed(0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">其他</div>
                        <div className="text-white">¥{result.cost.breakdown?.other?.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 风险 */}
                {result.risk && (
                  <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-red-300">⚠️ 风险: {result.risk.riskLevel}</div>
                    </div>
                    <div className="space-y-2">
                      {result.risk.risks?.map((r: any, i: number) => (
                        <div key={i} className="bg-black/30 rounded-lg p-2 text-sm">
                          <span className="text-white">{r.type}</span>
                          <span className="text-gray-400 ml-2">- {r.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 碳排放 */}
                {result.carbon && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-emerald-300">🌍 {result.carbon.totalEmission?.toFixed(1)} kg CO₂</div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300">等级 {result.carbon.rating}</span>
                    </div>
                  </div>
                )}

                {/* 拆分建议 */}
                {result.breaking && (
                  <div className={`rounded-xl p-4 border ${
                    result.breaking.recommendation === 'break'
                      ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30'
                      : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-lg font-bold ${
                        result.breaking.recommendation === 'break' ? 'text-purple-300' : 'text-amber-300'
                      }`}>
                        {result.breaking.recommendation === 'break' ? '🔨 建议继续拆分' : '📦 建议保持当前'}
                      </div>
                      <span className="text-gray-400">置信度: {result.breaking.confidence}%</span>
                    </div>
                    <div className="text-gray-300 text-sm">{result.breaking.reasoning}</div>
                  </div>
                )}

                {/* 重新分析按钮 */}
                <button
                  onClick={startFullAnalysis}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  🔄 重新分析
                </button>
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
                <div className="text-4xl mb-4">📊</div>
                <div className="text-gray-400">点击上方按钮开始生产分析</div>
              </div>
            )}
          </div>
        </div>
      </div>
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
