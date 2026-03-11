'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  // 弹窗状态
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

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

  // 处理点击节点 - 显示弹窗
  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setPopupPosition({
        x: rect.right + 8,
        y: rect.top + rect.height / 2,
      });
    }
    setShowPopup(true);
  };

  // 更新弹窗位置
  useEffect(() => {
    if (showPopup && nodeRef.current) {
      let rafId: number;

      const updatePosition = () => {
        if (nodeRef.current) {
          const rect = nodeRef.current.getBoundingClientRect();
          setPopupPosition({
            x: rect.right + 8,
            y: rect.top + rect.height / 2,
          });
        }
        rafId = requestAnimationFrame(updatePosition);
      };

      rafId = requestAnimationFrame(updatePosition);

      return () => {
        cancelAnimationFrame(rafId);
      };
    }
  }, [showPopup]);

  return (
    <div className="select-none">
      {/* 节点卡片 - 使用主题渐变背景 */}
      <div
        ref={nodeRef}
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
        onClick={handleNodeClick}
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
      </div>

      {/* 弹窗 - 使用 Portal 渲染 */}
      {showPopup && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-[99999]"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            width: '280px',
            pointerEvents: 'auto',
          }}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 shadow-2xl border-2 border-white/20 backdrop-blur-xl">
            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPopup(false);
              }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500/80 hover:bg-red-600 rounded-full text-white text-sm font-bold transition-all shadow-lg z-10"
              title="关闭"
            >
              ×
            </button>

            {/* 名称 */}
            <div className="text-lg font-bold text-white mb-2">
              {node.name}
            </div>

            {/* 描述 */}
            <div className="text-sm text-gray-300 mb-3">
              {node.description}
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2">
              {/* 继续拆解按钮 */}
              {!isRawMaterial && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPopup(false);
                    onNodeReexpand(node.id, node.name);
                  }}
                  className="w-full px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg pointer-events-auto"
                >
                  <span>🔧</span>
                  <span>继续拆解</span>
                </button>
              )}

              {/* 生产规划按钮 */}
              {!isRawMaterial && onProductionAnalysisClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPopup(false);
                    onProductionAnalysisClick(node);
                  }}
                  className="w-full px-3 py-2 bg-yellow-500/80 hover:bg-yellow-400/90 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg pointer-events-auto"
                >
                  <span>💡</span>
                  <span>生产规划</span>
                </button>
              )}
            </div>

            {/* 三角形指示器 */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-800"></div>
          </div>
        </div>,
        document.body
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
