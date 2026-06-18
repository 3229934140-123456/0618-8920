import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { ArrowLeft, Zap, Wind, Droplets, MapPin, List, Map, Calendar, Activity, Plus, Pencil, Trash2, X, Save, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import type { Area, InspectionPoint } from '@/types'

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

const statusColor: Record<string, string> = {
  normal: '#00D68F',
  attention: '#FFB800',
  abnormal: '#FF3D71',
}

interface AreaFormData {
  name: string
  type: Area['type']
  description: string
  latitude: string
  longitude: string
}

interface PointFormData {
  name: string
  latitude: string
  longitude: string
  deviceType: string
  templateId: string
}

function createPointIcon(status: string) {
  const color = statusColor[status] || '#9CA3AF'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 50%;
      box-shadow: 0 0 8px ${color}80, 0 0 20px ${color}40;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function AreaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const getAreaById = useAppStore(s => s.getAreaById)
  const getPointsByAreaId = useAppStore(s => s.getPointsByAreaId)
  const templates = useAppStore(s => s.templates)
  const addPoint = useAppStore(s => s.addPoint)
  const updatePoint = useAppStore(s => s.updatePoint)
  const deletePoint = useAppStore(s => s.deletePoint)
  const updateArea = useAppStore(s => s.updateArea)

  const area = getAreaById(id!)
  const points = getPointsByAreaId(id!)

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showAreaModal, setShowAreaModal] = useState(false)
  const [showPointModal, setShowPointModal] = useState(false)
  const [editingPointId, setEditingPointId] = useState<string | null>(null)
  const [areaForm, setAreaForm] = useState<AreaFormData>({
    name: '', type: 'power_line', description: '', latitude: '30.0', longitude: '120.0',
  })
  const [pointForm, setPointForm] = useState<PointFormData>({
    name: '', latitude: '30.0', longitude: '120.0', deviceType: '', templateId: '',
  })

  if (!area) {
    return (
      <div className="text-center py-20">
        <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">未找到该区域信息</p>
        <Link to="/areas" className="text-accent hover:underline mt-2 inline-block">返回区域列表</Link>
      </div>
    )
  }

  const TypeIcon = typeIcons[area.type] || MapPin

  const openAreaEditModal = () => {
    setAreaForm({
      name: area.name,
      type: area.type,
      description: area.description,
      latitude: String(area.coordinates[0]),
      longitude: String(area.coordinates[1]),
    })
    setShowAreaModal(true)
  }

  const closeAreaModal = () => {
    setShowAreaModal(false)
  }

  const handleAreaSubmit = () => {
    if (!areaForm.name.trim()) return
    const lat = parseFloat(areaForm.latitude) || 30.0
    const lng = parseFloat(areaForm.longitude) || 120.0
    updateArea(area.id, {
      name: areaForm.name.trim(),
      type: areaForm.type,
      description: areaForm.description.trim(),
      coordinates: [lat, lng] as [number, number],
    })
    closeAreaModal()
  }

  const openAddPointModal = () => {
    setEditingPointId(null)
    setPointForm({
      name: '',
      latitude: String(area.coordinates[0]),
      longitude: String(area.coordinates[1]),
      deviceType: '',
      templateId: templates[0]?.id || '',
    })
    setShowPointModal(true)
  }

  const openEditPointModal = (point: InspectionPoint) => {
    setEditingPointId(point.id)
    setPointForm({
      name: point.name,
      latitude: String(point.coordinates[0]),
      longitude: String(point.coordinates[1]),
      deviceType: point.deviceType,
      templateId: point.templateId,
    })
    setShowPointModal(true)
  }

  const closePointModal = () => {
    setShowPointModal(false)
    setEditingPointId(null)
  }

  const handlePointSubmit = () => {
    if (!pointForm.name.trim() || !pointForm.deviceType.trim() || !pointForm.templateId) return
    const lat = parseFloat(pointForm.latitude) || area.coordinates[0]
    const lng = parseFloat(pointForm.longitude) || area.coordinates[1]
    const data = {
      areaId: area.id,
      name: pointForm.name.trim(),
      coordinates: [lat, lng] as [number, number],
      deviceType: pointForm.deviceType.trim(),
      templateId: pointForm.templateId,
    }
    if (editingPointId) {
      updatePoint(editingPointId, data)
    } else {
      addPoint(data)
    }
    closePointModal()
  }

  const handleDeletePoint = (point: InspectionPoint) => {
    if (window.confirm(`确定要删除巡检点 "${point.name}" 吗？此操作不可恢复。`)) {
      deletePoint(point.id)
    }
  }

  const handleDeleteArea = () => {
    if (window.confirm(`确定要删除区域 "${area.name}" 吗？此操作将同时删除该区域下的所有巡检点、任务和缺陷数据，且不可恢复。`)) {
      useAppStore.getState().deleteArea(area.id)
      navigate('/areas')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/areas" className="btn-ghost p-2 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{area.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">区域详情与巡检点管理</p>
        </div>
        <button onClick={openAreaEditModal} className="btn-secondary flex items-center gap-1.5">
          <Pencil className="w-4 h-4" />
          编辑区域信息
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-accent" />
              </div>
              <span className="badge badge-info">{typeLabels[area.type]}</span>
              <div className={`badge ${healthBadgeClass[area.healthStatus]} ${healthGlowClass[area.healthStatus]}`}>
                {healthLabels[area.healthStatus]}
              </div>
            </div>

            <p className="text-gray-300">{area.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">巡检点数</p>
                <p className="stat-number text-white text-2xl">{area.pointCount}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">覆盖率</p>
                <p className="stat-number text-white text-2xl">{area.coverage}%</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 上次巡检
                </p>
                <p className="text-gray-300 text-sm mt-1">{area.lastInspectionDate || '暂无'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> 健康状态
                </p>
                <p className="text-sm mt-1">
                  <span className={`badge ${healthBadgeClass[area.healthStatus]}`}>
                    {healthLabels[area.healthStatus]}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">巡检覆盖率</span>
                <span className="stat-number text-white">{area.coverage}%</span>
              </div>
              <div className="h-2 bg-navy-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    area.coverage >= 90 ? 'bg-status-healthy' : area.coverage >= 75 ? 'bg-status-warning' : 'bg-status-critical'
                  }`}
                  style={{ width: `${area.coverage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">巡检点列表</h2>
        <div className="flex items-center gap-3">
          <button onClick={openAddPointModal} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            新增点位
          </button>
          <div className="flex bg-navy-800 rounded-lg p-0.5 border border-navy-600/30">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-navy-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              列表
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'map' ? 'bg-navy-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" />
              地图
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="card overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">名称</th>
                <th className="text-left px-4 py-3">设备类型</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-left px-4 py-3">上次巡检</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {points.map(point => (
                <tr key={point.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{point.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{point.deviceType}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusBadgeClass[point.status]}`}>
                      {statusLabels[point.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{point.lastInspectionDate || '暂无'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditPointModal(point)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-navy-700 transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePoint(point)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-status-critical hover:bg-navy-700 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {points.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    暂无巡检点数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="card overflow-hidden"
          style={{ height: 480 }}
        >
          <MapContainer
            center={area.coordinates}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map(point => (
              <Marker
                key={point.id}
                position={point.coordinates}
                icon={createPointIcon(point.status)}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{point.name}</p>
                    <p>设备类型：{point.deviceType}</p>
                    <p>状态：<span style={{ color: statusColor[point.status] }}>
                      {statusLabels[point.status]}
                    </span></p>
                    <p>上次巡检：{point.lastInspectionDate || '暂无'}</p>
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => { openEditPointModal(point) }}
                        className="text-xs px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => { handleDeletePoint(point) }}
                        className="text-xs px-2 py-1 rounded bg-status-critical/20 text-status-critical hover:bg-status-critical/30 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>
      )}

      {showAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">编辑区域信息</h2>
              <button onClick={closeAreaModal} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-navy-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">区域名称</label>
                <input
                  type="text"
                  value={areaForm.name}
                  onChange={e => setAreaForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="请输入区域名称"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">区域类型</label>
                <select
                  value={areaForm.type}
                  onChange={e => setAreaForm(f => ({ ...f, type: e.target.value as Area['type'] }))}
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
                  value={areaForm.description}
                  onChange={e => setAreaForm(f => ({ ...f, description: e.target.value }))}
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
                    value={areaForm.latitude}
                    onChange={e => setAreaForm(f => ({ ...f, latitude: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">经度 (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={areaForm.longitude}
                    onChange={e => setAreaForm(f => ({ ...f, longitude: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handleDeleteArea}
                className="text-status-critical hover:text-status-critical/80 text-sm font-medium transition-colors"
              >
                删除此区域
              </button>
              <div className="flex items-center gap-3">
                <button onClick={closeAreaModal} className="btn-secondary">
                  取消
                </button>
                <button onClick={handleAreaSubmit} className="btn-primary flex items-center gap-1.5">
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showPointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editingPointId ? '编辑巡检点' : '新增巡检点'}
              </h2>
              <button onClick={closePointModal} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-navy-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">点位名称</label>
                <input
                  type="text"
                  value={pointForm.name}
                  onChange={e => setPointForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="请输入点位名称，如：1号铁塔"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">设备类型</label>
                <input
                  type="text"
                  value={pointForm.deviceType}
                  onChange={e => setPointForm(f => ({ ...f, deviceType: e.target.value }))}
                  placeholder="铁塔/风机/阀室 等"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">巡检模板</label>
                <select
                  value={pointForm.templateId}
                  onChange={e => setPointForm(f => ({ ...f, templateId: e.target.value }))}
                  className="input-field w-full"
                >
                  {templates.length === 0 && <option value="">暂无可用模板</option>}
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.version})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">纬度 (Lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={pointForm.latitude}
                    onChange={e => setPointForm(f => ({ ...f, latitude: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">经度 (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={pointForm.longitude}
                    onChange={e => setPointForm(f => ({ ...f, longitude: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-navy-900/50 border border-navy-600/20">
                <Check className="w-4 h-4 text-status-healthy mt-0.5 shrink-0" />
                <p className="text-xs text-gray-400">
                  模板决定了该巡检点需要采集的照片/视频类型以及判定标准。请根据设备类型选择合适的巡检模板。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={closePointModal} className="btn-secondary">
                取消
              </button>
              <button onClick={handlePointSubmit} className="btn-primary flex items-center gap-1.5">
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
