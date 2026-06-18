import { useState } from 'react'
import { useAppStore } from '@/store'
import { coverageTrendData, healthScoreData } from '@/data/mockData'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, BarChart, Bar, Cell
} from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, Shield, MapPin, ArrowUp, ArrowDown, Eye } from 'lucide-react'
import { motion } from 'framer-motion'

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

const timelineSteps = [
  { key: 'pending', label: 'AI发现' },
  { key: 'confirmed', label: '飞手确认' },
  { key: 'work_order_created', label: '创建工单' },
  { key: 'repairing', label: '维修中' },
  { key: 'closed', label: '已闭环' },
]

const statusOrder: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  work_order_created: 2,
  repairing: 3,
  closed: 4,
}

function getHealthColor(score: number) {
  if (score > 90) return '#00D68F'
  if (score >= 70) return '#FFB800'
  return '#FF3D71'
}

function getHealthBadgeClass(score: number) {
  if (score > 90) return 'badge badge-healthy'
  if (score >= 70) return 'badge badge-warning'
  return 'badge badge-critical'
}

const radarColors = ['#FF6B35', '#00D68F', '#0095FF']

export default function Analytics() {
  const { areas, defects, getDefectsByAreaId } = useAppStore()
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id ?? '')
  const [selectedDefectId, setSelectedDefectId] = useState(defects[0]?.id ?? '')

  const areaDefects = getDefectsByAreaId(selectedAreaId)
  const selectedDefect = defects.find(d => d.id === selectedDefectId)
  const selectedArea = areas.find(a => a.id === selectedAreaId)

  const severityBreakdown = areaDefects.reduce((acc, d) => {
    acc[d.severity] = (acc[d.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const prevCoverage = selectedArea ? Math.min(selectedArea.coverage - 3.2 + Math.random() * 4, 100) : 0
  const prevDefectCount = Math.max(areaDefects.length - 1, 0)

  const areaCoverageData = areas.map(a => ({
    name: a.name.length > 8 ? a.name.slice(0, 8) + '…' : a.name,
    fullName: a.name,
    coverage: a.coverage,
    belowThreshold: a.coverage < 80,
  }))

  const radarData = [
    { metric: '结构', ...Object.fromEntries(healthScoreData.slice(0, 3).map((h, i) => [`area${i}`, h.structure])) },
    { metric: '腐蚀', ...Object.fromEntries(healthScoreData.slice(0, 3).map((h, i) => [`area${i}`, h.corrosion])) },
    { metric: '安全', ...Object.fromEntries(healthScoreData.slice(0, 3).map((h, i) => [`area${i}`, h.safety])) },
    { metric: '环境', ...Object.fromEntries(healthScoreData.slice(0, 3).map((h, i) => [`area${i}`, h.environment])) },
  ]

  const rankingData = healthScoreData.map((h, i) => {
    const prevOverall = h.overall + (Math.random() * 6 - 3)
    return { ...h, trend: h.overall >= prevOverall ? 'up' : 'down', rank: i + 1 }
  }).sort((a, b) => b.overall - a.overall)

  const currentDefectStep = selectedDefect ? statusOrder[selectedDefect.status] : -1

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-white">数据分析</h1>
          <p className="text-sm text-gray-500">巡检数据对比、缺陷进展与健康评估</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 巡检对比 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <h2 className="text-base font-semibold text-white">巡检对比</h2>
            </div>
            <select
              value={selectedAreaId}
              onChange={e => setSelectedAreaId(e.target.value)}
              className="input-field text-sm py-1.5 px-3"
            >
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-navy-900/60 rounded-lg p-4 border border-navy-700/30">
              <p className="text-xs text-gray-500 mb-3">上次巡检</p>
              <p className="text-xs text-gray-400 mb-2">
                日期：<span className="text-gray-300">{selectedArea?.lastInspectionDate
                  ? new Date(new Date(selectedArea.lastInspectionDate).getTime() - 30 * 86400000).toISOString().split('T')[0]
                  : '-'}</span>
              </p>
              <p className="text-xs text-gray-400 mb-2">
                覆盖率：<span className="stat-number text-gray-200">{prevCoverage.toFixed(1)}%</span>
              </p>
              <p className="text-xs text-gray-400 mb-2">
                缺陷数：<span className="stat-number text-gray-200">{prevDefectCount}</span>
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-gray-500">严重度分布</p>
                {(Object.entries(severityBreakdown) as [string, number][]).map(([sev]) => (
                  <div key={sev} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: severityColors[sev] }} />
                    <span className="text-gray-400">{severityLabels[sev]}</span>
                    <span className="stat-number text-gray-300">{Math.max(((severityBreakdown[sev] || 0) - 1), 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-navy-900/60 rounded-lg p-4 border border-accent/20">
              <p className="text-xs text-accent mb-3">本次巡检</p>
              <p className="text-xs text-gray-400 mb-2">
                日期：<span className="text-gray-300">{selectedArea?.lastInspectionDate ?? '-'}</span>
              </p>
              <p className="text-xs text-gray-400 mb-2">
                覆盖率：<span className="stat-number text-accent">{selectedArea?.coverage.toFixed(1) ?? '-'}%</span>
              </p>
              <p className="text-xs text-gray-400 mb-2">
                缺陷数：<span className="stat-number text-accent">{areaDefects.length}</span>
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-gray-500">严重度分布</p>
                {(Object.entries(severityBreakdown) as [string, number][]).map(([sev, count]) => (
                  <div key={sev} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: severityColors[sev] }} />
                    <span className="text-gray-400">{severityLabels[sev]}</span>
                    <span className="stat-number text-gray-300">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 缺陷进展 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" />
              <h2 className="text-base font-semibold text-white">缺陷进展</h2>
            </div>
            <select
              value={selectedDefectId}
              onChange={e => setSelectedDefectId(e.target.value)}
              className="input-field text-sm py-1.5 px-3"
            >
              {defects.map(d => (
                <option key={d.id} value={d.id}>{d.aiDescription.slice(0, 20)}…</option>
              ))}
            </select>
          </div>

          {selectedDefect && (
            <>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center py-1">
                  {timelineSteps.map((step, i) => {
                    const isReached = i <= currentDefectStep
                    const isCurrent = i === currentDefectStep
                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full border-2 transition-all ${
                            isCurrent
                              ? 'border-accent bg-accent scale-125'
                              : isReached
                                ? 'border-status-healthy bg-status-healthy'
                                : 'border-navy-600 bg-navy-800'
                          }`}
                        />
                        {i < timelineSteps.length - 1 && (
                          <div className={`w-0.5 h-6 ${isReached ? 'bg-status-healthy/60' : 'bg-navy-700'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-0">
                  {timelineSteps.map((step, i) => {
                    const isReached = i <= currentDefectStep
                    const isCurrent = i === currentDefectStep
                    return (
                      <div key={step.key} className="h-[36px] flex items-center">
                        <span className={`text-xs ${isCurrent ? 'text-accent font-semibold' : isReached ? 'text-gray-300' : 'text-gray-600'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-navy-900/60 rounded-lg p-3 border border-navy-700/30">
                  <p className="text-[10px] text-gray-500 mb-2">缺陷原图</p>
                  <div className="aspect-video rounded bg-navy-700/40 flex items-center justify-center">
                    <img
                      src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20inspection%20defect%20found%20rust%20crack%20aerial&image_size=landscape_16_9`}
                      alt="缺陷原图"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                </div>
                <div className="bg-navy-900/60 rounded-lg p-3 border border-navy-700/30">
                  <p className="text-[10px] text-gray-500 mb-2">修复后</p>
                  <div className="aspect-video rounded bg-navy-700/40 flex items-center justify-center">
                    {selectedDefect.status === 'closed' ? (
                      <img
                        src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20inspection%20repaired%20fixed%20clean%20aerial&image_size=landscape_16_9`}
                        alt="修复后"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs text-gray-600">待修复</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* 覆盖率统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h2 className="text-base font-semibold text-white">覆盖率统计</h2>
          </div>

          <div className="h-[200px] mb-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={coverageTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2A42" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#243552' }} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#243552' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#162033', border: '1px solid #243552', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#E5E7EB' }}
                  itemStyle={{ color: '#FF6B35' }}
                />
                <Line type="monotone" dataKey="coverage" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs text-gray-500 mb-1">区域覆盖率</p>
            {areaCoverageData.map(a => (
              <div key={a.fullName} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 truncate" title={a.fullName}>{a.name}</span>
                <div className="flex-1 h-2 bg-navy-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${a.coverage}%`,
                      background: a.belowThreshold ? '#FF3D71' : '#00D68F',
                    }}
                  />
                </div>
                <span className={`stat-number text-xs ${a.belowThreshold ? 'text-status-critical' : 'text-status-healthy'}`}>
                  {a.coverage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 健康汇总 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-accent" />
            <h2 className="text-base font-semibold text-white">健康汇总</h2>
          </div>

          <div className="h-[220px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1C2A42" strokeOpacity={0.4} />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                {healthScoreData.slice(0, 3).map((h, i) => (
                  <Radar
                    key={h.area}
                    name={h.area}
                    dataKey={`area${i}`}
                    stroke={radarColors[i]}
                    fill={radarColors[i]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Tooltip
                  contentStyle={{ background: '#162033', border: '1px solid #243552', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#E5E7EB' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-lg border border-navy-700/30">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-header">
                  <th className="text-left py-2 px-3">排名</th>
                  <th className="text-left py-2 px-3">区域</th>
                  <th className="text-center py-2 px-3">综合分</th>
                  <th className="text-center py-2 px-3">趋势</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((h, i) => (
                  <tr key={h.area} className="table-row">
                    <td className="py-2 px-3 stat-number text-gray-400">{i + 1}</td>
                    <td className="py-2 px-3 text-gray-300">{h.area}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={getHealthBadgeClass(h.overall)}>
                        <span className="stat-number">{h.overall}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {h.trend === 'up' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-status-healthy inline" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-status-critical inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
