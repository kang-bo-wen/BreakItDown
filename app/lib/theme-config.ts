// 主题配置
// 使用方式: import { useTheme } from '@/hooks/useTheme';

export type ThemeName = 'dark' | 'theme3';

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
      { bg: 'bg-blue-500/20', border: 'border-blue-500/40', borderAccent: 'border-blue-400', text: 'text-blue-100', glow: 'shadow-blue-500/50', gradient: 'from-blue-500/30 via-blue-400/20 to-transparent' },
      { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', borderAccent: 'border-indigo-400', text: 'text-indigo-100', glow: 'shadow-indigo-500/50', gradient: 'from-indigo-500/30 via-indigo-400/20 to-transparent' },
      { bg: 'bg-violet-500/20', border: 'border-violet-500/40', borderAccent: 'border-violet-400', text: 'text-violet-100', glow: 'shadow-violet-500/50', gradient: 'from-violet-500/30 via-violet-400/20 to-transparent' },
      { bg: 'bg-purple-500/20', border: 'border-purple-500/40', borderAccent: 'border-purple-400', text: 'text-purple-100', glow: 'shadow-purple-500/50', gradient: 'from-purple-500/30 via-purple-400/20 to-transparent' },
      { bg: 'bg-teal-500/20', border: 'border-teal-500/40', borderAccent: 'border-teal-400', text: 'text-teal-100', glow: 'shadow-teal-500/50', gradient: 'from-teal-500/30 via-teal-400/20 to-transparent' },
    ],
  },
  // 特殊主题 - 浅色科技风（4种不同配色）
  theme3: {
    name: 'theme3',
    label: '特殊主题',
    // 浅色基底
    backgroundGradient: 'from-slate-50 via-white to-slate-100',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-500',
    textMuted2: 'text-slate-400',
    textBody: 'text-slate-700',
    // 轻量纯色卡片
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    cardLightBg: 'bg-slate-50',
    // 按钮：靛蓝为主色
    btnPrimary: 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-md text-white',
    btnSecondary: 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
    // 输入框
    inputBg: 'bg-white',
    inputBorder: 'border-slate-300',
    inputText: 'text-slate-800',
    inputToggleBg: 'bg-slate-200',
    // 滑块
    sliderTrack: 'bg-slate-200',
    sliderThumb: 'bg-indigo-500',
    // 主题色：靛蓝
    primaryColor: 'indigo',
    primaryColorLight: 'indigo-500',
    primaryColorMuted: 'indigo-600/70',
    primaryGradient: 'from-indigo-500 via-indigo-400 to-indigo-500',
    borderColor: 'border-slate-200',
    borderColorLight: 'border-indigo-500/30',
    // 背景装饰
    techGridOpacity: 'opacity-5',
    radialGradient: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
    // 图片预览
    imagePreviewBg: 'bg-slate-50',
    imagePreviewBorder: 'border-slate-200',
    // GraphView 控制按钮样式
    controlBtn: 'bg-white border-slate-200',
    controlBtnHover: 'hover:bg-slate-50 hover:border-indigo-300',
    controlBtnBorder: 'border-slate-200',
    controlBtnBorderHover: 'hover:border-indigo-300',
    controlBtnText: 'text-indigo-600',
    // 装饰图标颜色
    decorationIcon: 'text-slate-300/30',
    // 卡片颜色数组：4种不同配色
    cardColors: [
      // 配色1: 靛蓝
      { bg: 'bg-white', border: 'border-indigo-200', lightBg: 'bg-indigo-50', accent: 'indigo-500', accentLight: 'indigo-600/70', gradient: 'from-indigo-500 via-indigo-400 to-indigo-500' },
      // 配色2: 祖母绿
      { bg: 'bg-white', border: 'border-emerald-200', lightBg: 'bg-emerald-50', accent: 'emerald-500', accentLight: 'emerald-600/70', gradient: 'from-emerald-500 via-emerald-400 to-emerald-500' },
      // 配色3: 暖橙
      { bg: 'bg-white', border: 'border-orange-200', lightBg: 'bg-orange-50', accent: 'orange-500', accentLight: 'orange-600/70', gradient: 'from-orange-500 via-orange-400 to-orange-500' },
      // 配色4: 玫瑰粉
      { bg: 'bg-white', border: 'border-rose-200', lightBg: 'bg-rose-50', accent: 'rose-500', accentLight: 'rose-600/70', gradient: 'from-rose-500 via-rose-400 to-rose-500' },
    ],
    // 树形结构层级颜色（浅色主题 - 多彩渐变）
    treeColors: [
      // 层级1: 靛蓝渐变
      { bg: 'bg-indigo-50', border: 'border-indigo-200', borderAccent: 'border-indigo-400', text: 'text-indigo-700', glow: 'shadow-indigo-500/30', gradient: 'from-indigo-100 via-indigo-50 to-white' },
      // 层级2: 蓝紫渐变
      { bg: 'bg-violet-50', border: 'border-violet-200', borderAccent: 'border-violet-400', text: 'text-violet-700', glow: 'shadow-violet-500/30', gradient: 'from-violet-100 via-violet-50 to-white' },
      // 层级3: 紫粉渐变
      { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', borderAccent: 'border-fuchsia-400', text: 'text-fuchsia-700', glow: 'shadow-fuchsia-500/30', gradient: 'from-fuchsia-100 via-fuchsia-50 to-white' },
      // 层级4: 粉橙渐变
      { bg: 'bg-pink-50', border: 'border-pink-200', borderAccent: 'border-pink-400', text: 'text-pink-700', glow: 'shadow-pink-500/30', gradient: 'from-pink-100 via-pink-50 to-white' },
      // 层级5: 橙黄渐变
      { bg: 'bg-orange-50', border: 'border-orange-200', borderAccent: 'border-orange-400', text: 'text-orange-700', glow: 'shadow-orange-500/30', gradient: 'from-orange-100 via-orange-50 to-white' },
      // 层级6: 青绿渐变
      { bg: 'bg-teal-50', border: 'border-teal-200', borderAccent: 'border-teal-400', text: 'text-teal-700', glow: 'shadow-teal-500/30', gradient: 'from-teal-100 via-teal-50 to-white' },
    ],
  },
};

// 获取主题列表（用于设置界面）
export function getThemeList(): { name: ThemeName; label: string }[] {
  return Object.values(themes).map(t => ({ name: t.name, label: t.label }));
}
