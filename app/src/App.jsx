import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PointsProvider } from './state/PointsContext.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Stats from './pages/Stats.jsx'
import Analyze from './pages/Analyze.jsx'

export default function App() {
  return (
    <PointsProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="stats" element={<Stats />} />
            <Route path="analyze" element={<Analyze />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </PointsProvider>
  )
}
