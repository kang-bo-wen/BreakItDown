let ws = null;
let currentPart = null;
let partsData = [];
let currentSuppliers = [];
let currentProcesses = [];
let assessmentResults = null;

// 初始化WebSocket连接
function initWebSocket() {
  ws = new WebSocket('ws://localhost:4000');

  ws.onopen = () => {
    console.log('WebSocket连接已建立');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };

  ws.onerror = (error) => {
    console.error('WebSocket错误:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket连接已关闭');
    setTimeout(initWebSocket, 3000);
  };
}

// 处理服务器消息
function handleMessage(message) {
  switch (message.type) {
    case 'thinking':
      updateAgentThinking(message.agent, message.content);
      break;
    case 'parts_breakdown':
      displayPartsTree(message.parts);
      break;
    case 'suppliers_found':
      displaySuppliers(message.suppliers);
      break;
    case 'customization_questions':
      displayCustomizationQuestions(message.questions);
      break;
    case 'processes_generated':
      displayProcesses(message.processes);
      break;
    case 'assessment_complete':
      displayAssessmentResults(message.results);
      break;
    case 'error':
      alert('错误: ' + message.message);
      break;
  }
}

// 更新Agent思考过程
function updateAgentThinking(agentName, content) {
  // 过滤掉Keep Breaking Agent，不在中间面板显示
  if (agentName === 'Keep Breaking Agent') {
    return;
  }

  let agentCard = document.querySelector(`[data-agent="${agentName}"]`);

  if (!agentCard) {
    agentCard = createAgentCard(agentName);
    document.getElementById('agentsGrid').appendChild(agentCard);
  }

  const thinkingDiv = agentCard.querySelector('.agent-thinking');
  thinkingDiv.textContent += content;
  thinkingDiv.scrollTop = thinkingDiv.scrollHeight;

  agentCard.classList.add('active');
  agentCard.querySelector('.agent-status').classList.add('active');
}

// 创建Agent卡片
function createAgentCard(agentName) {
  const card = document.createElement('div');
  card.className = 'agent-card';
  card.setAttribute('data-agent', agentName);
  card.innerHTML = `
    <div class="agent-header">
      <div class="agent-status"></div>
      <div class="agent-name">${agentName}</div>
    </div>
    <div class="agent-thinking"></div>
  `;
  return card;
}

// 显示零件树
function displayPartsTree(parts) {
  partsData = parts;
  const treeDiv = document.getElementById('partsTree');
  treeDiv.innerHTML = '';

  parts.forEach(part => {
    const partItem = createPartItem(part);
    treeDiv.appendChild(partItem);
  });
}

// 创建零件项
function createPartItem(part) {
  const item = document.createElement('div');
  item.className = `part-item level-${part.level}`;
  item.setAttribute('data-part-id', part.id);
  item.innerHTML = `
    <strong>${part.name}</strong>
    ${part.status ? `<span style="color: #999; margin-left: 10px;">[${part.status}]</span>` : ''}
  `;

  item.addEventListener('click', () => {
    selectPart(part);
  });

  return item;
}

// 选择零件
function selectPart(part) {
  currentPart = part;

  document.querySelectorAll('.part-item').forEach(item => {
    item.classList.remove('selected');
  });

  document.querySelector(`[data-part-id="${part.id}"]`).classList.add('selected');

  // 清空Agent面板
  document.getElementById('agentsGrid').innerHTML = '';

  // 发送请求查找供应商
  ws.send(JSON.stringify({
    type: 'find_suppliers',
    partId: part.id,
    partName: part.name
  }));
}

// 显示供应商列表
function displaySuppliers(suppliers) {
  currentSuppliers = suppliers;
  const panel = document.getElementById('interactionPanel');
  panel.innerHTML = `
    <h3>供应商选项</h3>
    <div class="supplier-list" id="supplierList"></div>
    <div class="action-buttons">
      <button class="btn btn-secondary" onclick="refreshSuppliers()">更换供应商</button>
      <button class="btn btn-secondary" onclick="startCustomization()">定制零件</button>
    </div>
  `;

  const listDiv = document.getElementById('supplierList');
  suppliers.forEach(supplier => {
    const item = createSupplierItem(supplier);
    listDiv.appendChild(item);
  });
}

// 创建供应商项
function createSupplierItem(supplier) {
  const item = document.createElement('div');
  item.className = 'supplier-item';
  item.setAttribute('data-supplier-id', supplier.id);
  item.innerHTML = `
    <div class="supplier-name">${supplier.name}</div>
    <div class="supplier-details">
      <div>规格: ${supplier.specs}</div>
      <div>价格: ¥${supplier.price}</div>
      <div>可靠性: ${supplier.reliability}/10</div>
      <div>交货周期: ${supplier.leadTime}天</div>
    </div>
  `;

  item.addEventListener('click', () => {
    selectSupplier(supplier);
  });

  return item;
}

// 选择供应商
function selectSupplier(supplier) {
  document.querySelectorAll('.supplier-item').forEach(item => {
    item.classList.remove('selected');
  });

  document.querySelector(`[data-supplier-id="${supplier.id}"]`).classList.add('selected');

  // 进入状态A
  ws.send(JSON.stringify({
    type: 'enter_state_a',
    partId: currentPart.id,
    option: supplier,
    optionType: 'supplier'
  }));
}

// 刷新供应商
function refreshSuppliers() {
  ws.send(JSON.stringify({
    type: 'find_suppliers',
    partId: currentPart.id,
    partName: currentPart.name
  }));
}

// 开始定制
function startCustomization() {
  ws.send(JSON.stringify({
    type: 'start_customization',
    partId: currentPart.id,
    partName: currentPart.name
  }));
}

// 显示定制问题
function displayCustomizationQuestions(questions) {
  const panel = document.getElementById('interactionPanel');
  panel.innerHTML = `
    <h3>定制零件参数</h3>
    <form id="customizationForm">
      ${questions.map((q, index) => `
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">${q.question}</label>
          ${q.type === 'select' ? `
            <select name="q${index}" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
              ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          ` : `
            <input type="${q.type}" name="q${index}" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
          `}
        </div>
      `).join('')}
      <button type="submit" class="btn btn-primary">提交定制需求</button>
    </form>
  `;

  document.getElementById('customizationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const params = {};
    questions.forEach((q, index) => {
      params[q.question] = formData.get(`q${index}`);
    });

    ws.send(JSON.stringify({
      type: 'generate_processes',
      partId: currentPart.id,
      partName: currentPart.name,
      customizedParams: params
    }));
  });
}

// 显示工艺选项
function displayProcesses(processes) {
  currentProcesses = processes;
  const panel = document.getElementById('interactionPanel');
  panel.innerHTML = `
    <h3>工艺方案</h3>
    <div class="supplier-list" id="processList"></div>
    <div style="margin-top: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">其他工艺（自定义）</label>
      <input type="text" id="customProcess" placeholder="输入自定义工艺" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
      <button class="btn btn-secondary" style="margin-top: 10px;" onclick="submitCustomProcess()">提交自定义工艺</button>
    </div>
  `;

  const listDiv = document.getElementById('processList');
  processes.forEach(process => {
    const item = createProcessItem(process);
    listDiv.appendChild(item);
  });
}

// 创建工艺项
function createProcessItem(process) {
  const item = document.createElement('div');
  item.className = 'supplier-item';
  item.setAttribute('data-process-id', process.id);
  item.innerHTML = `
    <div class="supplier-name">${process.name}</div>
    <div style="margin: 10px 0; color: #666;">${process.description}</div>
    <div class="supplier-details">
      <div>成本: ¥${process.cost}</div>
      <div>碳排放: ${process.carbonEmission} kg CO2</div>
    </div>
    <div style="margin-top: 10px; color: #999; font-size: 14px;">风险: ${process.risk}</div>
  `;

  item.addEventListener('click', () => {
    selectProcess(process);
  });

  return item;
}

// 选择工艺
function selectProcess(process) {
  document.querySelectorAll('.supplier-item').forEach(item => {
    item.classList.remove('selected');
  });

  document.querySelector(`[data-process-id="${process.id}"]`).classList.add('selected');

  // 进入状态A
  ws.send(JSON.stringify({
    type: 'enter_state_a',
    partId: currentPart.id,
    option: process,
    optionType: 'customized'
  }));
}

// 提交自定义工艺
function submitCustomProcess() {
  const customProcess = document.getElementById('customProcess').value;
  if (!customProcess) {
    alert('请输入自定义工艺');
    return;
  }

  const process = {
    id: `custom-${Date.now()}`,
    name: customProcess,
    description: '用户自定义工艺',
    cost: 0,
    risk: '待评估',
    carbonEmission: 0
  };

  selectProcess(process);
}

// 显示评估结果
function displayAssessmentResults(results) {
  assessmentResults = results;

  // 使用弹窗显示评估结果和Keep Breaking Agent建议
  const modal = document.getElementById('assessmentModal');
  const modalBody = document.getElementById('assessmentModalBody');

  modalBody.innerHTML = `
    <h2 style="margin-bottom: 20px; color: #333;">评估结果</h2>
    <div class="assessment-results">
      <div class="assessment-card">
        <div class="assessment-title">成本分析</div>
        <div class="assessment-value">¥${results.cost?.totalCost || 0}</div>
        <div class="assessment-details">${results.cost?.analysis || ''}</div>
      </div>
      <div class="assessment-card">
        <div class="assessment-title">工程风险</div>
        <div class="assessment-value">${results.risk?.riskLevel || '未知'}</div>
        <div class="assessment-details">${results.risk?.overallAssessment || ''}</div>
      </div>
      <div class="assessment-card">
        <div class="assessment-title">碳排放</div>
        <div class="assessment-value">${results.carbon?.totalEmission || 0} kg</div>
        <div class="assessment-details">评级: ${results.carbon?.rating || 'N/A'}</div>
      </div>
    </div>
    <div style="margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 10px;">
      <h3 style="margin-bottom: 15px; color: #333;">Keep Breaking Agent 建议</h3>
      <p style="font-size: 20px; font-weight: bold; color: ${results.recommendation?.recommendation === 'break' ? '#4caf50' : '#ff9800'}; margin: 15px 0;">
        ${results.recommendation?.recommendation === 'break' ? '建议继续拆分' : '建议保持当前选项'}
      </p>
      <p style="color: #666; line-height: 1.8; margin-bottom: 20px;">${results.recommendation?.reasoning || ''}</p>
      <div class="action-buttons">
        <button class="btn btn-primary" onclick="breakdownPart()">继续拆分零件</button>
        <button class="btn btn-secondary" onclick="keepCurrentOption()">保持当前选项</button>
      </div>
    </div>
  `;

  modal.classList.add('show');

  // 关闭弹窗事件
  const closeBtn = modal.querySelector('.close-modal');
  closeBtn.onclick = () => {
    modal.classList.remove('show');
  };

  // 点击弹窗外部关闭
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  };
}

// 拆分零件
function breakdownPart() {
  // 关闭弹窗
  document.getElementById('assessmentModal').classList.remove('show');

  ws.send(JSON.stringify({
    type: 'breakdown_part',
    partId: currentPart.id,
    partName: currentPart.name
  }));
}

// 保持当前选项
function keepCurrentOption() {
  // 关闭弹窗
  document.getElementById('assessmentModal').classList.remove('show');
  alert('已保存当前选项');
}

// 开始分析
document.getElementById('startBtn').addEventListener('click', () => {
  const productName = document.getElementById('productName').value;
  if (!productName) {
    alert('请输入产品名称');
    return;
  }

  ws.send(JSON.stringify({
    type: 'start_breakdown',
    productName: productName
  }));
});

// 初始化
initWebSocket();