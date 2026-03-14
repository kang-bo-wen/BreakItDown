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
import { useTheme } from '../hooks/useTheme';

interface TreeNode {
  id: string;
  name: string;
  description: string;
  isRawMaterial: boolean;
  children: TreeNode[];
  isExpanded: boolean;
  isCompleted?: boolean;
}

interface GraphViewProps {
  tree: TreeNode | null;
  loadingNodeIds: Set<string>;
  knowledgeCache: Map<string, any>;
  loadingKnowledgeIds: Set<string>;
  breakdownMode?: 'basic' | 'production';
  onNodeExpand: (nodeId: string, nodeName: string, parentContext?: string) => void;
  onShowKnowledge: (node: TreeNode) => void;
  onProductionAnalysis?: (node: TreeNode) => void;
  onDeleteChildren?: (nodeId: string) => void;
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
  breakdownMode,
  onNodeExpand,
  onShowKnowledge,
  onProductionAnalysis,
  onDeleteChildren,
  onNodePositionsChange,
  edgeType: initialEdgeType = 'bezier',
  hoveredNodeId: externalHoveredNodeId,
}: GraphViewProps) {
  // 使用主题
  const { theme, themeConfig } = useTheme();
  const isDarkTheme = theme === 'dark';
  // 便捷访问
  const tc = themeConfig;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
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
          hasChildren: treeNode.children && treeNode.children.length > 0,
          isCompleted: treeNode.isCompleted,
          zoom: currentZoom,
          isHovered: hoveredNodeId === node.id,
          nodeId: node.id,
          breakdownMode,
          onExpand: () => {
            const parentName = findParentName(tree, node.id);
            onNodeExpand(node.id, treeNode.name, parentName);
          },
          onShowKnowledge: () => onShowKnowledge(treeNode),
          onProductionAnalysis: onProductionAnalysis ? () => onProductionAnalysis(treeNode) : undefined,
          onDeleteChildren: onDeleteChildren ? () => onDeleteChildren(node.id) : undefined,
          onHover: (isHovered: boolean) => {
            setHoveredNodeId(isHovered ? node.id : null);
          },
        },
      };
    });

    setNodes(enhancedNodes);
    setEdges(layoutEdges);
  }, [tree, loadingNodeIds, knowledgeCache, loadingKnowledgeIds, breakdownMode, currentZoom, findNodeById, findParentName, onNodeExpand, onShowKnowledge, onProductionAnalysis, onDeleteChildren, edgeType]);

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
    <div className="w-full h-[600px] rounded-lg overflow-hidden border relative tech-grid" style={{ borderImage: `${tc.containerBorderGradient} 1`, background: tc.containerBgGradient }}>
      {/* 渐变背景层 */}
      <div
        className="absolute inset-0"
        style={{
          background: tc.radialGradient,
        }}
      />

      {/* 自定义控制按钮 - 使用主题色 */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* 返回按钮 */}
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          }}
          className={`w-10 h-10 backdrop-blur-md border rounded-lg flex items-center justify-center transition-all shadow-lg ${
              isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-400/50 text-white/80 hover:text-white'
                : 'bg-slate-900/10 hover:bg-slate-900/20 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900'
            }`}
          title="返回"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* 自适应观察 */}
        <button
          onClick={() => fitView({ padding: 0.2, duration: 300 })}
          className={`w-10 h-10 backdrop-blur-md border rounded-lg flex items-center justify-center transition-all shadow-lg ${
              isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-400/50 text-white/80 hover:text-white'
                : 'bg-slate-900/10 hover:bg-slate-900/20 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900'
            }`}
          title="自适应观察"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* 锁定/解锁拖拽 */}
        <button
          onClick={() => setIsDraggingLocked(!isDraggingLocked)}
          className={`w-10 h-10 backdrop-blur-md border rounded-lg flex items-center justify-center transition-all shadow-lg ${
            isDraggingLocked
              ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
              : isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-400/50 text-white/80 hover:text-white'
                : 'bg-slate-900/10 hover:bg-slate-900/20 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900'
          }`}
          title={isDraggingLocked ? '解锁拖拽' : '锁定拖拽'}
        >
          {isDraggingLocked ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* 缩略图开关 */}
        <button
          onClick={() => setShowMiniMap(!showMiniMap)}
          className={`w-10 h-10 backdrop-blur-md border rounded-lg flex items-center justify-center transition-all shadow-lg ${
            showMiniMap
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
              : isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-400/50 text-white/80 hover:text-white'
                : 'bg-slate-900/10 hover:bg-slate-900/20 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900'
          }`}
          title={showMiniMap ? '隐藏缩略图' : '显示缩略图'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>

        {/* 曲线类型切换 */}
        <button
          onClick={() => {
            const types: Array<'bezier' | 'smoothstep' | 'straight'> = ['bezier', 'smoothstep', 'straight'];
            const currentIndex = types.indexOf(edgeType);
            const nextIndex = (currentIndex + 1) % types.length;
            setEdgeType(types[nextIndex]);
          }}
          className={`w-10 h-10 backdrop-blur-md border rounded-lg flex items-center justify-center transition-all shadow-lg ${
              isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-400/50 text-white/80 hover:text-white'
                : 'bg-slate-900/10 hover:bg-slate-900/20 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900'
            }`}
          title={`曲线类型: ${edgeType === 'bezier' ? '贝塞尔曲线' : edgeType === 'smoothstep' ? '阶梯线' : '直线'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </button>

        {/* 统计面板 */}
        <button
          onClick={() => setShowStats(true)}
          className={`w-10 h-10 backdrop-blur-md border rounded-lg flex items-center justify-center transition-all shadow-lg ${
              isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-400/50 text-white/80 hover:text-white'
                : 'bg-slate-900/10 hover:bg-slate-900/20 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900'
            }`}
          title="统计面板"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        {/* 搜索节点 */}
        <button
          onClick={() => setShowSearch(true)}
          className={`w-10 h-10 backdrop-blur-md border rounded-lg flex items-center justify-center transition-all shadow-lg ${
              isDarkTheme
                ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-400/50 text-white/80 hover:text-white'
                : 'bg-slate-900/10 hover:bg-slate-900/20 border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900'
            }`}
          title="搜索节点"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
          color={isDarkTheme ? '#ffffff30' : '#00000030'}
        />
        {showMiniMap && (
          <MiniMap
            className={`backdrop-blur-sm border ${isDarkTheme ? 'bg-white/5 border-cyan-500/20' : 'bg-black/5 border-cyan-300/40'}`}
            nodeColor={(node) => {
              if (node.data.isRawMaterial) return '#22c55e'; // 绿色
              if (node.data.isLoading) return isDarkTheme ? '#475569' : '#94a3b8';
              // 根据主题使用不同颜色
              return isDarkTheme ? '#22d3ee' : '#0891b2';
            }}
          />
        )}
      </ReactFlow>

      {/* 帮助弹窗 */}
      {showHelp && (
        <div
          className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="tech-card p-8 max-w-2xl w-full mx-4"
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
                className="w-10 h-10 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/60 rounded-lg flex items-center justify-center text-cyan-300 text-xl transition"
              >
                ✕
              </button>
            </div>

            {/* 操作说明内容 */}
            <div className="space-y-6 text-gray-200">
              {/* 节点交互 */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  节点交互
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">左键点击</strong>：查看节点的详细知识卡片</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">右键点击</strong>：展开节点，查看其组成部分</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">鼠标悬停</strong>：在右侧显示节点名称</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">拖拽节点</strong>：移动节点及其所有子节点</span>
                  </li>
                </ul>
              </div>

              {/* 视图控制 */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <span>🎮</span>
                  视图控制
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">鼠标滚轮</strong>：缩放画布</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">拖拽空白区域</strong>：平移画布</span>
                  </li>
                </ul>
              </div>

              {/* 控制按钮 */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <span>🎛️</span>
                  控制按钮
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">← 返回</strong>：退出全屏模式</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">+ / −</strong>：放大/缩小画布</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">⊡ 自适应</strong>：自动调整视图以显示所有节点</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">🔓/🔒 拖拽锁</strong>：锁定/解锁节点拖拽功能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">🗺️ 缩略图</strong>：显示/隐藏画布缩略图</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span><strong className="text-white">? 帮助</strong>：显示此操作说明</span>
                  </li>
                </ul>
              </div>

              {/* 节点颜色说明 */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
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

      {/* 统计面板弹窗 */}
      {showStats && (
        <div
          className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowStats(false)}
        >
          <div
            className="tech-card p-8 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">📊</span>
                统计面板
              </h2>
              <button
                onClick={() => setShowStats(false)}
                className="w-10 h-10 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/60 rounded-lg flex items-center justify-center text-cyan-300 text-xl transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg">
                <span className="text-gray-300">节点总数</span>
                <span className="text-2xl font-bold text-cyan-400">{nodes.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                <span className="text-gray-300">边总数</span>
                <span className="text-2xl font-bold text-purple-400">{edges.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg">
                <span className="text-gray-300">当前缩放</span>
                <span className="text-2xl font-bold text-emerald-400">{Math.round(currentZoom * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索节点弹窗 */}
      {showSearch && (
        <div
          className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="tech-card p-8 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🔍</span>
                搜索节点
              </h2>
              <button
                onClick={() => setShowSearch(false)}
                className="w-10 h-10 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/60 rounded-lg flex items-center justify-center text-cyan-300 text-xl transition"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="输入节点名称搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            {searchQuery && (
              <div className="mt-4 max-h-60 overflow-y-auto">
                {nodes
                  .filter(node => (node.data?.label || node.data?.name || node.id)?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(node => (
                    <div
                      key={node.id}
                      className="p-3 hover:bg-cyan-500/10 rounded-lg cursor-pointer transition"
                      onClick={() => {
                        // 跳转到选中的节点
                        fitView({ nodes: [node], padding: 0.5, duration: 300 });
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                    >
                      <span className="text-white">{node.data?.label || node.data?.name || node.id}</span>
                    </div>
                  ))}
                {nodes.filter(node => (node.data?.label || node.data?.name || node.id)?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-gray-500 text-center py-4">未找到匹配的节点</p>
                )}
              </div>
            )}
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
