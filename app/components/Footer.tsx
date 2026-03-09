'use client';

import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function Footer() {
  const { themeConfig } = useTheme();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // 可以添加订阅逻辑
    alert(`已订阅: ${email}`);
    setEmail('');
  };

  return (
    <footer className={`py-12 mt-auto border-t ${themeConfig.borderColor} transition-colors duration-300`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 左侧：品牌 + 订阅 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${themeConfig.primaryGradient} shadow-lg`}>
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <div className={`text-lg font-bold bg-gradient-to-r ${themeConfig.primaryGradient} bg-clip-text text-transparent`}>
                  Break It Down Pro
                </div>
                <div className={`text-xs ${themeConfig.textMuted}`}>V4.0 - 探索万物本质</div>
              </div>
            </div>
            <p className={`text-sm ${themeConfig.textMuted} mb-6 max-w-sm`}>
              下一代AI技能协作市场，构建人类与AI高度协同的生产力枢纽。
            </p>

            {/* 订阅更新 */}
            <div>
              <div className={`text-sm font-medium ${themeConfig.textBody} mb-2`}>订阅更新</div>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入邮箱"
                  className={`flex-1 px-4 py-2 rounded-lg text-sm ${themeConfig.inputBg} ${themeConfig.inputBorder} border ${themeConfig.inputText} placeholder:text-opacity-50`}
                  style={{ colorScheme: 'dark' }}
                />
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r ${themeConfig.primaryGradient} shadow-lg hover:opacity-90 transition-opacity`}
                >
                  订阅
                </button>
              </form>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <div className={`text-sm font-bold ${themeConfig.textPrimary} mb-4`}>快速链接</div>
            <ul className="space-y-2">
              <li>
                <a href="#" className={`text-sm ${themeConfig.textMuted} hover:${themeConfig.primaryColorLight} transition-colors`}>
                  开发者文档
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm ${themeConfig.textMuted} hover:${themeConfig.primaryColorLight} transition-colors`}>
                  合规协议
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm ${themeConfig.textMuted} hover:${themeConfig.primaryColorLight} transition-colors`}>
                  社区准则
                </a>
              </li>
            </ul>
          </div>

          {/* 右侧：主题标识 + 版权 */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    themeConfig.primaryColor === 'cyan' ? '#22d3ee' :
                    themeConfig.primaryColor === 'blue' ? '#3b82f6' :
                    themeConfig.primaryColor === 'violet' ? '#a78bfa' : '#fb923c'
                }}
              />
              <span className={`text-sm ${themeConfig.textBody}`}>{themeConfig.label}</span>
            </div>

            <div className={`text-xs ${themeConfig.textMuted}`}>
              © {currentYear} Break It Down.<br />
              All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
