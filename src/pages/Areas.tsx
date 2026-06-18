import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Filter, Zap, Wind, Droplets, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'

const typeLabels: Record<string, string> = {
  power_line: '电力线路',
  wind_farm: '风电场',
  pipeline: '油气管道',
}

const typeIcons: Record<string, typeof Zap> = {
  power_line: Zap,
  wind_farm: Wind,
  pipeline: Droplets,
}

const healthLabels: Record<string, string> = {
  healthy: '健康',
  warning: '注意',
  critical: '严重',
}

const healthBadgeClass: Record<string, string> = {
  healthy: 'badge-healthy',
  warning: 'badge-warning',
  critical: 'badge-critical',
}

const healthGlowClass: Record<string, string> = {
  healthy: 'glow-healthy',
  warning: 'glow-warning',
  critical: 'glow-critical',
}

const coverageColor = (coverage: number) => {
  if (coverage >= 90) return 'bg-status-healthy'
  if (coverage >= 75) return 'bg-status-warning'
  return 'bg-status-critical'
}

export default function Areas() {
  const areas = useAppStore(s => s.areas)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'power_line' | 'wind_farm' | 'pipeline'>('all')

  const filtered = areas.filter(a => {
    const matchSearch = a.name.includes(search) || a.description.includes(search)
    const matchType = typeFilter === 'all' || a.type === typeFilter
    return matchSearch && matchType
  })

  const filterOptions: { value: typeof typeFilter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'power_line', label: '电力线路' },
    { value: 'wind_farm', label: '风电场' },
    { value: 'pipeline', label: '油气管道' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">巡检区域管理</h1>
        <p className="text-gray-400 mt-1">管理所有巡检区域，查看区域健康状态与覆盖情况</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜索区域名称或描述..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  typeFilter === opt.value
                    ? 'bg-accent text-white'
                    : 'bg-navy-800 text-gray-400 hover:text-white border border-navy-600/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((area, i) => {
          const TypeIcon = typeIcons[area.type] || MapPin
          return (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link to={`/areas/${area.id}`} className="block">
                <div className="card-hover p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <TypeIcon className="w-4 h-4 text-accent" />
                      </div>
                      <span className="badge badge-info">
                        {typeLabels[area.type] || area.type}
                      </span>
                    </div>
                    <div className={`badge ${healthBadgeClass[area.healthStatus]} ${healthGlowClass[area.healthStatus]}`}>
                      {healthLabels[area.healthStatus]}
                    </div>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-accent transition-colors">
                    {area.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {area.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">巡检点数</p>
                      <p className="stat-number text-white text-lg">{area.pointCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">上次巡检</p>
                      <p className="text-gray-300 text-sm">{area.lastInspectionDate || '暂无'}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">覆盖率</span>
                      <span className="stat-number text-white">{area.coverage}%</span>
                    </div>
                    <div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${coverageColor(area.coverage)}`}
                        style={{ width: `${area.coverage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    查看详情
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">未找到匹配的巡检区域</p>
        </div>
      )}
    </div>
  )
}
