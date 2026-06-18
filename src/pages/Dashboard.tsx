import { useAppStore } from '@/store'
import { defectTrendData } from '@/data/mockData'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts'
import { Shield, AlertTriangle, ClipboardCheck, MapPin, ArrowRight, Clock, CheckCircle2, XCircle, Zap, UserPlus, Play, FileCheck, Wrench, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const stagger = { animate: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const statusColor: Record<string, string> = { healthy: '#00D68F', warning: '#FFB800', critical: '#FF3D71' }
const statusLabel: Record<string, string> = { healthy: '健康', warning: '警告', critical: '严重' }
const taskIcon: Record<string, any> = { completed: CheckCircle2, in_progress: Clock, assigned: Zap, pending: Clock, overdue: XCircle }
const taskLabel: Record<string, string> = { completed: '已完成', in_progress: '执行中', assigned: '已指派', pending: '待分配', overdue: '已逾期' }
const taskColor: Record<string, string> = { completed: 'text-status-healthy', in_progress: 'text-status-info', assigned: 'text-accent', pending: 'text-gray-400', overdue: 'text-status-critical' }
const sevColor: Record<string, string> = { low: 'text-status-healthy', medium: 'text-status-warning', high: 'text-accent', critical: 'text-status-critical' }

function StatCard({ icon: Icon, label, value, unit, color, children }: any) {
  return (
    <motion.div {...fadeUp} className="card-hover p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="stat-number text-2xl text-white">{value}</span>
          {unit && <span className="text-xs text-gray-500">{unit}</span>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function HealthMap({ areas }: { areas: any[] }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-display font-semibold text-white mb-4">区域健康热力图</h3>
      <div className="grid grid-cols-3 gap-3">
        {areas.map(area => (
          <motion.div key={area.id} {...fadeUp} className="relative p-4 rounded-lg border bg-navy-900/50 overflow-hidden"
            style={{ borderColor: `${statusColor[area.healthStatus]}30` }}>
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="5" y="5" width="90" height="90" rx="4" fill={statusColor[area.healthStatus]} opacity="0.3" />
              {[10, 30, 50, 70, 90].map(y => <line key={y} x1="5" y1={y} x2="95" y2={y} stroke={statusColor[area.healthStatus]} strokeWidth="0.5" opacity="0.2" />)}
              {[10, 30, 50, 70, 90].map(x => <line key={x} x1={x} y1="5" x2={x} y2="95" stroke={statusColor[area.healthStatus]} strokeWidth="0.5" opacity="0.2" />)}
            </svg>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span className={`badge badge-${area.healthStatus}`}>{statusLabel[area.healthStatus]}</span>
              </div>
              <p className="text-xs text-white font-medium truncate mb-1">{area.name}</p>
              <p className="stat-number text-lg" style={{ color: statusColor[area.healthStatus] }}>{area.coverage}%</p>
              <p className="text-[10px] text-gray-500 mt-1">覆盖率 · {area.pointCount}个点位</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function DefectTrend() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-white">缺陷趋势</h3>
        <Link to="/analytics" className="text-xs text-gray-500 hover:text-accent flex items-center gap-1">
          查看详情 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={defectTrendData} barSize={12} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243552" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#162033', border: '1px solid #243552', borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="pending" stackId="a" fill="#FF3D71" name="待确认" />
          <Bar dataKey="confirmed" stackId="a" fill="#FFB800" name="已确认" />
          <Bar dataKey="repairing" stackId="a" fill="#0095FF" name="修复中" />
          <Bar dataKey="closed" stackId="a" fill="#00D68F" radius={[4, 4, 0, 0]} name="已关闭" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TaskList({ tasks }: { tasks: any[] }) {
  const recent = [...tasks].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)).slice(0, 5)
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-white">任务状态</h3>
        <Link to="/tasks" className="text-xs text-gray-500 hover:text-accent flex items-center gap-1">
          全部任务 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {recent.map(task => {
          const Icon = taskIcon[task.status]
          return (
            <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-700/30 transition-colors">
              <Icon className={`w-4 h-4 flex-shrink-0 ${taskColor[task.status]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{task.pilotName || '待分配'} · {task.scheduledDate}</p>
              </div>
              <span className={`text-xs ${taskColor[task.status]}`}>{taskLabel[task.status]}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function TodoList({ defects, tasks, workOrders }: { defects: any[]; tasks: any[]; workOrders: any[] }) {
  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const assignedTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length
  const pendingDefects = defects.filter(d => d.status === 'pending').length
  const workOrderPending = workOrders.filter(w => w.status === 'pending').length
  const repairingDefects = defects.filter(d => d.status === 'repairing').length
  const workOrderCompleted = workOrders.filter(w => w.status === 'completed').length
  const closedLoop = defects.filter(d => d.status === 'closed').length

  const todoItems = [
    {
      key: 'claim',
      label: '待领取任务',
      icon: UserPlus,
      count: pendingTasks,
      color: 'text-status-info bg-status-info/15',
      badge: 'badge-info',
      to: '/tasks',
      urgency: 'info'
    },
    {
      key: 'execute',
      label: '待执行任务',
      icon: Play,
      count: assignedTasks,
      color: 'text-status-info bg-status-info/15',
      badge: 'badge-info',
      to: '/tasks',
      urgency: 'info'
    },
    {
      key: 'confirm',
      label: '待确认缺陷',
      icon: Eye,
      count: pendingDefects,
      color: 'text-status-info bg-status-info/15',
      badge: 'badge-info',
      to: '/defects',
      urgency: 'info'
    },
    {
      key: 'wo-pending',
      label: '已建工单待处理',
      icon: FileCheck,
      count: workOrderPending,
      color: 'text-status-warning bg-status-warning/15',
      badge: 'badge-warning',
      to: '/work-orders',
      urgency: 'warning'
    },
    {
      key: 'repairing',
      label: '维修中缺陷',
      icon: Wrench,
      count: repairingDefects,
      color: 'text-status-critical bg-status-critical/15',
      badge: 'badge-critical',
      to: '/work-orders',
      urgency: 'critical'
    },
    {
      key: 'wo-completed',
      label: '待验收工单',
      icon: ClipboardCheck,
      count: workOrderCompleted,
      color: 'text-status-critical bg-status-critical/15',
      badge: 'badge-critical',
      to: '/work-orders',
      urgency: 'critical'
    }
  ]

  const totalTodo = todoItems.reduce((s, i) => s + i.count, 0)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-white">待办统计</h3>
        <div className="flex items-center gap-2">
          <span className="badge badge-critical">{totalTodo}项待处理</span>
          <span className="badge badge-healthy">已闭环 {closedLoop}</span>
        </div>
      </div>
      <div className="space-y-2">
        {todoItems.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.key}
              to={item.to}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-700/30 transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-300 flex-1 group-hover:text-white transition-colors">{item.label}</span>
              <span className={`badge ${item.badge} stat-number`}>{item.count}</span>
              <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-accent transition-colors" />
            </Link>
          )
        })}
        {totalTodo === 0 && <p className="text-sm text-gray-500 py-4 text-center">暂无待办，所有任务已处理！</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { areas, tasks, defects, workOrders } = useAppStore()
  const avgCoverage = areas.length ? (areas.reduce((s, a) => s + a.coverage, 0) / areas.length).toFixed(1) : 0
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const criticalDefects = defects.filter(d => d.severity === 'critical' || d.severity === 'high').length
  const coverageData = [{ value: Number(avgCoverage) }, { value: 100 - Number(avgCoverage) }]

  return (
    <div className="space-y-6">
      <motion.div className="grid grid-cols-4 gap-4" {...stagger}>
        <StatCard icon={Shield} label="平均覆盖率" value={avgCoverage} unit="%" color="bg-status-healthy/15 text-status-healthy">
          <PieChart width={56} height={56}>
            <Pie data={coverageData} dataKey="value" innerRadius={16} outerRadius={26} startAngle={90} endAngle={-270} strokeWidth={0}>
              <Cell fill="#00D68F" />
              <Cell fill="#243552" />
            </Pie>
          </PieChart>
        </StatCard>
        <StatCard icon={AlertTriangle} label="缺陷总数" value={defects.length} unit={`· ${criticalDefects}项高危`} color="bg-status-critical/15 text-status-critical" />
        <StatCard icon={ClipboardCheck} label="任务完成率" value={`${completedTasks}/${tasks.length}`} unit={tasks.length ? `${Math.round(completedTasks / tasks.length * 100)}%` : ''} color="bg-accent/15 text-accent" />
        <StatCard icon={MapPin} label="监控区域" value={areas.length} unit="个区域" color="bg-status-info/15 text-status-info" />
      </motion.div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3"><HealthMap areas={areas} /></div>
        <div className="col-span-2"><DefectTrend /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TaskList tasks={tasks} />
        <TodoList defects={defects} tasks={tasks} workOrders={workOrders} />
      </div>
    </div>
  )
}
