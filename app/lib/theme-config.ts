// 主题配置
// 使用方式: import { useTheme } from '@/hooks/useTheme';

export type ThemeName = 'dark' | 'light';

// 卡片颜色配置（用于不同卡片使用不同配色）
export interface CardColor {
  bg: string;        // 卡片背景
  border: string;   // 边框颜色
  lightBg: string;  // 浅色背景（用于 hover 等）
  accent: string;   // 强调色（渐变起点）
  accentLight: string; // 强调色浅色
  gradient: string; // 渐变样式
}

// 树形结构层级颜色配置
export interface TreeLevelColor {
  bg: string;        // 背景（半透明渐变）
  bgSolid?: string;  // 纯色背景（备用）
  border: string;   // 边框颜色
  borderAccent: string; // 边框强调色
  text: string;     // 文字颜色
  glow: string;     // 发光效果
  gradient: string; // 渐变背景
}

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  // 背景渐变
  backgroundGradient: string;
  // 文字颜色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textMuted2: string; // 更淡的文字颜色（用于滑块标签等）
  textBody: string; // 主体文字颜色
  // 卡片样式
  cardBg: string;
  cardBorder: string;
  cardLightBg: string;
  // 按钮样式
  btnPrimary: string;
  btnSecondary: string;
  // 输入框样式
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputToggleBg: string; // 输入模式切换背景
  // 滑块样式
  sliderTrack: string;
  sliderThumb: string;
  // 主题色
  primaryColor: string;
  primaryColorLight: string;
  primaryColorMuted: string;
  primaryGradient: string;
  // 边框颜色
  borderColor: string;
  borderColorLight: string;
  // 背景装饰
  techGridOpacity: string;
  radialGradient: string;
  // GraphView 大容器样式
  containerBorderGradient: string;
  containerBgGradient: string;
  // 图片预览
  imagePreviewBg: string;
  imagePreviewBorder: string;
  // GraphView 控制按钮样式
  controlBtn: string;
  controlBtnHover: string;
  controlBtnBorder: string;
  controlBtnBorderHover: string;
  controlBtnText: string;
  // 装饰图标颜色
  decorationIcon: string;
  // 多种卡片颜色（索引 0-3）
  cardColors: CardColor[];
  // 树形结构层级颜色（索引 0-5 对应不同层级）
  treeColors: TreeLevelColor[];
}

export const themes: Record<ThemeName, ThemeConfig> = {
  dark: {
    name: 'dark',
    label: '深色主题',
    backgroundGradient: 'from-slate-950 via-slate-900 to-black',
    textPrimary: 'text-white',
    textSecondary: 'text-cyan-100',
    textMuted: 'text-cyan-300/60',
    textMuted2: 'text-cyan-300/50',
    textBody: 'text-cyan-100',
    cardBg: 'bg-slate-800/50',
    cardBorder: 'border-slate-700',
    cardLightBg: 'bg-slate-900/70',
    btnPrimary: 'bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/30 text-white',
    btnSecondary: 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700',
    inputBg: 'bg-slate-800/50',
    inputBorder: 'border-cyan-500/30',
    inputText: 'text-white',
    inputToggleBg: 'bg-slate-800/70',
    sliderTrack: 'bg-slate-700',
    sliderThumb: 'bg-cyan-500',
    primaryColor: 'cyan',
    primaryColorLight: 'cyan-400',
    primaryColorMuted: 'cyan-300/70',
    primaryGradient: 'from-cyan-400 via-cyan-300 to-cyan-500',
    borderColor: 'border-slate-700',
    borderColorLight: 'border-cyan-500/20',
    techGridOpacity: 'opacity-30',
    radialGradient: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
    // GraphView 大容器样式 - 多彩渐变
    containerBorderGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(34, 197, 94, 0.4), rgba(249, 115, 22, 0.4))',
    containerBgGradient: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(34, 197, 94, 0.03) 100%)',
    imagePreviewBg: 'bg-black/40',
    imagePreviewBorder: 'border-cyan-500/20',
    // GraphView 控制按钮样式
    controlBtn: 'bg-gradient-to-br from-cyan-900 to-slate-900',
    controlBtnHover: 'hover:from-cyan-700 hover:to-cyan-900',
    controlBtnBorder: 'border-cyan-500/30',
    controlBtnBorderHover: 'hover:border-cyan-400/60',
    controlBtnText: 'text-cyan-300',
    // 装饰图标颜色
    decorationIcon: 'text-white/10',
    // 卡片颜色数组（待配置）
    cardColors: [
      { bg: 'bg-slate-800/50', border: 'border-cyan-500/30', lightBg: 'bg-cyan-900/30', accent: 'cyan-400', accentLight: 'cyan-300/70', gradient: 'from-cyan-400 via-cyan-300 to-cyan-500' },
      { bg: 'bg-slate-800/50', border: 'border-blue-500/30', lightBg: 'bg-blue-900/30', accent: 'blue-400', accentLight: 'blue-300/70', gradient: 'from-blue-400 via-blue-300 to-blue-500' },
      { bg: 'bg-slate-800/50', border: 'border-green-500/30', lightBg: 'bg-green-900/30', accent: 'green-400', accentLight: 'green-300/70', gradient: 'from-green-400 via-green-300 to-green-500' },
      { bg: 'bg-slate-800/50', border: 'border-amber-500/30', lightBg: 'bg-amber-900/30', accent: 'amber-400', accentLight: 'amber-300/70', gradient: 'from-amber-400 via-amber-300 to-amber-500' },
    ],
    // 树形结构层级颜色（深色主题 - 青色科技风）
    treeColors: [
      { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', borderAccent: 'border-cyan-400', text: 'text-cyan-100', glow: 'shadow-cyan-500/50', gradient: 'from-cyan-500/30 via-cyan-400/20 to-transparent' },
      { bg: 'bg-orange-500/20', border: 'border-orange-500/40', borderAccent: 'border-orange-400', text: 'text-orange-100', glow: 'shadow-orange-500/50', gradient: 'from-orange-500/30 via-orange-400/20 to-transparent' },
      { bg: 'bg-green-500/20', border: 'border-green-500/40', borderAccent: 'border-green-400', text: 'text-green-100', glow: 'shadow-green-500/50', gradient: 'from-green-500/30 via-green-400/20 to-transparent' },
      { bg: 'bg-purple-500/20', border: 'border-purple-500/40', borderAccent: 'border-purple-400', text: 'text-purple-100', glow: 'shadow-purple-500/50', gradient: 'from-purple-500/30 via-purple-400/20 to-transparent' },
      { bg: 'bg-violet-500/20', border: 'border-violet-500/40', borderAccent: 'border-violet-400', text: 'text-violet-100', glow: 'shadow-violet-500/50', gradient: 'from-violet-500/30 via-violet-400/20 to-transparent' },
      { bg: 'bg-pink-500/20', border: 'border-pink-500/40', borderAccent: 'border-pink-400', text: 'text-pink-100', glow: 'shadow-pink-500/50', gradient: 'from-pink-500/30 via-pink-400/20 to-transparent' },
    ],
  },
  // 浅色主题 - 清新简洁的浅色设计
  light: {
    name: 'light',
    label: '浅色主题',
    // 浅色基底 - 白色/浅灰/淡蓝
    backgroundGradient: 'from-slate-100 via-white to-slate-50',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-500',
    textMuted2: 'text-slate-400',
    textBody: 'text-slate-800',
    // 白色卡片 - 简洁大气
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    cardLightBg: 'bg-white',
    // 按钮：深青色为主色，更醒目
    btnPrimary: 'bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-md shadow-cyan-600/20 text-white',
    btnSecondary: 'bg-white border-slate-400 text-slate-700 hover:bg-slate-100',
    // 输入框
    inputBg: 'bg-white',
    inputBorder: 'border-slate-400',
    inputText: 'text-slate-900',
    inputToggleBg: 'bg-slate-200',
    // 滑块
    sliderTrack: 'bg-slate-300',
    sliderThumb: 'bg-cyan-600',
    // 主题色：深青色（更醒目）
    primaryColor: 'cyan',
    primaryColorLight: 'cyan-600',
    primaryColorMuted: 'cyan-700/80',
    primaryGradient: 'from-cyan-600 via-cyan-500 to-cyan-700',
    borderColor: 'border-slate-100',
    borderColorLight: 'border-cyan-300/40',
    // 背景装饰
    techGridOpacity: 'opacity-10',
    radialGradient: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)',
    // GraphView 大容器样式
    containerBorderGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(34, 197, 94, 0.2), rgba(249, 115, 22, 0.2))',
    containerBgGradient: 'linear-gradient(180deg, rgba(6, 182, 212, 0.04) 0%, rgba(34, 197, 94, 0.02) 100%)',
    // 图片预览
    imagePreviewBg: 'bg-slate-50',
    imagePreviewBorder: 'border-slate-100',
    // GraphView 控制按钮样式
    controlBtn: 'bg-white border-slate-100',
    controlBtnHover: 'hover:bg-slate-50 hover:border-cyan-400',
    controlBtnBorder: 'border-slate-100',
    controlBtnBorderHover: 'hover:border-cyan-400',
    controlBtnText: 'text-cyan-700',
    // 装饰图标颜色
    decorationIcon: 'text-slate-400/60',
    // 卡片颜色数组：4种不同配色（浅色版 - 更淡的边框）
    cardColors: [
      // 配色1: 青色
      { bg: 'bg-white', border: 'border-cyan-100', lightBg: 'bg-cyan-50', accent: 'cyan-600', accentLight: 'cyan-700', gradient: 'from-cyan-500 via-cyan-400 to-cyan-600' },
      // 配色2: 蓝色
      { bg: 'bg-white', border: 'border-blue-100', lightBg: 'bg-blue-50', accent: 'blue-600', accentLight: 'blue-700', gradient: 'from-blue-500 via-blue-400 to-blue-600' },
      // 配色3: 绿色
      { bg: 'bg-white', border: 'border-green-100', lightBg: 'bg-green-50', accent: 'green-600', accentLight: 'green-700', gradient: 'from-green-500 via-green-400 to-green-600' },
      // 配色4: 橙色
      { bg: 'bg-white', border: 'border-orange-100', lightBg: 'bg-orange-50', accent: 'orange-600', accentLight: 'orange-700', gradient: 'from-orange-500 via-orange-400 to-orange-600' },
    ],
    // 树形结构层级颜色（浅色主题 - 清新淡雅）
    treeColors: [
      // 层级1: 青色
      { bg: 'bg-cyan-50', border: 'border-cyan-100', borderAccent: 'border-cyan-300', text: 'text-cyan-800', glow: 'shadow-cyan-500/20', gradient: 'from-cyan-100 via-cyan-50 to-white' },
      // 层级2: 橙色
      { bg: 'bg-orange-50', border: 'border-orange-100', borderAccent: 'border-orange-300', text: 'text-orange-800', glow: 'shadow-orange-500/20', gradient: 'from-orange-100 via-orange-50 to-white' },
      // 层级3: 绿色
      { bg: 'bg-green-50', border: 'border-green-100', borderAccent: 'border-green-300', text: 'text-green-800', glow: 'shadow-green-500/20', gradient: 'from-green-100 via-green-50 to-white' },
      // 层级4: 紫色
      { bg: 'bg-violet-50', border: 'border-violet-100', borderAccent: 'border-violet-300', text: 'text-violet-800', glow: 'shadow-violet-500/20', gradient: 'from-violet-100 via-violet-50 to-white' },
      // 层级5: 蓝色
      { bg: 'bg-blue-50', border: 'border-blue-100', borderAccent: 'border-blue-300', text: 'text-blue-800', glow: 'shadow-blue-500/20', gradient: 'from-blue-100 via-blue-50 to-white' },
      // 层级6: 粉色
      { bg: 'bg-pink-50', border: 'border-pink-100', borderAccent: 'border-pink-300', text: 'text-pink-800', glow: 'shadow-pink-500/20', gradient: 'from-pink-100 via-pink-50 to-white' },
    ],
  },
};

// 获取主题列表（用于设置界面）
export function getThemeList(): { name: ThemeName; label: string }[] {
  return Object.values(themes).map(t => ({ name: t.name, label: t.label }));
}
