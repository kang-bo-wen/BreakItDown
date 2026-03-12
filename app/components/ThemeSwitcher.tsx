'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeName } from '../lib/theme-config';

export default function ThemeSwitcher() {
  const { theme, themeConfig, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 主题列表 - 深色主题和浅色主题
  const themes = [
    { name: 'dark' as ThemeName, label: '深色主题', icon: '🌙', color: 'from-cyan-500 to-cyan-700' },
    { name: 'light' as ThemeName, label: '浅色主题', icon: '☀️', color: 'from-cyan-400 to-cyan-500' },
  ];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 阻止事件冒泡
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative" ref={dropdownRef} onClick={handleClick}>
      {/* 当前主题按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-gray-700/50 ${
          isOpen ? 'bg-gray-700/50' : ''
        }`}
        title="切换主题"
      >
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${themeConfig.primaryGradient} flex items-center justify-center text-sm`}>
          {themes.find(t => t.name === theme)?.icon || '🎨'}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white">主题</p>
          <p className="text-xs text-gray-400">{themes.find(t => t.name === theme)?.label}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
          {themes.map((t) => (
            <button
              key={t.name}
              onClick={(e) => {
                e.stopPropagation();
                setTheme(t.name);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-gray-700/50 ${
                theme === t.name ? 'bg-gray-700/70' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-sm`}>
                {t.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${theme === t.name ? 'text-white' : 'text-gray-300'}`}>
                  {t.label}
                </p>
              </div>
              {theme === t.name && (
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
