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
  isCompleted?: boolean;
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
  onProcessFlowClick?: (node: TreeNode) => void;
  onDeleteChildrenClick?: (nodeId: string) => void;
  onCompleteNode?: (nodeId: string, isCompleted: boolean) => void;
}

export default function DecompositionTree({
  tree,
  hoveredNodeId,
  onNodeHover,
  onNodeCollapse,
  onNodeExpand,
  onNodeReexpand,
  onNodeClick,
  breakdownMode = 'production',
  onProductionAnalysisClick,
  onProcessFlowClick,
  onDeleteChildrenClick,
  onCompleteNode,
}: DecompositionTreeProps) {
  const [actionPanelNodeId, setActionPanelNodeId] = useState<string | null>(null);
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
        onProcessFlowClick={onProcessFlowClick}
        onDeleteChildrenClick={onDeleteChildrenClick}
        onCompleteNode={onCompleteNode}
        actionPanelNodeId={actionPanelNodeId}
        setActionPanelNodeId={setActionPanelNodeId}
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
  onProcessFlowClick?: (node: TreeNode) => void;
  onDeleteChildrenClick?: (nodeId: string) => void;
  onCompleteNode?: (nodeId: string, isCompleted: boolean) => void;
  actionPanelNodeId: string | null;
  setActionPanelNodeId: (nodeId: string | null) => void;
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
  breakdownMode = 'production',
  onProductionAnalysisClick,
  onProcessFlowClick,
  onDeleteChildrenClick,
  onCompleteNode,
  actionPanelNodeId,
  setActionPanelNodeId,
}: TreeNodeItemProps) {
  // 使用主题配置
  const { theme, themeConfig } = useTheme();
  const isDarkTheme = theme === 'dark';
  const treeColors = themeConfig.treeColors;

  const hasChildren = node.children.length > 0;
  const isHovered = hoveredNodeId === node.id;
  const isCollapsed = !node.isExpanded && hasChildren;
  const isActionPanelOpen = actionPanelNodeId === node.id;

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
          border-2 transition-all duration-300 cursor-pointer overflow-hidden
          ${color.bg} ${color.border}
          ${isRawMaterial ? 'opacity-70' : ''}
        `}
        style={{
          marginLeft: `${level * 20}px`,
          transform: isHovered ? 'scale(1.03)' : 'scale(1)',
          background: `linear-gradient(135deg, ${color.gradient})`,
          boxShadow: node.isCompleted
            ? (isHovered
              ? '0 0 30px #22c55e, 0 0 60px #22c55e, 0 0 90px #22c55e, 0 8px 25px rgba(34, 197, 94, 0.5)'
              : '0 0 20px #22c55e, 0 0 40px rgba(34, 197, 94, 0.4), 0 4px 15px rgba(0,0,0,0.3)')
            : (isHovered
              ? `0 0 20px ${color.glow}, 0 0 40px ${color.glow}, 0 4px 12px rgba(0,0,0,0.3)`
              : `0 2px 8px rgba(0,0,0,0.2)`),
          borderColor: node.isCompleted ? (isDarkTheme ? '#22c55e' : '#16a34a') : color.border,
        }}
        onMouseEnter={() => onNodeHover(node.id)}
        onMouseLeave={() => onNodeHover(null)}
        onClick={() => onNodeClick(node)}
        onContextMenu={handleContextMenu}
      >
        {/* 巨大的对勾背景装饰 */}
        {node.isCompleted && (
          <span
            className="absolute right-2 bottom-0 text-7xl opacity-15 select-none pointer-events-none font-bold"
            style={{ transform: 'translateY(10%)', color: '#22c55e' }}
          >
            ✓
          </span>
        )}
        {/* 折叠/展开按钮 */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className={`
              w-5 h-5 flex items-center justify-center rounded backdrop-blur-sm transition-all text-xs font-bold
              ${isDarkTheme
                ? (isHovered ? 'bg-white/30 text-white' : 'bg-black/20 text-white/70')
                : (isHovered ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600')
              }
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
        <span className={`flex-1 truncate text-sm font-medium ${isHovered ? (isDarkTheme ? 'text-white' : 'text-slate-900 font-semibold') : color.text}`}>
          {node.name}
        </span>

        {/* 原材料标记 */}
        {isRawMaterial && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkTheme ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
            原料
          </span>
        )}

        {/* 完成标记 - 简化显示 */}
        {node.isCompleted && (
          <span className={`text-sm font-bold px-2 py-0.5 rounded ${isDarkTheme ? 'bg-green-500/70 text-white' : 'bg-green-500 text-white'}`}>
            已完成
          </span>
        )}

        {/* 操作按钮 - 点击展开操作面板 (所有节点都显示) */}
        {(hasChildren || breakdownMode === 'production') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionPanelNodeId(isActionPanelOpen ? null : node.id);
            }}
            className={`ml-1 p-1 rounded transition-all ${
              isActionPanelOpen
                ? 'bg-cyan-500 text-white'
                : isDarkTheme
                  ? 'hover:bg-white/20 text-white/70'
                  : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="操作"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* 操作面板 */}
      {isActionPanelOpen && (
        <div
          className={`mx-2 my-1 rounded-lg border-2 flex items-center gap-1 p-2 ${
            isDarkTheme
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-slate-200'
          }`}
          style={{ marginLeft: `${level * 20 + 20}px` }}
        >
          {/* 工艺流程 */}
          {onProcessFlowClick && node.children && node.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onProcessFlowClick(node);
              }}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isDarkTheme
                  ? 'hover:bg-blue-500/20 text-blue-400'
                  : 'hover:bg-blue-50 text-blue-600'
              }`}
              title="查看工艺流程"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span className="text-xs">工艺流程</span>
            </button>
          )}

          {/* 生产分析 */}
          {breakdownMode === 'production' && onProductionAnalysisClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onProductionAnalysisClick(node);
              }}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isDarkTheme
                  ? 'hover:bg-cyan-500/20 text-cyan-400'
                  : 'hover:bg-cyan-50 text-cyan-600'
              }`}
              title={node.isCompleted ? '重新定制' : '查看生产分析'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="text-xs">{node.isCompleted ? '重新定制' : '生产分析'}</span>
            </button>
          )}

          {/* 删除子节点 */}
          {onDeleteChildrenClick && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`确定要删除"${node.name}"的所有子节点吗？`)) {
                  onDeleteChildrenClick(node.id);
                  setActionPanelNodeId(null);
                }
              }}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isDarkTheme
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-red-50 text-red-600'
              }`}
              title="删除所有子节点"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-xs">删除子节点</span>
            </button>
          )}

          {/* 完成/重新定制 */}
          {onCompleteNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newCompleted = !node.isCompleted;
                onCompleteNode(node.id, newCompleted);
                setActionPanelNodeId(null);
              }}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                node.isCompleted
                  ? (isDarkTheme ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600')
                  : (isDarkTheme ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-green-50 text-green-600')
              }`}
              title={node.isCompleted ? '重新定制' : '完成定制'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs">{node.isCompleted ? '重新定制' : '完成定制'}</span>
            </button>
          )}
        </div>
      )}

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
              onProcessFlowClick={onProcessFlowClick}
              onDeleteChildrenClick={onDeleteChildrenClick}
              onCompleteNode={onCompleteNode}
              actionPanelNodeId={actionPanelNodeId}
              setActionPanelNodeId={setActionPanelNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
