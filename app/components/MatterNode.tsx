'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { createPortal } from 'react-dom';
import { useTheme } from '../hooks/useTheme';

interface MatterNodeData {
  name: string;
  description: string;
  isRawMaterial: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  hasChildren: boolean;
  hasKnowledgeCard: boolean;
  isLoadingKnowledge: boolean;
  level: number;
  zoom?: number;
  icon?: string;
  imageUrl?: string;
  isHovered?: boolean;
  nodeId?: string;
  breakdownMode?: 'basic' | 'production';
  onExpand: () => void;
  onShowKnowledge: () => void;
  onProductionAnalysis?: () => void;
  onDeleteChildren?: () => void;
  onHover?: (isHovered: boolean) => void;
}

function MatterNode({ data }: NodeProps<MatterNodeData>) {
  const {
    name,
    description,
    isRawMaterial,
    isLoading,
    hasChildren,
    hasKnowledgeCard,
    isLoadingKnowledge,
    level,
    zoom = 1,
    icon,
    imageUrl,
    isHovered: externalIsHovered,
    nodeId,
    breakdownMode,
    onExpand,
    onShowKnowledge,
    onProductionAnalysis,
    onDeleteChildren,
    onHover,
  } = data;

  // 使用主题配置
  const { theme, themeConfig } = useTheme();
  const isDarkTheme = theme === 'dark';
  const treeColors = themeConfig.treeColors;

  // 内部或外部 hover 状态
  const [internalIsHovered, setInternalIsHovered] = useState(false);
  const isHovered = externalIsHovered || internalIsHovered;

  const [showTooltip, setShowTooltip] = useState(false);
  const [showHoverLabel, setShowHoverLabel] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoverLabelPosition, setHoverLabelPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 更新悬浮窗位置 - 使用 RAF 持续监控
  useEffect(() => {
    if (showTooltip && nodeRef.current) {
      let rafId: number;

      const updatePosition = () => {
        if (nodeRef.current) {
          const rect = nodeRef.current.getBoundingClientRect();
          setTooltipPosition({
            x: rect.right + 4,
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
  }, [showTooltip]);

  // 更新悬停标签位置 - 使用 RAF 持续监控
  useEffect(() => {
    if (showHoverLabel && nodeRef.current) {
      let rafId: number;

      const updatePosition = () => {
        if (nodeRef.current) {
          const rect = nodeRef.current.getBoundingClientRect();
          setHoverLabelPosition({
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
  }, [showHoverLabel]);

  // 左键点击：切换悬浮窗显示/隐藏
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 如果要显示悬浮窗，先计算位置
    if (!showTooltip && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right + 4,
        y: rect.top + rect.height / 2,
      });
    }

    setShowTooltip(!showTooltip);
  };

  // 右键点击：重新分解节点
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRawMaterial && !isLoading) {
      // 重新分解：清空子节点并重新展开
      onExpand();
    }
  };

  // 鼠标悬停：显示简单的名称标签
  const handleMouseEnter = () => {
    setInternalIsHovered(true);
    onHover?.(true); // 通知父组件更新悬停状态
    if (!showTooltip) { // 只在没有显示完整悬浮框时显示标签
      setShowHoverLabel(true);
      if (nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        setHoverLabelPosition({
          x: rect.right + 8,
          y: rect.top + rect.height / 2,
        });
      }
    }
  };

  // 鼠标离开：隐藏名称标签
  const handleMouseLeave = () => {
    setInternalIsHovered(false);
    onHover?.(false); // 通知父组件更新悬停状态
    setShowHoverLabel(false);
  };

  // 根据层级计算节点大小
  const getNodeSize = () => {
    const baseSize = 120;
    const sizeReduction = level * 15;
    return Math.max(baseSize - sizeReduction, 60); // 最小60px
  };

  const nodeSize = getNodeSize();
  const fontSize = Math.max(nodeSize / 8, 12); // 字体大小随节点缩放

  // 根据层级获取节点颜色 - 使用主题配置
  const getNodeColor = () => {
    if (isRawMaterial) {
      return 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-300';
    }
    if (isLoading) {
      return 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-300 cursor-wait';
    }

    // 使用主题配置的层级颜色
    const themeColor = treeColors[level % treeColors.length];
    return `${themeColor.gradient} ${themeColor.border} hover:scale-110`;
  };

  return (
    <div
      ref={nodeRef}
      className={`relative ${showTooltip ? 'z-[9999]' : 'z-10'}`}
    >
      {/* 连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-blue-500 border-2 border-white opacity-0"
      />

      {/* 圆形节点 */}
      <div
        className={`
          rounded-full flex items-center justify-center
          backdrop-blur-sm border-4
          transition-all duration-300 cursor-pointer
          ${getNodeColor()}
          ${showTooltip ? 'z-50' : 'z-10'}
        `}
        style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          // 增强悬浮时的发光效果
          boxShadow: isHovered
            ? `0 0 30px currentColor, 0 0 60px currentColor, 0 0 90px currentColor, 0 4px 20px rgba(0,0,0,0.4)`
            : `0 4px 20px rgba(0,0,0,0.3)`,
          transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 默认显示：图片或图标 */}
        <div className="flex items-center justify-center w-full h-full overflow-hidden rounded-full">
          {isLoading ? (
            <span className="inline-block animate-spin" style={{ fontSize: `${nodeSize * 0.5}px` }}>
              🔄
            </span>
          ) : imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover sketch-effect"
              onError={() => setImageError(true)}
            />
          ) : (
            <span style={{ fontSize: `${nodeSize * 0.5}px` }}>
              {icon || (isRawMaterial ? '🌿' : '📦')}
            </span>
          )}
        </div>
      </div>

      {/* 连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-blue-500 border-2 border-white opacity-0"
      />

      {/* Hover 时显示的详细信息卡片 - 使用 Portal 渲染到 body 或 fullscreen 元素 */}
      {showTooltip && typeof window !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[99999]"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            width: '320px',
            maxHeight: '400px',
            pointerEvents: 'auto',
          }}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 shadow-2xl border-2 border-white/20 backdrop-blur-xl overflow-y-auto max-h-full">
            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
                onHover?.(false);
              }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500/80 hover:bg-red-600 rounded-full text-white text-sm font-bold transition-all shadow-lg z-10"
              title="关闭"
            >
              ×
            </button>

            {/* 名称 */}
            <div className="text-lg font-bold text-white mb-2">
              {name}
            </div>

            {/* 描述 */}
            <div className="text-sm text-gray-300 mb-3">
              {description}
            </div>


            {/* 操作按钮 - 横向排列 */}
            <div className="flex items-center gap-1">
              {/* 工艺流程 */}
              {!isRawMaterial && hasKnowledgeCard && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowKnowledge();
                  }}
                  className={`flex-1 flex flex-row items-center justify-center gap-1 p-2 rounded-lg transition-all ${
                    isDarkTheme
                      ? 'hover:bg-blue-500/20 text-blue-400'
                      : 'hover:bg-blue-50 text-blue-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span className="text-xs">工艺流程</span>
                </button>
              )}

              {/* 生产分析 */}
              {!isRawMaterial && breakdownMode === 'production' && onProductionAnalysis && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductionAnalysis();
                  }}
                  className={`flex-1 flex flex-row items-center justify-center gap-1 p-2 rounded-lg transition-all ${
                    isDarkTheme
                      ? 'hover:bg-cyan-500/20 text-cyan-400'
                      : 'hover:bg-cyan-50 text-cyan-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="text-xs">生产分析</span>
                </button>
              )}

              {/* 删除子节点 */}
              {!isRawMaterial && hasChildren && onDeleteChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`确定要删除"${name}"的所有子节点吗？`)) {
                      onDeleteChildren();
                      setShowTooltip(false);
                    }
                  }}
                  className={`flex-1 flex flex-row items-center justify-center gap-1 p-2 rounded-lg transition-all ${
                    isDarkTheme
                      ? 'hover:bg-red-500/20 text-red-400'
                    : 'hover:bg-red-50 text-red-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-xs">删除</span>
              </button>
              )}
            </div>

            {/* 加载中提示 */}
            {!isRawMaterial && !hasKnowledgeCard && isLoadingKnowledge && (
              <div className="w-full px-3 py-2 bg-gray-500/50 rounded-lg text-white text-sm flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">🔄</span>
                <span className="text-xs">加载工艺中...</span>
              </div>
            )}

            {/* 三角形指示器 */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-800"></div>
          </div>
        </div>,
        document.fullscreenElement || document.body
      )}

      {/* 悬停时显示的简单名称标签 - 使用 Portal 渲染 */}
      {showHoverLabel && !showTooltip && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-[99998] pointer-events-none"
          style={{
            left: `${hoverLabelPosition.x}px`,
            top: `${hoverLabelPosition.y}px`,
          }}
        >
          <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg border border-white/20" style={{ transform: 'translateY(-50%)' }}>
            <div className="text-white text-sm font-medium whitespace-nowrap">
              {name}
            </div>
          </div>
        </div>,
        document.fullscreenElement || document.body
      )}
    </div>
  );
}

export default memo(MatterNode);
