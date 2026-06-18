import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Filter, Zap, Wind, Droplets, ArrowRight, Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import type { Area } from '@/types'

const typeLabels: Record<string, string> = {
  power_line: '电力线路',
  wind_farm: '风电场',
  pipeline: '油气管道',
  other: '其他',
}

const typeIcons: Record<string, typeof Zap> = {
  power_line: Zap,
  wind_farm: Wind,
  pipeline: Droplets,
  other: MapPin,
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

interface AreaFormData {
  name: string
  type: Area['type']
  description: string
  latitude: string
  longitude: string
}

const emptyForm: AreaFormData = {
  name: '',
  type: 'power_line',
  description: '',
  latitude: '30.0',
  longitude: '120.0',
}

export default function Areas() {
  const areas = useAppStore(s => s.areas)
  const addArea = useAppStore(s => s.addArea)
  const updateArea = useAppStore(s => s.updateArea)
  const deleteArea = useAppStore(s => s.deleteArea)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'power_line' | 'wind_farm' | 'pipeline' | 'other'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AreaFormData>(emptyForm)

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
    { value: 'other', label: '其他' },
  ]

  const openAddModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (area: Area) => {
    setEditingId(area.id)
    setForm({
      name: area.name,
      type: area.type,
      description: area.description,
      latitude: String(area.coordinates[0]),
      longitude: String(area.coordinates[1]),
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const lat = parseFloat(form.latitude) || 30.0
    const lng = parseFloat(form.longitude) || 120.0
    const data = {
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
      coordinates: [lat, lng] as [number, number],
    }
    if (editingId) {
      updateArea(editingId, data)
    } else {
      addArea(data)
    }
    closeModal()
  }

  const handleDelete = (area: Area) => {
    if (window.confirm(`确定要删除区域 "${area.name}" 吗？此操作将同时删除该区域下的所有巡检点、任务和缺陷数据，且不可恢复。`)) {
      deleteArea(area.id)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">巡检区域管理</h1>
        <p className="text-gray-400 mt-1">管理所有巡检区域，查看区域健康状态与覆盖情况</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1 flex-wrap">
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
          <button onClick={openAddModal} className="btn-primary flex items-center gap-1.5 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            新增区域
          </button>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(area) }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-navy-700 transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(area) }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-status-critical hover:bg-navy-700 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className={`badge ${healthBadgeClass[area.healthStatus]} ${healthGlowClass[area.healthStatus]}`}>
                      {healthLabels[area.healthStatus]}
                    </div>
                  </div>
                </div>

                <Link to={`/areas/${area.id}`} className="block">
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
                </Link>
              </div>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? '编辑区域' : '新增区域'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-navy-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">区域名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="请输入区域名称"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">区域类型</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as Area['type'] }))}
                  className="input-field w-full"
                >
                  <option value="power_line">电力线路</option>
                  <option value="wind_farm">风电场</option>
                  <option value="pipeline">油气管道</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">区域描述</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="请输入区域描述"
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">纬度 (Lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.latitude}
                    onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">经度 (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.longitude}
                    onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
