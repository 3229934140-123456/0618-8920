import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Shield, AlertTriangle, MapPin, TrendingUp, TrendingDown,
  BarChart3, Clock, User, Flag, ChevronRight, Wrench, AlertCircle, Lightbulb, CheckCircle2
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'

const severityWeights: Record<string, number> = {
  critical: 12,
  high: 8,
  medium: 3,
  low: 1
}

const severityColors: Record<string, string> = {
  low: '#00D68F',
  medium: '#FFB800',
  high: '#FF6B35',
  critical: '#FF3D71',
}

const severityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
}

const defectTypeColors: Record<string, string> = {
  rust: '#FFB800',
  crack: '#FF3D71',
  foreign_object: '#FF6B35',
  other: '#6B7280',
}

const defectTypeLabels: Record<string, string> = {
  rust: '锈蚀',
  crack: '裂缝',
  foreign_object: '异物',
  other: '其他',
}

const priorityLabels: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
}

function calcAreaRisk(area: any, areaDefects: any[]) {
  const openDefects = areaDefects.filter(d => d.status !== 'closed')
  const criticalCount = openDefects.filter(d => d.severity === 'critical').length
  const highCount = openDefects.filter(d => d.severity === 'high').length
  const mediumCount = openDefects.filter(d => d.severity === 'medium').length
  const lowCount = openDefects.filter(d => d.severity === 'low').length

  const score = Math.min(100,
    (1 - (area.coverage || 0) / 100) * 30 +
    criticalCount * 12 +
    highCount * 8 +
    mediumCount * 3 +
    lowCount * 1
  )

  let level = 'healthy'
  let levelLabel = '低风险'
  if (score >= 60) {
    level = 'critical'
    levelLabel = '高风险'
  } else if (score >= 30) {
    level = 'warning'
    levelLabel = '中风险'
  }

  return {
    score: Math.round(score * 10) / 10,
    level,
    levelLabel,
    openCounts: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
    totalOpen: openDefects.length
  }
}

const mockTrendData = [
  { month: '1月', risk: 28 },
  { month: '2月', risk: 32 },
  { month: '3月', risk: 45 },
  { month: '4月', risk: 38 },
  { month: '5月', risk: 52 },
  { month: '6月', risk: 0 },
]

export default function AreaRiskDetail() {
  const { id } = useParams<{ id: string }>()
  const { areas, defects, points, workOrders, getDefectsByAreaId } = useAppStore()

  const area = areas.find(a => a.id === id)
  const areaDefects = useMemo(() => getDefectsByAreaId(id || ''), [getDefectsByAreaId, id])
  const areaPoints = useMemo(() => points.filter(p => p.areaId === id), [points, id])
  const areaWorkOrders = useMemo(() => {
    const defectIds = new Set(areaDefects.map(d => d.id))
    return workOrders.filter(w => defectIds.has(w.defectId))
  }, [workOrders, areaDefects])

  const risk = useMemo(() => area ? calcAreaRisk(area, areaDefects) : null, [area, areaDefects])

  const typeDistribution = useMemo(() => {
    const openDefects = areaDefects.filter(d => d.status !== 'closed')
    const counts: Record<string, number> = { rust: 0, crack: 0, foreign_object: 0, other: 0 }
    openDefects.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1 })
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([type, value]) => ({ name: defectTypeLabels[type] || type, value, type }))
  }, [areaDefects])

  const pointRanking = useMemo(() => {
    const openDefects = areaDefects.filter(d => d.status !== 'closed')
    return areaPoints.map(p => {
      const pointDefects = openDefects.filter(d => d.pointId === p.id)
      const weightedScore = pointDefects.reduce((s, d) => s + severityWeights[d.severity] || 0, 0)
      const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
      pointDefects.forEach(d => { bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1 })
      return {
        point: p,
        score: weightedScore,
        defectCount: pointDefects.length,
        bySeverity
      }
    }).sort((a, b) => b.score - a.score)
  }, [areaPoints, areaDefects])

  const openWorkOrders = useMemo(() =>
    areaWorkOrders.filter(w => w.status !== 'verified').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [areaWorkOrders]
  )

  const trendData = useMemo(() => {
    if (!risk) return mockTrendData
    return mockTrendData.map((d, i) => ({
      ...d,
      risk: i === mockTrendData.length - 1 ? risk.score : d.risk
    }))
  }, [risk])

  const topType = typeDistribution[0]?.type || 'none'
  const topTypeLabel = topType !== 'none'
    ? `${defectTypeLabels[topType]}类缺陷最为突出`
    : '暂无明显集中缺陷'

  const highRiskPoints = pointRanking.filter(p => p.score > 0).slice(0, 3).map(p => p.point.name).join('、')

  const suggestion = !risk || risk.level === 'healthy'
    ? '该区域健康状况良好，建议按计划正常巡检，保持现有维护节奏。'
    : `建议优先巡检${highRiskPoints || '高风险点位'}等点位，重点关注${topTypeLabel.replace('类缺陷最为突出', '')}类缺陷的闭环处理，${risk.level === 'critical' ? '必要时安排专项整改。' : '确保下次巡检前完成主要缺陷修复。'}`

  if (!area) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">区域不存在</p>
          <Link to="/analytics" className="text-accent text-sm hover:underline mt-2 inline-block">
            返回数据分析
          </Link>
        </div>
      </div>
    )
  }

  const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to="/analytics"
          className="w-9 h-9 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-600/30 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              {area.name}
            </h1>
            {risk && (
              <span className={`badge badge-${risk.level}`}>
                {risk.levelLabel} · {risk.score}分
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">区域风险分析与整改建议</p>
        </div>
      </div>

      <motion.div
        {...fadeUp}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-status-critical/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-status-critical" />
            </div>
            <span className="text-xs text-gray-500">风险评分</span>
          </div>
          <div className={`stat-number text-3xl ${
            risk?.level === 'critical' ? 'text-status-critical' :
            risk?.level === 'warning' ? 'text-status-warning' : 'text-status-healthy'
          }`}>
            {risk?.score ?? '-'}
          </div>
          <div className="text-xs text-gray-500 mt-1">/ 100</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-status-warning/15 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-status-warning" />
            </div>
            <span className="text-xs text-gray-500">开放缺陷</span>
          </div>
          <div className="stat-number text-3xl text-white">{risk?.totalOpen ?? 0}</div>
          <div className="flex gap-2 mt-1 text-[10px]">
            <span className="text-status-critical">严重 {risk?.openCounts.critical ?? 0}</span>
            <span className="text-accent">高 {risk?.openCounts.high ?? 0}</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-status-info/15 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-status-info" />
            </div>
            <span className="text-xs text-gray-500">未闭环工单</span>
          </div>
          <div className="stat-number text-3xl text-white">{openWorkOrders.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            待处理 {openWorkOrders.filter(w => w.status === 'pending').length} · 处理中 {openWorkOrders.filter(w => w.status === 'in_progress').length}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-status-healthy/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-status-healthy" />
            </div>
            <span className="text-xs text-gray-500">巡检覆盖率</span>
          </div>
          <div className="stat-number text-3xl text-status-healthy">{area.coverage.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">共 {areaPoints.length} 个点位</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            缺陷类型分布
          </h3>
          {typeDistribution.length > 0 ? (
            <>
              <div className="h-[180px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={index} fill={defectTypeColors[entry.type] || '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#162033', border: '1px solid #243552', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {typeDistribution.map(item => (
                  <div key={item.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: defectTypeColors[item.type] }}
                      />
                      <span className="text-gray-300">{item.name}</span>
                    </div>
                    <span className="stat-number text-gray-400">{item.value}项</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-status-healthy mx-auto mb-2 opacity-50" />
              <p className="text-sm text-gray-500">暂无未闭环缺陷</p>
              <p className="text-xs text-gray-600 mt-1">区域健康状况良好</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            风险趋势
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2A42" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#243552' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#243552' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#162033', border: '1px solid #243552', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${value}分`, '风险值']}
                />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#FF6B35"
                  strokeWidth={2}
                  dot={{ fill: '#FF6B35', r: 3 }}
                  activeDot={{ r: 5, fill: '#FF6B35' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-gray-500">较上月变化</span>
            <span className={`stat-number flex items-center gap-1 ${
              trendData.length >= 2 && trendData[trendData.length - 1].risk >= trendData[trendData.length - 2].risk
                ? 'text-status-critical'
                : 'text-status-healthy'
            }`}>
              {trendData.length >= 2 && (
                trendData[trendData.length - 1].risk >= trendData[trendData.length - 2].risk
                  ? <><TrendingUp className="w-3 h-3" />上升</>
                  : <><TrendingDown className="w-3 h-3" />下降</>
              )}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            巡检建议
          </h3>
          <div className="bg-accent/5 rounded-lg p-3.5 border border-accent/20">
            <p className="text-xs text-gray-300 leading-relaxed">{suggestion}</p>
          </div>

          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-medium text-gray-400">关键关注点</h4>
            {pointRanking.filter(p => p.score > 0).length > 0 ? (
              pointRanking.filter(p => p.score > 0).slice(0, 5).map(({ point, defectCount, bySeverity }) => (
                <div key={point.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-navy-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/points/${point.id}`}
                        className="text-xs text-white hover:text-accent transition-colors truncate"
                      >
                        {point.name}
                      </Link>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">{defectCount}项</span>
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      {bySeverity.critical > 0 && (
                        <span className="text-[9px] text-status-critical">严重{bySeverity.critical}</span>
                      )}
                      {bySeverity.high > 0 && (
                        <span className="text-[9px] text-accent">高{bySeverity.high}</span>
                      )}
                      {bySeverity.medium > 0 && (
                        <span className="text-[9px] text-status-warning">中{bySeverity.medium}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-600 text-center py-2">无高风险点位</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent" />
            未闭环工单
          </h3>
          <Link to="/workorders" className="text-xs text-gray-500 hover:text-accent flex items-center gap-1">
            维修计划
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {openWorkOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-header">
                  <th className="text-left py-2.5 px-3">工单号</th>
                  <th className="text-left py-2.5 px-3">描述</th>
                  <th className="text-left py-2.5 px-3">优先级</th>
                  <th className="text-left py-2.5 px-3">负责人</th>
                  <th className="text-left py-2.5 px-3">截止日期</th>
                  <th className="text-left py-2.5 px-3">状态</th>
                  <th className="text-right py-2.5 px-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {openWorkOrders.map(wo => {
                  const isOverdue = wo.status !== 'verified' && wo.dueDate < new Date().toISOString().split('T')[0]
                  const statusLabel = wo.status === 'pending' ? '待处理' :
                    wo.status === 'in_progress' ? '处理中' :
                    wo.status === 'completed' ? '待验收' : '已闭环'
                  const statusBadge = wo.status === 'pending' ? 'badge-info' :
                    wo.status === 'in_progress' ? 'badge-warning' :
                    wo.status === 'completed' ? 'badge-healthy' : 'badge-healthy'
                  const defect = areaDefects.find(d => d.id === wo.defectId)
                  return (
                    <tr key={wo.id} className="table-row">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-400">{wo.id}</td>
                      <td className="py-2.5 px-3 text-gray-300 max-w-[240px] truncate" title={wo.description}>
                        {wo.description}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`badge ${
                          wo.priority === 'urgent' ? 'badge-critical' :
                          wo.priority === 'high' ? 'badge-warning' :
                          wo.priority === 'medium' ? 'badge-info' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                        } !text-[10px] !py-0 !px-2`}>
                          <Flag className="w-2 h-2 mr-0.5" />
                          {priorityLabels[wo.priority]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-navy-700 flex items-center justify-center text-[9px] text-gray-400">
                            {wo.assignee.slice(0, 1)}
                          </div>
                          <span className="text-gray-300">{wo.assignee}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-status-critical' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" />
                          {wo.dueDate}
                          {isOverdue && <AlertCircle className="w-3 h-3 text-status-critical" />}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`badge ${statusBadge} !text-[10px] !py-0 !px-2`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {defect && (
                          <Link
                            to={`/defects/${defect.id}`}
                            className="text-accent hover:underline text-[11px]"
                          >
                            查看缺陷
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-status-healthy mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-500">所有工单已闭环</p>
            <p className="text-xs text-gray-600 mt-1">该区域暂无未完成维修任务</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
