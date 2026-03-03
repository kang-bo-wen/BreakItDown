let ws = null;
let currentPart = null;
let partsData = [];
let currentSuppliers = [];
let currentProcesses = [];
let assessmentResults = null;

// 树状可视化数据结构 - 径向布局
let treeData = {
  id: null,
  name: null,
  children: [],
  level: 0,
  isExpanded: true,
  status: null
};

// 布局配置 - 径向布局（参考项目二）
const LAYOUT_CONFIG = {
  centerX: 500,
  centerY: 400,
  radiusStep: 150,  // 层级间距
  baseNodeSize: 60  // 节点稍小
};

// 树视图缩放和拖拽状态
let treeScale = 1;
let treePanX = 0;
let treePanY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// 节点拖拽状态
let isNodeDragging = false;
let draggedNode = null;
let draggedNodeElement = null;
let nodeDragOffsetX = 0;
let nodeDragOffsetY = 0;

// 节点自定义位置存储 (仅当前会话有效)
const nodeCustomPositions = {};

// 初始化WebSocket连接
async function initWebSocket() {
  // 先获取当前服务器端口
  let port = 4000;
  try {
    const response = await fetch('/api/port');
    const data = await response.json();
    port = data.port;
    console.log(`检测到服务器端口: ${port}`);
  } catch (e) {
    console.log('使用默认端口 4000');
  }

  ws = new WebSocket(`ws://localhost:${port}`);

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

// Agent颜色和图标配置
const agentStyles = {
  'supplier-agent': { icon: '🏭', color: '#3b82f6', name: '供应商Agent' },
  'customized-agent': { icon: '🎨', color: '#8b5cf6', name: '定制化Agent' },
  'process-agent': { icon: '⚙️', color: '#f97316', name: '工艺Agent' },
  'cost-agent': { icon: '💰', color: '#10b981', name: '成本Agent' },
  'risk-agent': { icon: '⚠️', color: '#ef4444', name: '风险Agent' },
  'carbon-agent': { icon: '🌿', color: '#06b6d4', name: '碳排放Agent' },
  'breaking-agent': { icon: '🔄', color: '#f59e0b', name: '决策Agent' }
};

// 创建Agent卡片
function createAgentCard(agentName) {
  const style = agentStyles[agentName] || { icon: '🤖', color: '#667eea', name: agentName };

  const card = document.createElement('div');
  card.className = 'agent-card';
  card.setAttribute('data-agent', agentName);
  card.style.setProperty('--agent-color', style.color);

  card.innerHTML = `
    <div class="agent-card-header" onclick="toggleAgentCard(this)">
      <div class="agent-header">
        <div class="agent-status" style="background: ${style.color};"></div>
        <div class="agent-icon">${style.icon}</div>
        <div class="agent-name">${style.name}</div>
      </div>
      <button class="agent-collapse-btn" onclick="event.stopPropagation(); toggleAgentCard(this.parentElement)">▼</button>
 </div>
    <div class="agent-thinking"></div>
  `;
  return card;
}

// 显示零件树
function displayPartsTree(parts) {
  partsData = parts;

  // 构建树形数据结构
  buildTreeFromParts(parts);

  // 重置树的初始化状态，以便自动居中
  if (treeData) {
    treeData._initialized = false;
  }

  // 渲染树状可视化（自动居中）
  renderVisualTree();

  // 渲染零件卡片列表（显示描述和重要性）
  const cardsDiv = document.getElementById('partsCards');
  cardsDiv.innerHTML = '';

  parts.forEach(part => {
    const partCard = createPartCard(part);
    cardsDiv.appendChild(partCard);
  });
}

// 创建零件卡片（显示描述和重要性）
function createPartCard(part) {
  const card = document.createElement('div');
  card.className = 'part-card';
  card.setAttribute('data-part-id', part.id);

  // 重要性标签颜色
  const importanceColors = {
    '高': '#e74c3c',
    '中': '#f39c12',
    '低': '#27ae60'
  };
  const importanceColor = importanceColors[part.importance] || importanceColors['中'];

  card.innerHTML = `
    <div class="part-card-header">
      <span class="part-card-name">${part.name}</span>
      ${part.importance ? `<span class="part-importance-tag" style="background: ${importanceColor};">${part.importance}</span>` : ''}
    </div>
    ${part.description ? `<div class="part-card-desc">${part.description}</div>` : ''}
    <div class="part-card-level">层级 ${part.level}</div>
  `;

  card.addEventListener('click', () => {
    selectPart(part);
  });

  return card;
}

// 从零件列表构建树形数据结构
function buildTreeFromParts(parts) {
  if (!parts || parts.length === 0) return;

  // 检查是否已经有嵌套的 children 结构（从 getPartsTree 获取）
  const hasNestedChildren = parts.some(p => p.children && p.children.length > 0);

  if (hasNestedChildren) {
    // 已经是嵌套结构，创建虚拟根节点
    const productName = document.getElementById('productName').value || '产品';

    treeData = {
      id: 'root',
      name: productName,
      children: [],
      level: 0,
      isExpanded: true,
      status: null
    };

    // 递归构建子树
    const buildSubtree = (part, level) => {
      const node = {
        id: part.id,
        name: part.name,
        description: part.description || '',
        importance: part.importance || '中',
        children: [],
        level: level,
        isExpanded: level < 2, // 默认展开到第2层
        status: part.status || null,
        parentId: part.parentId
      };

      // 如果已有 children 数据（从后端获取）
      if (part.children && part.children.length > 0) {
        part.children.forEach(child => {
          node.children.push(buildSubtree(child, level + 1));
        });
      }

      return node;
    };

    // 根节点是 level=1 的节点
    const rootParts = parts.filter(p => p.level === 1);
    rootParts.forEach(rootPart => {
      treeData.children.push(buildSubtree(rootPart, 1));
    });
  } else {
    // 扁平结构，查找根节点
    const rootPart = parts.find(p => p.level === 1);
    if (!rootPart) return;

    treeData = {
      id: rootPart.id || 'root',
      name: rootPart.name,
      children: [],
      level: 0,
      isExpanded: true,
      status: rootPart.status || null
    };

    // 构建子节点
    const level1Parts = parts.filter(p => p.level === 1);
    level1Parts.forEach(part => {
      const childNode = {
        id: part.id,
        name: part.name,
        description: part.description || '',
        importance: part.importance || '中',
        children: [],
        level: 1,
        isExpanded: false,
        status: part.status || null,
        parentId: treeData.id
      };

      // 查找该零件的子零件
      const childParts = parts.filter(p => p.parentId === part.id);
      childParts.forEach(cp => {
        childNode.children.push({
          id: cp.id,
          name: cp.name,
          description: cp.description || '',
          importance: cp.importance || '中',
          children: [],
          level: 2,
          isExpanded: false,
          status: cp.status || null,
          parentId: cp.parentId
        });
      });

      treeData.children.push(childNode);
    });
  }
}

// 渲染可视化树
function renderVisualTree(autoCenter = true) {
  const container = document.getElementById('visualTree');
  const nodesContainer = document.getElementById('treeNodes');
  const edgesContainer = document.getElementById('treeEdges');

  if (!treeData.name) {
    container.classList.remove('has-data');
    return;
  }

  container.classList.add('has-data');
  nodesContainer.innerHTML = '';
  edgesContainer.innerHTML = '';

  // 计算径向布局
  const layout = calculateTreeLayout();

  if (layout.nodes.length === 0) return;

  // ========== 新逻辑：基于完整边界框调整位置 ==========
  const padding = 40; // 边距

  // 1. 计算所有节点的边界
  const minX = Math.min(...layout.nodes.map(n => n.x));
  const maxX = Math.max(...layout.nodes.map(n => n.x + n.width));
  const minY = Math.min(...layout.nodes.map(n => n.y));
  const maxY = Math.max(...layout.nodes.map(n => n.y + n.height));

  // 2. 计算树的实际尺寸
  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;

  // 3. 调整节点位置（平移到从padding开始）
  // 对于有自定义位置的节点，不进行调整（保留用户拖拽后的位置）
  layout.nodes.forEach(node => {
    if (!node.hasCustomPosition) {
      node.x = node.x - minX + padding;
      node.y = node.y - minY + padding;
    }
  });

  // 4. 调整边的位置
  layout.edges.forEach(edge => {
    const sourceNode = layout.nodes.find(n => n.id === edge.sourceId);
    const targetNode = layout.nodes.find(n => n.id === edge.targetId);
    if (sourceNode && !sourceNode.hasCustomPosition) {
      edge.x1 = edge.x1 - minX + padding;
      edge.y1 = edge.y1 - minY + padding;
    }
    if (targetNode && !targetNode.hasCustomPosition) {
      edge.x2 = edge.x2 - minX + padding;
      edge.y2 = edge.y2 - minY + padding;
    }
  });

  // 5. 设置SVG和节点容器大小足以容纳整个树
  const svgWidth = treeWidth + padding * 2;
  const svgHeight = treeHeight + padding * 2;
  edgesContainer.setAttribute('width', svgWidth);
  edgesContainer.setAttribute('height', svgHeight);
  // 同步设置节点容器的尺寸，与SVG一致
  nodesContainer.style.width = svgWidth + 'px';
  nodesContainer.style.height = svgHeight + 'px';

  // 6. 初始自动计算缩放比例让树适应容器
  // 注意：container可能还没显示，需要处理尺寸为0的情况
  let containerWidth = container.clientWidth;
  let containerHeight = container.clientHeight;

  // 如果容器尺寸为0（display:none），使用一个合理的默认值
  if (!containerWidth || containerWidth < 100) containerWidth = 300;
  if (!containerHeight || containerHeight < 100) containerHeight = 400;

  if (!treeData._initialized) {
    // 计算让树完全适应容器的缩放比例
    const scaleX = containerWidth / svgWidth;
    const scaleY = containerHeight / svgHeight;
    // 取较小值确保树完全显示
    treeScale = Math.min(scaleX, scaleY);
    // 限制最小缩放，防止树太大
    treeScale = Math.max(treeScale, 0.15);

    // 居中显示
    treePanX = (containerWidth - svgWidth * treeScale) / 2;
    treePanY = (containerHeight - svgHeight * treeScale) / 2;

    treeData._initialized = true;
  }

  // 应用缩放和平移到节点容器
  nodesContainer.style.transform = `translate(${treePanX}px, ${treePanY}px) scale(${treeScale})`;
  nodesContainer.style.transformOrigin = '0 0';

  // 应用缩放和平移到连接线容器
  edgesContainer.style.transform = `translate(${treePanX}px, ${treePanY}px) scale(${treeScale})`;
  edgesContainer.style.transformOrigin = '0 0';

  // 渲染节点
  layout.nodes.forEach(nodeData => {
    const nodeElement = createTreeNodeElement(nodeData);
    nodeElement.style.left = nodeData.x + 'px';
    nodeElement.style.top = nodeData.y + 'px';
    nodesContainer.appendChild(nodeElement);
  });

  // 渲染连接线
  layout.edges.forEach(edge => {
    const edgeElement = createEdgeElement(edge);
    edgesContainer.appendChild(edgeElement);
  });

  // 更新缩放显示
  updateZoomLevel();
}

// 初始化树视图的鼠标事件
function initTreeViewEvents() {
  const container = document.getElementById('visualTree');
  if (!container) return;

  // 鼠标滚轮缩放
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(treeScale * delta, 0.3), 3);

    // 以鼠标位置为中心缩放
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - treePanX;
    const mouseY = e.clientY - rect.top - treePanY;

    treePanX -= mouseX * (newScale - treeScale) / treeScale;
    treePanY -= mouseY * (newScale - treeScale) / treeScale;

    treeScale = newScale;
    renderVisualTree();
  }, { passive: false });

  // 鼠标拖拽
  container.addEventListener('mousedown', (e) => {
    // 如果点击的是节点或按钮，不触发拖拽
    if (e.target.closest('.tree-node') || e.target.closest('.tree-control-btn')) {
      return;
    }
    isDragging = true;
    dragStartX = e.clientX - treePanX;
    dragStartY = e.clientY - treePanY;
    container.style.cursor = 'grabbing';
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    treePanX = e.clientX - dragStartX;
    treePanY = e.clientY - dragStartY;
    renderVisualTree();
  });

  container.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  // 设置初始光标
  container.style.cursor = 'grab';

  // 更新缩放显示
  updateZoomLevel();

  // 全局节点拖拽事件
  document.addEventListener('mousemove', onNodeDrag);
  document.addEventListener('mouseup', endNodeDrag);
}

// 开始拖拽节点
function startNodeDrag(e, nodeData, nodeElement) {
  e.stopPropagation();

  const container = document.getElementById('visualTree');
  const rect = container.getBoundingClientRect();

  isNodeDragging = true;
  draggedNode = nodeData;
  draggedNodeElement = nodeElement;

  // 获取节点当前位置
  const nodePos = getNodePosition(nodeData.id);
  const nodeX = nodePos.x || nodeData.x || 0;
  const nodeY = nodePos.y || nodeData.y || 0;

  // 计算鼠标相对于节点中心的偏移
  const mouseX = (e.clientX - rect.left - treePanX) / treeScale;
  const mouseY = (e.clientY - rect.top - treePanY) / treeScale;
  nodeDragOffsetX = mouseX - nodeX;
  nodeDragOffsetY = mouseY - nodeY;

  // 添加拖拽样式
  nodeElement.classList.add('dragging');
  container.style.cursor = 'grabbing';
}

// 拖拽中
function onNodeDrag(e) {
  if (!isNodeDragging || !draggedNode) return;

  const container = document.getElementById('visualTree');
  const rect = container.getBoundingClientRect();

  // 计算鼠标在容器中的当前位置
  const currentMouseX = (e.clientX - rect.left - treePanX) / treeScale;
  const currentMouseY = (e.clientY - rect.top - treePanY) / treeScale;

  // 计算节点新位置：当前鼠标位置 - 鼠标相对于节点的偏移
  const newX = currentMouseX - nodeDragOffsetX;
  const newY = currentMouseY - nodeDragOffsetY;

  // 更新节点位置
  nodeCustomPositions[draggedNode.id] = { x: newX, y: newY };

  // 重新渲染
  renderVisualTree();
}

// 获取节点当前位置
function getNodePosition(nodeId) {
  return nodeCustomPositions[nodeId] || { x: 0, y: 0 };
}

// 结束拖拽
function endNodeDrag() {
  if (!isNodeDragging) return;

  // 移除拖拽样式
  if (draggedNodeElement) {
    draggedNodeElement.classList.remove('dragging');
  }

  isNodeDragging = false;

  const container = document.getElementById('visualTree');
  if (container) {
    container.style.cursor = 'grab';
  }

  draggedNode = null;
  draggedNodeElement = null;
}

// 计算树形布局 - 径向布局
function calculateTreeLayout() {
  const nodes = [];
  const edges = [];

  function traverse(node, level, angle, parentId, angleSpan, parentX, parentY) {
    const nodeSize = getNodeSizeByLevel(level);
    const offset = nodeSize / 2;

    // 检查是否有自定义位置
    const customPos = nodeCustomPositions[node.id];

    let x, y;
    if (level === 0) {
      // 根节点在中心
      x = LAYOUT_CONFIG.centerX;
      y = LAYOUT_CONFIG.centerY;
    } else if (customPos) {
      // 有自定义位置时，使用自定义位置（已经是最终显示坐标）
      x = customPos.x + offset;
      y = customPos.y + offset;
    } else {
      // 子节点围绕父节点展开，使用对数增长（参考项目二）
      const radius = LAYOUT_CONFIG.radiusStep * (1 + Math.log(level) * 0.5);
      x = parentX + radius * Math.cos(angle);
      y = parentY + radius * Math.sin(angle);
    }

    nodes.push({
      id: node.id,
      name: node.name,
      x: x - offset,
      y: y - offset,
      level: level,
      status: node.status,
      isExpanded: node.isExpanded,
      hasChildren: node.children && node.children.length > 0,
      width: nodeSize,
      height: nodeSize,
      hasCustomPosition: !!customPos
    });

    // 添加边
    if (parentId) {
      edges.push({
        x1: parentX,
        y1: parentY,
        x2: x,
        y2: y,
        sourceId: parentId,
        targetId: node.id
      });
    }

    // 递归处理子节点
    if (node.isExpanded && node.children && node.children.length > 0) {
      const childCount = node.children.length;

      if (level === 0) {
        // 根节点的子节点围绕整个圆均匀分布
        const angleStep = (Math.PI * 2) / childCount;
        node.children.forEach((child, index) => {
          const childAngle = index * angleStep;
          traverse(child, level + 1, childAngle, node.id, angleStep, x, y);
        });
      } else {
        // 非根节点的子节点在父节点前方扇形区域内分布
        const fanAngle = Math.PI / 2;
        const childAngleSpan = fanAngle / Math.max(childCount, 1);

        node.children.forEach((child, index) => {
          const childAngle = angle - fanAngle / 2 + childAngleSpan * (index + 0.5);
          traverse(child, level + 1, childAngle, node.id, childAngleSpan, x, y);
        });
      }
    }
  }

  if (treeData.name) {
    traverse(treeData, 0, 0, null, Math.PI * 2, LAYOUT_CONFIG.centerX, LAYOUT_CONFIG.centerY);
  }

  return { nodes, edges };
}

// 根据层级获取节点大小
function getNodeSizeByLevel(level) {
  const baseSize = LAYOUT_CONFIG.baseNodeSize;
  const reduction = level * 8;
  return Math.max(baseSize - reduction, 40);
}

// 创建树节点元素
function createTreeNodeElement(nodeData) {
  const node = document.createElement('div');
  node.className = 'tree-node';
  node.setAttribute('data-node-id', nodeData.id);

  if (nodeData.level === 0) {
    node.classList.add('root-node');
  }

  if (nodeData.hasChildren) {
    node.classList.add('has-children');
  }

  if (currentPart && currentPart.id === nodeData.id) {
    node.classList.add('selected');
  }

  // 根据层级设置边框颜色
  const levelColors = {
    0: '#667eea',  // 根节点 - 紫色
    1: '#4caf50',  // 第1层 - 绿色
    2: '#2196f3',  // 第2层 - 蓝色
    3: '#ff9800',  // 第3层 - 橙色
    4: '#9c27b0'   // 第4层+ - 紫色
  };
  const borderColor = levelColors[nodeData.level] || levelColors[4];

  // 设置节点尺寸（增大以显示描述）
  const nodeSize = Math.max(nodeData.width || 100, 100);

  // 重要性标签颜色
  const importanceColors = {
    '高': '#e74c3c',
    '中': '#f39c12',
    '低': '#27ae60'
  };
  const importanceColor = importanceColors[nodeData.importance] || importanceColors['中'];

  node.innerHTML = `
    <div class="node-card" style="width: ${nodeSize}px; min-height: ${nodeSize}px; border-color: ${borderColor};">
      <div class="node-name">${nodeData.name}</div>
      ${nodeData.importance ? `<div class="node-importance" style="background: ${importanceColor};">${nodeData.importance}</div>` : ''}
      ${nodeData.description ? `<div class="node-description">${nodeData.description}</div>` : ''}
    </div>
    ${nodeData.hasChildren ? `<div class="expand-indicator ${nodeData.isExpanded ? 'expanded' : ''}">▼</div>` : ''}
  `;

  // 点击事件
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    handleTreeNodeClick(nodeData);
  });

  // 展开/折叠事件
  const expandIndicator = node.querySelector('.expand-indicator');
  if (expandIndicator) {
    expandIndicator.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNodeExpand(nodeData);
    });
  }

  // 节点拖拽事件
  node.addEventListener('mousedown', (e) => {
    startNodeDrag(e, nodeData, node);
  });

  return node;
}

// 创建连接线元素
function createEdgeElement(edge) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  // 使用贝塞尔曲线
  const midY = (edge.y1 + edge.y2) / 2;
  const d = `M ${edge.x1} ${edge.y1}
             C ${edge.x1} ${midY},
               ${edge.x2} ${midY},
               ${edge.x2} ${edge.y2}`;

  path.setAttribute('d', d);
  path.setAttribute('class', 'tree-edge');
  path.setAttribute('fill', 'none');

  return path;
}

// 处理树节点点击
function handleTreeNodeClick(nodeData) {
  // 找到对应的零件数据
  const part = partsData.find(p => p.id === nodeData.id);
  if (part) {
    selectPart(part);
  }

  // 更新选中状态
  document.querySelectorAll('.tree-node').forEach(node => {
    node.classList.remove('selected');
  });
  document.querySelector(`[data-node-id="${nodeData.id}"]`)?.classList.add('selected');
}

// 切换节点展开/折叠
function toggleNodeExpand(nodeData) {
  // 找到节点并切换状态
  const findAndToggle = (node) => {
    if (node.id === nodeData.id) {
      node.isExpanded = !node.isExpanded;
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (findAndToggle(child)) return true;
      }
    }
    return false;
  };

  findAndToggle(treeData);
  renderVisualTree();
}

// 展开所有节点
function expandAllNodes() {
  const expand = (node) => {
    node.isExpanded = true;
    if (node.children) {
      node.children.forEach(expand);
    }
  };
  expand(treeData);
  renderVisualTree();
}

// 折叠所有节点
function collapseAllNodes() {
  const collapse = (node) => {
    if (node.children && node.children.length > 0) {
      node.isExpanded = false;
      node.children.forEach(collapse);
    }
  };
  // 保留根节点展开
  treeData.isExpanded = true;
  treeData.children.forEach(collapse);
  renderVisualTree();
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

  // 移除所有选中状态
  document.querySelectorAll('.part-item').forEach(item => {
    item.classList.remove('selected');
  });
  document.querySelectorAll('.part-card').forEach(card => {
    card.classList.remove('selected');
  });

  // 添加选中状态
  const selectedCard = document.querySelector(`[data-part-id="${part.id}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

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
initTreeViewEvents();

// 重置树视图
function resetTreeView() {
  // 重置缩放和平移
  treeScale = 1;
  treePanX = 0;
  treePanY = 0;
  // 清除初始化标记，这样重新渲染时会自动居中
  if (treeData) {
    treeData._initialized = false;
  }
  updateZoomLevel();
  renderVisualTree();
}

// 放大
function zoomIn() {
  treeScale = Math.min(treeScale * 1.2, 3);
  updateZoomLevel();
  renderVisualTree();
}

// 缩小
function zoomOut() {
  treeScale = Math.max(treeScale * 0.8, 0.3);
  updateZoomLevel();
  renderVisualTree();
}

// 更新缩放显示
function updateZoomLevel() {
  const zoomLevelEl = document.getElementById('zoomLevel');
  if (zoomLevelEl) {
    zoomLevelEl.textContent = Math.round(treeScale * 100) + '%';
  }
}

// Agent卡片折叠/展开功能
function toggleAgentCard(header) {
  const card = header.closest('.agent-card');
  const body = card.querySelector('.agent-thinking');
  const btn = card.querySelector('.agent-collapse-btn');

  if (body.classList.contains('collapsed')) {
    // 展开
    body.classList.remove('collapsed');
    card.classList.remove('collapsed');
    btn.innerHTML = '▼';
  } else {
    // 折叠
    body.classList.add('collapsed');
    card.classList.add('collapsed');
    btn.innerHTML = '▲';
  }
}

// 列折叠/展开功能
function toggleColumn(column) {
  const content = document.getElementById(column + 'Content');
  const summary = document.getElementById(column + 'Summary');

  // 找到正确的按钮
  const columnEl = document.querySelector('.' + column + '-column');
  const collapseBtn = columnEl.querySelector('.column-collapse-btn');

  if (content.classList.contains('collapsed')) {
    // 展开
    content.classList.remove('collapsed');
    summary.classList.remove('visible');
    collapseBtn.innerHTML = '▼';
  } else {
    // 折叠
    content.classList.add('collapsed');
    summary.classList.add('visible');
    collapseBtn.innerHTML = '▲';
  }
}


// 右侧区块折叠/展开功能（Agent和供应商）
function toggleRightSection(section) {
  const content = document.getElementById(section + 'Content');
  const sectionEl = document.getElementById(section + 'Section');
  const collapseBtn = sectionEl.querySelector('.column-collapse-btn');

  if (content.classList.contains('collapsed')) {
    // 展开
    content.classList.remove('collapsed');
    collapseBtn.innerHTML = '▼';
  } else {
    // 折叠
    content.classList.add('collapsed');
    collapseBtn.innerHTML = '▲';
  }
}

// 左侧面板收起/展开
function togglePanel(panel) {
  const panelEl = document.getElementById(panel + 'Panel');
  const toggleBtn = panelEl.querySelector('.panel-toggle');

  if (panelEl.classList.contains('collapsed')) {
    panelEl.classList.remove('collapsed');
    toggleBtn.innerHTML = '◀';
  } else {
    panelEl.classList.add('collapsed');
    toggleBtn.innerHTML = '▶';
  }
}

// 右侧面板Tab切换（Agent/供应商）
function switchPanelTab(tab) {
  const tabs = document.querySelectorAll('.panel-tab');
  const agentsGrid = document.getElementById('agentsGrid');
  const interactionPanel = document.getElementById('interactionPanel');

  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'agents') {
    document.querySelector('[data-tab="agents"]').classList.add('active');
    agentsGrid.classList.remove('hidden');
    interactionPanel.classList.add('hidden');
  } else {
    document.querySelector('[data-tab="suppliers"]').classList.add('active');
    agentsGrid.classList.add('hidden');
    interactionPanel.classList.remove('hidden');
  }
}