import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, ArrowLeft, FileText, Camera, AlertTriangle, Wrench, Activity,
  ChevronRight, Calendar, User, CheckCircle2, ExternalLink, Box, Factory,
  Cpu, Clock, Navigation, Check, X, Plus, List, Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DefectSeverity, DefectStatus, DefectType, TaskStatus, WorkOrderStatus, WorkOrderPriority } from '@/types'

const statusLabels: Record<string, string> = {
  normal: '正常',
  attention: '关注',
  abnormal: '异常',
}

const statusBadgeClass: Record<string, string> = {
  normal: 'badge-healthy',
  attention: 'badge-warning',
  abnormal: 'badge-critical',
}

const statusGlowClass: Record<string, string> = {
  normal: 'glow-healthy',
  attention: 'glow-warning',
  abnormal: 'glow-critical',
}

const statusColor: Record<string, string> = {
  normal: '#00D68F',
  attention: '#FFB800',
  abnormal: '#FF3D71',
}

const healthScoreMap: Record<string, number> = {
  normal: 100,
  attention: 65,
  abnormal: 30,
}

const defectTypeLabels: Record<DefectType, string> = {
  crack: '裂缝',
  rust: '锈蚀',
  foreign_object: '异物',
  other: '其他',
}

const defectStatusLabels: Record<DefectStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  work_order_created: '已建工单',
  repairing: '维修中',
  closed: '已闭环',
}

const defectStatusBadgeClass: Record<DefectStatus, string> = {
  pending: 'badge-info',
  confirmed: 'badge-warning',
  work_order_created: 'badge-healthy',
  repairing: 'badge-warning',
  closed: 'badge-healthy',
}

const taskStatusLabels: Record<TaskStatus, string> = {
  pending: '待领取',
  assigned: '已指派',
  in_progress: '巡检中',
  completed: '已完成',
  overdue: '已超时',
}

const taskStatusBadgeClass: Record<TaskStatus, string> = {
  pending: 'badge-info',
  assigned: 'badge-info',
  in_progress: 'badge-warning',
  completed: 'badge-healthy',
  overdue: 'badge-critical',
}

const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  completed: '待验收',
  verified: '已完成',
}

const workOrderStatusBadgeClass: Record<WorkOrderStatus, string> = {
  pending: 'badge-info',
  in_progress: 'badge-warning',
  completed: 'badge-warning',
  verified: 'badge-healthy',
}

const workOrderPriorityLabels: Record<WorkOrderPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const workOrderPriorityBadgeClass: Record<WorkOrderPriority, string> = {
  low: 'badge-info',
  medium: 'badge-warning',
  high: 'badge-critical',
  urgent: 'badge-critical',
}

function SeverityBadge({ severity }: { severity: DefectSeverity }) {
  const config: Record<DefectSeverity, { cls: string; label: string }> = {
    critical: { cls: 'badge-critical glow-critical', label: '严重' },
    high: { cls: 'badge-critical', label: '高' },
    medium: { cls: 'badge-warning', label: '中' },
    low: { cls: 'badge-info', label: '低' },
  }
  return <span className={`badge ${config[severity].cls}`}>{config[severity].label}</span>
}

type TabKey = 'captures' | 'defects' | 'trend' | 'workorders'

export default function PointProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pointId = id || ''

  const point = useAppStore(s => s.points.find(p => p.id === pointId))
  const area = useAppStore(s => s.getAreaById(point?.areaId || ''))
  const defects = useAppStore(s => s.defects.filter(d => d.pointId === pointId))
  const allTasks = useAppStore(s => s.tasks)
  const templates = useAppStore(s => s.templates)
  const getCapturesByPoint = useAppStore(s => s.getCapturesByPoint)
  const getWorkOrderByDefectId = useAppStore(s => s.getWorkOrderByDefectId)

  const tasks = useMemo(
    () => allTasks.filter(t => t.points.some(p => p.pointId === pointId)),
    [allTasks, pointId]
  )

  const template = useMemo(
    () => templates.find(t => t.id === point?.templateId),
    [templates, point?.templateId]
  )

  const workOrders = useMemo(() => {
    const woMap = new Map<string, ReturnType<typeof getWorkOrderByDefectId>>()
    defects.forEach(d => {
      const wo = getWorkOrderByDefectId(d.id)
      if (wo) woMap.set(wo.id, wo)
    })
    return Array.from(woMap.values()).filter(Boolean) as ReturnType<typeof getWorkOrderByDefectId>[]
  }, [defects, getWorkOrderByDefectId])

  const [activeTab, setActiveTab] = useState<TabKey>('captures')
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null)

  if (!point) {
    return (
      <div className="text-center py-20">
        <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">未找到该巡检点位信息</p>
        <Link to="/areas" className="text-accent hover:underline mt-2 inline-block">返回区域列表</Link>
      </div>
    )
  }

  const defectStats = {
    critical: defects.filter(d => d.severity === 'critical').length,
    high: defects.filter(d => d.severity === 'high').length,
    medium: defects.filter(d => d.severity === 'medium').length,
    low: defects.filter(d => d.severity === 'low').length,
    pending: defects.filter(d => d.status === 'pending').length,
    confirmed: defects.filter(d => d.status === 'confirmed').length,
    repairing: defects.filter(d => d.status === 'repairing').length,
    closed: defects.filter(d => d.status === 'closed').length,
  }

  const healthTimeline = useMemo(() => {
    const completed = tasks
      .filter(t => t.status === 'completed' && t.completedDate)
      .sort((a, b) => (a.completedDate || '').localeCompare(b.completedDate || ''))

    return completed.map(task => {
      const taskPoint = task.points.find(p => p.pointId === pointId)
      const taskDefects = defects.filter(d => d.taskId === task.id)
      const hasCriticalHigh = taskDefects.some(d => d.severity === 'critical' || d.severity === 'high')
      const hasMedLow = taskDefects.some(d => d.severity === 'medium' || d.severity === 'low')
      let pointStatus: 'normal' | 'attention' | 'abnormal' = 'normal'
      if (hasCriticalHigh) pointStatus = 'abnormal'
      else if (hasMedLow) pointStatus = 'attention'

      return {
        taskId: task.id,
        date: task.completedDate || task.scheduledDate,
        pilotName: task.pilotName || '未指派',
        status: pointStatus,
        defectCount: taskDefects.length,
        maxSeverity: taskDefects.length > 0
          ? taskDefects.reduce((max, d) => {
              const order = { critical: 4, high: 3, medium: 2, low: 1 }
              return order[d.severity] > (order[max as keyof typeof order] || 0) ? d.severity : max
            }, 'low' as DefectSeverity)
          : null,
      }
    })
  }, [tasks, defects, pointId])

  const firstInspectionDate = healthTimeline[0]?.date || null
  const lastInspectionDate = healthTimeline[healthTimeline.length - 1]?.date || point.lastInspectionDate
  const totalInspections = healthTimeline.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/areas" className="text-gray-400 hover:text-accent transition-colors">区域管理</Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <Link to={`/areas/${point.areaId}`} className="text-gray-400 hover:text-accent transition-colors">
            {area?.name || '未知区域'}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <span className="text-white font-medium">{point.name}</span>
        </nav>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`card p-6 ${statusGlowClass[point.status]}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{point.name}</h1>
              <span className={`badge ${statusBadgeClass[point.status]}`}>
                {statusLabels[point.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-700/30">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                  <Cpu className="w-3.5 h-3.5" />
                  设备类型
                </div>
                <p className="text-white font-medium">
                  {point.deviceType || <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-700/30">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                  <Box className="w-3.5 h-3.5" />
                  型号
                </div>
                <p className="text-white font-medium">
                  {point.model || <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-700/30">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  容量
                </div>
                <p className="text-white font-medium">
                  {point.capacity || <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-700/30">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                  <Factory className="w-3.5 h-3.5" />
                  制造商
                </div>
                <p className="text-white font-medium">
                  {point.manufacturer || <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  安装日期
                </div>
                <p className="text-gray-300">
                  {point.installDate || <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  关联模板
                </div>
                <p className="text-gray-300">
                  {template
                    ? <Link to={`/templates/${template.id}`} className="text-accent hover:underline">{template.name}</Link>
                    : <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  最近巡检
                </div>
                <p className="text-gray-300">
                  {point.lastInspectionDate || <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  坐标
                </div>
                <p className="text-gray-300 font-mono text-xs">
                  {point.coordinates
                    ? `${point.coordinates[0].toFixed(4)}, ${point.coordinates[1].toFixed(4)}`
                    : <span className="text-gray-600">暂无数据</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-navy-700/30">
          {[
            { key: 'captures' as TabKey, label: '历次巡检影像', icon: Camera },
            { key: 'defects' as TabKey, label: '缺陷历史', icon: AlertTriangle },
            { key: 'trend' as TabKey, label: '健康变化趋势', icon: Activity },
            { key: 'workorders' as TabKey, label: '关联工单', icon: Wrench },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative ${
                activeTab === tab.key
                  ? 'text-white bg-navy-700/30'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'defects' && defects.length > 0 && (
                <span className="ml-1 text-xs bg-status-critical/20 text-status-critical px-1.5 py-0.5 rounded-full">
                  {defects.length}
                </span>
              )}
              {tab.key === 'workorders' && workOrders.length > 0 && (
                <span className="ml-1 text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                  {workOrders.length}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'captures' && (
              <motion.div
                key="captures"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {tasks.length === 0 ? (
                  <EmptyState icon={Camera} text="该点位暂无巡检任务记录" />
                ) : (
                  tasks.map((task, idx) => {
                    const captures = getCapturesByPoint(task.id, pointId)
                    const taskPoint = task.points.find(p => p.pointId === pointId)
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="card p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{task.scheduledDate}</span>
                              {task.completedDate && task.completedDate !== task.scheduledDate && (
                                <span className="text-gray-500 text-xs">
                                  (完成: {task.completedDate})
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs text-gray-500 bg-navy-900/50 px-2 py-1 rounded">
                              {task.id}
                            </span>
                            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                              <User className="w-3.5 h-3.5" />
                              {task.pilotName || '未指派'}
                            </div>
                          </div>
                          <span className={`badge ${taskStatusBadgeClass[task.status]}`}>
                            {taskStatusLabels[task.status]}
                          </span>
                        </div>

                        {captures.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            本次巡检暂无影像资料
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {captures.map(cap => (
                              <div
                                key={cap.id}
                                onClick={() => setPreviewMedia({ url: cap.url, type: cap.type })}
                                className="relative aspect-square rounded-lg overflow-hidden border border-navy-700/40 cursor-pointer group hover:border-accent/50 transition-all"
                              >
                                {cap.type === 'photo' ? (
                                  <img
                                    src={cap.thumbnailUrl || cap.url}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <video
                                    src={cap.url}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    muted
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                                <span className={`absolute top-2 left-2 badge ${cap.type === 'photo' ? 'badge-info' : 'badge-warning'}`}>
                                  {cap.type === 'photo' ? '照片' : '视频'}
                                </span>
                                {cap.type === 'video' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-navy-950/70 flex items-center justify-center">
                                      <Plus className="w-5 h-5 text-white rotate-45" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                )}
              </motion.div>
            )}

            {activeTab === 'defects' && (
              <motion.div
                key="defects"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  <StatMini label="严重" value={defectStats.critical} color="text-status-critical" bg="bg-status-critical/10" />
                  <StatMini label="高" value={defectStats.high} color="text-status-critical" bg="bg-status-critical/10" />
                  <StatMini label="中" value={defectStats.medium} color="text-status-warning" bg="bg-status-warning/10" />
                  <StatMini label="低" value={defectStats.low} color="text-status-info" bg="bg-status-info/10" />
                  <div className="col-span-1" />
                  <StatMini label="待确认" value={defectStats.pending} color="text-status-info" bg="bg-status-info/10" />
                  <StatMini label="维修中" value={defectStats.repairing} color="text-status-warning" bg="bg-status-warning/10" />
                  <StatMini label="已闭环" value={defectStats.closed} color="text-status-healthy" bg="bg-status-healthy/10" />
                </div>

                {defects.length === 0 ? (
                  <EmptyState icon={CheckCircle2} text="该点位暂无缺陷记录" hint="保持良好状态，继续定期巡检" />
                ) : (
                  <div className="card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left px-4 py-3">ID</th>
                          <th className="text-left px-4 py-3">创建时间</th>
                          <th className="text-left px-4 py-3">类型</th>
                          <th className="text-left px-4 py-3">等级</th>
                          <th className="text-left px-4 py-3">状态</th>
                          <th className="text-left px-4 py-3">AI 描述</th>
                          <th className="text-left px-4 py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defects.map((d, i) => (
                          <motion.tr
                            key={d.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="table-row cursor-pointer"
                            onClick={() => navigate(`/defects/${d.id}`)}
                          >
                            <td className="px-4 py-3 text-sm font-mono text-gray-400">{d.id}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{d.createdAt}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{defectTypeLabels[d.type]}</td>
                            <td className="px-4 py-3"><SeverityBadge severity={d.severity} /></td>
                            <td className="px-4 py-3">
                              <span className={`badge ${defectStatusBadgeClass[d.status]}`}>
                                {defectStatusLabels[d.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{d.aiDescription}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/defects/${d.id}`) }}
                                className="inline-flex items-center gap-1 text-accent hover:text-accent-light text-sm transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                查看
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'trend' && (
              <motion.div
                key="trend"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      首次巡检日期
                    </div>
                    <p className="text-white text-lg font-medium">
                      {firstInspectionDate || <span className="text-gray-600">暂无数据</span>}
                    </p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      最近巡检日期
                    </div>
                    <p className="text-white text-lg font-medium">
                      {lastInspectionDate || <span className="text-gray-600">暂无数据</span>}
                    </p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <Activity className="w-3.5 h-3.5" />
                      累计巡检次数
                    </div>
                    <p className="text-accent text-2xl font-semibold stat-number">{totalInspections}</p>
                  </div>
                </div>

                {healthTimeline.length > 0 && (
                  <HealthTrendChart data={healthTimeline} />
                )}

                {healthTimeline.length === 0 ? (
                  <EmptyState icon={Activity} text="暂无健康趋势数据" hint="完成首次巡检后将生成趋势分析" />
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <List className="w-4 h-4 text-gray-400" />
                      巡检时间线
                    </h3>
                    <div className="relative">
                      <div className="absolute left-4 top-2 bottom-2 w-px bg-navy-600/50" />
                      <div className="space-y-4">
                        {[...healthTimeline].reverse().map((item, i) => (
                          <motion.div
                            key={item.taskId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative pl-10"
                          >
                            <div
                              className="absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 border-navy-800 z-10"
                              style={{
                                backgroundColor: statusColor[item.status],
                                boxShadow: `0 0 10px ${statusColor[item.status]}80`,
                              }}
                            />
                            <div className="card p-4">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-white font-medium">{item.date}</span>
                                  <span className="font-mono text-xs text-gray-500">{item.taskId}</span>
                                </div>
                                <span className={`badge ${statusBadgeClass[item.status]}`}>
                                  {statusLabels[item.status]}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                <User className="w-3.5 h-3.5" />
                                飞手：{item.pilotName}
                              </div>
                              <p className="text-sm text-gray-300">
                                {item.defectCount === 0 ? (
                                  <span className="text-status-healthy flex items-center gap-1.5">
                                    <Check className="w-4 h-4" /> 巡检结果正常，未发现缺陷
                                  </span>
                                ) : (
                                  <span>
                                    发现 <span className="text-status-critical font-medium">{item.defectCount}</span> 处缺陷
                                    {item.maxSeverity && (
                                      <>
                                        ，最高等级
                                        <span className="ml-1">
                                          <SeverityBadge severity={item.maxSeverity} />
                                        </span>
                                      </>
                                    )}
                                  </span>
                                )}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'workorders' && (
              <motion.div
                key="workorders"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {workOrders.length === 0 ? (
                  <EmptyState icon={Wrench} text="该点位暂无关联工单" hint="创建缺陷后可派发维修工单" />
                ) : (
                  <div className="card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left px-4 py-3">工单ID</th>
                          <th className="text-left px-4 py-3">优先级</th>
                          <th className="text-left px-4 py-3">负责人</th>
                          <th className="text-left px-4 py-3">状态</th>
                          <th className="text-left px-4 py-3">截止日期</th>
                          <th className="text-left px-4 py-3">描述</th>
                          <th className="text-left px-4 py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workOrders.map((wo, i) => (
                          <motion.tr
                            key={wo!.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="table-row"
                          >
                            <td className="px-4 py-3 text-sm font-mono text-gray-400">{wo!.id}</td>
                            <td className="px-4 py-3">
                              <span className={`badge ${workOrderPriorityBadgeClass[wo!.priority]}`}>
                                {workOrderPriorityLabels[wo!.priority]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{wo!.assignee}</td>
                            <td className="px-4 py-3">
                              <span className={`badge ${workOrderStatusBadgeClass[wo!.status]}`}>
                                {workOrderStatusLabels[wo!.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{wo!.dueDate}</td>
                            <td className="px-4 py-3 text-sm text-gray-300 max-w-md truncate">{wo!.description}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => navigate('/workorders')}
                                className="inline-flex items-center gap-1 text-accent hover:text-accent-light text-sm transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                查看
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {previewMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 backdrop-blur-sm p-4"
            onClick={() => setPreviewMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-6xl max-h-[90vh] w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute -top-12 right-0 p-2 rounded-lg bg-navy-800 text-gray-300 hover:text-white hover:bg-navy-700 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="card overflow-hidden">
                {previewMedia.type === 'photo' ? (
                  <img src={previewMedia.url} alt="" className="w-full max-h-[85vh] object-contain" />
                ) : (
                  <video src={previewMedia.url} controls autoPlay className="w-full max-h-[85vh]" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatMini({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="p-3 rounded-lg bg-navy-900/50 border border-navy-700/30">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`stat-number text-xl ${color}`}>{value}</span>
        {value > 0 && <span className={`text-xs px-1.5 py-0.5 rounded ${bg} ${color}`}>{value}</span>}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text, hint }: { icon: any; text: string; hint?: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-navy-700/30 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-gray-600" />
      </div>
      <p className="text-gray-400 mb-1">{text}</p>
      {hint && <p className="text-gray-600 text-sm">{hint}</p>}
    </div>
  )
}

function HealthTrendChart({ data }: { data: { date: string; status: 'normal' | 'attention' | 'abnormal' }[] }) {
  const points = data.map((d, i) => ({
    x: i,
    y: healthScoreMap[d.status],
    date: d.date,
    status: d.status,
  }))

  const width = 100
  const height = 100
  const padding = { left: 8, right: 8, top: 12, bottom: 20 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const xScale = (i: number) =>
    points.length <= 1 ? 50 : padding.left + (i / (points.length - 1)) * chartW
  const yScale = (v: number) =>
    padding.top + chartH - ((v - 0) / 100) * chartH

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
    .join(' ')

  const areaD = pathD +
    ` L ${xScale(points[points.length - 1].x)} ${padding.top + chartH}` +
    ` L ${xScale(points[0].x)} ${padding.top + chartH} Z`

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          健康评分趋势
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor.normal }} />
            <span className="text-gray-400">正常 (100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor.attention }} />
            <span className="text-gray-400">关注 (65)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor.abnormal }} />
            <span className="text-gray-400">异常 (30)</span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height: 220 }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map(v => (
            <line
              key={v}
              x1={padding.left}
              x2={width - padding.right}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="#243552"
              strokeWidth="0.2"
              strokeDasharray="1 1"
            />
          ))}

          <path d={areaD} fill="url(#healthGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="#FF6B35"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map(p => (
            <g key={`${p.date}-${p.x}`}>
              <circle
                cx={xScale(p.x)}
                cy={yScale(p.y)}
                r="1.8"
                fill={statusColor[p.status]}
                stroke="#162033"
                strokeWidth="0.6"
              />
              <circle
                cx={xScale(p.x)}
                cy={yScale(p.y)}
                r="0.8"
                fill={statusColor[p.status]}
              />
            </g>
          ))}
        </svg>

        <div className="absolute left-0 right-0 flex justify-between px-2 mt-1">
          {points.filter((_, i, arr) =>
            arr.length <= 6 || i === 0 || i === arr.length - 1 || i % Math.ceil(arr.length / 5) === 0
          ).map(p => (
            <div
              key={`label-${p.date}-${p.x}`}
              className="text-[10px] text-gray-500 font-mono whitespace-nowrap"
              style={{ position: 'absolute', left: `${xScale(p.x)}%`, transform: 'translateX(-50%)' }}
            >
              {p.date.slice(5)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
