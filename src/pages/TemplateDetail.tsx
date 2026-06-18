import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Camera, Video, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'

const levelConfig: Record<string, { badge: string; icon: typeof CheckCircle2; label: string }> = {
  pass: { badge: 'badge-healthy', icon: CheckCircle2, label: '合格' },
  attention: { badge: 'badge-warning', icon: AlertTriangle, label: '关注' },
  fail: { badge: 'badge-critical', icon: XCircle, label: '不合格' },
}

const captureTypeConfig: Record<string, { icon: typeof Camera; label: string }> = {
  photo: { icon: Camera, label: '拍照' },
  video: { icon: Video, label: '录像' },
}

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const getTemplateById = useAppStore(s => s.getTemplateById)
  const template = getTemplateById(id!)

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  if (!template) {
    return (
      <div className="p-6 text-center py-20 text-gray-500">
        <FileText size={48} className="mx-auto mb-3 opacity-30" />
        <p>未找到该模板</p>
        <Link to="/templates" className="text-accent text-sm mt-2 inline-block hover:underline">
          返回模板列表
        </Link>
      </div>
    )
  }

  const selectedItem = template.items.find(it => it.id === selectedItemId) || template.items[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/templates" className="hover:text-accent transition-colors">巡检模板</Link>
        <ChevronRight size={14} />
        <span className="text-gray-200">{template.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <FileText size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{template.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="badge badge-info">{template.areaType}</span>
              <span className="text-xs font-mono text-gray-500">版本 {template.version}</span>
              <span className="text-xs text-gray-500">共 {template.items.length} 项</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        <div className="w-72 shrink-0 space-y-1">
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-3">拍摄项目</h2>
          {template.items.map((item, i) => {
            const ct = captureTypeConfig[item.captureType]
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedItemId(item.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  selectedItem.id === item.id
                    ? 'bg-accent/15 border border-accent/30 text-white'
                    : 'hover:bg-navy-800 text-gray-300 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                  selectedItem.id === item.id ? 'bg-accent/25' : 'bg-navy-700'
                }`}>
                  <ct.icon size={16} className={selectedItem.id === item.id ? 'text-accent' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{ct.label}</span>
                    {item.required && (
                      <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">必拍</span>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="flex-1 min-w-0">
          <motion.div
            key={selectedItem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-6 space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{selectedItem.name}</h2>
                <div className="flex items-center gap-2">
                  {(() => {
                    const ct = captureTypeConfig[selectedItem.captureType]
                    return (
                      <span className="badge badge-info flex items-center gap-1">
                        <ct.icon size={12} />
                        {ct.label}
                      </span>
                    )
                  })()}
                  {selectedItem.required && (
                    <span className="badge bg-accent/15 text-accent border border-accent/30">必拍项</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400">{selectedItem.description}</p>
            </div>

            <div className="border-t border-navy-700/40 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-4">判定标准</h3>
              <div className="grid grid-cols-3 gap-4">
                {selectedItem.standards.map(std => {
                  const cfg = levelConfig[std.level]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={std.level}
                      className={`rounded-xl p-4 space-y-3 border ${
                        std.level === 'pass'
                          ? 'bg-status-healthy/5 border-status-healthy/20'
                          : std.level === 'attention'
                          ? 'bg-status-warning/5 border-status-warning/20'
                          : 'bg-status-critical/5 border-status-critical/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={
                          std.level === 'pass' ? 'text-status-healthy'
                            : std.level === 'attention' ? 'text-status-warning'
                            : 'text-status-critical'
                        } />
                        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{std.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
