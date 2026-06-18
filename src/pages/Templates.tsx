import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Filter, Zap, Wind, Droplets, Clock, Camera, Video, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Pencil, Trash2, X, Save, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import type { TemplateItem, Standard } from '@/types'

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

const wizardAreaTypes = [
  { value: 'power_line', label: '高压线路', icon: Zap, desc: '杆塔、绝缘子、导线等电力设施巡检', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/40' },
  { value: 'wind_farm', label: '风电场', icon: Wind, desc: '风机叶片、塔筒、机舱等风电设施巡检', color: 'from-green-500/20 to-green-600/10 border-green-500/40' },
  { value: 'pipeline', label: '管道', icon: Droplets, desc: '油气管道、阀门、泵站等管线设施巡检', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/40' },
]

interface WizardItem {
  id: string
  name: string
  description: string
  captureType: 'photo' | 'video'
  required: boolean
  pass: string
  attention: string
  fail: string
}

function createEmptyItem(index: number): WizardItem {
  return {
    id: `ti${Date.now()}-${index}`,
    name: '',
    description: '',
    captureType: 'photo',
    required: true,
    pass: '',
    attention: '',
    fail: '',
  }
}

export default function Templates() {
  const templates = useAppStore(s => s.templates)
  const addTemplate = useAppStore(s => s.addTemplate)
  const updateTemplate = useAppStore(s => s.updateTemplate)
  const deleteTemplate = useAppStore(s => s.deleteTemplate)
  const [areaType, setAreaType] = useState('')

  const [wizardOpen, setWizardOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [selectedAreaType, setSelectedAreaType] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [items, setItems] = useState<WizardItem[]>([createEmptyItem(0)])

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filtered = areaType
    ? templates.filter(t => t.areaType === areaType)
    : templates

  const openWizard = () => {
    setEditMode(false)
    setEditingId(null)
    setWizardStep(1)
    setSelectedAreaType('')
    setTemplateName('')
    setItems([createEmptyItem(0)])
    setWizardOpen(true)
  }

  const openEditWizard = (tpl: typeof templates[number]) => {
    setEditMode(true)
    setEditingId(tpl.id)
    setWizardStep(1)
    setSelectedAreaType(tpl.areaType)
    setTemplateName(tpl.name)
    setItems(tpl.items.map(it => ({
      id: it.id,
      name: it.name,
      description: it.description,
      captureType: it.captureType,
      required: it.required,
      pass: it.standards.find(s => s.level === 'pass')?.description || '',
      attention: it.standards.find(s => s.level === 'attention')?.description || '',
      fail: it.standards.find(s => s.level === 'fail')?.description || '',
    })))
    setWizardOpen(true)
  }

  const closeWizard = () => {
    setWizardOpen(false)
  }

  const addItem = () => {
    setItems(prev => [...prev, createEmptyItem(prev.length)])
  }

  const removeItem = (id: string) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter(it => it.id !== id))
  }

  const updateItem = (id: string, patch: Partial<WizardItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }

  const canGoNext = () => {
    if (wizardStep === 1) return !!selectedAreaType
    if (wizardStep === 2) return templateName.trim().length > 0 && items.every(it => it.name.trim().length > 0)
    return true
  }

  const handleSave = () => {
    const templateItems: TemplateItem[] = items.map(it => {
      const standards: Standard[] = [
        { level: 'pass', description: it.pass },
        { level: 'attention', description: it.attention },
        { level: 'fail', description: it.fail },
      ]
      return {
        id: it.id,
        name: it.name,
        description: it.description,
        captureType: it.captureType,
        required: it.required,
        standards,
      }
    })

    if (editMode && editingId) {
      updateTemplate(editingId, { name: templateName, areaType: selectedAreaType, items: templateItems })
    } else {
      addTemplate({ name: templateName, areaType: selectedAreaType, items: templateItems })
    }
    closeWizard()
  }

  const handleDelete = (id: string) => {
    deleteTemplate(id)
    setDeleteConfirmId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">巡检模板</h1>
          <p className="text-gray-400 text-sm mt-1">管理无人机巡检拍摄模板与标准</p>
        </div>
        <button onClick={openWizard} className="btn-primary flex items-center gap-2">
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
            <div className="card-hover p-5 space-y-4 relative group">
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.preventDefault(); openEditWizard(tpl) }}
                  className="w-7 h-7 rounded-md bg-navy-700 hover:bg-accent/20 text-gray-400 hover:text-accent flex items-center justify-center transition-colors"
                  title="编辑模板"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setDeleteConfirmId(tpl.id) }}
                  className="w-7 h-7 rounded-md bg-navy-700 hover:bg-status-critical/20 text-gray-400 hover:text-status-critical flex items-center justify-center transition-colors"
                  title="删除模板"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <Link to={`/templates/${tpl.id}`} className="block">
                <div className="flex items-start justify-between pr-16">
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
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>暂无匹配的巡检模板</p>
        </div>
      )}

      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeWizard}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-navy-800 border border-navy-600/50 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700/50">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {editMode ? '编辑巡检模板' : '新建巡检模板'}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    {[1, 2].map(step => (
                      <div key={step} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                          wizardStep >= step
                            ? 'bg-accent text-white'
                            : 'bg-navy-700 text-gray-500'
                        }`}>
                          {wizardStep > step ? <CheckCircle2 size={14} /> : step}
                        </div>
                        <span className={`text-sm ${wizardStep >= step ? 'text-gray-200' : 'text-gray-500'}`}>
                          {step === 1 ? '选择区域类型' : '配置拍摄项目'}
                        </span>
                        {step < 2 && <ChevronRight size={14} className="text-gray-600" />}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={closeWizard}
                  className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {wizardStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-gray-400 mb-4">请选择该模板适用的巡检区域类型：</p>
                    <div className="grid grid-cols-3 gap-4">
                      {wizardAreaTypes.map(opt => {
                        const Icon = opt.icon
                        const isSelected = selectedAreaType === opt.value
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setSelectedAreaType(opt.value)}
                            className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 bg-gradient-to-br ${opt.color} ${
                              isSelected
                                ? 'border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                                : 'border-navy-600/50 hover:border-navy-500 hover:scale-[1.01]'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                                <CheckCircle2 size={16} className="text-white" />
                              </div>
                            )}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                              isSelected ? 'bg-accent/25' : 'bg-navy-900/50'
                            }`}>
                              <Icon size={24} className={isSelected ? 'text-accent' : 'text-gray-400'} />
                            </div>
                            <h3 className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                              {opt.label}
                            </h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{opt.desc}</p>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {wizardStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">模板名称</label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="例如：500kV线路标准巡检模板"
                        className="input-field w-full"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-300">拍摄项目列表</h3>
                        <button
                          onClick={addItem}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <Plus size={14} />
                          添加项目
                        </button>
                      </div>

                      {items.map((item, idx) => (
                        <div key={item.id} className="bg-navy-900/60 border border-navy-700/50 rounded-xl p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-md bg-accent/15 text-accent text-xs font-semibold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium text-white">拍摄项目</span>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={items.length <= 1}
                              className="w-7 h-7 rounded-md bg-navy-700 hover:bg-status-critical/20 text-gray-400 hover:text-status-critical disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1.5">项目名称 *</label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={e => updateItem(item.id, { name: e.target.value })}
                                placeholder="例如：杆塔全景拍摄"
                                className="input-field w-full text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1.5">拍摄方式</label>
                              <div className="flex gap-1 bg-navy-800 rounded-lg p-1">
                                <button
                                  onClick={() => updateItem(item.id, { captureType: 'photo' })}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    item.captureType === 'photo'
                                      ? 'bg-accent text-white shadow'
                                      : 'text-gray-400 hover:text-gray-200'
                                  }`}
                                >
                                  <Camera size={13} />
                                  拍照
                                </button>
                                <button
                                  onClick={() => updateItem(item.id, { captureType: 'video' })}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    item.captureType === 'video'
                                      ? 'bg-accent text-white shadow'
                                      : 'text-gray-400 hover:text-gray-200'
                                  }`}
                                >
                                  <Video size={13} />
                                  录像
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5">项目描述</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => updateItem(item.id, { description: e.target.value })}
                              placeholder="描述拍摄内容、角度要求等"
                              className="input-field w-full text-sm"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.required}
                                onChange={e => updateItem(item.id, { required: e.target.checked })}
                                className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-accent focus:ring-accent focus:ring-offset-navy-800"
                              />
                              <span className="text-xs text-gray-300">必拍项（巡检时必须完成）</span>
                            </label>
                          </div>

                          <div className="border-t border-navy-700/40 pt-4">
                            <h4 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                              <AlertTriangle size={12} />
                              合格标准
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 size={12} className="text-status-healthy" />
                                  <span className="text-xs font-medium text-status-healthy">合格</span>
                                </div>
                                <textarea
                                  value={item.pass}
                                  onChange={e => updateItem(item.id, { pass: e.target.value })}
                                  placeholder="符合标准的判定条件"
                                  rows={3}
                                  className="input-field w-full text-xs resize-none bg-status-healthy/5 border-status-healthy/20 focus:border-status-healthy/40"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle size={12} className="text-status-warning" />
                                  <span className="text-xs font-medium text-status-warning">关注</span>
                                </div>
                                <textarea
                                  value={item.attention}
                                  onChange={e => updateItem(item.id, { attention: e.target.value })}
                                  placeholder="需要关注的判定条件"
                                  rows={3}
                                  className="input-field w-full text-xs resize-none bg-status-warning/5 border-status-warning/20 focus:border-status-warning/40"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <XCircle size={12} className="text-status-critical" />
                                  <span className="text-xs font-medium text-status-critical">不合格</span>
                                </div>
                                <textarea
                                  value={item.fail}
                                  onChange={e => updateItem(item.id, { fail: e.target.value })}
                                  placeholder="不合格的判定条件"
                                  rows={3}
                                  className="input-field w-full text-xs resize-none bg-status-critical/5 border-status-critical/20 focus:border-status-critical/40"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-navy-700/50 bg-navy-900/50">
                <button
                  onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : closeWizard()}
                  className="btn-ghost flex items-center gap-1.5"
                >
                  {wizardStep > 1 ? <ChevronLeft size={16} /> : <X size={16} />}
                  {wizardStep > 1 ? '上一步' : '取消'}
                </button>
                <div className="flex items-center gap-2">
                  {wizardStep < 2 ? (
                    <button
                      onClick={() => setWizardStep(wizardStep + 1)}
                      disabled={!canGoNext()}
                      className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一步
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={!canGoNext()}
                      className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      {editMode ? '保存修改' : '创建模板'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-navy-800 border border-navy-600/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-status-critical/15 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} className="text-status-critical" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">确认删除</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    删除后将无法恢复，相关任务中的模板引用也可能受影响。确定要删除该模板吗？
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="btn-primary !bg-status-critical hover:!bg-status-critical/90 !border-status-critical"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
