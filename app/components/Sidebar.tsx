'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '../hooks/useTheme'
import { getDisplayIcon } from '../lib/icon-utils'
import ThemeSwitcher from './ThemeSwitcher'

interface SessionItem {
  id: string
  title: string
  rootObjectName: string
  rootObjectIcon: string | null
  rootObjectImage: string | null
  createdAt: string
  updatedAt: string
}

export default function Sidebar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()
  const isDarkTheme = theme === 'dark'
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [hasFetchedSessions, setHasFetchedSessions] = useState(false)

  // 获取会话列表
  useEffect(() => {
    if (status === 'authenticated' && isOpen && !hasFetchedSessions) {
      fetchSessions()
      setHasFetchedSessions(true)
    }
  }, [status, isOpen, hasFetchedSessions])

  const fetchSessions = async () => {
    setIsLoadingSessions(true)
    try {
      // 先尝试从 sessionStorage 读取缓存
      const cached = sessionStorage.getItem('sidebar-sessions-cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        // 如果缓存在 30 秒内，直接使用
        if (Date.now() - timestamp < 30000) {
          console.log('📦 侧边栏使用缓存的会话数据')
          setSessions(data)
          setIsLoadingSessions(false)
          return
        }
      }

      console.log('🔄 侧边栏从服务器获取会话数据')
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        const sessionsData = data.sessions || []
        setSessions(sessionsData)

        // 缓存到 sessionStorage
        sessionStorage.setItem('sidebar-sessions-cache', JSON.stringify({
          data: sessionsData,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  // 关闭侧边栏（点击外部或按 ESC）
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // 路由变化时关闭侧边栏
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // 监听自定义事件打开侧边栏
  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsOpen(true)
      window.dispatchEvent(new CustomEvent('sidebar-opened'))
    }

    window.addEventListener('open-sidebar', handleOpenSidebar)
    return () => window.removeEventListener('open-sidebar', handleOpenSidebar)
  }, [])

  if (status === 'loading') {
    return null
  }

  if (status === 'unauthenticated') {
    return null
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个拆解记录吗？')) return

    // 乐观更新：立即从 UI 中移除
    setSessions(sessions.filter(s => s.id !== sessionId))

    // 同步更新缓存
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    sessionStorage.setItem('sidebar-sessions-cache', JSON.stringify({
      data: updatedSessions,
      timestamp: Date.now()
    }))

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        console.error('删除会话失败')
        // 不恢复，因为删除很少失败
      }
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  // 关闭侧边栏并通知
  const closeSidebar = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('close-sidebar'));
  };

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={`fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDarkTheme
            ? 'bg-gray-900 text-white border-r border-white/10'
            : 'bg-white text-slate-900 border-r border-slate-200'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                isDarkTheme ? 'from-blue-400 to-purple-400' : 'from-cyan-600 to-blue-600'
              }`}>
                Break It Down
              </h2>
              <button
                onClick={closeSidebar}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkTheme ? 'hover:bg-gray-800' : 'hover:bg-slate-100'
                }`}
                aria-label="关闭菜单"
              >
                <svg
                  className={`w-6 h-6 ${isDarkTheme ? 'text-white' : 'text-slate-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 用户信息 */}
            {session?.user && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                isDarkTheme ? 'bg-gray-800' : 'bg-slate-100'
              }`}>
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold text-white">
                  {session.user.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {session.user.email}
                  </p>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>已登录</p>
                </div>
              </div>
            )}
          </div>

          {/* 新建按钮 */}
          <div className={`p-4 border-b ${isDarkTheme ? 'border-gray-800' : 'border-slate-200'}`}>
            <button
              onClick={() => {
                // 清除所有本地存储数据
                localStorage.removeItem('deconstructionTree');
                localStorage.removeItem('identificationResult');
                localStorage.removeItem('imagePreview');
                localStorage.removeItem('knowledgeCache');
                localStorage.removeItem('nodePositions');
                localStorage.removeItem('setupState');
                localStorage.removeItem('fromSetup');

                // 使用 window.location 强制刷新到新页面
                window.location.href = '/setup';
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium">新建拆解</span>
            </button>
          </div>

          {/* 历史记录列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>拆解历史</h3>
              <button
                onClick={() => {
                  sessionStorage.removeItem('sidebar-sessions-cache')
                  setHasFetchedSessions(false)
                  fetchSessions()
                }}
                className={`p-1 rounded transition-colors ${isDarkTheme ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}
                title="刷新列表"
                disabled={isLoadingSessions}
              >
                <svg
                  className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'} ${isLoadingSessions ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
            {isLoadingSessions ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>加载中...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className={`text-center py-8 text-sm ${isDarkTheme ? 'text-gray-500' : 'text-slate-500'}`}>
                暂无历史记录
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsOpen(false); // 关闭侧边栏
                      router.push(`/canvas?sessionId=${item.id}`);
                    }}
                    className={`group relative rounded-lg p-3 cursor-pointer transition-all ${
                      isDarkTheme
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 图标或图片 */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        isDarkTheme ? 'bg-gray-700' : 'bg-slate-200'
                      }`}>
                        {getDisplayIcon(item.rootObjectIcon)}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {item.title}
                        </p>
                        <p className={`text-xs mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                          {new Date(item.updatedAt).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => handleDeleteSession(item.id, e)}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                          isDarkTheme ? 'hover:bg-red-600/20' : 'hover:bg-red-100'
                        }`}
                        title="删除"
                      >
                        <svg
                          className={`w-4 h-4 ${isDarkTheme ? 'text-red-400' : 'text-red-500'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 主题切换 */}
          <div className={`p-4 border-t ${isDarkTheme ? 'border-gray-800' : 'border-slate-200'}`}>
            <ThemeSwitcher />
          </div>

          {/* 底部 */}
          <div className={`p-4 border-t ${isDarkTheme ? 'border-gray-800' : 'border-slate-200'}`}>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isDarkTheme
                  ? 'hover:bg-red-600/20 text-red-400 hover:text-red-300'
                  : 'hover:bg-red-50 text-red-500 hover:text-red-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
