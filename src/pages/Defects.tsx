import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Search, Filter, Shield, Eye } from 'lucide-react'
import { useAppStore } from '@/store'
import type { DefectSeverity, DefectStatus, DefectType } from '@/types'

const severityOptions: { value: DefectSeverity | ''; label: string }[] = [
  { value: '', label: '全部等级' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '严重' },
]

const statusOptions: { value: DefectStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'work_order_created', label: '已建工单' },
  { value: 'repairing', label: '维修中' },
  { value: 'closed', label: '已闭环' },
]

const typeOptions: { value: DefectType | ''; label: string }[] = [
  { value: '', label: '全部类型' },
  { value: 'crack', label: '裂缝' },
  { value: 'rust', label: '锈蚀' },
  { value: 'foreign_object', label: '异物' },
  { value: 'other', label: '其他' },
]

const typeLabels: Record<DefectType, string> = {
  crack: '裂缝',
  rust: '锈蚀',
  foreign_object: '异物',
  other: '其他',
}

const statusLabels: Record<DefectStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  work_order_created: '已建工单',
  repairing: '维修中',
  closed: '已闭环',
}

function SeverityBadge({ severity }: { severity: DefectSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="badge badge-critical glow-critical">
        <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse" />
        严重
      </span>
    )
  }
  if (severity === 'high') {
    return (
      <span className="badge badge-critical glow-critical">
        <span className="w-1.5 h-1.5 rounded-full bg-status-critical" />
        高
      </span>
    )
  }
  if (severity === 'medium') {
    return (
      <span className="badge badge-warning">
        <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
        中
      </span>
    )
  }
  return (
    <span className="badge badge-info">
      <span className="w-1.5 h-1.5 rounded-full bg-status-info" />
      低
    </span>
  )
}

function StatusBadge({ status }: { status: DefectStatus }) {
  const colorMap: Record<DefectStatus, string> = {
    pending: 'badge-info',
    confirmed: 'badge-warning',
    work_order_created: 'badge-healthy',
    repairing: 'badge-warning',
    closed: 'badge-healthy',
  }
  return (
    <span className={`badge ${colorMap[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

export default function Defects() {
  const { defects, areas, points } = useAppStore()
  const [severityFilter, setSeverityFilter] = useState<DefectSeverity | ''>('')
  const [statusFilter, setStatusFilter] = useState<DefectStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<DefectType | ''>('')
  const [search, setSearch] = useState('')

  const filtered = defects.filter(d => {
    if (severityFilter && d.severity !== severityFilter) return false
    if (statusFilter && d.status !== statusFilter) return false
    if (typeFilter && d.type !== typeFilter) return false
    if (search) {
      const area = areas.find(a => a.id === d.areaId)
      const point = points.find(p => p.id === d.pointId)
      const haystack = [d.id, area?.name, point?.name, d.aiDescription].join(' ').toLowerCase()
      if (!haystack.includes(search.toLowerCase())) return false
    }
    return true
  })

  const counts = {
    total: defects.length,
    critical: defects.filter(d => d.severity === 'critical').length,
    pending: defects.filter(d => d.status === 'pending').length,
    repairing: defects.filter(d => d.status === 'repairing').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-white">缺陷与工单</h1>
          <p className="text-sm text-gray-500">缺陷识别、确认与工单跟踪管理</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '缺陷总数', value: counts.total, color: 'text-accent' },
          { label: '严重缺陷', value: counts.critical, color: 'text-status-critical' },
          { label: '待确认', value: counts.pending, color: 'text-status-warning' },
          { label: '维修中', value: counts.repairing, color: 'text-status-info' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`stat-number text-2xl ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm">筛选</span>
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as DefectSeverity | '')}
            className="input-field text-sm py-1.5"
          >
            {severityOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as DefectStatus | '')}
            className="input-field text-sm py-1.5"
          >
            {statusOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as DefectType | '')}
            className="input-field text-sm py-1.5"
          >
            {typeOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索缺陷..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field text-sm py-1.5 pl-9 w-56"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">区域</th>
              <th className="text-left px-4 py-3">点位</th>
              <th className="text-left px-4 py-3">类型</th>
              <th className="text-left px-4 py-3">等级</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">AI置信度</th>
              <th className="text-left px-4 py-3">创建时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((defect, i) => {
              const area = areas.find(a => a.id === defect.areaId)
              const point = points.find(p => p.id === defect.pointId)
              return (
                <motion.tr
                  key={defect.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="table-row"
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-300">{defect.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{area?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{point?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <Shield className="w-3.5 h-3.5 text-gray-500" />
                      {typeLabels[defect.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3"><SeverityBadge severity={defect.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge status={defect.status} /></td>
                  <td className="px-4 py-3">
                    <span className={`stat-number text-sm ${
                      defect.aiConfidence >= 0.9 ? 'text-status-critical' :
                      defect.aiConfidence >= 0.8 ? 'text-status-warning' : 'text-status-info'
                    }`}>
                      {(defect.aiConfidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{defect.createdAt}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/defects/${defect.id}`}
                      className="inline-flex items-center gap-1 text-accent hover:text-accent-light text-sm transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      详情
                    </Link>
                  </td>
                </motion.tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  暂无匹配的缺陷记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
