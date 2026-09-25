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
            {/* 통계 대시보드가 첫 화면. 슬롯은 /slot 으로 내린다 */}
            <Route index element={<Stats />} />
            <Route path="slot" element={<Home />} />
            {/* 예전 주소(#/stats)로 들어온 링크·북마크를 살리고 URL 도 정리한다 */}
            <Route path="stats" element={<Navigate to="/" replace />} />
            <Route path="analyze" element={<Analyze />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </PointsProvider>
  )
}
