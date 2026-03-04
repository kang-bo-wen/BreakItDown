'use client';

import { useState, useCallback } from 'react';

interface TreeNode {
  id: string;
  name: string;
  description: string;
  isRawMaterial: boolean;
  icon?: string;
  imageUrl?: string;
  children: TreeNode[];
  isExpanded: boolean;
}

interface DecompositionTreeProps {
  tree: TreeNode | null;
  hoveredNodeId: string | null;
  onNodeHover: (nodeId: string | null) => void;
  onNodeCollapse: (nodeId: string) => void;
  onNodeExpand: (nodeId: string) => void;
  onNodeReexpand: (nodeId: string, nodeName: string, parentContext?: string) => void;
  onNodeClick: (node: TreeNode) => void;
}

export default function DecompositionTree({
  tree,
  hoveredNodeId,
  onNodeHover,
  onNodeCollapse,
  onNodeExpand,
  onNodeReexpand,
  onNodeClick,
}: DecompositionTreeProps) {
  if (!tree) {
    return (
      <div className="text-gray-500 text-sm p-4">
        暂无分解结构
      </div>
    );
  }

  return (
    <div className="text-sm">
      <TreeNodeItem
        node={tree}
        level={0}
        hoveredNodeId={hoveredNodeId}
        onNodeHover={onNodeHover}
        onNodeCollapse={onNodeCollapse}
        onNodeExpand={onNodeExpand}
        onNodeReexpand={onNodeReexpand}
        onNodeClick={onNodeClick}
      />
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  hoveredNodeId: string | null;
  onNodeHover: (nodeId: string | null) => void;
  onNodeCollapse: (nodeId: string) => void;
  onNodeExpand: (nodeId: string) => void;
  onNodeReexpand: (nodeId: string, nodeName: string, parentContext?: string) => void;
  onNodeClick: (node: TreeNode) => void;
}

function TreeNodeItem({
  node,
  level,
  hoveredNodeId,
  onNodeHover,
  onNodeCollapse,
  onNodeExpand,
  onNodeReexpand,
  onNodeClick,
}: TreeNodeItemProps) {
  const hasChildren = node.children.length > 0;
  const isHovered = hoveredNodeId === node.id;
  const isCollapsed = !node.isExpanded && hasChildren;

  // 根据层级计算颜色
  const getLevelColor = (lvl: number) => {
    const colors = [
      { bg: 'bg-blue-600', border: 'border-blue-400', glow: 'shadow-blue-500/60', text: 'text-blue-100' },
      { bg: 'bg-purple-600', border: 'border-purple-400', glow: 'shadow-purple-500/60', text: 'text-purple-100' },
      { bg: 'bg-pink-600', border: 'border-pink-400', glow: 'shadow-pink-500/60', text: 'text-pink-100' },
      { bg: 'bg-orange-600', border: 'border-orange-400', glow: 'shadow-orange-500/60', text: 'text-orange-100' },
      { bg: 'bg-yellow-600', border: 'border-yellow-400', glow: 'shadow-yellow-500/60', text: 'text-yellow-100' },
      { bg: 'bg-cyan-600', border: 'border-cyan-400', glow: 'shadow-cyan-500/60', text: 'text-cyan-100' },
      { bg: 'bg-green-600', border: 'border-green-400', glow: 'shadow-green-500/60', text: 'text-green-100' },
      { bg: 'bg-red-600', border: 'border-red-400', glow: 'shadow-red-500/60', text: 'text-red-100' },
    ];
    return colors[lvl % colors.length];
  };

  const color = getLevelColor(level);
  const isRawMaterial = node.isRawMaterial;

  // 处理折叠/展开（只是展开/折叠，不重新分解）
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCollapsed) {
      // 展开（不清空子节点）
      onNodeExpand(node.id);
    } else if (hasChildren) {
      // 折叠
      onNodeCollapse(node.id);
    }
  };

  // 处理右键重新分解
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRawMaterial) {
      onNodeReexpand(node.id, node.name);
    }
  };

  return (
    <div className="select-none">
      {/* 节点卡片 - 默认就有层级颜色 */}
      <div
        className={`
          relative flex items-center gap-2 px-3 py-2 mx-2 my-1 rounded-lg
          border-2 transition-all duration-300 cursor-pointer
          ${color.bg} ${color.border}
          ${isRawMaterial ? 'opacity-70' : ''}
        `}
        style={{
          marginLeft: `${level * 20}px`,
          transform: isHovered ? 'scale(1.03)' : 'scale(1)',
          boxShadow: isHovered
            ? `0 0 20px ${color.glow}, 0 0 40px ${color.glow}, 0 4px 12px rgba(0,0,0,0.3)`
            : `0 2px 8px rgba(0,0,0,0.2)`,
        }}
        onMouseEnter={() => onNodeHover(node.id)}
        onMouseLeave={() => onNodeHover(null)}
        onClick={() => onNodeClick(node)}
        onContextMenu={handleContextMenu}
      >
        {/* 折叠/展开按钮 */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className={`
              w-5 h-5 flex items-center justify-center rounded
              ${isHovered ? 'bg-white/30 text-white' : 'bg-gray-700 text-gray-400'}
              hover:bg-white/20 transition-all text-xs font-bold
            `}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        )}

        {/* 图标 */}
        <span className="text-lg flex-shrink-0">
          {isRawMaterial ? '🌿' : node.icon || '📦'}
        </span>

        {/* 名称 */}
        <span className={`flex-1 truncate text-sm font-medium ${isHovered ? 'text-white' : color.text}`}>
          {node.name}
        </span>

        {/* 原材料标记 */}
        {isRawMaterial && (
          <span className="text-xs px-1.5 py-0.5 bg-green-500/30 text-green-300 rounded">
            原料
          </span>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && !isCollapsed && (
        <div className="relative">
          {/* 连接线 */}
          <div
            className="absolute border-l-2 border-gray-600"
            style={{
              left: `${(level + 1) * 20 - 10}px`,
              top: '8px',
              height: 'calc(100% - 16px)',
            }}
          />
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              hoveredNodeId={hoveredNodeId}
              onNodeHover={onNodeHover}
              onNodeCollapse={onNodeCollapse}
              onNodeExpand={onNodeExpand}
              onNodeReexpand={onNodeReexpand}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
