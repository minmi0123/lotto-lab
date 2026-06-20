import { createContext, useContext } from 'react'
import { usePoints } from './usePoints.js'

// 라우트가 달라도 포인트 상태를 하나로 공유 (헤더 ↔ 슬롯 실시간 동기화)
const PointsContext = createContext(null)

export function PointsProvider({ children }) {
  const pts = usePoints()
  return <PointsContext.Provider value={pts}>{children}</PointsContext.Provider>
}

export function usePointsCtx() {
  const ctx = useContext(PointsContext)
  if (!ctx) throw new Error('usePointsCtx must be used within <PointsProvider>')
  return ctx
}
