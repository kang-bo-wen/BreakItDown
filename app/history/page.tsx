'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SessionCard from '../components/SessionCard'

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
      // 先尝试从 sessionStorage 读取缓存
      const cached = sessionStorage.getItem('sessions-cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        // 如果缓存在 30 秒内，直接使用
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

      // 缓存到 sessionStorage
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
    // 立即从 UI 中移除
    const updatedSessions = sessions.filter(s => s.id !== id)
    setSessions(updatedSessions)

    // 更新缓存
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">拆解历史</h1>
            <button
              onClick={() => {
                sessionStorage.removeItem('sessions-cache')
                setHasFetched(false)
                fetchSessions()
              }}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? '刷新中...' : '🔄 刷新'}
            </button>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="搜索会话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">最新创建</option>
              <option value="oldest">最早创建</option>
              <option value="recent">最近更新</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">
              {searchQuery ? '没有找到匹配的会话' : '还没有保存的会话'}
            </p>
            <button
              onClick={() => router.push('/deconstruct')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              开始拆解
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
