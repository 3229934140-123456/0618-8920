import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { ArrowLeft, Zap, Wind, Droplets, MapPin, List, Map, Calendar, Activity } from 'lucide-react'
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
  const getAreaById = useAppStore(s => s.getAreaById)
  const getPointsByAreaId = useAppStore(s => s.getPointsByAreaId)

  const area = getAreaById(id!)
  const points = getPointsByAreaId(id!)

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/areas" className="btn-ghost p-2 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{area.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">区域详情与巡检点管理</p>
        </div>
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
                </tr>
              ))}
              {points.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
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
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>
      )}
    </div>
  )
}
