import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { useParams } from 'react-router-dom'
import { Camera, Video, CheckCircle2, ChevronLeft, ChevronRight, Upload, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl bg-navy-800 border border-navy-600/50"
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-status-healthy flex-shrink-0" />
      ) : (
        <Upload className="w-5 h-5 text-accent flex-shrink-0" />
      )}
      <span className="text-sm text-white font-medium">{message}</span>
      <button onClick={onClose} className="ml-1 text-gray-500 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export default function Inspection() {
  const { id } = useParams<{ id: string }>()
  const { getTaskById, getTemplateById, completePoint, addCapture } = useAppStore()

  const task = getTaskById(id || '')
  const template = task ? getTemplateById(task.templateId) : undefined

  const [currentIdx, setCurrentIdx] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type })
  }

  const handleUploadClick = (itemId: string) => {
    const input = fileInputRefs.current[itemId]
    if (input) input.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, itemId: string, type: 'photo' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      addCapture(task.id, currentPoint.pointId, type, dataUrl, dataUrl)
      showToast(type === 'photo' ? '照片上传成功' : '视频上传成功', 'info')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCompletePoint = () => {
    completePoint(task.id, currentPoint.pointId)
    showToast('点位完成！AI识别中...', 'success')
  }

  const currentCaptures = currentPoint.captures

  return (
    <div className="max-w-4xl mx-auto space-y-5 relative">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {template.items.map(item => (
                <div key={item.id}>
                  <input
                    ref={el => { fileInputRefs.current[item.id] = el }}
                    type="file"
                    accept={item.captureType === 'photo' ? 'image/*' : 'video/*'}
                    capture={item.captureType === 'photo' ? 'environment' : undefined}
                    onChange={(e) => handleFileChange(e, item.id, item.captureType)}
                    className="hidden"
                  />
                  <div
                    onClick={() => handleUploadClick(item.id)}
                    className="border-2 border-dashed border-navy-600/50 rounded-xl h-28 flex flex-col items-center justify-center gap-1.5 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer group"
                  >
                    <Upload className="w-6 h-6 text-gray-600 group-hover:text-accent transition-colors" />
                    <span className="text-[11px] text-gray-500 text-center px-2 leading-tight group-hover:text-gray-400 transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-700 flex items-center gap-1">
                      {item.captureType === 'photo' ? (
                        <><Camera className="w-2.5 h-2.5" /> JPG/PNG</>
                      ) : (
                        <><Video className="w-2.5 h-2.5" /> MP4</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentCaptures.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">已上传资料</h3>
                <span className="badge badge-info text-[10px]">
                  {currentCaptures.length} 个文件
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {currentCaptures.map((cap, idx) => (
                  <motion.div
                    key={cap.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="relative group"
                  >
                    <div className="card p-1.5">
                      {cap.type === 'photo' ? (
                        <img
                          src={cap.url}
                          alt={`拍摄-${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={cap.url}
                          className="w-full h-24 object-cover rounded-lg"
                          controls
                          preload="metadata"
                        />
                      )}
                      <div className="absolute top-2 left-2">
                        {cap.type === 'photo' ? (
                          <span className="badge badge-info text-[9px] py-0 px-1.5">
                            <Camera className="w-2 h-2 mr-0.5" />照片
                          </span>
                        ) : (
                          <span className="badge badge-warning text-[9px] py-0 px-1.5">
                            <Video className="w-2 h-2 mr-0.5" />视频
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

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
                onClick={handleCompletePoint}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                完成本点位
              </button>
            )}
            {currentPoint.status === 'completed' && (
              <span className="text-sm text-status-healthy flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                已完成
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
