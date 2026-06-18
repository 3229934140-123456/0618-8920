import { create } from 'zustand'
import type { Area, InspectionPoint, InspectionTemplate, InspectionTask, Defect, WorkOrder, Pilot, TemplateItem } from '@/types'
import { areas as mockAreas, inspectionPoints as mockPoints, templates as mockTemplates, tasks as mockTasks, defects as mockDefects, workOrders as mockWorkOrders, pilots as mockPilots } from '@/data/mockData'

interface NewAreaData {
  name: string
  type: Area['type']
  description: string
  coordinates: [number, number]
}

interface NewPointData {
  areaId: string
  name: string
  coordinates: [number, number]
  deviceType: string
  templateId: string
}

interface NewTemplateData {
  name: string
  areaType: string
  items: TemplateItem[]
}

interface NewTaskData {
  templateId: string
  areaId: string
  scheduledDate: string
  pointIds: string[]
}

interface AppState {
  areas: Area[]
  points: InspectionPoint[]
  templates: InspectionTemplate[]
  tasks: InspectionTask[]
  defects: Defect[]
  workOrders: WorkOrder[]
  pilots: Pilot[]
  sidebarCollapsed: boolean
  currentRole: 'admin' | 'manager' | 'pilot'

  toggleSidebar: () => void
  setRole: (role: 'admin' | 'manager' | 'pilot') => void

  addArea: (data: NewAreaData) => Area
  updateArea: (id: string, data: Partial<NewAreaData>) => void
  deleteArea: (id: string) => void

  addPoint: (data: NewPointData) => InspectionPoint
  updatePoint: (id: string, data: Partial<NewPointData>) => void
  deletePoint: (id: string) => void

  addTemplate: (data: NewTemplateData) => InspectionTemplate
  updateTemplate: (id: string, data: Partial<NewTemplateData> & { items?: TemplateItem[] }) => void
  deleteTemplate: (id: string) => void

  createTask: (data: NewTaskData) => InspectionTask
  claimTask: (taskId: string, pilotId: string, pilotName: string) => void
  startTask: (taskId: string) => void
  completePoint: (taskId: string, pointId: string) => void
  completeTask: (taskId: string) => void

  addCapture: (taskId: string, pointId: string, type: 'photo' | 'video', fileUrl: string, thumbnailUrl: string) => void
  runAIRecognition: (taskId: string, pointId: string) => Defect[]

  confirmDefect: (defectId: string, note: string) => void
  updateDefectStatus: (defectId: string, status: Defect['status']) => void
  createWorkOrder: (defectId: string, assignee: string, description: string) => void
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrder['status']) => void

  getAreaById: (id: string) => Area | undefined
  getPointsByAreaId: (areaId: string) => InspectionPoint[]
  getTemplateById: (id: string) => InspectionTemplate | undefined
  getTaskById: (id: string) => InspectionTask | undefined
  getDefectsByAreaId: (areaId: string) => Defect[]
  getDefectsByTaskId: (taskId: string) => Defect[]
  getDefectsByPointId: (pointId: string) => Defect[]
  getWorkOrderByDefectId: (defectId: string) => WorkOrder | undefined
  getWorkOrderById: (id: string) => WorkOrder | undefined
  getCapturesByPoint: (taskId: string, pointId: string) => { type: 'photo' | 'video'; url: string; thumbnailUrl: string; id: string }[]
}

const today = () => new Date().toISOString().split('T')[0]

const recalcAreaStats = (areas: Area[], points: InspectionPoint[], tasks: InspectionTask[], defects: Defect[]): Area[] => {
  return areas.map(area => {
    const areaPoints = points.filter(p => p.areaId === area.id)
    const areaPointIds = areaPoints.map(p => p.id)
    const areaTasks = tasks.filter(t => t.areaId === area.id)
    const completedTaskPoints = areaTasks.flatMap(t => t.points.filter(p =>
      p.status === 'completed' && areaPointIds.includes(p.pointId)
    ))
    const uniqueCompletedPointIds = new Set(completedTaskPoints.map(p => p.pointId))
    const coverage = areaPoints.length > 0
      ? Math.round((uniqueCompletedPointIds.size / areaPoints.length) * 1000) / 10
      : 0
    const areaDefects = defects.filter(d => d.areaId === area.id)
    const criticalCount = areaDefects.filter(d => d.severity === 'critical' || d.severity === 'high').length
    const openCritical = criticalCount > 0
    const hasAttention = areaDefects.some(d => d.severity === 'medium' || d.severity === 'low')
    let healthStatus: Area['healthStatus'] = 'healthy'
    if (coverage < 60 || openCritical) healthStatus = 'critical'
    else if (coverage < 80 || hasAttention) healthStatus = 'warning'
    const lastDate = [...areaTasks]
      .filter(t => t.status === 'completed')
      .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))[0]?.completedDate || null
    return {
      ...area,
      pointCount: areaPoints.length,
      coverage,
      healthStatus,
      lastInspectionDate: lastDate
    }
  })
}

const defectTypes: Defect['type'][] = ['crack', 'rust', 'foreign_object', 'other']
const defectDesc: Record<Defect['type'], string[]> = {
  crack: ['检测到表面裂纹,长约5cm', '焊缝处检测到微裂纹', '结构件出现纵向裂纹'],
  rust: ['表面局部锈蚀,面积约10cm²', '连接处检测到锈蚀', '金属外壳涂层破损锈蚀'],
  foreign_object: ['检测到异物缠绕', '周围有施工材料堆积', '线路旁有漂浮物'],
  other: ['检测到结构轻微变形', '连接件出现松动迹象', '密封胶老化脱落'],
}

export const useAppStore = create<AppState>((set, get) => ({
  areas: mockAreas,
  points: mockPoints,
  templates: mockTemplates,
  tasks: mockTasks,
  defects: mockDefects,
  workOrders: mockWorkOrders,
  pilots: mockPilots,
  sidebarCollapsed: false,
  currentRole: 'manager',

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setRole: (role) => set({ currentRole: role }),

  addArea: (data) => {
    const newArea: Area = {
      id: `a${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description,
      coordinates: data.coordinates,
      pointCount: 0,
      coverage: 0,
      healthStatus: 'healthy',
      lastInspectionDate: null,
    }
    set(s => ({ areas: [...s.areas, newArea] }))
    return newArea
  },

  updateArea: (id, data) => set(s => ({
    areas: s.areas.map(a => a.id === id ? { ...a, ...data } : a)
  })),

  deleteArea: (id) => set(s => {
    const pointIds = s.points.filter(p => p.areaId === id).map(p => p.id)
    return {
      areas: s.areas.filter(a => a.id !== id),
      points: s.points.filter(p => p.areaId !== id),
      tasks: s.tasks.filter(t => t.areaId !== id),
      defects: s.defects.filter(d => d.areaId !== id),
    }
  }),

  addPoint: (data) => {
    const newPoint: InspectionPoint = {
      id: `ip${Date.now()}`,
      areaId: data.areaId,
      name: data.name,
      coordinates: data.coordinates,
      deviceType: data.deviceType,
      templateId: data.templateId,
      lastInspectionDate: null,
      status: 'normal',
    }
    set(s => {
      const newPoints = [...s.points, newPoint]
      return {
        points: newPoints,
        areas: recalcAreaStats(s.areas, newPoints, s.tasks, s.defects)
      }
    })
    return newPoint
  },

  updatePoint: (id, data) => set(s => ({
    points: s.points.map(p => p.id === id ? { ...p, ...data } : p)
  })),

  deletePoint: (id) => set(s => {
    const point = s.points.find(p => p.id === id)
    const newPoints = s.points.filter(p => p.id !== id)
    return {
      points: newPoints,
      areas: recalcAreaStats(s.areas, newPoints, s.tasks, s.defects),
      tasks: s.tasks.map(t => t.areaId === point?.areaId
        ? { ...t, points: t.points.filter(p => p.pointId !== id) }
        : t
      ),
    }
  }),

  addTemplate: (data) => {
    const todayStr = today()
    const newTpl: InspectionTemplate = {
      id: `tpl${Date.now()}`,
      name: data.name,
      areaType: data.areaType,
      version: 'v1.0',
      items: data.items,
      createdAt: todayStr,
      updatedAt: todayStr,
    }
    set(s => ({ templates: [...s.templates, newTpl] }))
    return newTpl
  },

  updateTemplate: (id, data) => set(s => ({
    templates: s.templates.map(t => t.id === id ? {
      ...t,
      name: data.name ?? t.name,
      areaType: data.areaType ?? t.areaType,
      items: data.items ?? t.items,
      updatedAt: today(),
    } : t)
  })),

  deleteTemplate: (id) => set(s => ({
    templates: s.templates.filter(t => t.id !== id)
  })),

  createTask: (data) => {
    const pts = get().points.filter(p => data.pointIds.includes(p.id))
    const route: [number, number][] = pts.map(p => p.coordinates)
    const newTask: InspectionTask = {
      id: `t${Date.now()}`,
      templateId: data.templateId,
      areaId: data.areaId,
      pilotId: null,
      pilotName: null,
      status: 'pending',
      scheduledDate: data.scheduledDate,
      completedDate: null,
      route,
      points: pts.map(p => ({
        pointId: p.id,
        pointName: p.name,
        status: 'pending',
        captures: [],
        completedAt: null,
      }))
    }
    set(s => ({ tasks: [...s.tasks, newTask] }))
    return newTask
  },

  claimTask: (taskId, pilotId, pilotName) => set(s => ({
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, pilotId, pilotName, status: 'assigned' as const } : t)
  })),

  startTask: (taskId) => set(s => ({
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'in_progress' as const } : t)
  })),

  completePoint: (taskId, pointId) => set(s => {
    const updatedTasks = s.tasks.map(t => t.id === taskId ? {
      ...t,
      points: t.points.map(p => p.pointId === pointId ? {
        ...p,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      } : p)
    } : t)
    const task = updatedTasks.find(t => t.id === taskId)
    const point = task?.points.find(p => p.pointId === pointId)
    let newDefects: Defect[] = [...s.defects]
    if (point && point.captures.length > 0) {
      const area = s.areas.find(a => a.id === task?.areaId)
      point.captures.forEach(cap => {
        if (cap.type === 'photo' && !newDefects.some(d => d.captureId === cap.id)) {
          const isDefect = Math.random() < 0.5
          if (isDefect) {
            const rndType = defectTypes[Math.floor(Math.random() * defectTypes.length)]
            const rndSev: Defect['severity'] = (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)]
            const descs = defectDesc[rndType]
            const rndDesc = descs[Math.floor(Math.random() * descs.length)]
            const newDef: Defect = {
              id: `d${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              taskId,
              pointId,
              captureId: cap.id,
              areaId: task?.areaId || '',
              type: rndType,
              severity: rndSev,
              aiConfidence: 0.7 + Math.random() * 0.28,
              aiDescription: rndDesc,
              pilotConfirmed: false,
              pilotNote: '',
              location: {
                x: 10 + Math.random() * 70,
                y: 10 + Math.random() * 70,
                width: 8 + Math.random() * 20,
                height: 5 + Math.random() * 15,
              },
              workOrderId: null,
              status: 'pending',
              createdAt: today(),
            }
            newDefects.push(newDef)
          }
        }
      })
    }
    const newPoints = s.points.map(p => p.id === pointId ? {
      ...p,
      lastInspectionDate: today(),
      status: (newDefects.some(d => d.pointId === pointId && (d.severity === 'critical' || d.severity === 'high'))
        ? 'abnormal'
        : newDefects.some(d => d.pointId === pointId && (d.severity === 'medium' || d.severity === 'low'))
          ? 'attention'
          : 'normal') as InspectionPoint['status']
    } : p)
    return {
      tasks: updatedTasks,
      defects: newDefects,
      points: newPoints,
      areas: recalcAreaStats(s.areas, newPoints, updatedTasks, newDefects)
    }
  }),

  completeTask: (taskId) => set(s => {
    const completedDate = today()
    const updatedTasks = s.tasks.map(t => t.id === taskId ? {
      ...t, status: 'completed' as const, completedDate
    } : t)
    return {
      tasks: updatedTasks,
      areas: recalcAreaStats(s.areas, s.points, updatedTasks, s.defects)
    }
  }),

  addCapture: (taskId, pointId, type, fileUrl, thumbnailUrl) => set(s => ({
    tasks: s.tasks.map(t => t.id === taskId ? {
      ...t,
      points: t.points.map(p => p.pointId === pointId ? {
        ...p,
        captures: [...p.captures, {
          id: `c${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          url: fileUrl,
          thumbnailUrl,
          uploadedAt: new Date().toISOString(),
          hasDefect: false,
        }]
      } : p)
    } : t)
  })),

  runAIRecognition: (taskId, pointId) => {
    return [] as Defect[]
  },

  confirmDefect: (defectId, note) => set(s => ({
    defects: s.defects.map(d => d.id === defectId ? { ...d, pilotConfirmed: true, pilotNote: note, status: 'confirmed' as const } : d)
  })),

  updateDefectStatus: (defectId, status) => set(s => ({
    defects: s.defects.map(d => d.id === defectId ? { ...d, status } : d)
  })),

  createWorkOrder: (defectId, assignee, description) => {
    const newWo: WorkOrder = {
      id: `wo${Date.now()}`,
      defectId,
      assignee,
      status: 'pending',
      description,
      repairPhotos: [],
      createdAt: today(),
      completedAt: null,
      verifiedAt: null
    }
    set(s => ({
      workOrders: [...s.workOrders, newWo],
      defects: s.defects.map(d => d.id === defectId ? { ...d, workOrderId: newWo.id, status: 'work_order_created' as const } : d)
    }))
  },

  updateWorkOrderStatus: (workOrderId, status) => set(s => {
    const wo = s.workOrders.find(w => w.id === workOrderId)
    const updates: Partial<WorkOrder> = { status }
    if (status === 'completed') updates.completedAt = today()
    if (status === 'verified') {
      updates.verifiedAt = today()
    }
    const newWorkOrders = s.workOrders.map(w => w.id === workOrderId ? { ...w, ...updates } : w)
    let newDefects = s.defects
    if (wo) {
      if (status === 'in_progress') {
        newDefects = s.defects.map(d => d.id === wo.defectId ? { ...d, status: 'repairing' as const } : d)
      }
      if (status === 'verified') {
        newDefects = s.defects.map(d => d.id === wo.defectId ? { ...d, status: 'closed' as const } : d)
      }
    }
    return { workOrders: newWorkOrders, defects: newDefects }
  }),

  getAreaById: (id) => get().areas.find(a => a.id === id),
  getPointsByAreaId: (areaId) => get().points.filter(p => p.areaId === areaId),
  getTemplateById: (id) => get().templates.find(t => t.id === id),
  getTaskById: (id) => get().tasks.find(t => t.id === id),
  getDefectsByAreaId: (areaId) => get().defects.filter(d => d.areaId === areaId),
  getDefectsByTaskId: (taskId) => get().defects.filter(d => d.taskId === taskId),
  getDefectsByPointId: (pointId) => get().defects.filter(d => d.pointId === pointId),
  getWorkOrderByDefectId: (defectId) => get().workOrders.find(wo => wo.defectId === defectId),
  getWorkOrderById: (id) => get().workOrders.find(wo => wo.id === id),
  getCapturesByPoint: (taskId, pointId) => {
    const task = get().tasks.find(t => t.id === taskId)
    const point = task?.points.find(p => p.pointId === pointId)
    return point?.captures.map(c => ({ id: c.id, type: c.type, url: c.url, thumbnailUrl: c.thumbnailUrl })) || []
  },
}))
