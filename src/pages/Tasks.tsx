import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, User, Calendar, MapPin, ArrowRight, AlertCircle, Plus, Check, ChevronLeft, ChevronRight, X, CheckCircle2, Zap, Wind, Droplets, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: '待领取', badge: 'badge badge-info', dot: 'bg-status-info' },
  assigned: { label: '已分配', badge: 'badge badge-warning', dot: 'bg-status-warning' },
  in_progress: { label: '执行中', badge: 'badge badge-healthy', dot: 'bg-status-healthy' },
  completed: { label: '已完成', badge: 'badge badge-healthy opacity-70', dot: 'bg-status-healthy' },
  overdue: { label: '已逾期', badge: 'badge badge-critical', dot: 'bg-status-critical' },
}

const columnOrder: Array<keyof typeof statusConfig> = ['pending', 'assigned', 'in_progress', 'completed', 'overdue']

const areaTypeIcon: Record<string, typeof Zap> = {
  power_line: Zap,
  wind_farm: Wind,
  pipeline: Droplets,
  other: Filter,
}

const areaTypeLabel: Record<string, string> = {
  power_line: '高压线路',
  wind_farm: '风电场',
  pipeline: '管道',
  other: '其他',
}

export default function Tasks() {
  const { tasks, areas, claimTask, templates, getPointsByAreaId, createTask } = useAppStore()

  const columns = columnOrder.map(status => ({
    status,
    ...statusConfig[status],
    tasks: tasks.filter(t => t.status === status),
  }))

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([])

  const openWizard = () => {
    setWizardStep(1)
    setSelectedAreaId('')
    setSelectedTemplateId('')
    setScheduledDate('')
    setSelectedPointIds([])
    setWizardOpen(true)
  }

  const closeWizard = () => {
    setWizardOpen(false)
  }

  const selectedArea = areas.find(a => a.id === selectedAreaId)
  const availableTemplates = selectedArea
    ? templates.filter(t => t.areaType === selectedArea.type)
    : []
  const areaPoints = selectedAreaId ? getPointsByAreaId(selectedAreaId) : []
  const allPointsSelected = areaPoints.length > 0 && selectedPointIds.length === areaPoints.length

  const filteredTemplates = selectedArea
    ? templates.filter(t => t.areaType === selectedArea.type)
    : []

  const togglePoint = (pointId: string) => {
    setSelectedPointIds(prev =>
      prev.includes(pointId)
        ? prev.filter(id => id !== pointId)
        : [...prev, pointId]
    )
  }

  const toggleAllPoints = () => {
    if (allPointsSelected) {
      setSelectedPointIds([])
    } else {
      setSelectedPointIds(areaPoints.map(p => p.id))
    }
  }

  const canGoNext = () => {
    if (wizardStep === 1) return !!selectedAreaId
    if (wizardStep === 2) return !!selectedTemplateId && !!scheduledDate
    if (wizardStep === 3) return selectedPointIds.length > 0
    return true
  }

  const handleSave = () => {
    createTask({
      templateId: selectedTemplateId,
      areaId: selectedAreaId,
      scheduledDate,
      pointIds: selectedPointIds,
    })
    closeWizard()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            任务调度
          </h1>
          <p className="text-sm text-gray-500 mt-1">共 {tasks.length} 个巡检任务</p>
        </div>
        <button
          onClick={openWizard}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          新建任务
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.status} className="flex-shrink-0 w-[280px] flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-sm font-medium text-gray-300">{col.label}</span>
              <span className="text-xs text-gray-600 ml-auto">{col.tasks.length}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {col.tasks.length === 0 && (
                <div className="card rounded-lg p-4 text-center text-gray-600 text-sm">
                  暂无任务
                </div>
              )}
              {col.tasks.map((task, i) => {
                const area = areas.find(a => a.id === task.areaId)
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/tasks/${task.id}`} className="block">
                      <div className="card-hover rounded-lg p-3.5 cursor-pointer group">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-white group-hover:text-accent transition-colors leading-tight">
                            {area?.name || '未知区域'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-accent transition-colors flex-shrink-0 mt-0.5" />
                        </div>

                        <div className="space-y-1.5 mb-3">
                          {task.pilotName ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <User className="w-3 h-3" />
                              <span>{task.pilotName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <User className="w-3 h-3" />
                              <span>未分配</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{task.scheduledDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span>{task.points.length} 个点位</span>
                          </div>
                        </div>

                        {task.status === 'overdue' && (
                          <div className="flex items-center gap-1 text-xs text-status-critical mb-2">
                            <AlertCircle className="w-3 h-3" />
                            <span>已逾期，请尽快处理</span>
                          </div>
                        )}

                        {task.status === 'pending' && (
                          <button
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              claimTask(task.id, 'p2', '李明')
                            }}
                            className="btn-primary w-full text-xs py-1.5"
                          >
                            领取任务
                          </button>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

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
              className="bg-navy-800 border border-navy-600/50 rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700/50">
                <div>
                  <h2 className="text-lg font-semibold text-white">新建巡检任务</h2>
                  <div className="flex items-center gap-4 mt-2">
                    {[1, 2, 3].map(step => (
                      <div key={step} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                          wizardStep >= step
                            ? 'bg-accent text-white'
                            : 'bg-navy-700 text-gray-500'
                        }`}>
                          {wizardStep > step ? <CheckCircle2 size={14} /> : step}
                        </div>
                        <span className={`text-sm ${wizardStep >= step ? 'text-gray-200' : 'text-gray-500'}`}>
                          {step === 1 ? '选择区域' : step === 2 ? '选择模板' : '选择点位'}
                        </span>
                        {step < 3 && <ChevronRight size={14} className="text-gray-600" />}
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
                    <p className="text-sm text-gray-400 mb-4">请选择巡检任务所属的区域：</p>
                    <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                      {areas.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-gray-500">
                          <MapPin size={36} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">暂无可用区域，请先创建区域</p>
                        </div>
                      ) : (
                        areas.map(area => {
                          const Icon = areaTypeIcon[area.type] || Filter
                          const isSelected = selectedAreaId === area.id
                          return (
                            <button
                              key={area.id}
                              onClick={() => setSelectedAreaId(area.id)}
                              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                isSelected
                                  ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                                  : 'border-navy-600/50 bg-navy-900/40 hover:border-navy-500'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                  <Check size={12} className="text-white" />
                                </div>
                              )}
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-accent/25' : 'bg-navy-800'
                                }`}>
                                  <Icon size={20} className={isSelected ? 'text-accent' : 'text-gray-400'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-medium mb-0.5 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                    {area.name}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{areaTypeLabel[area.type] || area.type}</span>
                                    <span>·</span>
                                    <span>{area.pointCount} 个点位</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`badge ${
                                      area.healthStatus === 'healthy' ? 'badge-healthy' :
                                      area.healthStatus === 'warning' ? 'badge-warning' : 'badge-critical'
                                    }`}>
                                      {area.healthStatus === 'healthy' ? '正常' :
                                       area.healthStatus === 'warning' ? '关注' : '异常'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      覆盖率 {area.coverage}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })
                      )}
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        选择巡检模板
                        <span className="text-xs text-gray-500 ml-2">
                          （已匹配 "{selectedArea?.name}" 区域类型）
                        </span>
                      </label>
                      <div className="space-y-2 max-h-[32vh] overflow-y-auto pr-2">
                        {filteredTemplates.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-navy-900/40 rounded-xl border border-navy-700/40">
                            <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">该区域类型暂无可用模板</p>
                            <p className="text-xs text-gray-600 mt-1">请先创建匹配的巡检模板</p>
                          </div>
                        ) : (
                          filteredTemplates.map(tpl => {
                            const isSelected = selectedTemplateId === tpl.id
                            return (
                              <button
                                key={tpl.id}
                                onClick={() => setSelectedTemplateId(tpl.id)}
                                className={`w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                                  isSelected
                                    ? 'border-accent bg-accent/5'
                                    : 'border-navy-600/50 bg-navy-900/40 hover:border-navy-500'
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-accent/25' : 'bg-navy-800'
                                }`}>
                                  <ClipboardList size={18} className={isSelected ? 'text-accent' : 'text-gray-400'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className={`font-medium truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                      {tpl.name}
                                    </h3>
                                    <span className="text-[10px] font-mono text-gray-500 bg-navy-800 px-1.5 py-0.5 rounded shrink-0">
                                      {tpl.version}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {tpl.items.length} 个拍摄项目 · 必拍 {tpl.items.filter(i => i.required).length} 项
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'border-accent bg-accent'
                                    : 'border-navy-600'
                                }`}>
                                  {isSelected && <Check size={12} className="text-white" />}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        计划执行日期
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                  </motion.div>
                )}

                {wizardStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300 font-medium">选择巡检点位</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          已选 {selectedPointIds.length} / {areaPoints.length} 个点位
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg bg-navy-900/60 border border-navy-700/50 hover:border-navy-600 transition-colors">
                        <input
                          type="checkbox"
                          checked={allPointsSelected}
                          onChange={toggleAllPoints}
                          className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-accent focus:ring-accent focus:ring-offset-navy-800"
                        />
                        <span className="text-xs text-gray-300">全选</span>
                      </label>
                    </div>

                    <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2">
                      {areaPoints.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-navy-900/40 rounded-xl border border-navy-700/40">
                          <MapPin size={36} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">该区域暂无巡检点位</p>
                        </div>
                      ) : (
                        areaPoints.map(point => {
                          const isSelected = selectedPointIds.includes(point.id)
                          return (
                            <button
                              key={point.id}
                              onClick={() => togglePoint(point.id)}
                              className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                                isSelected
                                  ? 'border-accent/50 bg-accent/5'
                                  : 'border-navy-600/40 bg-navy-900/30 hover:border-navy-500'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-accent/25' : 'bg-navy-800'
                              }`}>
                                <MapPin size={16} className={isSelected ? 'text-accent' : 'text-gray-500'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                  {point.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-gray-500">{point.deviceType}</span>
                                  {point.status === 'normal' && (
                                    <span className="badge badge-healthy !text-[10px] !py-0">正常</span>
                                  )}
                                  {point.status === 'attention' && (
                                    <span className="badge badge-warning !text-[10px] !py-0">关注</span>
                                  )}
                                  {point.status === 'abnormal' && (
                                    <span className="badge badge-critical !text-[10px] !py-0">异常</span>
                                  )}
                                  {point.lastInspectionDate && (
                                    <span className="text-[10px] text-gray-600 ml-auto">
                                      上次: {point.lastInspectionDate}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'border-accent bg-accent'
                                  : 'border-navy-600'
                              }`}>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                            </button>
                          )
                        })
                      )}
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
                  {wizardStep < 3 ? (
                    <button
                      onClick={() => {
                        if (wizardStep === 1) {
                          const matchingTpls = templates.filter(t => t.areaType === selectedArea?.type)
                          if (matchingTpls.length > 0) {
                            setSelectedTemplateId(matchingTpls[0].id)
                          }
                        }
                        if (wizardStep === 2) {
                          const defaultDate = new Date().toISOString().split('T')[0]
                          if (!scheduledDate) setScheduledDate(defaultDate)
                        }
                        setWizardStep(wizardStep + 1)
                      }}
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
                      <Check size={16} />
                      创建任务
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
