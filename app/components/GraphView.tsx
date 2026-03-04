'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeChange,
  OnMove,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import MatterNode from './MatterNode';
import { calculateRadialLayout } from '../utils/layoutUtils';

interface TreeNode {
  id: string;
  name: string;
  description: string;
  isRawMaterial: boolean;
  children: TreeNode[];
  isExpanded: boolean;
}

interface GraphViewProps {
  tree: TreeNode | null;
  loadingNodeIds: Set<string>;
  knowledgeCache: Map<string, any>;
  loadingKnowledgeIds: Set<string>;
  onNodeExpand: (nodeId: string, nodeName: string, parentContext?: string) => void;
  onShowKnowledge: (node: TreeNode) => void;
  onNodePositionsChange?: () => void;
  edgeType?: 'bezier' | 'smoothstep' | 'straight';
  hoveredNodeId?: string | null;
}

const nodeTypes = {
  matterNode: MatterNode,
};

function GraphViewInner({
  tree,
  loadingNodeIds,
  knowledgeCache,
  loadingKnowledgeIds,
  onNodeExpand,
  onShowKnowledge,
  onNodePositionsChange,
  edgeType: initialEdgeType = 'bezier',
  hoveredNodeId: externalHoveredNodeId,
}: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [internalHoveredNodeId, setInternalHoveredNodeId] = useState<string | null>(null);
  // 使用外部传入的 hoveredNodeId 或内部状态
  const hoveredNodeId = externalHoveredNodeId !== undefined ? externalHoveredNodeId : internalHoveredNodeId;
  const setHoveredNodeId = externalHoveredNodeId !== undefined
    ? () => {} // 外部控制时不需要内部状态更新
    : setInternalHoveredNodeId;
  const [edgeType, setEdgeType] = useState<'bezier' | 'smoothstep' | 'straight'>(initialEdgeType);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isDraggingLocked, setIsDraggingLocked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  // 保存用户手动调整的节点位置
  const userPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  // 保存上一次的节点位置，用于计算拖拽偏移
  const previousPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // 从 localStorage 恢复节点位置
  useEffect(() => {
    const savedPositions = localStorage.getItem('nodePositions');
    if (savedPositions) {
      try {
        const positionsArray = JSON.parse(savedPositions);
        userPositions.current = new Map(positionsArray);
        console.log('✅ GraphView: 从 localStorage 恢复节点位置', positionsArray.length);
      } catch (error) {
        console.error('恢复节点位置失败:', error);
      }
    }
  }, [tree]);

  // 处理 viewport 变化（包括缩放）
  const handleMove: OnMove = useCallback((event, viewport) => {
    setCurrentZoom(viewport.zoom);
  }, []);

  // 查找节点的所有子孙节点
  const findAllDescendants = useCallback((currentTree: TreeNode | null, targetId: string): string[] => {
    if (!currentTree) return [];

    const findNode = (node: TreeNode): TreeNode | null => {
      if (node.id === targetId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };

    const collectDescendants = (node: TreeNode): string[] => {
      const ids: string[] = [];
      for (const child of node.children) {
        ids.push(child.id);
        ids.push(...collectDescendants(child));
      }
      return ids;
    };

    const targetNode = findNode(currentTree);
    return targetNode ? collectDescendants(targetNode) : [];
  }, []);

  // 查找节点的父节点名称
  const findParentName = useCallback((currentTree: TreeNode | null, targetId: string): string | undefined => {
    if (!currentTree) return undefined;

    // 检查当前节点的子节点
    for (const child of currentTree.children) {
      if (child.id === targetId) {
        return currentTree.name;
      }
      // 递归查找
      const parentName = findParentName(child, targetId);
      if (parentName) return parentName;
    }
    return undefined;
  }, []);

  // 查找节点
  const findNodeById = useCallback((currentTree: TreeNode | null, id: string): TreeNode | null => {
    if (!currentTree) return null;
    if (currentTree.id === id) return currentTree;
    for (const child of currentTree.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  // 更新图形布局
  useEffect(() => {
    if (!tree) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutNodes, edges: layoutEdges } = calculateRadialLayout(tree, {
      centerX: 600,
      centerY: 400,
      radiusStep: 180, // 减小层级间距，避免节点展开太远
      angleOffset: 0,
      savedPositions: userPositions.current, // 传递保存的位置
      edgeType: edgeType, // 传递边的连接类型
    });

    // 为每个节点添加交互回调，并应用用户保存的位置
    const enhancedNodes = layoutNodes.map((node) => {
      const treeNode = findNodeById(tree, node.id);
      if (!treeNode) return node;

      // 如果用户手动调整过位置，使用保存的位置
      const savedPosition = userPositions.current.get(node.id);
      const position = savedPosition || node.position;

      return {
        ...node,
        position,
        data: {
          ...node.data,
          isLoading: loadingNodeIds.has(node.id),
          hasKnowledgeCard: knowledgeCache.has(node.id),
          isLoadingKnowledge: loadingKnowledgeIds.has(node.id),
          zoom: currentZoom,
          isHovered: hoveredNodeId === node.id,
          onExpand: () => {
            const parentName = findParentName(tree, node.id);
            onNodeExpand(node.id, treeNode.name, parentName);
          },
          onShowKnowledge: () => onShowKnowledge(treeNode),
          onHover: (isHovered: boolean) => {
            setHoveredNodeId(isHovered ? node.id : null);
          },
        },
      };
    });

    setNodes(enhancedNodes);
    setEdges(layoutEdges);
  }, [tree, loadingNodeIds, knowledgeCache, loadingKnowledgeIds, currentZoom, findNodeById, findParentName, onNodeExpand, onShowKnowledge, edgeType]);

  // 根据悬停状态更新节点的 zIndex
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        zIndex: node.id === hoveredNodeId ? 9999 : 1,
      }))
    );
  }, [hoveredNodeId, setNodes]);

  // 自定义节点变化处理，实现整体拖拽
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.dragging && change.position) {
          const nodeId = change.id;
          const newPosition = change.position;

          // 获取旧位置
          const oldPosition = previousPositions.current.get(nodeId);

          if (oldPosition) {
            // 计算偏移量
            const deltaX = newPosition.x - oldPosition.x;
            const deltaY = newPosition.y - oldPosition.y;

            // 获取所有子孙节点
            const descendants = findAllDescendants(tree, nodeId);

            // 更新当前节点和所有子孙节点的位置
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId || descendants.includes(node.id)) {
                  const updatedPosition = {
                    x: node.position.x + deltaX,
                    y: node.position.y + deltaY,
                  };
                  // 保存用户调整的位置
                  userPositions.current.set(node.id, updatedPosition);
                  previousPositions.current.set(node.id, updatedPosition);
                  return {
                    ...node,
                    position: updatedPosition,
                  };
                }
                return node;
              })
            );
          } else {
            // 首次拖拽，保存初始位置
            previousPositions.current.set(nodeId, newPosition);
            userPositions.current.set(nodeId, newPosition);
          }
        } else if (change.type === 'position' && !change.dragging) {
          // 拖拽结束，更新所有节点的 previousPositions 并保存到 localStorage
          setNodes((nds) => {
            nds.forEach((node) => {
              previousPositions.current.set(node.id, node.position);
            });

            // 保存到 localStorage
            const positionsArray = Array.from(userPositions.current.entries());
            localStorage.setItem('nodePositions', JSON.stringify(positionsArray));
            console.log('💾 节点位置已保存到 localStorage');

            // 延迟触发父组件的回调，避免在渲染期间更新状态
            if (onNodePositionsChange) {
              setTimeout(() => {
                onNodePositionsChange();
              }, 0);
            }

            return nds;
          });
        }
      });

      // 应用其他类型的变化
      onNodesChange(changes);
    },
    [tree, findAllDescendants, onNodesChange, onNodePositionsChange]
  );

  if (!tree) {
    return (
      <div className="w-full h-[800px] flex items-center justify-center bg-black/30 rounded-lg">
        <div className="text-gray-400 text-lg">
          等待拆解结果...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[900px] bg-black/30 rounded-lg overflow-hidden border-2 border-white/10 relative">
      {/* 动态渐变背景层 */}
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #134e4a, #1e1b4b, #0f172a)',
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        }}
      />

      {/* 自定义控制按钮 - 左上角 */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* 返回按钮 */}
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          }}
          className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title="返回"
        >
          ←
        </button>

        {/* 放大 */}
        <button
          onClick={() => zoomIn()}
          className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title="放大"
        >
          +
        </button>

        {/* 缩小 */}
        <button
          onClick={() => zoomOut()}
          className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title="缩小"
        >
          −
        </button>

        {/* 自适应观察 */}
        <button
          onClick={() => fitView({ padding: 0.2, duration: 300 })}
          className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title="自适应观察"
        >
          ⊡
        </button>

        {/* 锁定/解锁拖拽 */}
        <button
          onClick={() => setIsDraggingLocked(!isDraggingLocked)}
          className={`w-12 h-12 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
            isDraggingLocked
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
              : 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600'
          }`}
          title={isDraggingLocked ? '解锁拖拽' : '锁定拖拽'}
        >
          {isDraggingLocked ? '🔒' : '🔓'}
        </button>

        {/* 缩略图开关 */}
        <button
          onClick={() => setShowMiniMap(!showMiniMap)}
          className={`w-12 h-12 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
            showMiniMap
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
              : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600'
          }`}
          title={showMiniMap ? '隐藏缩略图' : '显示缩略图'}
        >
          🗺️
        </button>

        {/* 曲线类型切换 */}
        <button
          onClick={() => {
            const types: Array<'bezier' | 'smoothstep' | 'straight'> = ['bezier', 'smoothstep', 'straight'];
            const currentIndex = types.indexOf(edgeType);
            const nextIndex = (currentIndex + 1) % types.length;
            setEdgeType(types[nextIndex]);
          }}
          className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title={`曲线类型: ${edgeType === 'bezier' ? '贝塞尔曲线' : edgeType === 'smoothstep' ? '阶梯线' : '直线'}`}
        >
          {edgeType === 'bezier' ? '〰' : edgeType === 'smoothstep' ? '📐' : '📏'}
        </button>

        {/* 帮助按钮 */}
        <button
          onClick={() => setShowHelp(true)}
          className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 backdrop-blur-sm border-2 border-white/30 rounded-xl flex items-center justify-center text-white text-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
          title="操作说明"
        >
          ?
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={handleMove}
        nodeTypes={nodeTypes}
        nodesDraggable={!isDraggingLocked}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#ffffff30"
        />
        {showMiniMap && (
          <MiniMap
            className="bg-white/10 backdrop-blur-sm border border-white/20"
            nodeColor={(node) => {
              if (node.data.isRawMaterial) return '#10b981';
              if (node.data.isLoading) return '#6b7280';
              return '#3b82f6';
            }}
          />
        )}
      </ReactFlow>

      {/* 帮助弹窗 */}
      {showHelp && (
        <div
          className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full mx-4 border-2 border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">💡</span>
                操作说明
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white text-xl transition"
              >
                ✕
              </button>
            </div>

            {/* 操作说明内容 */}
            <div className="space-y-6 text-gray-200">
              {/* 节点交互 */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  节点交互
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono">•</span>
                    <span><strong className="text-white">左键点击</strong>：查看节点的详细知识卡片</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono">•</span>
                    <span><strong className="text-white">右键点击</strong>：展开节点，查看其组成部分</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono">•</span>
                    <span><strong className="text-white">鼠标悬停</strong>：在右侧显示节点名称</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono">•</span>
                    <span><strong className="text-white">拖拽节点</strong>：移动节点及其所有子节点</span>
                  </li>
                </ul>
              </div>

              {/* 视图控制 */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  <span>🎮</span>
                  视图控制
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-mono">•</span>
                    <span><strong className="text-white">鼠标滚轮</strong>：缩放画布</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-mono">•</span>
                    <span><strong className="text-white">拖拽空白区域</strong>：平移画布</span>
                  </li>
                </ul>
              </div>

              {/* 控制按钮 */}
              <div>
                <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <span>🎛️</span>
                  控制按钮
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono">•</span>
                    <span><strong className="text-white">← 返回</strong>：退出全屏模式</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono">•</span>
                    <span><strong className="text-white">+ / −</strong>：放大/缩小画布</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono">•</span>
                    <span><strong className="text-white">⊡ 自适应</strong>：自动调整视图以显示所有节点</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono">•</span>
                    <span><strong className="text-white">🔓/🔒 拖拽锁</strong>：锁定/解锁节点拖拽功能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono">•</span>
                    <span><strong className="text-white">🗺️ 缩略图</strong>：显示/隐藏画布缩略图</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono">•</span>
                    <span><strong className="text-white">? 帮助</strong>：显示此操作说明</span>
                  </li>
                </ul>
              </div>

              {/* 节点颜色说明 */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <span>🎨</span>
                  节点颜色
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-4 h-4 bg-blue-500 rounded mt-1"></span>
                    <span><strong className="text-white">相同颜色</strong>：同级组件</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-4 h-4 bg-green-500 rounded mt-1"></span>
                    <span><strong className="text-white">绿色</strong>：末节点（不可再拆解的原材料）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-4 h-4 bg-gray-500 rounded mt-1"></span>
                    <span><strong className="text-white">灰色</strong>：加载中</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 关闭按钮 */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowHelp(false)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-white font-semibold transition shadow-lg hover:shadow-xl"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export default function GraphView(props: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewInner {...props} />
    </ReactFlowProvider>
  );
}
