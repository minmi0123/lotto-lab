import { NavLink, Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import { usePointsCtx } from '../state/PointsContext.jsx'

export default function Layout() {
  const { balance } = usePointsCtx()
  return (
    <div className="wrap">
      <h1>🎱 로또 랩 <span className="v">Lotto Lab</span></h1>
      <p className="lead">
        역대 당첨번호로 노는 데이터 토이앱 ·{' '}
        <span className="mini">통계·포인트는 재미용이며 당첨을 보장하지 않습니다 😉</span>
      </p>

      <Header balance={balance} />

      <nav className="nav">
        <NavLink to="/" end>🎰 슬롯 게임</NavLink>
        <NavLink to="/stats">📊 통계 대시보드</NavLink>
        <NavLink to="/analyze">🎯 분석·시뮬</NavLink>
      </nav>

      <Outlet />
    </div>
  )
}
