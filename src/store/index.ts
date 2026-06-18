import { create } from 'zustand'
import type {
  Area, InspectionPoint, InspectionTemplate, InspectionTask,
  Defect, WorkOrder, Pilot, TemplateItem
} from '@/types'
import {
  areas as mockAreas,
  inspectionPoints as mockPoints,
  templates as mockTemplates,
  tasks as mockTasks,
  defects as mockDefects,
  workOrders as mockWorkOrders,
  pilots as mockPilots
} from '@/data/mockData'

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
  manufacturer?: string
  installDate?: string
  model?: string
  capacity?: string
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

interface NewWorkOrderData {
  defectId: string
  assignee: string
  description: string
  priority?: WorkOrder['priority']
  dueDate?: string
}

const today = (): string => new Date().toISOString().split('T')[0]
const nowStr = (): string => new Date().toISOString().replace('T', ' ').slice(0, 16)

const recalcAreaStats = (
  areas: Area[],
  points: InspectionPoint[],
  tasks: InspectionTask[],
  defects: Defect[]
): Area[] => {
  return areas.map(area => {
    const areaPoints = points.filter(p => p.areaId === area.id)
    const areaPointIds = areaPoints.map(p => p.id)
    const areaTasks = tasks.filter(t => t.areaId === area.id)
    const completedTaskPoints = areaTasks.flatMap(t =>
      t.points.filter(p => p.status === 'completed' && areaPointIds.includes(p.pointId))
    )
    const uniqueCompletedPointIds = new Set(completedTaskPoints.map(p => p.pointId))
    const coverage = areaPoints.length > 0
      ? Math.round((uniqueCompletedPointIds.size / areaPoints.length) * 1000) / 10
      : 0
    const areaDefects = defects.filter(d => d.areaId === area.id)
    const criticalCount = areaDefects.filter(
      d => (d.severity === 'critical' || d.severity === 'high') && d.status !== 'closed'
    ).length
    const openCritical = criticalCount > 0
    const hasAttention = areaDefects.some(
      d => (d.severity === 'medium' || d.severity === 'low') && d.status !== 'closed'
    )
    let healthStatus: Area['healthStatus'] = 'healthy'
    if (coverage < 60 || openCritical) healthStatus = 'critical'
    else if (coverage < 80 || hasAttention) healthStatus = 'warning'
    const lastDate = [...areaTasks]
      .filter(t => t.status === 'completed')
      .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''))[0]
      ?.completedDate || null
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
  crack: ['检测到表面裂纹', '焊缝处检测到微裂纹', '结构件出现纵向裂纹', '焊缝开裂需焊接修复'],
  rust: ['表面局部锈蚀', '连接处检测到锈蚀', '金属外壳涂层破损锈蚀', '大面积锈蚀需防腐处理'],
  foreign_object: ['检测到异物缠绕', '周围有施工材料堆积', '线路旁有漂浮物', '有异物悬挂需清除'],
  other: ['检测到结构轻微变形', '连接件出现松动迹象', '密封胶老化脱落', '设备异常发热迹象']
}

const videoDefectDesc: Record<Defect['type'], string[]> = {
  crack: ['视频帧序列检测到结构裂纹发展', '运行中检测到焊缝开裂振动', '长时间运行裂纹扩展'],
  rust: ['多帧对比发现锈蚀区域扩散', '视频检测到涂层剥落'],
  foreign_object: ['视频画面中发现异物移动', '连续帧确认异物悬挂飘动'],
  other: ['视频中发现异常振动', '多帧分析发现结构形变']
}

const sevFromType = (type: Defect['type']): Defect['severity'] => {
  const r = Math.random()
  if (type === 'crack') return r < 0.35 ? 'critical' : r < 0.75 ? 'high' : 'medium'
  if (type === 'foreign_object') return r < 0.25 ? 'critical' : r < 0.6 ? 'high' : 'medium'
  if (type === 'rust') return r < 0.15 ? 'high' : r < 0.55 ? 'medium' : 'low'
  return r < 0.1 ? 'high' : r < 0.5 ? 'medium' : 'low'
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
  setRole: (r: 'admin' | 'manager' | 'pilot') => void

  addArea: (d: NewAreaData) => Area
  updateArea: (id: string, d: Partial<NewAreaData>) => void
  deleteArea: (id: string) => void

  addPoint: (d: NewPointData) => InspectionPoint
  updatePoint: (id: string, d: Partial<NewPointData>) => void
  deletePoint: (id: string) => void

  addTemplate: (d: NewTemplateData) => InspectionTemplate
  updateTemplate: (id: string, d: Partial<NewTemplateData> & { items?: TemplateItem[] }) => void
  deleteTemplate: (id: string) => void

  createTask: (d: NewTaskData) => InspectionTask
  claimTask: (taskId: string, pilotId: string, pilotName: string) => void
  startTask: (taskId: string) => void
  completePoint: (taskId: string, pointId: string) => void
  completeTask: (taskId: string) => void

  addCapture: (taskId: string, pointId: string, type: 'photo' | 'video', fileUrl: string, thumbUrl: string) => void
  confirmDefect: (defectId: string, note: string) => void
  updateDefectStatus: (defectId: string, status: Defect['status']) => void

  createWorkOrder: (d: NewWorkOrderData) => void
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrder['status']) => void
  addWorkOrderRecord: (workOrderId: string, content: string, operator: string) => void

  getAreaById: (id: string) => Area | undefined
  getPointsByAreaId: (areaId: string) => InspectionPoint[]
  getTemplateById: (id: string) => InspectionTemplate | undefined
  getTaskById: (id: string) => InspectionTask | undefined
  getDefectsByAreaId: (areaId: string) => Defect[]
  getDefectsByTaskId: (taskId: string) => Defect[]
  getDefectsByPointId: (pointId: string) => Defect[]
  getWorkOrderByDefectId: (defectId: string) => WorkOrder | undefined
  getWorkOrderById: (id: string) => WorkOrder | undefined
  getCapturesByPoint: (taskId: string, pointId: string) => { id: string; type: 'photo' | 'video'; url: string; thumbnailUrl: string }[]
  getDefectsByStatus: (statuses: Defect['status'][]) => Defect[]
  getOpenWorkOrders: () => WorkOrder[]
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
  setRole: role => set({ currentRole: role }),

  addArea: data => {
    const a: Area = {
      id: `a${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description,
      coordinates: data.coordinates,
      pointCount: 0,
      coverage: 0,
      healthStatus: 'healthy',
      lastInspectionDate: null
    }
    set(s => ({ areas: [...s.areas, a] }))
    return a
  },

  updateArea: (id, data) => set(s => ({
    areas: s.areas.map(a => a.id === id ? { ...a, ...data } : a)
  })),

  deleteArea: id => set(s => {
    return {
      areas: s.areas.filter(a => a.id !== id),
      points: s.points.filter(p => p.areaId !== id),
      tasks: s.tasks.filter(t => t.areaId !== id),
      defects: s.defects.filter(d => d.areaId !== id)
    }
  }),

  addPoint: data => {
    const p: InspectionPoint = {
      id: `ip${Date.now()}`,
      areaId: data.areaId,
      name: data.name,
      coordinates: data.coordinates,
      deviceType: data.deviceType,
      templateId: data.templateId,
      lastInspectionDate: null,
      status: 'normal',
      manufacturer: data.manufacturer,
      installDate: data.installDate,
      model: data.model,
      capacity: data.capacity
    }
    set(s => {
      const np = [...s.points, p]
      return {
        points: np,
        areas: recalcAreaStats(s.areas, np, s.tasks, s.defects)
      }
    })
    return p
  },

  updatePoint: (id, data) => set(s => ({
    points: s.points.map(p => p.id === id ? { ...p, ...data } : p)
  })),

  deletePoint: id => set(s => {
    const pt = s.points.find(p => p.id === id)
    const np = s.points.filter(p => p.id !== id)
    return {
      points: np,
      areas: recalcAreaStats(s.areas, np, s.tasks, s.defects),
      tasks: s.tasks.map(t =>
        t.areaId === pt?.areaId
          ? { ...t, points: t.points.filter(p => p.pointId !== id) }
          : t
      )
    }
  }),

  addTemplate: data => {
    const d = today()
    const t: InspectionTemplate = {
      id: `tpl${Date.now()}`,
      name: data.name,
      areaType: data.areaType,
      version: 'v1.0',
      items: data.items,
      createdAt: d,
      updatedAt: d
    }
    set(s => ({ templates: [...s.templates, t] }))
    return t
  },

  updateTemplate: (id, data) => set(s => ({
    templates: s.templates.map(t => t.id === id ? {
      ...t,
      name: data.name ?? t.name,
      areaType: data.areaType ?? t.areaType,
      items: data.items ?? t.items,
      updatedAt: today()
    } : t)
  })),

  deleteTemplate: id => set(s => ({
    templates: s.templates.filter(t => t.id !== id)
  })),

  createTask: data => {
    const pts = get().points.filter(p => data.pointIds.includes(p.id))
    const route: [number, number][] = pts.map(p => p.coordinates)
    const t: InspectionTask = {
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
        completedAt: null
      }))
    }
    set(s => ({ tasks: [...s.tasks, t] }))
    return t
  },

  claimTask: (tid, pid, pname) => set(s => ({
    tasks: s.tasks.map(t => t.id === tid ? { ...t, pilotId: pid, pilotName: pname, status: 'assigned' as const } : t)
  })),

  startTask: tid => set(s => ({
    tasks: s.tasks.map(t => t.id === tid ? { ...t, status: 'in_progress' as const } : t)
  })),

  completePoint: (tid, pid) => set(s => {
    const up = s.tasks.map(t => t.id === tid ? {
      ...t,
      points: t.points.map(p => p.pointId === pid ? {
        ...p,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      } : p)
    } : t)
    const task = up.find(t => t.id === tid)
    const pt = task?.points.find(p => p.pointId === pid)
    let nd: Defect[] = [...s.defects]

    if (pt && pt.captures.length > 0) {
      pt.captures.forEach(cap => {
        if (!nd.some(d => d.captureId === cap.id)) {
          const rnd = Math.random()
          const prob = cap.type === 'photo' ? 0.5 : 0.35
          if (rnd < prob) {
            const rndType = defectTypes[Math.floor(Math.random() * defectTypes.length)]
            const rndSev = sevFromType(rndType)
            const descs = cap.type === 'photo' ? defectDesc[rndType] : videoDefectDesc[rndType]
            const rndDesc = descs[Math.floor(Math.random() * descs.length)]
            nd.push({
              id: `d${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              taskId: tid,
              pointId: pid,
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
                height: 5 + Math.random() * 15
              },
              workOrderId: null,
              status: 'pending',
              createdAt: today()
            })
          }
        }
      })
    }

    const hasCriticalHigh = nd.some(d =>
      d.pointId === pid && (d.severity === 'critical' || d.severity === 'high')
    )
    const hasMedLow = nd.some(d =>
      d.pointId === pid && (d.severity === 'medium' || d.severity === 'low')
    )
    const pointStatus: InspectionPoint['status'] = hasCriticalHigh
      ? 'abnormal'
      : hasMedLow
        ? 'attention'
        : 'normal'

    const np = s.points.map(p => p.id === pid
      ? { ...p, lastInspectionDate: today(), status: pointStatus }
      : p
    )

    return {
      tasks: up,
      defects: nd,
      points: np,
      areas: recalcAreaStats(s.areas, np, up, nd)
    }
  }),

  completeTask: tid => set(s => {
    const cd = today()
    const up = s.tasks.map(t => t.id === tid ? {
      ...t,
      status: 'completed' as const,
      completedDate: cd
    } : t)
    return {
      tasks: up,
      areas: recalcAreaStats(s.areas, s.points, up, s.defects)
    }
  }),

  addCapture: (tid, pid, type, url, thumb) => set(s => ({
    tasks: s.tasks.map(t => t.id === tid ? {
      ...t,
      points: t.points.map(p => p.pointId === pid ? {
        ...p,
        captures: [...p.captures, {
          id: `c${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          url,
          thumbnailUrl: thumb,
          uploadedAt: new Date().toISOString(),
          hasDefect: false
        }]
      } : p)
    } : t)
  })),

  confirmDefect: (did, note) => set(s => ({
    defects: s.defects.map(d => d.id === did ? {
      ...d,
      pilotConfirmed: true,
      pilotNote: note,
      status: 'confirmed' as const
    } : d)
  })),

  updateDefectStatus: (did, status) => set(s => ({
    defects: s.defects.map(d => d.id === did ? { ...d, status } : d)
  })),

  createWorkOrder: data => {
    const defect = get().defects.find(d => d.id === data.defectId)
    let sev: WorkOrder['priority'] = 'low'
    if (data.priority) {
      sev = data.priority
    } else if (defect) {
      if (defect.severity === 'critical') sev = 'urgent'
      else if (defect.severity === 'high') sev = 'high'
      else if (defect.severity === 'medium') sev = 'medium'
      else sev = 'low'
    }
    const days = sev === 'urgent' ? 3 : sev === 'high' ? 7 : sev === 'medium' ? 14 : 28
    const date0 = new Date()
    date0.setDate(date0.getDate() + days)
    const due = data.dueDate ?? date0.toISOString().split('T')[0]

    const wo: WorkOrder = {
      id: `wo${Date.now()}`,
      defectId: data.defectId,
      assignee: data.assignee,
      status: 'pending',
      description: data.description,
      priority: sev,
      dueDate: due,
      repairPhotos: [],
      processingRecords: [
        { time: nowStr(), content: `工单创建并派发至${data.assignee}`, operator: '系统' }
      ],
      createdAt: today(),
      startedAt: null,
      completedAt: null,
      verifiedAt: null
    }

    set(s => ({
      workOrders: [...s.workOrders, wo],
      defects: s.defects.map(d => d.id === data.defectId ? {
        ...d,
        workOrderId: wo.id,
        status: 'work_order_created' as const
      } : d)
    }))
  },

  updateWorkOrderStatus: (wId, status) => set(s => {
    const wo = s.workOrders.find(w => w.id === wId)
    if (!wo) return s

    const u = s.workOrders.map(w => {
      if (w.id !== wId) return w
      const up: WorkOrder = { ...w, status }
      const newRecords = [...w.processingRecords]
      const now = nowStr()
      if (status === 'in_progress') {
        up.startedAt = today()
        newRecords.push({ time: now, content: '工单已开始处理', operator: w.assignee })
      }
      if (status === 'completed') {
        up.completedAt = today()
        newRecords.push({ time: now, content: '维修完成提交验收', operator: w.assignee })
      }
      if (status === 'verified') {
        up.verifiedAt = today()
        newRecords.push({ time: now, content: '维修验收通过，工单闭环', operator: '管理方' })
      }
      up.processingRecords = newRecords
      return up
    })

    let nd = s.defects
    if (status === 'in_progress') {
      nd = s.defects.map(d => d.id === wo.defectId ? { ...d, status: 'repairing' as const } : d)
    }
    if (status === 'verified') {
      nd = s.defects.map(d => d.id === wo.defectId ? { ...d, status: 'closed' as const } : d)
    }

    return { workOrders: u, defects: nd }
  }),

  addWorkOrderRecord: (wId, content, operator) => set(s => ({
    workOrders: s.workOrders.map(w =>
      w.id === wId
        ? { ...w, processingRecords: [...w.processingRecords, { time: nowStr(), content, operator }] }
        : w
    )
  })),

  getAreaById: id => get().areas.find(a => a.id === id),
  getPointsByAreaId: aid => get().points.filter(p => p.areaId === aid),
  getTemplateById: id => get().templates.find(t => t.id === id),
  getTaskById: id => get().tasks.find(t => t.id === id),
  getDefectsByAreaId: aid => get().defects.filter(d => d.areaId === aid),
  getDefectsByTaskId: tid => get().defects.filter(d => d.taskId === tid),
  getDefectsByPointId: pid => get().defects.filter(d => d.pointId === pid),
  getWorkOrderByDefectId: did => get().workOrders.find(w => w.defectId === did),
  getWorkOrderById: id => get().workOrders.find(w => w.id === id),
  getCapturesByPoint: (tid, pid) => {
    const t = get().tasks.find(x => x.id === tid)
    const p = t?.points.find(x => x.pointId === pid)
    return p?.captures.map(c => ({
      id: c.id,
      type: c.type,
      url: c.url,
      thumbnailUrl: c.thumbnailUrl
    })) || []
  },
  getDefectsByStatus: statuses => get().defects.filter(d => statuses.includes(d.status)),
  getOpenWorkOrders: () => get().workOrders.filter(w => w.status !== 'verified')
}))
