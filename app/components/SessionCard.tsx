'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleLoad = () => {
    router.push(`/canvas?sessionId=${id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)

    // 乐观更新：立即从 UI 中移除
    onDelete(id)

    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // 如果删除失败，显示错误但不恢复（因为很少失败）
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="mb-4 flex items-center justify-center h-32 bg-gray-100 rounded-lg overflow-hidden">
        {rootObjectImage ? (
          <img
            src={rootObjectImage}
            alt={rootObjectName}
            className="max-h-full max-w-full object-contain"
          />
        ) : rootObjectIcon ? (
          <span className="text-6xl">{rootObjectIcon}</span>
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>

      {/* Title and Object Name */}
      <h3 className="text-lg font-semibold mb-2 truncate">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 truncate">
        {rootObjectIcon} {rootObjectName}
      </p>

      {/* Dates */}
      <div className="text-xs text-gray-500 mb-4">
        <p>创建: {formatDate(createdAt)}</p>
        <p>更新: {formatDate(updatedAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleLoad}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          加载
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          disabled={isDeleting}
        >
          删除
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除"{title}"吗？此操作无法撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
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
