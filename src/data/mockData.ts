import type { Area, InspectionPoint, InspectionTemplate, InspectionTask, Defect, WorkOrder, Pilot } from '@/types'

export const pilots: Pilot[] = [
  { id: 'p1', name: '张伟', avatar: '', currentTaskId: 't3' },
  { id: 'p2', name: '李明', avatar: '', currentTaskId: null },
  { id: 'p3', name: '王强', avatar: '', currentTaskId: 't4' },
  { id: 'p4', name: '赵刚', avatar: '', currentTaskId: null },
]

export const areas: Area[] = [
  {
    id: 'a1', name: '华东220kV高压线A段', type: 'power_line',
    description: '华东地区220kV高压输电线路A段，全长45公里，包含铁塔32座',
    pointCount: 32, lastInspectionDate: '2026-06-10', healthStatus: 'healthy',
    coordinates: [31.23, 121.47], coverage: 96.8
  },
  {
    id: 'a2', name: '西北风电场一期', type: 'wind_farm',
    description: '西北地区风电场一期工程，装机容量200MW，风机48台',
    pointCount: 48, lastInspectionDate: '2026-06-05', healthStatus: 'warning',
    coordinates: [38.73, 103.83], coverage: 87.5
  },
  {
    id: 'a3', name: '华南天然气管线B段', type: 'pipeline',
    description: '华南地区天然气管线B段，全长120公里，阀室8座',
    pointCount: 24, lastInspectionDate: '2026-05-28', healthStatus: 'critical',
    coordinates: [23.13, 113.26], coverage: 72.3
  },
  {
    id: 'a4', name: '华北500kV高压线C段', type: 'power_line',
    description: '华北地区500kV高压输电线路C段，全长68公里，铁塔51座',
    pointCount: 51, lastInspectionDate: '2026-06-12', healthStatus: 'healthy',
    coordinates: [39.9, 116.4], coverage: 94.1
  },
  {
    id: 'a5', name: '东南沿海风电场二期', type: 'wind_farm',
    description: '东南沿海风电场二期工程，装机容量150MW，风机36台',
    pointCount: 36, lastInspectionDate: '2026-06-08', healthStatus: 'warning',
    coordinates: [25.3, 119.3], coverage: 82.6
  },
  {
    id: 'a6', name: '西南油气管道D段', type: 'pipeline',
    description: '西南地区油气管道D段，全长95公里，阀室6座',
    pointCount: 18, lastInspectionDate: '2026-06-01', healthStatus: 'healthy',
    coordinates: [30.57, 104.07], coverage: 91.2
  },
]

export const inspectionPoints: InspectionPoint[] = [
  { id: 'ip1', areaId: 'a1', name: 'A-01号铁塔', coordinates: [31.22, 121.45], deviceType: '铁塔', templateId: 'tpl1', lastInspectionDate: '2026-06-10', status: 'normal', manufacturer: '国家电网', model: 'Z3-S220', installDate: '2018-03-15', capacity: '220kV' },
  { id: 'ip2', areaId: 'a1', name: 'A-02号铁塔', coordinates: [31.24, 121.48], deviceType: '铁塔', templateId: 'tpl1', lastInspectionDate: '2026-06-10', status: 'normal', manufacturer: '国家电网', model: 'Z3-S220', installDate: '2018-04-02', capacity: '220kV' },
  { id: 'ip3', areaId: 'a1', name: 'A-03号铁塔', coordinates: [31.21, 121.50], deviceType: '铁塔', templateId: 'tpl1', lastInspectionDate: '2026-06-10', status: 'attention', manufacturer: '国家电网', model: 'Z3-S220', installDate: '2018-05-20', capacity: '220kV' },
  { id: 'ip4', areaId: 'a1', name: 'A-04号铁塔', coordinates: [31.25, 121.43], deviceType: '铁塔', templateId: 'tpl1', lastInspectionDate: '2026-06-10', status: 'abnormal', manufacturer: '国家电网', model: 'Z3-S220', installDate: '2017-11-08', capacity: '220kV' },
  { id: 'ip5', areaId: 'a2', name: 'W-01号风机', coordinates: [38.72, 103.81], deviceType: '风机', templateId: 'tpl2', lastInspectionDate: '2026-06-05', status: 'normal', manufacturer: '金风科技', model: 'GW155-5.0MW', installDate: '2021-09-01', capacity: '5MW' },
  { id: 'ip6', areaId: 'a2', name: 'W-02号风机', coordinates: [38.74, 103.85], deviceType: '风机', templateId: 'tpl2', lastInspectionDate: '2026-06-05', status: 'attention', manufacturer: '金风科技', model: 'GW155-5.0MW', installDate: '2021-10-12', capacity: '5MW' },
  { id: 'ip7', areaId: 'a2', name: 'W-03号风机', coordinates: [38.71, 103.80], deviceType: '风机', templateId: 'tpl2', lastInspectionDate: '2026-06-05', status: 'normal', manufacturer: '金风科技', model: 'GW155-5.0MW', installDate: '2021-11-05', capacity: '5MW' },
  { id: 'ip8', areaId: 'a3', name: 'V-01号阀室', coordinates: [23.12, 113.24], deviceType: '阀室', templateId: 'tpl3', lastInspectionDate: '2026-05-28', status: 'abnormal', manufacturer: '中石化', model: 'FS-1016', installDate: '2019-06-18', capacity: '1016mm' },
  { id: 'ip9', areaId: 'a3', name: 'V-02号阀室', coordinates: [23.14, 113.28], deviceType: '阀室', templateId: 'tpl3', lastInspectionDate: '2026-05-28', status: 'attention', manufacturer: '中石化', model: 'FS-1016', installDate: '2019-07-25', capacity: '1016mm' },
  { id: 'ip10', areaId: 'a3', name: 'V-03号阀室', coordinates: [23.11, 113.30], deviceType: '阀室', templateId: 'tpl3', lastInspectionDate: '2026-05-28', status: 'normal', manufacturer: '中石化', model: 'FS-1016', installDate: '2019-08-30', capacity: '1016mm' },
  { id: 'ip11', areaId: 'a4', name: 'C-01号铁塔', coordinates: [39.91, 116.38], deviceType: '铁塔', templateId: 'tpl1', lastInspectionDate: '2026-06-12', status: 'normal', manufacturer: '国家电网', model: 'Z5-S500', installDate: '2020-02-10', capacity: '500kV' },
  { id: 'ip12', areaId: 'a4', name: 'C-02号铁塔', coordinates: [39.89, 116.42], deviceType: '铁塔', templateId: 'tpl1', lastInspectionDate: '2026-06-12', status: 'normal', manufacturer: '国家电网', model: 'Z5-S500', installDate: '2020-03-18', capacity: '500kV' },
  { id: 'ip13', areaId: 'a5', name: 'SE-01号风机', coordinates: [25.29, 119.28], deviceType: '风机', templateId: 'tpl2', lastInspectionDate: '2026-06-08', status: 'attention', manufacturer: '远景能源', model: 'EN-171-5.2MW', installDate: '2022-04-22', capacity: '5.2MW' },
  { id: 'ip14', areaId: 'a5', name: 'SE-02号风机', coordinates: [25.31, 119.32], deviceType: '风机', templateId: 'tpl2', lastInspectionDate: '2026-06-08', status: 'normal', manufacturer: '远景能源', model: 'EN-171-5.2MW', installDate: '2022-05-10', capacity: '5.2MW' },
  { id: 'ip15', areaId: 'a6', name: 'D-01号阀室', coordinates: [30.56, 104.05], deviceType: '阀室', templateId: 'tpl3', lastInspectionDate: '2026-06-01', status: 'normal', manufacturer: '中石油', model: 'FS-813', installDate: '2020-09-15', capacity: '813mm' },
  { id: 'ip16', areaId: 'a6', name: 'D-02号阀室', coordinates: [30.58, 104.09], deviceType: '阀室', templateId: 'tpl3', lastInspectionDate: '2026-06-01', status: 'normal', manufacturer: '中石油', model: 'FS-813', installDate: '2020-10-28', capacity: '813mm' },
]

export const templates: InspectionTemplate[] = [
  {
    id: 'tpl1', name: '高压线路巡检模板', areaType: 'power_line', version: 'v2.3',
    items: [
      { id: 'ti1', name: '导线状态拍摄', description: '拍摄导线整体状态，检查是否有断股、松股', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '导线表面光滑无异常，无明显损伤' },
        { level: 'attention', description: '导线表面有轻微磨损或变色' },
        { level: 'fail', description: '导线有明显断股、松股或严重锈蚀' }
      ]},
      { id: 'ti2', name: '绝缘子拍摄', description: '拍摄绝缘子串，检查是否有破损或污闪', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '绝缘子表面清洁完好，无破损' },
        { level: 'attention', description: '绝缘子表面有轻微污秽或微小裂纹' },
        { level: 'fail', description: '绝缘子有明显破损、裂纹或严重污秽' }
      ]},
      { id: 'ti3', name: '铁塔结构拍摄', description: '拍摄铁塔主体结构，检查锈蚀和变形', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '铁塔结构完好，无锈蚀变形' },
        { level: 'attention', description: '铁塔表面有轻微锈蚀，结构无变形' },
        { level: 'fail', description: '铁塔有明显锈蚀或结构变形' }
      ]},
      { id: 'ti4', name: '线路走廊拍摄', description: '拍摄线路下方走廊，检查树木和违建', captureType: 'video', required: false, standards: [
        { level: 'pass', description: '走廊内无超高树木和违章建筑' },
        { level: 'attention', description: '走廊内有树木接近安全距离' },
        { level: 'fail', description: '走廊内有超高树木或违章建筑' }
      ]}
    ],
    createdAt: '2026-01-15', updatedAt: '2026-05-20'
  },
  {
    id: 'tpl2', name: '风电场巡检模板', areaType: 'wind_farm', version: 'v1.8',
    items: [
      { id: 'ti5', name: '叶片正面拍摄', description: '拍摄风机叶片正面，检查裂纹和前缘腐蚀', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '叶片表面光滑，无裂纹和腐蚀' },
        { level: 'attention', description: '叶片前缘有轻微腐蚀痕迹' },
        { level: 'fail', description: '叶片有明显裂纹或严重前缘腐蚀' }
      ]},
      { id: 'ti6', name: '塔筒外观拍摄', description: '拍摄塔筒外表面，检查锈蚀和螺栓状态', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '塔筒表面涂层完好，螺栓紧固' },
        { level: 'attention', description: '塔筒表面有局部涂层脱落' },
        { level: 'fail', description: '塔筒有严重锈蚀或螺栓松动' }
      ]},
      { id: 'ti7', name: '机舱顶部拍摄', description: '拍摄机舱顶部状态，检查密封和设备', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '机舱密封良好，设备正常' },
        { level: 'attention', description: '机舱密封有轻微老化' },
        { level: 'fail', description: '机舱密封破损或设备异常' }
      ]},
      { id: 'ti8', name: '风机运行视频', description: '录制风机运行状态视频，检查异常振动', captureType: 'video', required: false, standards: [
        { level: 'pass', description: '风机运行平稳，无异常振动' },
        { level: 'attention', description: '风机有轻微振动异常' },
        { level: 'fail', description: '风机有明显异常振动或异响' }
      ]}
    ],
    createdAt: '2026-02-10', updatedAt: '2026-06-01'
  },
  {
    id: 'tpl3', name: '管道巡检模板', areaType: 'pipeline', version: 'v3.1',
    items: [
      { id: 'ti9', name: '管道外防腐拍摄', description: '拍摄管道外防腐层，检查破损和剥离', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '防腐层完好，无破损剥离' },
        { level: 'attention', description: '防腐层有轻微划痕或起泡' },
        { level: 'fail', description: '防腐层有明显破损或大面积剥离' }
      ]},
      { id: 'ti10', name: '阀室外景拍摄', description: '拍摄阀室外景，检查围墙和标识', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '阀室围墙完好，标识清晰' },
        { level: 'attention', description: '阀室围墙有轻微破损，标识褪色' },
        { level: 'fail', description: '阀室围墙损坏或标识缺失' }
      ]},
      { id: 'ti11', name: '管道标志桩拍摄', description: '拍摄管道标志桩，检查位置和完整性', captureType: 'photo', required: true, standards: [
        { level: 'pass', description: '标志桩位置正确，完好清晰' },
        { level: 'attention', description: '标志桩有倾斜或字迹模糊' },
        { level: 'fail', description: '标志桩缺失或严重损坏' }
      ]},
      { id: 'ti12', name: '管道沿线巡视视频', description: '录制管道沿线巡视视频，检查地貌变化', captureType: 'video', required: true, standards: [
        { level: 'pass', description: '沿线地貌正常，无施工无塌方' },
        { level: 'attention', description: '沿线有施工活动但未危及管道' },
        { level: 'fail', description: '沿线有塌方或施工危及管道安全' }
      ]}
    ],
    createdAt: '2025-11-20', updatedAt: '2026-04-15'
  }
]

export const tasks: InspectionTask[] = [
  {
    id: 't1', templateId: 'tpl1', areaId: 'a1', pilotId: 'p1', pilotName: '张伟',
    status: 'completed', scheduledDate: '2026-06-10', completedDate: '2026-06-10',
    points: [
      { pointId: 'ip1', pointName: 'A-01号铁塔', status: 'completed', completedAt: '2026-06-10T09:15:00', captures: [
        { id: 'c1', type: 'photo', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=power%20line%20tower%20inspection%20aerial%20photo%20clean%20sky&image_size=landscape_16_9', thumbnailUrl: '', uploadedAt: '2026-06-10T09:15:00', hasDefect: false },
        { id: 'c2', type: 'photo', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=insulator%20string%20inspection%20close%20up%20clean&image_size=landscape_16_9', thumbnailUrl: '', uploadedAt: '2026-06-10T09:16:00', hasDefect: false }
      ]},
      { pointId: 'ip2', pointName: 'A-02号铁塔', status: 'completed', completedAt: '2026-06-10T09:45:00', captures: [
        { id: 'c3', type: 'photo', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=power%20line%20tower%20steel%20structure%20rust%20aerial&image_size=landscape_16_9', thumbnailUrl: '', uploadedAt: '2026-06-10T09:45:00', hasDefect: true }
      ]},
    ],
    route: [[31.22, 121.45], [31.24, 121.48]]
  },
  {
    id: 't2', templateId: 'tpl2', areaId: 'a2', pilotId: 'p3', pilotName: '王强',
    status: 'completed', scheduledDate: '2026-06-05', completedDate: '2026-06-05',
    points: [
      { pointId: 'ip5', pointName: 'W-01号风机', status: 'completed', completedAt: '2026-06-05T10:00:00', captures: [
        { id: 'c4', type: 'photo', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wind%20turbine%20blade%20inspection%20aerial%20photo&image_size=landscape_16_9', thumbnailUrl: '', uploadedAt: '2026-06-05T10:00:00', hasDefect: false },
      ]},
      { pointId: 'ip6', pointName: 'W-02号风机', status: 'completed', completedAt: '2026-06-05T10:30:00', captures: [
        { id: 'c5', type: 'photo', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wind%20turbine%20tower%20rust%20corrosion%20close%20up&image_size=landscape_16_9', thumbnailUrl: '', uploadedAt: '2026-06-05T10:30:00', hasDefect: true },
      ]},
    ],
    route: [[38.72, 103.81], [38.74, 103.85]]
  },
  {
    id: 't3', templateId: 'tpl3', areaId: 'a3', pilotId: 'p1', pilotName: '张伟',
    status: 'in_progress', scheduledDate: '2026-06-15', completedDate: null,
    points: [
      { pointId: 'ip8', pointName: 'V-01号阀室', status: 'completed', completedAt: '2026-06-15T08:30:00', captures: [
        { id: 'c6', type: 'photo', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gas%20pipeline%20valve%20station%20aerial%20inspection&image_size=landscape_16_9', thumbnailUrl: '', uploadedAt: '2026-06-15T08:30:00', hasDefect: true },
      ]},
      { pointId: 'ip9', pointName: 'V-02号阀室', status: 'in_progress', completedAt: null, captures: [] },
      { pointId: 'ip10', pointName: 'V-03号阀室', status: 'pending', completedAt: null, captures: [] },
    ],
    route: [[23.12, 113.24], [23.14, 113.28], [23.11, 113.30]]
  },
  {
    id: 't4', templateId: 'tpl1', areaId: 'a4', pilotId: 'p3', pilotName: '王强',
    status: 'assigned', scheduledDate: '2026-06-18', completedDate: null,
    points: [
      { pointId: 'ip11', pointName: 'C-01号铁塔', status: 'pending', completedAt: null, captures: [] },
      { pointId: 'ip12', pointName: 'C-02号铁塔', status: 'pending', completedAt: null, captures: [] },
    ],
    route: [[39.91, 116.38], [39.89, 116.42]]
  },
  {
    id: 't5', templateId: 'tpl2', areaId: 'a5', pilotId: null, pilotName: null,
    status: 'pending', scheduledDate: '2026-06-20', completedDate: null,
    points: [
      { pointId: 'ip13', pointName: 'SE-01号风机', status: 'pending', completedAt: null, captures: [] },
      { pointId: 'ip14', pointName: 'SE-02号风机', status: 'pending', completedAt: null, captures: [] },
    ],
    route: [[25.29, 119.28], [25.31, 119.32]]
  },
  {
    id: 't6', templateId: 'tpl3', areaId: 'a3', pilotId: null, pilotName: null,
    status: 'overdue', scheduledDate: '2026-06-01', completedDate: null,
    points: [
      { pointId: 'ip8', pointName: 'V-01号阀室', status: 'pending', completedAt: null, captures: [] },
    ],
    route: [[23.12, 113.24]]
  },
]

export const defects: Defect[] = [
  {
    id: 'd1', taskId: 't1', pointId: 'ip2', captureId: 'c3', areaId: 'a1',
    type: 'rust', severity: 'medium', aiConfidence: 0.89,
    aiDescription: '检测到铁塔塔腿部位表面锈蚀，面积约15cm×10cm，建议关注',
    pilotConfirmed: true, pilotNote: '确认为塔腿锈蚀，需安排除锈防腐处理',
    location: { x: 35, y: 40, width: 20, height: 15 },
    workOrderId: 'wo1', status: 'repairing', createdAt: '2026-06-10'
  },
  {
    id: 'd2', taskId: 't2', pointId: 'ip6', captureId: 'c5', areaId: 'a2',
    type: 'crack', severity: 'high', aiConfidence: 0.92,
    aiDescription: '检测到塔筒焊缝处裂纹，长约8cm，建议紧急处理',
    pilotConfirmed: true, pilotNote: '焊缝裂纹明显，需要尽快安排修复',
    location: { x: 45, y: 55, width: 15, height: 5 },
    workOrderId: 'wo2', status: 'work_order_created', createdAt: '2026-06-05'
  },
  {
    id: 'd3', taskId: 't3', pointId: 'ip8', captureId: 'c6', areaId: 'a3',
    type: 'foreign_object', severity: 'critical', aiConfidence: 0.95,
    aiDescription: '检测到阀室围墙外有第三方施工机械，距管道不足5米',
    pilotConfirmed: true, pilotNote: '已确认第三方施工，已通知管道保护人员',
    location: { x: 60, y: 30, width: 25, height: 20 },
    workOrderId: 'wo3', status: 'confirmed', createdAt: '2026-06-15'
  },
  {
    id: 'd4', taskId: 't1', pointId: 'ip3', captureId: 'c1', areaId: 'a1',
    type: 'rust', severity: 'low', aiConfidence: 0.76,
    aiDescription: '检测到绝缘子连接金具轻微锈蚀',
    pilotConfirmed: true, pilotNote: '轻微锈蚀，暂时不影响运行',
    location: { x: 50, y: 25, width: 10, height: 10 },
    workOrderId: null, status: 'confirmed', createdAt: '2026-06-10'
  },
  {
    id: 'd5', taskId: 't2', pointId: 'ip5', captureId: 'c4', areaId: 'a2',
    type: 'other', severity: 'medium', aiConfidence: 0.71,
    aiDescription: '检测到叶片前缘有轻微侵蚀痕迹',
    pilotConfirmed: false, pilotNote: '',
    location: { x: 30, y: 45, width: 18, height: 8 },
    workOrderId: null, status: 'pending', createdAt: '2026-06-05'
  },
]

export const workOrders: WorkOrder[] = [
  {
    id: 'wo1', defectId: 'd1', assignee: '陈工', status: 'in_progress',
    priority: 'medium', dueDate: '2026-06-25',
    description: 'A-02号铁塔塔腿锈蚀处理：除锈+防腐涂装',
    repairPhotos: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steel%20tower%20rust%20repair%20sandblasting%20work&image_size=landscape_16_9'],
    processingRecords: [
      { time: '2026-06-11 09:00', content: '工单创建并派发至陈工', operator: '系统' },
      { time: '2026-06-12 10:30', content: '陈工已确认，订购防腐涂料和除锈设备', operator: '陈工' },
      { time: '2026-06-15 08:00', content: '材料到位，开始入场施工，先完成塔腿除锈', operator: '陈工' },
    ],
    createdAt: '2026-06-11', startedAt: '2026-06-15', completedAt: null, verifiedAt: null
  },
  {
    id: 'wo2', defectId: 'd2', assignee: '刘工', status: 'pending',
    priority: 'high', dueDate: '2026-06-22',
    description: 'W-02号风机塔筒焊缝裂纹修复：焊接+检测',
    repairPhotos: [],
    processingRecords: [
      { time: '2026-06-06 14:00', content: '工单创建：塔筒焊缝裂纹需紧急处理', operator: '系统' },
    ],
    createdAt: '2026-06-06', startedAt: null, completedAt: null, verifiedAt: null
  },
  {
    id: 'wo3', defectId: 'd3', assignee: '管道保护科', status: 'pending',
    priority: 'urgent', dueDate: '2026-06-19',
    description: 'V-01号阀室围墙外第三方施工处置：现场确认+安全距离标识',
    repairPhotos: [],
    processingRecords: [
      { time: '2026-06-15 16:00', content: '紧急工单创建：第三方施工距离管道不足5米', operator: '系统' },
      { time: '2026-06-15 17:30', content: '已通知施工方暂停作业，等待管道保护科现场确认', operator: '飞手张伟' },
    ],
    createdAt: '2026-06-15', startedAt: null, completedAt: null, verifiedAt: null
  },
]

export const defectTrendData = [
  { month: '1月', pending: 12, confirmed: 8, repairing: 5, closed: 15 },
  { month: '2月', pending: 9, confirmed: 11, repairing: 6, closed: 18 },
  { month: '3月', pending: 15, confirmed: 7, repairing: 8, closed: 20 },
  { month: '4月', pending: 8, confirmed: 9, repairing: 4, closed: 22 },
  { month: '5月', pending: 11, confirmed: 6, repairing: 7, closed: 25 },
  { month: '6月', pending: 5, confirmed: 3, repairing: 6, closed: 16 },
]

export const coverageTrendData = [
  { month: '1月', coverage: 78.5 },
  { month: '2月', coverage: 82.3 },
  { month: '3月', coverage: 79.8 },
  { month: '4月', coverage: 85.6 },
  { month: '5月', coverage: 88.2 },
  { month: '6月', coverage: 87.4 },
]

export const healthScoreData = [
  { area: '华东高压线A段', structure: 92, corrosion: 85, safety: 95, environment: 88, overall: 90 },
  { area: '西北风电场一期', structure: 78, corrosion: 72, safety: 85, environment: 80, overall: 79 },
  { area: '华南管线B段', structure: 65, corrosion: 58, safety: 70, environment: 75, overall: 67 },
  { area: '华北高压线C段', structure: 90, corrosion: 88, safety: 93, environment: 85, overall: 89 },
  { area: '东南风电场二期', structure: 82, corrosion: 75, safety: 80, environment: 78, overall: 79 },
  { area: '西南管道D段', structure: 88, corrosion: 82, safety: 90, environment: 86, overall: 87 },
]
