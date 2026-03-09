'use client';

import { useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';

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
  breakdownMode?: 'basic' | 'production';
  onProductionAnalysisClick?: (node: TreeNode) => void;
}

export default function DecompositionTree({
  tree,
  hoveredNodeId,
  onNodeHover,
  onNodeCollapse,
  onNodeExpand,
  onNodeReexpand,
  onNodeClick,
  breakdownMode = 'basic',
  onProductionAnalysisClick,
}: DecompositionTreeProps) {
  const { themeConfig } = useTheme();

  if (!tree) {
    return (
      <div className={`${themeConfig.textMuted} text-sm p-4`}>
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
        breakdownMode={breakdownMode}
        onProductionAnalysisClick={onProductionAnalysisClick}
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
  breakdownMode?: 'basic' | 'production';
  onProductionAnalysisClick?: (node: TreeNode) => void;
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
  breakdownMode = 'basic',
  onProductionAnalysisClick,
}: TreeNodeItemProps) {
  // 使用主题配置
  const { themeConfig } = useTheme();
  const treeColors = themeConfig.treeColors;

  const hasChildren = node.children.length > 0;
  const isHovered = hoveredNodeId === node.id;
  const isCollapsed = !node.isExpanded && hasChildren;

  // 根据层级获取主题颜色
  const color = treeColors[level % treeColors.length];
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
      {/* 节点卡片 - 使用主题渐变背景 */}
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
          background: `linear-gradient(135deg, ${color.gradient})`,
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
              w-5 h-5 flex items-center justify-center rounded backdrop-blur-sm
              ${isHovered ? 'bg-white/30 text-white' : 'bg-black/20 text-white/70'}
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

        {/* 生产模式：显示生产分析按钮 */}
        {breakdownMode === 'production' && onProductionAnalysisClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductionAnalysisClick(node);
            }}
            className="ml-1 p-1 hover:bg-white/20 rounded transition-colors text-xs"
            title="查看生产分析"
          >
            🏭
          </button>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && !isCollapsed && (
        <div className="relative">
          {/* 连接线 - 使用层级颜色 */}
          <div
            className={`absolute border-l-2 ${color.borderAccent}`}
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
              breakdownMode={breakdownMode}
              onProductionAnalysisClick={onProductionAnalysisClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
