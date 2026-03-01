// 零件数据模型
export class Part {
  constructor(id, name, level, parentId = null) {
    this.id = id;
    this.name = name;
    this.level = level;
    this.parentId = parentId;
    this.children = [];
    this.suppliers = [];
    this.customizedOption = null;
    this.selectedOption = null; // 'supplier' or 'customized'
    this.status = 'pending'; // pending, analyzing, completed
  }

  addChild(part) {
    this.children.push(part);
  }

  setSuppliers(suppliers) {
    this.suppliers = suppliers;
  }

  setCustomizedOption(option) {
    this.customizedOption = option;
  }
}

// 供应商数据模型
export class Supplier {
  constructor(id, name, partName, specs, price, reliability, leadTime) {
    this.id = id;
    this.name = name;
    this.partName = partName;
    this.specs = specs;
    this.price = price;
    this.reliability = reliability;
    this.leadTime = leadTime;
  }
}

// 定制化选项数据模型
export class CustomizedOption {
  constructor(id, partName, parameters, processes) {
    this.id = id;
    this.partName = partName;
    this.parameters = parameters;
    this.processes = processes;
    this.selectedProcess = null;
  }

  setSelectedProcess(process) {
    this.selectedProcess = process;
  }
}

// 工艺数据模型
export class Process {
  constructor(id, name, description, cost, risk, carbonEmission) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cost = cost;
    this.risk = risk;
    this.carbonEmission = carbonEmission;
  }
}

// 评估结果数据模型
export class Assessment {
  constructor(partId, optionType, optionId) {
    this.partId = partId;
    this.optionType = optionType; // 'supplier' or 'customized'
    this.optionId = optionId;
    this.cost = 0;
    this.risk = '';
    this.carbonEmission = 0;
    this.recommendation = ''; // 'break' or 'keep'
    this.reasoning = '';
  }
}
