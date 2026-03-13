'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../hooks/useTheme'
import SessionCard from '../components/SessionCard'
import { ArrowPathIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

interface Session {
  id: string
  title: string
  rootObjectName: string
  rootObjectIcon?: string
  rootObjectImage?: string
  createdAt: string
  updatedAt: string
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, themeConfig } = useTheme()
  const isDarkTheme = theme === 'dark'
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'recent'>('newest')
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && !hasFetched) {
      fetchSessions()
      setHasFetched(true)
    }
  }, [status, router, hasFetched])

  const fetchSessions = async () => {
    setIsLoading(true)
    setError('')

    try {
      const cached = sessionStorage.getItem('sessions-cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 30000) {
          console.log('📦 使用缓存的会话数据')
          setSessions(data)
          setIsLoading(false)
          return
        }
      }

      console.log('🔄 从服务器获取会话数据')
      const response = await fetch('/api/sessions')

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      const sessionsData = data.sessions || []
      setSessions(sessionsData)

      sessionStorage.setItem('sessions-cache', JSON.stringify({
        data: sessionsData,
        timestamp: Date.now()
      }))
    } catch (err) {
      console.error('Fetch error:', err)
      setError('加载历史记录失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    const updatedSessions = sessions.filter(s => s.id !== id)
    setSessions(updatedSessions)

    sessionStorage.setItem('sessions-cache', JSON.stringify({
      data: updatedSessions,
      timestamp: Date.now()
    }))
  }

  const filteredSessions = sessions
    .filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rootObjectName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return 0
      }
    })

  if (status === 'loading' || isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-lg ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-12 ${isDarkTheme ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                拆解历史
              </h1>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-slate-600'}>
                回顾你的拆解作品，继续未完成的探索
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('sessions-cache')
                setHasFetched(false)
                fetchSessions()
              }}
              className={`p-3 rounded-xl transition-all hover:scale-105 ${
                isDarkTheme
                  ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
              disabled={isLoading}
            >
              <ArrowPathIcon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDarkTheme ? 'text-gray-500' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="搜索拆解记录..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                  isDarkTheme
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            <div className="relative">
              <AdjustmentsHorizontalIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDarkTheme ? 'text-gray-500' : 'text-slate-400'
              }`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`w-full sm:w-48 pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none ${
                  isDarkTheme
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="newest">最新创建</option>
                <option value="oldest">最早创建</option>
                <option value="recent">最近更新</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-xl ${isDarkTheme ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {error}
          </div>
        )}

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isDarkTheme ? 'bg-white/10' : 'bg-slate-100'
            }`}>
              <MagnifyingGlassIcon className={`w-12 h-12 ${isDarkTheme ? 'text-gray-600' : 'text-slate-400'}`} />
            </div>
            <p className={`text-xl mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>
              {searchQuery ? '没有找到匹配的记录' : '还没有保存的拆解记录'}
            </p>
            <p className={`mb-8 ${isDarkTheme ? 'text-gray-500' : 'text-slate-500'}`}>
              {searchQuery ? '试试其他关键词' : '开始你的第一次拆解之旅'}
            </p>
            <button
              onClick={() => router.push('/setup')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30 hover:scale-105"
            >
              开始拆解
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSessions.map(session => (
              <SessionCard
                key={session.id}
                {...session}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
