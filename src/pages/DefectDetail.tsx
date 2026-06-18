import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Check, Clock, Wrench,
  FileText, ArrowRight, MessageSquare, User, Save, ArrowLeft, X, CheckCircle2
} from 'lucide-react'
import { useAppStore } from '@/store'
import type { DefectType, DefectSeverity } from '@/types'

const typeLabels: Record<DefectType, string> = {
  crack: '裂缝',
  rust: '锈蚀',
  foreign_object: '异物',
  other: '其他',
}

const severityLabels: Record<DefectSeverity, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
}

const workOrderTimeline = [
  { key: 'pending', label: '创建', icon: FileText },
  { key: 'in_progress', label: '处理中', icon: Wrench },
  { key: 'completed', label: '已完成', icon: CheckCircle2 },
  { key: 'verified', label: '已验收', icon: CheckCircle2 },
] as const

const defectStatusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  work_order_created: '工单已创建',
  repairing: '维修中',
  closed: '已闭环',
}

function SeverityBadge({ severity }: { severity: DefectSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="badge badge-critical glow-critical">
        <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse" />
        {severityLabels[severity]}
      </span>
    )
  }
  if (severity === 'high') {
    return (
      <span className="badge badge-critical glow-critical">
        <span className="w-1.5 h-1.5 rounded-full bg-status-critical" />
        {severityLabels[severity]}
      </span>
    )
  }
  if (severity === 'medium') {
    return (
      <span className="badge badge-warning">
        <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
        {severityLabels[severity]}
      </span>
    )
  }
  return (
    <span className="badge badge-info">
      <span className="w-1.5 h-1.5 rounded-full bg-status-info" />
      {severityLabels[severity]}
    </span>
  )
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'info' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-status-healthy flex-shrink-0" />,
    info: <MessageSquare className="w-5 h-5 text-accent flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl bg-navy-800 border border-navy-600/50"
    >
      {iconMap[type]}
      <span className="text-sm text-white font-medium">{message}</span>
      <button onClick={onClose} className="ml-1 text-gray-500 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export default function DefectDetail() {
  const { id } = useParams<{ id: string }>()
  const { defects, areas, points, tasks, workOrders, confirmDefect, createWorkOrder, updateWorkOrderStatus, getWorkOrderByDefectId } = useAppStore()
  const [pilotNote, setPilotNote] = useState('')
  const [woAssignee, setWoAssignee] = useState('')
  const [woDescription, setWoDescription] = useState('')
  const [showWoForm, setShowWoForm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null)

  const defect = defects.find(d => d.id === id)

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type })
  }

  if (!defect) {
    return (
      <div className="space-y-6">
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>
        <Link to="/defects" className="btn-ghost text-sm flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-4 h-4" />
          返回缺陷列表
        </Link>
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <AlertTriangle className="w-12 h-12 mb-4 text-gray-600" />
          <p className="text-lg">未找到缺陷记录</p>
          <Link to="/defects" className="text-accent hover:text-accent-light mt-2 text-sm">
            返回缺陷列表
          </Link>
        </div>
      </div>
    )
  }

  const area = areas.find(a => a.id === defect.areaId)
  const point = points.find(p => p.id === defect.pointId)
  const task = tasks.find(t => t.id === defect.taskId)
  const capture = task?.points.flatMap(p => p.captures).find(c => c.id === defect.captureId)
  const workOrder = getWorkOrderByDefectId(defect.id)

  const handleConfirm = () => {
    if (!pilotNote.trim()) return
    confirmDefect(defect.id, pilotNote)
    setPilotNote('')
    showToast('缺陷已确认！', 'success')
  }

  const handleCreateWorkOrder = () => {
    if (!woAssignee.trim() || !woDescription.trim()) return
    createWorkOrder(defect.id, woAssignee, woDescription)
    setShowWoForm(false)
    setWoAssignee('')
    setWoDescription('')
    showToast('工单创建成功！', 'success')
  }

  const getNextWoStatus = () => {
    if (!workOrder) return null
    const statusOrder: typeof workOrderTimeline[number]['key'][] = ['pending', 'in_progress', 'completed', 'verified']
    const idx = statusOrder.indexOf(workOrder.status)
    if (idx < statusOrder.length - 1) return statusOrder[idx + 1]
    return null
  }

  const nextWoStatus = getNextWoStatus()
  const nextWoStatusLabel: Record<string, string> = {
    in_progress: '开始处理',
    completed: '标记完成',
    verified: '确认验收',
  }

  const nextWoStatusToast: Record<string, string> = {
    in_progress: '工单已开始处理，缺陷状态更新为维修中',
    completed: '工单已标记完成！',
    verified: '工单已验收通过，缺陷已闭环',
  }

  const handleAdvanceStatus = () => {
    if (!workOrder || !nextWoStatus) return
    updateWorkOrderStatus(workOrder.id, nextWoStatus)
    showToast(nextWoStatusToast[nextWoStatus] || '状态已更新', 'success')
  }

  const timelineIdx = workOrder
    ? workOrderTimeline.findIndex(t => t.key === workOrder.status)
    : -1

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/defects" className="btn-ghost text-sm flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            返回缺陷列表
          </Link>
          <div className="h-5 w-px bg-navy-700" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">缺陷详情 {defect.id}</span>
              <span className={`badge ${
                defect.status === 'closed' ? 'badge-healthy' :
                defect.status === 'repairing' ? 'badge-warning' :
                defect.status === 'confirmed' ? 'badge-info' : 'badge-info'
              } text-[10px]`}>
                {defectStatusLabels[defect.status]}
              </span>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {area?.name ?? '-'} · {point?.name ?? '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-navy-600/30 flex items-center justify-between">
              <span className="text-sm font-medium text-white">缺陷影像</span>
              <SeverityBadge severity={defect.severity} />
            </div>
            <div className="relative">
              <img
                src={capture?.url ?? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20equipment%20inspection%20aerial%20dark&image_size=landscape_16_9'}
                alt="缺陷图像"
                className="w-full h-auto object-cover"
              />
              <div
                className="absolute border-2 border-status-critical/80 rounded-sm"
                style={{
                  left: `${defect.location.x}%`,
                  top: `${defect.location.y}%`,
                  width: `${defect.location.width}%`,
                  height: `${defect.location.height}%`,
                }}
              >
                <span className="absolute -top-5 left-0 text-[10px] text-status-critical bg-navy-950/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {typeLabels[defect.type]} · {(defect.aiConfidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              AI分析结果
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">缺陷类型</p>
                <p className="text-sm text-gray-200">{typeLabels[defect.type]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">AI置信度</p>
                <p className={`stat-number text-sm ${
                  defect.aiConfidence >= 0.9 ? 'text-status-critical' :
                  defect.aiConfidence >= 0.8 ? 'text-status-warning' : 'text-status-info'
                }`}>
                  {(defect.aiConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">严重等级</p>
                <SeverityBadge severity={defect.severity} />
              </div>
            </div>
            <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-600/20">
              <p className="text-xs text-gray-500 mb-1">AI描述</p>
              <p className="text-sm text-gray-300 leading-relaxed">{defect.aiDescription}</p>
            </div>
            <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              创建: {defect.createdAt}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              飞手确认
            </h3>
            {!defect.pilotConfirmed ? (
              <div className="space-y-3">
                <textarea
                  value={pilotNote}
                  onChange={e => setPilotNote(e.target.value)}
                  placeholder="请输入确认备注..."
                  className="input-field w-full h-24 text-sm resize-none"
                />
                <button
                  onClick={handleConfirm}
                  disabled={!pilotNote.trim()}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  确认缺陷
                </button>
              </div>
            ) : (
              <div className="bg-status-healthy/5 border border-status-healthy/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-status-healthy" />
                  <span className="text-sm text-status-healthy font-medium">已确认</span>
                </div>
                {defect.pilotNote && (
                  <p className="text-sm text-gray-300 ml-6">{defect.pilotNote}</p>
                )}
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-5"
          >
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-accent" />
              工单跟踪
            </h3>

            {!workOrder && !showWoForm && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 mb-4">暂无关联工单</p>
                {defect.pilotConfirmed && (
                  <button
                    onClick={() => setShowWoForm(true)}
                    className="btn-primary text-sm"
                  >
                    创建工单
                  </button>
                )}
                {!defect.pilotConfirmed && (
                  <p className="text-xs text-gray-600">需先确认缺陷后才能创建工单</p>
                )}
              </div>
            )}

            {!workOrder && showWoForm && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                    <User className="w-3 h-3" />
                    负责人
                  </label>
                  <input
                    type="text"
                    value={woAssignee}
                    onChange={e => setWoAssignee(e.target.value)}
                    placeholder="输入负责人"
                    className="input-field w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    工单描述
                  </label>
                  <textarea
                    value={woDescription}
                    onChange={e => setWoDescription(e.target.value)}
                    placeholder="输入工单描述..."
                    className="input-field w-full text-sm h-20 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateWorkOrder}
                    disabled={!woAssignee.trim() || !woDescription.trim()}
                    className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    创建
                  </button>
                  <button
                    onClick={() => setShowWoForm(false)}
                    className="btn-secondary text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {workOrder && (
              <div className="space-y-4">
                <div className="bg-navy-900/50 rounded-lg p-4 border border-navy-600/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">工单编号</span>
                    <span className="font-mono text-sm text-gray-300">{workOrder.id}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      负责人
                    </span>
                    <span className="text-sm text-gray-300">{workOrder.assignee}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      创建时间
                    </span>
                    <span className="text-sm text-gray-400">{workOrder.createdAt}</span>
                  </div>
                  {workOrder.completedAt && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">完成时间</span>
                      <span className="text-sm text-gray-400">{workOrder.completedAt}</span>
                    </div>
                  )}
                  {workOrder.verifiedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">验收时间</span>
                      <span className="text-sm text-gray-400">{workOrder.verifiedAt}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-400 mt-3 pt-3 border-t border-navy-600/20">
                    {workOrder.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-3">工单进度</p>
                  <div className="space-y-0">
                    {workOrderTimeline.map((step, i) => {
                      const isCompleted = i <= timelineIdx
                      const isCurrent = i === timelineIdx
                      const StepIcon = step.icon
                      const dateField = i === 0 ? workOrder.createdAt
                        : i === 2 ? workOrder.completedAt
                        : i === 3 ? workOrder.verifiedAt
                        : null
                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? isCurrent ? 'bg-accent/20 ring-2 ring-accent/40' : 'bg-status-healthy/20'
                                : 'bg-navy-700'
                            }`}>
                              <StepIcon className={`w-3.5 h-3.5 ${
                                isCompleted
                                  ? isCurrent ? 'text-accent' : 'text-status-healthy'
                                  : 'text-gray-600'
                              }`} />
                            </div>
                            {i < workOrderTimeline.length - 1 && (
                              <div className={`w-0.5 h-8 ${
                                i < timelineIdx ? 'bg-status-healthy/40' : 'bg-navy-700'
                              }`} />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className={`text-sm font-medium ${
                              isCompleted ? 'text-white' : 'text-gray-600'
                            }`}>
                              {step.label}
                            </p>
                            {dateField && (
                              <p className="text-xs text-gray-500 mt-0.5">{dateField}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {nextWoStatus && (
                  <button
                    onClick={handleAdvanceStatus}
                    className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {nextWoStatusLabel[nextWoStatus] ?? '推进'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
