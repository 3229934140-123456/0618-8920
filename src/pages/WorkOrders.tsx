import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { Link } from 'react-router-dom'
import {
  Wrench, Calendar, Filter, Search, ChevronLeft, ChevronRight,
  User, Clock, Check, AlertTriangle, X, UserCheck, Flag,
  ArrowRight, Eye, AlertCircle, CheckCircle2, History,
  FileText, Camera, MapPin
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus, Defect } from '@/types'

const priorityConfig: Record<WorkOrderPriority, { label: string; badge: string; glow?: string }> = {
  urgent: { label: '紧急', badge: 'badge badge-critical', glow: 'glow-critical' },
  high: { label: '高', badge: 'badge badge-warning', glow: 'glow-warning' },
  medium: { label: '中', badge: 'badge badge-info' },
  low: { label: '低', badge: 'badge bg-gray-500/15 text-gray-400 border border-gray-500/30' },
}

const statusConfig: Record<WorkOrderStatus, { label: string; badge: string }> = {
  pending: { label: '待处理', badge: 'badge badge-info' },
  in_progress: { label: '处理中', badge: 'badge badge-warning' },
  completed: { label: '已完成', badge: 'badge badge-healthy' },
  verified: { label: '已闭环', badge: 'badge badge-healthy opacity-70' },
}

const defectTypeLabels: Record<Defect['type'], string> = {
  crack: '裂纹',
  rust: '锈蚀',
  foreign_object: '异物',
  other: '其他',
}

const severityLabels: Record<Defect['severity'], string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
}

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function getWeekDates(baseDate: Date): Date[] {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const nd = new Date(monday)
    nd.setDate(monday.getDate() + i)
    dates.push(nd)
  }
  return dates
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.ceil((db - da) / 86400000)
}

const statusNextAction: Record<WorkOrderStatus, { label: string; next: WorkOrderStatus } | null> = {
  pending: { label: '开始处理', next: 'in_progress' },
  in_progress: { label: '完成维修', next: 'completed' },
  completed: { label: '通过验收', next: 'verified' },
  verified: null,
}

export default function WorkOrders() {
  const {
    workOrders, areas, defects, points, updateWorkOrderStatus,
  } = useAppStore(state => ({
    workOrders: state.workOrders,
    areas: state.areas,
    defects: state.defects,
    points: state.points,
    updateWorkOrderStatus: state.updateWorkOrderStatus,
  }))

  const todayStr = formatDate(new Date())

  const [statusFilter, setStatusFilter] = useState<'all' | WorkOrderStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | WorkOrderPriority>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const weekDates = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    return getWeekDates(base)
  }, [weekOffset])

  const weekStartStr = formatDate(weekDates[0])
  const weekEndStr = formatDate(weekDates[6])

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false
      if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false
      if (areaFilter !== 'all') {
        const defect = defects.find(d => d.id === wo.defectId)
        if (!defect || defect.areaId !== areaFilter) return false
      }
      if (assigneeSearch && !wo.assignee.toLowerCase().includes(assigneeSearch.toLowerCase())) return false
      return true
    })
  }, [workOrders, statusFilter, priorityFilter, areaFilter, assigneeSearch, defects])

  const workOrdersByDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {}
    weekDates.forEach(d => { map[formatDate(d)] = [] })
    filteredWorkOrders.forEach(wo => {
      if (map[wo.dueDate]) {
        map[wo.dueDate].push(wo)
      }
    })
    return map
  }, [filteredWorkOrders, weekDates])

  const stats = useMemo(() => {
    const total = workOrders.length
    const pending = workOrders.filter(w => w.status === 'pending').length
    const inProgress = workOrders.filter(w => w.status === 'in_progress').length
    const completed = workOrders.filter(w => w.status === 'completed').length
    const verified = workOrders.filter(w => w.status === 'verified').length
    const soonOverdue = workOrders.filter(w => {
      if (w.status === 'verified') return false
      const diff = daysBetween(todayStr, w.dueDate)
      return diff >= 0 && diff <= 3
    }).length
    return { total, pending, inProgress, completed, verified, soonOverdue }
  }, [workOrders, todayStr])

  const assigneeStats = useMemo(() => {
    const map: Record<string, { total: number; done: number; urgent: number }> = {}
    workOrders.forEach(wo => {
      if (!map[wo.assignee]) map[wo.assignee] = { total: 0, done: 0, urgent: 0 }
      map[wo.assignee].total++
      if (wo.status === 'verified') map[wo.assignee].done++
      if (wo.priority === 'urgent' || wo.priority === 'high') map[wo.assignee].urgent++
    })
    return Object.entries(map)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.total - a.total)
  }, [workOrders])

  const maxAssigneeTotal = Math.max(1, ...assigneeStats.map(s => s.total))

  const openDrawer = (wo: WorkOrder) => {
    setSelectedWO(wo)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedWO(null), 300)
  }

  const selectedDefect = selectedWO ? defects.find(d => d.id === selectedWO.defectId) : null
  const selectedArea = selectedDefect ? areas.find(a => a.id === selectedDefect.areaId) : null
  const selectedPoint = selectedDefect ? points.find(p => p.id === selectedDefect.pointId) : null

  const isOverdue = (wo: WorkOrder) =>
    wo.status !== 'verified' && wo.dueDate < todayStr

  const handleStatusAdvance = () => {
    if (!selectedWO) return
    const action = statusNextAction[selectedWO.status]
    if (!action) return
    updateWorkOrderStatus(selectedWO.id, action.next)
  }

  const currentWeekLabel = `${weekDates[0].getMonth() + 1}月${weekDates[0].getDate()}日 - ${weekDates[6].getMonth() + 1}月${weekDates[6].getDate()}日`

  return (
    <div className="h-full flex flex-col">
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white">维修计划</h1>
            <p className="text-sm text-gray-500">按周排期视图管理维修工单</p>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-400">筛选：</span>
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="input-field text-sm py-1.5 px-3 w-auto"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="in_progress">处理中</option>
              <option value="completed">已完成</option>
              <option value="verified">已闭环</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="input-field text-sm py-1.5 px-3 w-auto"
            >
              <option value="all">全部优先级</option>
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>

            <select
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              className="input-field text-sm py-1.5 px-3 w-auto"
            >
              <option value="all">全部区域</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={assigneeSearch}
                onChange={e => setAssigneeSearch(e.target.value)}
                placeholder="搜索负责人..."
                className="input-field w-full pl-9 pr-3 text-sm py-1.5"
              />
            </div>

            <div className="ml-auto text-xs text-gray-500">
              共 <span className="stat-number text-accent">{filteredWorkOrders.length}</span> 个工单
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-5 min-h-0">
        <div className="w-[70%] flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="w-8 h-8 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-600/30 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-600/30">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-white">{currentWeekLabel}</span>
              </div>
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="w-8 h-8 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-600/30 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                本周
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-7 gap-2.5 min-h-0 overflow-hidden">
            {weekDates.map((date, idx) => {
              const dateStr = formatDate(date)
              const isToday = dateStr === todayStr
              const isWeekend = idx >= 5
              const dayWOs = workOrdersByDate[dateStr] || []
              return (
                <div
                  key={dateStr}
                  className={`flex flex-col rounded-xl border overflow-hidden ${
                    isToday
                      ? 'bg-accent/5 border-accent/30'
                      : isWeekend
                        ? 'bg-navy-900/40 border-navy-700/20'
                        : 'bg-navy-800/60 border-navy-700/30'
                  }`}
                >
                  <div className={`px-2 py-2.5 border-b ${
                    isToday
                      ? 'bg-accent/10 border-accent/20'
                      : 'border-navy-700/30'
                  }`}>
                    <div className={`text-[11px] mb-0.5 ${
                      isToday ? 'text-accent font-medium' : 'text-gray-500'
                    }`}>
                      {weekDays[idx]}
                    </div>
                    <div className={`text-lg font-display font-bold ${
                      isToday ? 'text-accent' : isWeekend ? 'text-gray-400' : 'text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {dayWOs.length === 0 && (
                      <div className="text-center py-6 text-[11px] text-gray-600">
                        无工单
                      </div>
                    )}
                    {dayWOs.map(wo => {
                      const defect = defects.find(d => d.id === wo.defectId)
                      const area = defect ? areas.find(a => a.id === defect.areaId) : null
                      const pc = priorityConfig[wo.priority]
                      const overdue = isOverdue(wo)
                      return (
                        <motion.div
                          key={wo.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => openDrawer(wo)}
                          className={`rounded-lg p-2.5 cursor-pointer transition-all group ${
                            overdue
                              ? 'bg-status-critical/10 border border-status-critical/40 hover:border-status-critical/60'
                              : pc.glow
                                ? `bg-navy-900/70 border border-navy-600/40 hover:border-navy-500 ${pc.glow}`
                                : 'bg-navy-900/70 border border-navy-600/40 hover:border-navy-500'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="text-[11px] text-gray-400 truncate flex-1" title={area?.name}>
                              <MapPin className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                              {area?.name?.slice(0, 8) || '-'}
                            </span>
                            <span className={`${pc.badge} !text-[10px] !py-0 !px-1.5 flex-shrink-0`}>
                              <Flag className="w-2.5 h-2.5 mr-0.5" />
                              {pc.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-300 mb-1.5 line-clamp-2 leading-snug">
                            {wo.description.slice(0, 24)}{wo.description.length > 24 ? '…' : ''}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <User className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[50px]">{wo.assignee}</span>
                            </div>
                            {overdue && (
                              <AlertCircle className="w-3 h-3 text-status-critical" />
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-[30%] flex flex-col gap-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 gap-2.5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-3.5"
            >
              <div className="text-[11px] text-gray-500 mb-1">工单总数</div>
              <div className="stat-number text-2xl text-white">{stats.total}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card p-3.5 border-status-info/20"
            >
              <div className="text-[11px] text-gray-500 mb-1">待处理</div>
              <div className="stat-number text-2xl text-status-info">{stats.pending}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-3.5 border-status-warning/20"
            >
              <div className="text-[11px] text-gray-500 mb-1">处理中</div>
              <div className="stat-number text-2xl text-status-warning">{stats.inProgress}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card p-3.5 border-status-healthy/20"
            >
              <div className="text-[11px] text-gray-500 mb-1">已完成</div>
              <div className="stat-number text-2xl text-status-healthy">{stats.completed}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-3.5 border-emerald-500/10"
            >
              <div className="text-[11px] text-gray-500 mb-1">已闭环</div>
              <div className="stat-number text-2xl text-emerald-400">{stats.verified}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`card p-3.5 ${stats.soonOverdue > 0 ? 'border-status-critical/30 glow-critical' : ''}`}
            >
              <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-status-warning" />
                3天内到期
              </div>
              <div className={`stat-number text-2xl ${stats.soonOverdue > 0 ? 'text-status-critical' : 'text-gray-400'}`}>
                {stats.soonOverdue}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4 flex-1 min-h-0"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-white">按负责人统计</h3>
            </div>
            <div className="space-y-3">
              {assigneeStats.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-600">暂无数据</div>
              )}
              {assigneeStats.map((s, i) => {
                const pct = Math.round((s.total / maxAssigneeTotal) * 100)
                const donePct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-navy-700 flex items-center justify-center text-[10px] font-medium text-gray-400">
                          {s.name.slice(0, 1)}
                        </div>
                        <span className="text-xs text-gray-300">{s.name}</span>
                        {s.urgent > 0 && (
                          <span className="badge badge-critical !text-[10px] !py-0 !px-1.5">
                            紧急{s.urgent}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-gray-500">完成率</span>
                        <span className="stat-number text-status-healthy">{donePct}%</span>
                        <span className="stat-number text-gray-400">({s.done}/{s.total})</span>
                      </div>
                    </div>
                    <div className="relative h-5 bg-navy-900/70 rounded-md overflow-hidden border border-navy-700/30">
                      <div
                        className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-md transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <div
                        className="absolute left-0 top-0 h-full bg-status-healthy/60 rounded-md transition-all"
                        style={{ width: `${(s.done / maxAssigneeTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && selectedWO && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[480px] max-w-[92vw] bg-navy-800 border-l border-navy-600/50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">工单详情</h2>
                    <p className="text-[11px] text-gray-500 font-mono">{selectedWO.id}</p>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-5">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`${priorityConfig[selectedWO.priority].badge} ${priorityConfig[selectedWO.priority].glow || ''}`}>
                        <Flag className="w-3 h-3" />
                        {priorityConfig[selectedWO.priority].label}
                      </span>
                      <span className={statusConfig[selectedWO.status].badge}>
                        {statusConfig[selectedWO.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 font-medium mb-4 leading-relaxed">
                      {selectedWO.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-navy-900/50 rounded-lg p-2.5 border border-navy-700/30">
                        <div className="text-gray-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          截止日期
                        </div>
                        <div className={`stat-number text-sm ${
                          isOverdue(selectedWO) ? 'text-status-critical' : 'text-gray-200'
                        }`}>
                          {selectedWO.dueDate}
                          {isOverdue(selectedWO) && (
                            <span className="ml-1 text-[10px]">(已逾期)</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-navy-900/50 rounded-lg p-2.5 border border-navy-700/30">
                        <div className="text-gray-500 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          负责人
                        </div>
                        <div className="stat-number text-sm text-gray-200">{selectedWO.assignee}</div>
                      </div>
                    </div>
                  </div>

                  {selectedDefect && (
                    <div className="card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Eye className="w-4 h-4 text-status-info" />
                          关联缺陷
                        </h3>
                        <Link
                          to={`/defects/${selectedDefect.id}`}
                          className="btn-ghost !py-1 !px-2.5 text-xs flex items-center gap-1"
                        >
                          查看详情
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="bg-navy-900/50 rounded-lg p-3 border border-navy-700/30 space-y-2.5 text-xs">
                        <div>
                          <span className="text-gray-500">AI分析：</span>
                          <span className="text-gray-300 ml-1">{selectedDefect.aiDescription}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <div>
                            <span className="text-gray-500">等级：</span>
                            <span className={`badge ${
                              selectedDefect.severity === 'critical' ? 'badge-critical' :
                              selectedDefect.severity === 'high' ? 'badge-warning' :
                              selectedDefect.severity === 'medium' ? 'badge-info' : 'badge-healthy'
                            } !text-[10px] !py-0 !px-1.5 ml-1`}>
                              {severityLabels[selectedDefect.severity]}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">类型：</span>
                            <span className="text-gray-300 ml-1">{defectTypeLabels[selectedDefect.type]}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">置信度：</span>
                            <span className="stat-number text-accent ml-1">
                              {Math.round(selectedDefect.aiConfidence * 100)}%
                            </span>
                          </div>
                        </div>
                        {selectedDefect.pilotNote && (
                          <div className="pt-2 border-t border-navy-700/30">
                            <span className="text-gray-500">飞手备注：</span>
                            <span className="text-gray-300 ml-1">{selectedDefect.pilotNote}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t border-navy-700/30 text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{selectedArea?.name || '-'}</span>
                          <span className="text-gray-600">·</span>
                          <span>{selectedPoint?.name || '-'}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-[11px] text-gray-500 mb-2 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          缺陷影像
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-navy-900/70 border border-navy-700/30">
                          <img
                            src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20inspection%20${selectedDefect.type}%20defect%20aerial%20view&image_size=landscape_16_9`}
                            alt="缺陷影像"
                            className="w-full h-full object-cover"
                          />
                          <div
                            className="absolute border-2 border-status-critical rounded-sm"
                            style={{
                              left: `${selectedDefect.location.x}%`,
                              top: `${selectedDefect.location.y}%`,
                              width: `${selectedDefect.location.width}%`,
                              height: `${selectedDefect.location.height}%`,
                              boxShadow: '0 0 12px rgba(255, 61, 113, 0.5)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                      <History className="w-4 h-4 text-accent" />
                      处理记录
                    </h3>
                    <div className="relative">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-navy-700/50" />
                      <div className="space-y-4">
                        {selectedWO.processingRecords.map((r, i) => (
                          <div key={i} className="relative pl-7">
                            <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-navy-600 bg-navy-800 flex items-center justify-center">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                i === selectedWO.processingRecords.length - 1
                                  ? 'bg-accent'
                                  : 'bg-navy-500'
                              }`} />
                            </div>
                            <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-2">
                              <span>{r.time}</span>
                              <span className="text-gray-600">·</span>
                              <span className="text-gray-400">{r.operator}</span>
                            </div>
                            <div className="text-xs text-gray-300 leading-relaxed">{r.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-navy-700/50 bg-navy-900/40">
                {statusNextAction[selectedWO.status] ? (
                  <button
                    onClick={handleStatusAdvance}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {selectedWO.status === 'pending' && <Wrench className="w-4 h-4" />}
                    {selectedWO.status === 'in_progress' && <CheckCircle2 className="w-4 h-4" />}
                    {selectedWO.status === 'completed' && <UserCheck className="w-4 h-4" />}
                    {statusNextAction[selectedWO.status]!.label}
                  </button>
                ) : (
                  <div className="text-center py-2 flex items-center justify-center gap-2 text-status-healthy">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="badge badge-healthy !text-xs">已归档</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
