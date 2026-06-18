import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Camera, Video, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Save, Plus, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import type { TemplateItem, Standard } from '@/types'

const levelConfig: Record<string, { badge: string; icon: typeof CheckCircle2; label: string }> = {
  pass: { badge: 'badge-healthy', icon: CheckCircle2, label: '合格' },
  attention: { badge: 'badge-warning', icon: AlertTriangle, label: '关注' },
  fail: { badge: 'badge-critical', icon: XCircle, label: '不合格' },
}

const captureTypeConfig: Record<string, { icon: typeof Camera; label: string }> = {
  photo: { icon: Camera, label: '拍照' },
  video: { icon: Video, label: '录像' },
}

const areaTypeLabel: Record<string, string> = {
  power_line: '高压线路',
  wind_farm: '风电场',
  pipeline: '管道',
}

interface EditableItem {
  id: string
  name: string
  description: string
  captureType: 'photo' | 'video'
  required: boolean
  standards: Standard[]
}

function itemToEditable(item: TemplateItem): EditableItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    captureType: item.captureType,
    required: item.required,
    standards: item.standards.map(s => ({ ...s })),
  }
}

function editableToItem(item: EditableItem): TemplateItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    captureType: item.captureType,
    required: item.required,
    standards: item.standards,
  }
}

function createEmptyItem(index: number): EditableItem {
  return {
    id: `ti${Date.now()}-${index}`,
    name: '',
    description: '',
    captureType: 'photo',
    required: true,
    standards: [
      { level: 'pass', description: '' },
      { level: 'attention', description: '' },
      { level: 'fail', description: '' },
    ],
  }
}

interface NewItemForm {
  name: string
  captureType: 'photo' | 'video'
  required: boolean
  pass: string
  attention: string
  fail: string
}

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const getTemplateById = useAppStore(s => s.getTemplateById)
  const updateTemplate = useAppStore(s => s.updateTemplate)
  const template = getTemplateById(id!)

  const [name, setName] = useState(template?.name || '')
  const [items, setItems] = useState<EditableItem[]>(
    template?.items.map(itemToEditable) || []
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<NewItemForm>({
    name: '',
    captureType: 'photo',
    required: true,
    pass: '',
    attention: '',
    fail: '',
  })

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

  const effectiveItems = items.length > 0 ? items : (template.items.map(itemToEditable))
  const selectedItem = effectiveItems.find(it => it.id === selectedItemId) || effectiveItems[0]

  const updateItem = (itemId: string, patch: Partial<EditableItem>) => {
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, ...patch } : it))
  }

  const updateItemStandard = (itemId: string, level: 'pass' | 'attention' | 'fail', description: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it
      return {
        ...it,
        standards: it.standards.map(s => s.level === level ? { ...s, description } : s),
      }
    }))
  }

  const deleteItem = (itemId: string) => {
    const newItems = effectiveItems.filter(it => it.id !== itemId)
    setItems(newItems)
    if (selectedItemId === itemId) {
      setSelectedItemId(newItems[0]?.id || null)
    }
  }

  const handleAddItem = () => {
    if (!newItem.name.trim()) return
    const empty = createEmptyItem(effectiveItems.length)
    const added: EditableItem = {
      ...empty,
      name: newItem.name,
      captureType: newItem.captureType,
      required: newItem.required,
      standards: [
        { level: 'pass', description: newItem.pass },
        { level: 'attention', description: newItem.attention },
        { level: 'fail', description: newItem.fail },
      ],
    }
    setItems([...effectiveItems, added])
    setSelectedItemId(added.id)
    setShowAddForm(false)
    setNewItem({
      name: '',
      captureType: 'photo',
      required: true,
      pass: '',
      attention: '',
      fail: '',
    })
  }

  const handleSave = () => {
    const finalItems = effectiveItems.map(editableToItem)
    updateTemplate(id!, { name: name.trim() || template.name, items: finalItems })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/templates" className="hover:text-accent transition-colors">巡检模板</Link>
        <ChevronRight size={14} />
        <span className="text-gray-200">{template.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-navy-600 focus:border-accent focus:outline-none transition-colors w-full max-w-md pb-0.5"
            />
            <div className="flex items-center gap-3 mt-1">
              <span className="badge badge-info">{areaTypeLabel[template.areaType] || template.areaType}</span>
              <span className="text-xs font-mono text-gray-500">版本 {template.version}</span>
              <span className="text-xs text-gray-500">共 {effectiveItems.length} 项</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Save size={16} />
          保存修改
        </button>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        <div className="w-72 shrink-0 flex flex-col">
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-3">拍摄项目</h2>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {effectiveItems.map((item, i) => {
              const ct = captureTypeConfig[item.captureType]
              const isSelected = selectedItem?.id === item.id
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative"
                >
                  <button
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 pr-10 ${
                      isSelected
                        ? 'bg-accent/15 border border-accent/30 text-white'
                        : 'hover:bg-navy-800 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-accent/25' : 'bg-navy-700'
                    }`}>
                      <ct.icon size={16} className={isSelected ? 'text-accent' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name || '未命名项目'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{ct.label}</span>
                        {item.required && (
                          <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">必拍</span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-navy-700/80 hover:bg-status-critical/20 text-gray-500 hover:text-status-critical opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                    title="删除项目"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              )
            })}
          </div>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              <Plus size={14} />
              添加拍摄项目
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 bg-navy-800 border border-navy-600/50 rounded-xl p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">新建拍摄项目</span>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewItem({ name: '', captureType: 'photo', required: true, pass: '', attention: '', fail: '' })
                  }}
                  className="w-5 h-5 rounded hover:bg-navy-700 text-gray-500 hover:text-gray-300 flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">项目名称 *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入名称"
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">拍摄方式</label>
                <div className="flex gap-1 bg-navy-900 rounded-md p-0.5">
                  <button
                    onClick={() => setNewItem(prev => ({ ...prev, captureType: 'photo' }))}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-all ${
                      newItem.captureType === 'photo'
                        ? 'bg-accent text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Camera size={11} />
                    拍照
                  </button>
                  <button
                    onClick={() => setNewItem(prev => ({ ...prev, captureType: 'video' }))}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-all ${
                      newItem.captureType === 'video'
                        ? 'bg-accent text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Video size={11} />
                    录像
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newItem.required}
                  onChange={e => setNewItem(prev => ({ ...prev, required: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-navy-600 bg-navy-900 text-accent focus:ring-accent focus:ring-offset-navy-800"
                />
                <span className="text-[11px] text-gray-400">必拍项</span>
              </label>

              <div className="space-y-2 pt-1 border-t border-navy-700/40">
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-status-healthy mb-1">
                    <CheckCircle2 size={10} /> 合格
                  </label>
                  <textarea
                    value={newItem.pass}
                    onChange={e => setNewItem(prev => ({ ...prev, pass: e.target.value }))}
                    placeholder="合格标准"
                    rows={2}
                    className="input-field w-full text-[11px] resize-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-status-warning mb-1">
                    <AlertTriangle size={10} /> 关注
                  </label>
                  <textarea
                    value={newItem.attention}
                    onChange={e => setNewItem(prev => ({ ...prev, attention: e.target.value }))}
                    placeholder="关注标准"
                    rows={2}
                    className="input-field w-full text-[11px] resize-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] text-status-critical mb-1">
                    <XCircle size={10} /> 不合格
                  </label>
                  <textarea
                    value={newItem.fail}
                    onChange={e => setNewItem(prev => ({ ...prev, fail: e.target.value }))}
                    placeholder="不合格标准"
                    rows={2}
                    className="input-field w-full text-[11px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewItem({ name: '', captureType: 'photo', required: true, pass: '', attention: '', fail: '' })
                  }}
                  className="btn-ghost flex-1 text-xs py-1.5"
                >
                  取消
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.name.trim()}
                  className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <Plus size={12} />
                  添加
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {selectedItem && (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="card p-6 space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">项目名称</label>
                        <input
                          type="text"
                          value={selectedItem.name}
                          onChange={e => updateItem(selectedItem.id, { name: e.target.value })}
                          className="input-field w-full text-lg font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">项目描述</label>
                        <input
                          type="text"
                          value={selectedItem.description}
                          onChange={e => updateItem(selectedItem.id, { description: e.target.value })}
                          placeholder="描述拍摄内容、角度要求等"
                          className="input-field w-full text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 shrink-0 w-48">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">拍摄方式</label>
                        <div className="flex gap-1 bg-navy-900 rounded-lg p-1">
                          <button
                            onClick={() => updateItem(selectedItem.id, { captureType: 'photo' })}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                              selectedItem.captureType === 'photo'
                                ? 'bg-accent text-white shadow'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <Camera size={12} />
                            拍照
                          </button>
                          <button
                            onClick={() => updateItem(selectedItem.id, { captureType: 'video' })}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                              selectedItem.captureType === 'video'
                                ? 'bg-accent text-white shadow'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <Video size={12} />
                            录像
                          </button>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedItem.required}
                          onChange={e => updateItem(selectedItem.id, { required: e.target.checked })}
                          className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-accent focus:ring-accent focus:ring-offset-navy-800"
                        />
                        <span className="text-xs text-gray-300">必拍项</span>
                      </label>
                    </div>
                  </div>
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
                          <textarea
                            value={std.description}
                            onChange={e => updateItemStandard(selectedItem.id, std.level as 'pass' | 'attention' | 'fail', e.target.value)}
                            placeholder={`输入${cfg.label}判定标准描述...`}
                            rows={6}
                            className={`w-full text-sm text-gray-300 leading-relaxed resize-none bg-transparent border border-transparent rounded-lg p-2 focus:outline-none focus:border-navy-600/50 transition-colors ${
                              std.level === 'pass' ? 'placeholder:text-status-healthy/30'
                                : std.level === 'attention' ? 'placeholder:text-status-warning/30'
                                : 'placeholder:text-status-critical/30'
                            }`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
