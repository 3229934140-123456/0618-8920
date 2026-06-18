import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Areas from '@/pages/Areas'
import AreaDetail from '@/pages/AreaDetail'
import Templates from '@/pages/Templates'
import TemplateDetail from '@/pages/TemplateDetail'
import Tasks from '@/pages/Tasks'
import TaskDetail from '@/pages/TaskDetail'
import Inspection from '@/pages/Inspection'
import Defects from '@/pages/Defects'
import DefectDetail from '@/pages/DefectDetail'
import WorkOrders from '@/pages/WorkOrders'
import PointProfile from '@/pages/PointProfile'
import AreaRiskDetail from '@/pages/AreaRiskDetail'
import Analytics from '@/pages/Analytics'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/areas/:id" element={<AreaDetail />} />
          <Route path="/areas/:id/risk" element={<AreaRiskDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/inspection/:id" element={<Inspection />} />
          <Route path="/defects" element={<Defects />} />
          <Route path="/defects/:id" element={<DefectDetail />} />
          <Route path="/workorders" element={<WorkOrders />} />
          <Route path="/points/:id" element={<PointProfile />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
