import { PartBreakdownAgent } from '../agents/breakdown-agent.js';
import { SupplierAgent } from '../agents/supplier-agent.js';
import { CustomizedAgent } from '../agents/customized-agent.js';
import { ProcessAgent } from '../agents/process-agent.js';
import { CostAgent } from '../agents/cost-agent.js';
import { RiskAgent } from '../agents/risk-agent.js';
import { CarbonAgent } from '../agents/carbon-agent.js';
import { BreakingAgent } from '../agents/breaking-agent.js';
import { Assessment } from '../models/data-models.js';

export class WorkflowService {
  constructor() {
    this.breakdownAgent = new PartBreakdownAgent();
    this.supplierAgent = new SupplierAgent();
    this.customizedAgent = new CustomizedAgent();
    this.processAgent = new ProcessAgent();
    this.costAgent = new CostAgent();
    this.riskAgent = new RiskAgent();
    this.carbonAgent = new CarbonAgent();
    this.breakingAgent = new BreakingAgent();

    this.currentPart = null;
    this.partsTree = [];
    this.assessmentHistory = [];
    this.accumulatedCost = 0;
  }

  async startProductBreakdown(productName, onThinking) {
    const parts = await this.breakdownAgent.breakdownProduct(productName, onThinking);
    this.partsTree = parts;
    return parts;
  }

  async findSuppliersForPart(part, onThinking) {
    const suppliers = await this.supplierAgent.findSuppliers(part.name, '', onThinking);
    part.setSuppliers(suppliers);
    return suppliers;
  }

  async startCustomization(part, onThinking) {
    const questions = await this.customizedAgent.generateQuestions(part.name, onThinking);
    return questions;
  }

  async generateProcesses(part, customizedParams, onThinking) {
    const processes = await this.processAgent.generateProcesses(part.name, customizedParams, onThinking);
    return processes;
  }

  async enterStateA(part, option, optionType, onThinking) {
    const results = {
      cost: null,
      risk: null,
      carbon: null,
      recommendation: null
    };

    // 并行执行三个agent
    const [costData, riskData, carbonData] = await Promise.all([
      this.costAgent.analyzeCost(option, optionType, onThinking),
      this.riskAgent.assessRisk(option, optionType, onThinking),
      this.carbonAgent.assessCarbon(option, optionType, onThinking)
    ]);

    results.cost = costData;
    results.risk = riskData;
    results.carbon = carbonData;

    // Keep Breaking Agent 综合分析
    const recommendation = await this.breakingAgent.recommend(
      costData,
      riskData,
      carbonData,
      this.assessmentHistory,
      onThinking
    );

    results.recommendation = recommendation;

    // 保存评估结果
    const assessment = new Assessment(part.id, optionType, option.id);
    assessment.cost = costData?.totalCost || 0;
    assessment.risk = riskData?.riskLevel || '';
    assessment.carbonEmission = carbonData?.totalEmission || 0;
    assessment.recommendation = recommendation?.recommendation || '';
    assessment.reasoning = recommendation?.reasoning || '';

    this.assessmentHistory.push(assessment);

    return results;
  }

  async breakdownPart(part, onThinking) {
    const subParts = await this.breakdownAgent.breakdownPart(
      part.name,
      part.id,
      part.level + 1,
      onThinking
    );

    subParts.forEach(subPart => {
      part.addChild(subPart);
    });

    return subParts;
  }

  getPartsTree() {
    return this.partsTree;
  }

  getAssessmentHistory() {
    return this.assessmentHistory;
  }

  clearCache() {
    this.breakdownAgent.clearThinkingProcess();
    this.supplierAgent.clearThinkingProcess();
    this.customizedAgent.clearThinkingProcess();
    this.processAgent.clearThinkingProcess();
    this.costAgent.clearThinkingProcess();
    this.riskAgent.clearThinkingProcess();
    this.carbonAgent.clearThinkingProcess();
    this.breakingAgent.clearThinkingProcess();
  }
}
