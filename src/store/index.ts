import { create } from 'zustand'
import type { Area, InspectionPoint, InspectionTemplate, InspectionTask, Defect, WorkOrder, Pilot } from '@/types'
import { areas as mockAreas, inspectionPoints as mockPoints, templates as mockTemplates, tasks as mockTasks, defects as mockDefects, workOrders as mockWorkOrders, pilots as mockPilots } from '@/data/mockData'

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
  claimTask: (taskId: string, pilotId: string, pilotName: string) => void
  startTask: (taskId: string) => void
  completePoint: (taskId: string, pointId: string) => void
  completeTask: (taskId: string) => void
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
  getWorkOrderByDefectId: (defectId: string) => WorkOrder | undefined
  getWorkOrderById: (id: string) => WorkOrder | undefined
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

  claimTask: (taskId, pilotId, pilotName) => set(s => ({
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, pilotId, pilotName, status: 'assigned' as const } : t)
  })),

  startTask: (taskId) => set(s => ({
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'in_progress' as const } : t)
  })),

  completePoint: (taskId, pointId) => set(s => ({
    tasks: s.tasks.map(t => t.id === taskId ? {
      ...t,
      points: t.points.map(p => p.pointId === pointId ? {
        ...p,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      } : p)
    } : t)
  })),

  completeTask: (taskId) => set(s => ({
    tasks: s.tasks.map(t => t.id === taskId ? {
      ...t, status: 'completed' as const, completedDate: new Date().toISOString().split('T')[0]
    } : t)
  })),

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
      createdAt: new Date().toISOString().split('T')[0],
      completedAt: null,
      verifiedAt: null
    }
    set(s => ({
      workOrders: [...s.workOrders, newWo],
      defects: s.defects.map(d => d.id === defectId ? { ...d, workOrderId: newWo.id, status: 'work_order_created' as const } : d)
    }))
  },

  updateWorkOrderStatus: (workOrderId, status) => set(s => ({
    workOrders: s.workOrders.map(wo => {
      if (wo.id !== workOrderId) return wo
      const updates: Partial<WorkOrder> = { status }
      if (status === 'completed') updates.completedAt = new Date().toISOString().split('T')[0]
      if (status === 'verified') updates.verifiedAt = new Date().toISOString().split('T')[0]
      return { ...wo, ...updates }
    })
  })),

  getAreaById: (id) => get().areas.find(a => a.id === id),
  getPointsByAreaId: (areaId) => get().points.filter(p => p.areaId === areaId),
  getTemplateById: (id) => get().templates.find(t => t.id === id),
  getTaskById: (id) => get().tasks.find(t => t.id === id),
  getDefectsByAreaId: (areaId) => get().defects.filter(d => d.areaId === areaId),
  getDefectsByTaskId: (taskId) => get().defects.filter(d => d.taskId === taskId),
  getWorkOrderByDefectId: (defectId) => get().workOrders.find(wo => wo.defectId === defectId),
  getWorkOrderById: (id) => get().workOrders.find(wo => wo.id === id),
}))
