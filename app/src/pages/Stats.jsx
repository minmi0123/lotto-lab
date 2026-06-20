import { useNavigate } from 'react-router-dom'
import LatestDraw from '../components/LatestDraw.jsx'
import FreqChart from '../components/FreqChart.jsx'
import HotCold from '../components/HotCold.jsx'
import MiscStats from '../components/MiscStats.jsx'
import Generator from '../components/Generator.jsx'
import LuckyPick from '../components/LuckyPick.jsx'
import HallOfFame from '../components/HallOfFame.jsx'

export default function Stats() {
  const navigate = useNavigate()
  // 생성기·추천에서 뽑은 번호를 분석 페이지로 들고 이동
  const onAnalyze = (nums) => navigate('/analyze', { state: { nums } })

  return (
    <div className="grid">
      <LatestDraw />
      <FreqChart />
      <HotCold />
      <MiscStats />
      <Generator onAnalyze={onAnalyze} />
      <LuckyPick onAnalyze={onAnalyze} />
      <HallOfFame />
    </div>
  )
}
