import { useLocation } from 'react-router-dom'
import Analyzer from '../components/Analyzer.jsx'

export default function Analyze() {
  const { state } = useLocation()
  // 생성기·추천에서 navigate state 로 넘어온 번호 (없으면 빈 입력)
  return (
    <div className="grid">
      <Analyzer initialNums={state?.nums} />
    </div>
  )
}
