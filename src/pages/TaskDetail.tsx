import { useAppStore } from '@/store'
import { useParams, Link } from 'react-router-dom'
import { ClipboardList, User, Calendar, MapPin, Play, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const statusConfig: Record<string, { label: string; badge: string }> = {
  pending: { label: '待领取', badge: 'badge badge-info' },
  assigned: { label: '已分配', badge: 'badge badge-warning' },
  in_progress: { label: '执行中', badge: 'badge badge-healthy' },
  completed: { label: '已完成', badge: 'badge badge-healthy opacity-70' },
  overdue: { label: '已逾期', badge: 'badge badge-critical' },
}

const pointStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待执行', color: 'text-gray-500' },
  in_progress: { label: '执行中', color: 'text-status-healthy' },
  completed: { label: '已完成', color: 'text-status-healthy opacity-70' },
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const { getTaskById, getAreaById, getTemplateById, claimTask, startTask, completeTask } = useAppStore()

  const task = getTaskById(id || '')
  const area = task ? getAreaById(task.areaId) : undefined
  const template = task ? getTemplateById(task.templateId) : undefined

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle className="w-12 h-12 mb-3" />
        <p className="text-lg">任务不存在</p>
        <Link to="/tasks" className="btn-secondary mt-4 text-sm">返回任务列表</Link>
      </div>
    )
  }

  const status = statusConfig[task.status] || statusConfig.pending

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-5 h-5 text-accent" />
                <h1 className="text-lg font-bold text-white">{area?.name || '未知区域'}</h1>
                <span className={status.badge}>{status.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  模板: {template?.name || '未知模板'}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {task.pilotName || '未分配飞手'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  计划日期: {task.scheduledDate}
                </span>
                {task.completedDate && (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-healthy" />
                    完成日期: {task.completedDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {task.status === 'pending' && (
              <button onClick={() => claimTask(task.id, 'p2', '李明')} className="btn-primary text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                领取
              </button>
            )}
            {task.status === 'assigned' && (
              <button onClick={() => startTask(task.id)} className="btn-primary text-sm flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                开始执行
              </button>
            )}
            {task.status === 'in_progress' && (
              <button onClick={() => completeTask(task.id)} className="btn-primary text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                完成任务
              </button>
            )}
            {task.status === 'overdue' && (
              <button onClick={() => claimTask(task.id, 'p2', '李明')} className="btn-primary text-sm flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                领取并处理
              </button>
            )}
            <Link to="/tasks" className="btn-secondary text-sm">返回列表</Link>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            航线地图
          </h2>
          <div className="bg-navy-900 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
              {task.route.map((_, i) => {
                if (i >= task.route.length - 1) return null
                const x1 = (task.route[i][1] - 103) * 200 + 50
                const y1 = (task.route[i][0] - 23) * 200 + 30
                const x2 = (task.route[i + 1][1] - 103) * 200 + 50
                const y2 = (task.route[i + 1][0] - 23) * 200 + 30
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF6B35" strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />
                )
              })}
              {task.route.map((coord, i) => {
                const cx = (coord[1] - 103) * 200 + 50
                const cy = (coord[0] - 23) * 200 + 30
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="6" fill="#FF6B35" fillOpacity="0.2" stroke="#FF6B35" strokeWidth="1.5" />
                    <circle cx={cx} cy={cy} r="2.5" fill="#FF6B35" />
                  </g>
                )
              })}
            </svg>
            <div className="absolute bottom-2 right-3 text-[10px] text-gray-600">
              {task.route.length} 个航点 · {area?.name}
            </div>
            <div className="absolute top-2 left-3 text-[10px] text-gray-500 space-y-0.5">
              {task.route.map((coord, i) => (
                <div key={i}>航点{i + 1}: {coord[0].toFixed(4)}°N, {coord[1].toFixed(4)}°E</div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-accent" />
            巡检点位 ({task.points.length})
          </h2>
          <div className="space-y-2">
            {task.points.map((point, i) => {
              const ps = pointStatusConfig[point.status] || pointStatusConfig.pending
              return (
                <div key={point.pointId} className="flex items-center justify-between bg-navy-900/50 rounded-lg px-4 py-3 hover:bg-navy-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-navy-700 flex items-center justify-center text-xs text-gray-400 font-mono">
                      {i + 1}
                    </span>
                    <span className="text-sm text-white">{point.pointName}</span>
                    <span className={`text-xs ${ps.color}`}>{ps.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {point.captures.length > 0 && (
                      <span className="text-xs text-gray-500">{point.captures.length} 张拍摄</span>
                    )}
                    {(task.status === 'in_progress' || task.status === 'assigned') && (
                      <Link
                        to={`/inspection/${task.id}`}
                        className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
                      >
                        {point.status === 'pending' || point.status === 'in_progress' ? '执行' : '查看'}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
