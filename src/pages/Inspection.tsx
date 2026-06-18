import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { useParams } from 'react-router-dom'
import { Camera, Video, CheckCircle2, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { motion } from 'framer-motion'

const pointStatusColors: Record<string, string> = {
  pending: 'text-gray-500',
  in_progress: 'text-status-healthy',
  completed: 'text-status-healthy opacity-70',
}

const pointStatusLabels: Record<string, string> = {
  pending: '待执行',
  in_progress: '执行中',
  completed: '已完成',
}

export default function Inspection() {
  const { id } = useParams<{ id: string }>()
  const { getTaskById, getTemplateById, completePoint } = useAppStore()

  const task = getTaskById(id || '')
  const template = task ? getTemplateById(task.templateId) : undefined

  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    if (task) {
      const ipIdx = task.points.findIndex(p => p.status === 'in_progress')
      if (ipIdx >= 0) setCurrentIdx(ipIdx)
    }
  }, [task])

  if (!task || !template) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Camera className="w-12 h-12 mb-3" />
        <p className="text-lg">任务不存在</p>
      </div>
    )
  }

  const points = task.points
  const currentPoint = points[currentIdx]
  const progressPct = Math.round((points.filter(p => p.status === 'completed').length / points.length) * 100)

  const goPrev = () => setCurrentIdx(Math.max(0, currentIdx - 1))
  const goNext = () => setCurrentIdx(Math.min(points.length - 1, currentIdx + 1))

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">点位进度</span>
            <span className="text-xs text-gray-500">{progressPct}% 已完成</span>
          </div>
          <div className="flex items-center gap-1.5">
            {points.map((p, i) => (
              <button
                key={p.pointId}
                onClick={() => setCurrentIdx(i)}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  i === currentIdx
                    ? 'bg-accent'
                    : p.status === 'completed'
                      ? 'bg-status-healthy/50'
                      : 'bg-navy-600'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-gray-600">
            <span>{points[0]?.pointName}</span>
            <span>{points[points.length - 1]?.pointName}</span>
          </div>
        </div>
      </motion.div>

      <motion.div key={currentPoint.pointId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">{currentPoint.pointName}</h2>
              <span className={`text-xs ${pointStatusColors[currentPoint.status]}`}>
                {pointStatusLabels[currentPoint.status]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {currentIdx + 1} / {points.length}
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <h3 className="text-sm font-medium text-gray-300">拍摄项目</h3>
            {template.items.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-navy-900/50 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  {item.captureType === 'photo' ? (
                    <Camera className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.required && (
                    <span className="badge badge-critical text-[10px] py-0 px-1.5">必拍</span>
                  )}
                  <span className="text-[10px] text-gray-600">
                    {item.captureType === 'photo' ? '照片' : '视频'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <h3 className="text-sm font-medium text-gray-300 mb-2">上传区域</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {template.items.map(item => (
                <div
                  key={item.id}
                  className="border-2 border-dashed border-navy-600/50 rounded-lg h-24 flex flex-col items-center justify-center gap-1.5 hover:border-navy-500/50 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="text-[10px] text-gray-600 text-center px-2 leading-tight">
                    {item.name}
                  </span>
                  <span className="text-[9px] text-gray-700">
                    {item.captureType === 'photo' ? 'JPG/PNG' : 'MP4'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                上一点位
              </button>
              <button
                onClick={goNext}
                disabled={currentIdx === points.length - 1}
                className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                下一点位
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {currentPoint.status !== 'completed' && (
              <button
                onClick={() => completePoint(task.id, currentPoint.pointId)}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                完成本点位
              </button>
            )}
            {currentPoint.status === 'completed' && (
              <span className="text-sm text-status-healthy flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                已完成
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
