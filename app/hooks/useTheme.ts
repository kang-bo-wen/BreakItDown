'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThemeName, ThemeConfig, themes } from '../lib/theme-config';

interface UseThemeReturn {
  theme: ThemeName;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [mounted, setMounted] = useState(false);

  // 从 localStorage 加载主题
  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeName | null;
    if (saved && themes[saved]) {
      setThemeState(saved);
    } else {
      // 默认使用深色主题
      setThemeState('dark');
    }
    setMounted(true);
  }, []);

  // 设置主题
  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // 广播主题变化给其他页面
    window.dispatchEvent(new Event('theme-change'));
  }, []);

  // 切换主题（深色 <-> 浅色）
  const toggleTheme = useCallback(() => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      // 如果是其他主题，切换回 dark
      setTheme('dark');
    }
  }, [theme, setTheme]);

  // 监听其他页面的主题变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('theme') as ThemeName | null;
      if (saved && themes[saved]) {
        setThemeState(saved);
      }
    };

    const handleThemeChange = () => {
      const saved = localStorage.getItem('theme') as ThemeName | null;
      if (saved && themes[saved]) {
        setThemeState(saved);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('theme-change', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, []);

  return {
    theme,
    themeConfig: themes[theme],
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
}

// 获取服务端初始主题（避免闪烁）
export function getServerTheme(): ThemeName {
  // 服务端默认返回 dark，实际主题会在客户端 hydration 后通过 useTheme 同步
  return 'dark';
}

// 导出 ThemeName 类型供外部使用
export type { ThemeName } from '../lib/theme-config';
