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
}: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isDraggingLocked, setIsDraggingLocked] = useState(false);
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
        console.log(`恢复了 ${positionsArray.length} 个节点的位置`);
      } catch (error) {
        console.error('恢复节点位置失败:', error);
      }
    }
  }, []);

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
  }, [tree, loadingNodeIds, knowledgeCache, loadingKnowledgeIds, currentZoom, findNodeById, findParentName, onNodeExpand, onShowKnowledge]);

  // 根据悬停状态更新边的样式
  useEffect(() => {
    if (!hoveredNodeId) {
      // 没有悬停节点时，恢复所有边的默认样式
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            strokeWidth: 2,
            opacity: 1,
          },
        }))
      );
    } else {
      // 有悬停节点时，高亮相关的边
      setEdges((eds) =>
        eds.map((edge) => {
          const isRelated = edge.source === hoveredNodeId;
          return {
            ...edge,
            style: {
              ...edge.style,
              strokeWidth: isRelated ? 4 : 2,
              opacity: isRelated ? 1 : 0.3,
            },
          };
        })
      );
    }
  }, [hoveredNodeId, setEdges]);

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

            return nds;
          });
        }
      });

      // 应用其他类型的变化
      onNodesChange(changes);
    },
    [tree, findAllDescendants, onNodesChange]
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
          color="#ffffff20"
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
