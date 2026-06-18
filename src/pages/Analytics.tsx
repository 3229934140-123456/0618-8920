import { useState } from 'react'
import { useAppStore } from '@/store'
import { coverageTrendData, healthScoreData } from '@/data/mockData'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, Shield, MapPin, ArrowUp, ArrowDown, Eye, AlertTriangle, Target, AlertCircle, Lightbulb, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fixedPrevCoverage: Record<string, number> = {
  a1: 92.5, a2: 84.1, a3: 70.8, a4: 91.0, a5: 80.5, a6: 89.3
}
const fixedPrevDefectCount: Record<string, number> = {
  a1: 2, a2: 3, a3: 5, a4: 1, a5: 2, a6: 1
}
const fixedSeverityPrevDiffs: Record<string, Record<string, number>> = {
  low: { a1: 0, a2: 1, a3: 1, a4: 0, a5: 0, a6: 0 },
  medium: { a1: 1, a2: 1, a3: 2, a4: 0, a5: 1, a6: 1 },
  high: { a1: 1, a2: 0, a3: 1, a4: 1, a5: 0, a6: 0 },
  critical: { a1: 0, a2: 1, a3: 1, a4: 0, a5: 1, a6: 0 },
}
const fixedHealthTrend: Record<string, number> = {
  '华东220kV高压线A段': 88,
  '西北风电场一期': 81,
  '华南天然气管线B段': 65,
  '华北500kV高压线C段': 87,
  '东南沿海风电场二期': 77,
  '西南油气管道D段': 85
}

const healthScoreAreaIds = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']
const healthScoreAreaNames = [
  '华东220kV高压线A段',
  '西北风电场一期',
  '华南天然气管线B段',
  '华北500kV高压线C段',
  '东南沿海风电场二期',
  '西南油气管道D段'
]

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

const defectTypeLabels: Record<string, string> = {
  rust: '锈蚀问题突出',
  crack: '裂缝集中',
  foreign_object: '异物频繁',
  other: '其他异常较多'
}

const severityWeights: Record<string, number> = {
  critical: 12,
  high: 8,
  medium: 3,
  low: 1
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

  return { score: Math.round(score * 10) / 10, level, levelLabel, openCounts: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount } }
}

function analyzeAreaFactors(area: any, areaDefects: any[], points: any[]) {
  const openDefects = areaDefects.filter(d => d.status !== 'closed')

  const typeCounts: Record<string, number> = { rust: 0, crack: 0, foreign_object: 0, other: 0 }
  openDefects.forEach(d => { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1 })

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const topType = sortedTypes[0]?.[1] > 0 ? sortedTypes[0][0] : null

  const areaPoints = points.filter(p => p.areaId === area.id)
  const pointScores = areaPoints.map(p => {
    const pointDefects = openDefects.filter(d => d.pointId === p.id)
    const weightedScore = pointDefects.reduce((s, d) => s + severityWeights[d.severity] || 0, 0)
    return { point: p, score: weightedScore, defectCount: pointDefects.length }
  }).sort((a, b) => b.score - a.score).slice(0, 3)

  return {
    topDefectType: topType,
    topDefectTypeLabel: topType ? defectTypeLabels[topType] : '暂无集中缺陷',
    topPoints: pointScores
  }
}

export default function Analytics() {
  const { areas, defects, points, getDefectsByAreaId, getDefectsByPointId } = useAppStore()
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id ?? '')
  const [selectedDefectId, setSelectedDefectId] = useState(defects[0]?.id ?? '')

  const areaDefects = getDefectsByAreaId(selectedAreaId)
  const selectedDefect = defects.find(d => d.id === selectedDefectId)
  const selectedArea = areas.find(a => a.id === selectedAreaId)

  const areaRiskList = areas.slice(0, 3).map(area => ({
    area,
    risk: calcAreaRisk(area, getDefectsByAreaId(area.id))
  })).sort((a, b) => b.risk.score - a.risk.score)

  const factorAnalysisAreas = areas.slice(0, 3).map(area => ({
    area,
    factors: analyzeAreaFactors(area, getDefectsByAreaId(area.id), points)
  }))

  const topRiskArea = areaRiskList[0]
  const topRiskPoints = topRiskArea ? factorAnalysisAreas.find(f => f.area.id === topRiskArea.area.id)?.factors.topPoints || [] : []
  const suggestion = topRiskArea && topRiskPoints.length > 0
    ? `建议优先巡检${topRiskArea.area.name}的${topRiskPoints.slice(0, 2).map(p => p.point.name).join('、')}等点位，重点关注${factorAnalysisAreas.find(f => f.area.id === topRiskArea.area.id)?.factors.topDefectTypeLabel.replace('问题突出', '类').replace('集中', '类').replace('频繁', '类').replace('较多', '类') || '各类'}缺陷`
    : '各区域健康状况良好，建议按计划正常巡检'

  const severityBreakdown = areaDefects.reduce((acc, d) => {
    acc[d.severity] = (acc[d.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const prevCoverage = selectedArea ? (fixedPrevCoverage[selectedArea.id] ?? 0) : 0
  const prevDefectCount = selectedArea ? (fixedPrevDefectCount[selectedArea.id] ?? 0) : 0

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
    const areaId = healthScoreAreaIds[i]
    const areaName = healthScoreAreaNames[i]
    const prevOverall = fixedHealthTrend[areaName] ?? h.overall
    return {
      ...h,
      areaId,
      area: areaName,
      trend: h.overall >= prevOverall ? 'up' : 'down',
      rank: i + 1
    }
  }).sort((a, b) => b.overall - a.overall)

  const getPrevSeverityCount = (sev: string) => {
    const diffs = fixedSeverityPrevDiffs[sev]
    const diff = selectedArea && diffs ? (diffs[selectedArea.id] ?? 0) : 0
    const current = severityBreakdown[sev] || 0
    return Math.max(current - diff, 0)
  }

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-status-critical/15 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-status-critical" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">风险评分与趋势解释</h2>
            <p className="text-xs text-gray-500">基于缺陷严重度、覆盖率等多维度综合评估</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-white">区域风险评分</h3>
            </div>
            <div className="space-y-3">
              {areaRiskList.map(({ area, risk }) => (
                <div key={area.id} className="bg-navy-900/50 rounded-lg p-3 border border-navy-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      {area.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`stat-number text-sm ${
                        risk.level === 'critical' ? 'text-status-critical' :
                        risk.level === 'warning' ? 'text-status-warning' : 'text-status-healthy'
                      }`}>
                        {risk.score}
                      </span>
                      <span className={`badge badge-${risk.level}`}>{risk.levelLabel}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${risk.score}%`,
                        background: risk.level === 'critical' ? '#FF3D71' :
                          risk.level === 'warning' ? '#FFB800' : '#00D68F'
                      }}
                    />
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-critical" />
                      严重 {risk.openCounts.critical}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      高 {risk.openCounts.high}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                      中 {risk.openCounts.medium}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-healthy" />
                      低 {risk.openCounts.low}
                    </span>
                    <span className="ml-auto">覆盖率 {area.coverage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-white">健康分拉低因素分析</h3>
            </div>
            <div className="space-y-3">
              {factorAnalysisAreas.map(({ area, factors }) => (
                <div key={area.id} className="bg-navy-900/50 rounded-lg p-3 border border-navy-700/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm text-white">{area.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-gray-500 w-14 shrink-0 pt-0.5">缺陷类型</span>
                      <span className={`text-xs ${
                        factors.topDefectType === 'rust' ? 'text-status-warning' :
                        factors.topDefectType === 'crack' ? 'text-status-critical' :
                        factors.topDefectType === 'foreign_object' ? 'text-accent' :
                        'text-gray-400'
                      }`}>
                        {factors.topDefectTypeLabel}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-gray-500 w-14 shrink-0 pt-0.5">高风险点</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {factors.topPoints.length > 0 ? (
                          factors.topPoints.map(({ point, defectCount }) => (
                            <Link
                              key={point.id}
                              to={`/points/${point.id}`}
                              className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-0.5"
                            >
                              {point.name}
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ))
                        ) : (
                            <span className="text-xs text-gray-500">暂无高风险点位</span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-accent/5 rounded-lg p-3 border border-accent/20 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-accent font-medium mb-0.5">下次巡检建议</p>
                  <p className="text-xs text-gray-300">{suggestion}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {(Object.keys(severityLabels) as string[]).map((sev) => (
                  <div key={sev} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: severityColors[sev] }} />
                    <span className="text-gray-400">{severityLabels[sev]}</span>
                    <span className="stat-number text-gray-300">{getPrevSeverityCount(sev)}</span>
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
                {(Object.keys(severityLabels) as string[]).map((sev) => (
                  <div key={sev} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: severityColors[sev] }} />
                    <span className="text-gray-400">{severityLabels[sev]}</span>
                    <span className="stat-number text-gray-300">{severityBreakdown[sev] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

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
