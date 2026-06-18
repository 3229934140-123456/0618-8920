import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'
import {
  LayoutDashboard, MapPin, FileText, ClipboardList, Camera, AlertTriangle, BarChart3,
  ChevronLeft, ChevronRight, Zap, Settings, User
} from 'lucide-react'

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/areas', label: '区域管理', icon: MapPin },
  { path: '/templates', label: '巡检模板', icon: FileText },
  { path: '/tasks', label: '任务调度', icon: ClipboardList },
  { path: '/inspection/t3', label: '巡检执行', icon: Camera },
  { path: '/defects', label: '缺陷与工单', icon: AlertTriangle },
  { path: '/analytics', label: '数据分析', icon: BarChart3 },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-[220px]'} bg-navy-900 border-r border-navy-600/30 flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="h-14 flex items-center px-4 border-b border-navy-600/30 gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-display font-bold text-white leading-tight truncate">SkyPatrol</h1>
              <p className="text-[10px] text-gray-500 leading-tight">无人机巡检管理</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/')))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-400 hover:text-white hover:bg-navy-700/50'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {!sidebarCollapsed && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="py-3 px-2 border-t border-navy-600/30 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50 transition-all w-full">
            <Settings className="w-[18px] h-[18px] flex-shrink-0 text-gray-500" />
            {!sidebarCollapsed && <span className="text-sm">系统设置</span>}
          </button>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-gray-300" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs text-white truncate">管理员</p>
                <p className="text-[10px] text-gray-500 truncate">admin@skypatrol.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-navy-900/50 border-b border-navy-600/30 flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-navy-700 text-gray-400 hover:text-white transition-colors">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-gray-600">/</span>
            <span className="text-white">
              {navItems.find(i => location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path.split('/').slice(0, 2).join('/'))))?.label || '工作台'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="badge badge-info">
              <span className="w-1.5 h-1.5 rounded-full bg-status-info animate-pulse" />
              系统运行中
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
