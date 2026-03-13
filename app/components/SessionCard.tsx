'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../hooks/useTheme'
import { getDisplayIcon } from '../lib/icon-utils'
import { TrashIcon, ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline'

interface SessionCardProps {
  id: string
  title: string
  rootObjectName: string
  rootObjectIcon?: string
  rootObjectImage?: string
  createdAt: string
  updatedAt: string
  onDelete: (id: string) => void
}

export default function SessionCard({
  id,
  title,
  rootObjectName,
  rootObjectIcon,
  rootObjectImage,
  createdAt,
  updatedAt,
  onDelete
}: SessionCardProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDarkTheme = theme === 'dark'
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleLoad = () => {
    router.push(`/canvas?sessionId=${id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)

    onDelete(id)

    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        alert('删除失败，请刷新页面')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('删除失败，请刷新页面')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`group backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
      isDarkTheme
        ? 'bg-white/10 border-white/20 hover:border-cyan-500/50'
        : 'bg-white border-slate-200 hover:border-cyan-500 shadow-sm hover:shadow-md'
    }`}>
      {/* Thumbnail */}
      <div className={`relative h-40 flex items-center justify-center overflow-hidden ${
        isDarkTheme ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-100 to-slate-200'
      }`}>
        {rootObjectImage ? (
          <img
            src={rootObjectImage}
            alt={rootObjectName}
            className="max-h-full max-w-full object-contain p-4"
          />
        ) : rootObjectIcon ? (
          <span className="text-7xl filter drop-shadow-lg">{getDisplayIcon(rootObjectIcon)}</span>
        ) : (
          <span className="text-7xl">📦</span>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className={`text-lg font-bold mb-2 truncate group-hover:text-cyan-400 transition-colors ${
          isDarkTheme ? 'text-white' : 'text-slate-900'
        }`}>{title}</h3>
        <p className={`text-sm mb-4 truncate flex items-center gap-2 ${
          isDarkTheme ? 'text-gray-400' : 'text-slate-600'
        }`}>
          <span className="text-lg">{getDisplayIcon(rootObjectIcon)}</span>
          {rootObjectName}
        </p>

        {/* Dates */}
        <div className={`flex items-center gap-4 text-xs mb-4 ${
          isDarkTheme ? 'text-gray-500' : 'text-slate-500'
        }`}>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleLoad}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/20"
          >
            <ArrowRightIcon className="w-4 h-4" />
            加载
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`p-2.5 rounded-xl transition-all ${
              isDarkTheme
                ? 'bg-white/10 text-red-400 hover:bg-red-500/20'
                : 'bg-slate-100 text-red-500 hover:bg-red-50'
            }`}
            disabled={isDeleting}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 max-w-sm mx-4 shadow-2xl ${
            isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-bold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>确认删除</h3>
            <p className={`mb-6 ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>
              确定要删除「{title}」吗？此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isDarkTheme
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
