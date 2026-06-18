import { useAppStore } from '@/store'
import { Link } from 'react-router-dom'
import { ClipboardList, User, Calendar, MapPin, ArrowRight, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: '待领取', badge: 'badge badge-info', dot: 'bg-status-info' },
  assigned: { label: '已分配', badge: 'badge badge-warning', dot: 'bg-status-warning' },
  in_progress: { label: '执行中', badge: 'badge badge-healthy', dot: 'bg-status-healthy' },
  completed: { label: '已完成', badge: 'badge badge-healthy opacity-70', dot: 'bg-status-healthy' },
  overdue: { label: '已逾期', badge: 'badge badge-critical', dot: 'bg-status-critical' },
}

const columnOrder: Array<keyof typeof statusConfig> = ['pending', 'assigned', 'in_progress', 'completed', 'overdue']

export default function Tasks() {
  const { tasks, areas, claimTask } = useAppStore()

  const columns = columnOrder.map(status => ({
    status,
    ...statusConfig[status],
    tasks: tasks.filter(t => t.status === status),
  }))

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            任务调度
          </h1>
          <p className="text-sm text-gray-500 mt-1">共 {tasks.length} 个巡检任务</p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.status} className="flex-shrink-0 w-[280px] flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-sm font-medium text-gray-300">{col.label}</span>
              <span className="text-xs text-gray-600 ml-auto">{col.tasks.length}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {col.tasks.length === 0 && (
                <div className="card rounded-lg p-4 text-center text-gray-600 text-sm">
                  暂无任务
                </div>
              )}
              {col.tasks.map((task, i) => {
                const area = areas.find(a => a.id === task.areaId)
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/tasks/${task.id}`} className="block">
                      <div className="card-hover rounded-lg p-3.5 cursor-pointer group">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-white group-hover:text-accent transition-colors leading-tight">
                            {area?.name || '未知区域'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-accent transition-colors flex-shrink-0 mt-0.5" />
                        </div>

                        <div className="space-y-1.5 mb-3">
                          {task.pilotName ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <User className="w-3 h-3" />
                              <span>{task.pilotName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <User className="w-3 h-3" />
                              <span>未分配</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{task.scheduledDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span>{task.points.length} 个点位</span>
                          </div>
                        </div>

                        {task.status === 'overdue' && (
                          <div className="flex items-center gap-1 text-xs text-status-critical mb-2">
                            <AlertCircle className="w-3 h-3" />
                            <span>已逾期，请尽快处理</span>
                          </div>
                        )}

                        {task.status === 'pending' && (
                          <button
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              claimTask(task.id, 'p2', '李明')
                            }}
                            className="btn-primary w-full text-xs py-1.5"
                          >
                            领取任务
                          </button>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
