import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Filter, Zap, Wind, Droplets, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'

const areaTypeOptions = [
  { value: '', label: '全部类型', icon: Filter },
  { value: 'power_line', label: '高压线路', icon: Zap },
  { value: 'wind_farm', label: '风电场', icon: Wind },
  { value: 'pipeline', label: '管道', icon: Droplets },
]

const areaTypeLabel: Record<string, string> = {
  power_line: '高压线路',
  wind_farm: '风电场',
  pipeline: '管道',
}

const areaTypeBadge: Record<string, string> = {
  power_line: 'badge-info',
  wind_farm: 'badge-healthy',
  pipeline: 'badge-warning',
}

export default function Templates() {
  const templates = useAppStore(s => s.templates)
  const [areaType, setAreaType] = useState('')

  const filtered = areaType
    ? templates.filter(t => t.areaType === areaType)
    : templates

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">巡检模板</h1>
          <p className="text-gray-400 text-sm mt-1">管理无人机巡检拍摄模板与标准</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          新建模板
        </button>
      </div>

      <div className="flex items-center gap-2">
        {areaTypeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setAreaType(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              areaType === opt.value
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'bg-navy-800 text-gray-400 border border-navy-600/30 hover:text-gray-200 hover:border-navy-500/50'
            }`}
          >
            <opt.icon size={14} />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl, i) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={`/templates/${tpl.id}`} className="block">
              <div className="card-hover p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                      <FileText size={20} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{tpl.name}</h3>
                      <span className={`badge ${areaTypeBadge[tpl.areaType] || 'badge-info'}`}>
                        {areaTypeLabel[tpl.areaType] || tpl.areaType}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-gray-500 bg-navy-900 px-2 py-0.5 rounded">
                    {tpl.version}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-navy-900/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 mb-0.5">拍摄项目</p>
                    <p className="stat-number text-lg text-white">{tpl.items.length}</p>
                  </div>
                  <div className="bg-navy-900/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 mb-0.5">必拍项</p>
                    <p className="stat-number text-lg text-accent">
                      {tpl.items.filter(it => it.required).length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-navy-700/40">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    创建: {tpl.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    更新: {tpl.updatedAt}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>暂无匹配的巡检模板</p>
        </div>
      )}
    </div>
  )
}
