export interface Area {
  id: string
  name: string
  type: 'power_line' | 'wind_farm' | 'pipeline' | 'other'
  description: string
  pointCount: number
  lastInspectionDate: string | null
  healthStatus: 'healthy' | 'warning' | 'critical'
  coordinates: [number, number]
  coverage: number
}

export interface InspectionPoint {
  id: string
  areaId: string
  name: string
  coordinates: [number, number]
  deviceType: string
  templateId: string
  lastInspectionDate: string | null
  status: 'normal' | 'attention' | 'abnormal'
  manufacturer?: string
  installDate?: string
  model?: string
  capacity?: string
}

export interface InspectionTemplate {
  id: string
  name: string
  areaType: string
  version: string
  items: TemplateItem[]
  createdAt: string
  updatedAt: string
}

export interface TemplateItem {
  id: string
  name: string
  description: string
  captureType: 'photo' | 'video'
  standards: Standard[]
  required: boolean
}

export interface Standard {
  level: 'pass' | 'attention' | 'fail'
  description: string
  referenceImageUrl?: string
}

export interface InspectionTask {
  id: string
  templateId: string
  areaId: string
  pilotId: string | null
  pilotName: string | null
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'overdue'
  scheduledDate: string
  completedDate: string | null
  points: TaskPoint[]
  route: [number, number][]
}

export interface TaskPoint {
  pointId: string
  pointName: string
  status: 'pending' | 'in_progress' | 'completed'
  captures: Capture[]
  completedAt: string | null
}

export interface Capture {
  id: string
  type: 'photo' | 'video'
  url: string
  thumbnailUrl: string
  uploadedAt: string
  hasDefect: boolean
}

export interface Defect {
  id: string
  taskId: string
  pointId: string
  captureId: string
  type: 'crack' | 'rust' | 'foreign_object' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  aiConfidence: number
  aiDescription: string
  pilotConfirmed: boolean
  pilotNote: string
  location: { x: number; y: number; width: number; height: number }
  workOrderId: string | null
  status: 'pending' | 'confirmed' | 'work_order_created' | 'repairing' | 'closed'
  createdAt: string
  areaId: string
}

export interface WorkOrder {
  id: string
  defectId: string
  assignee: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  description: string
  repairPhotos: string[]
  processingRecords: { time: string; content: string; operator: string }[]
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  verifiedAt: string | null
}

export interface Pilot {
  id: string
  name: string
  avatar: string
  currentTaskId: string | null
}

export type AreaType = Area['type']
export type HealthStatus = Area['healthStatus']
export type TaskStatus = InspectionTask['status']
export type DefectType = Defect['type']
export type DefectSeverity = Defect['severity']
export type DefectStatus = Defect['status']
export type WorkOrderStatus = WorkOrder['status']
export type WorkOrderPriority = WorkOrder['priority']
