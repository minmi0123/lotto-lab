import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePointsCtx } from '../state/PointsContext.jsx'
import Generator from '../components/Generator.jsx'
import LuckyPick from '../components/LuckyPick.jsx'
import Analyzer from '../components/Analyzer.jsx'

export default function Analyze() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { setMyNumbers } = usePointsCtx()
  // 생성기·추천에서 고른 번호 → 같은 페이지의 분석기로 전달
  const [picked, setPicked] = useState(state?.nums || null)

  const onAnalyze = (nums) => setPicked([...nums]) // 새 배열로 → 분석기 useEffect 트리거
  const onSlot = (nums) => {
    setMyNumbers(nums)
    navigate('/')
  }

  return (
    <div className="grid">
      <Generator onAnalyze={onAnalyze} onSlot={onSlot} />
      <LuckyPick onAnalyze={onAnalyze} onSlot={onSlot} />
      <Analyzer initialNums={picked} />
    </div>
  )
}
