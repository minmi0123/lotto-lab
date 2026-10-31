import RegionStats from '../components/RegionStats.jsx'
import LatestDraw from '../components/LatestDraw.jsx'
import FreqChart from '../components/FreqChart.jsx'
import HotCold from '../components/HotCold.jsx'
import MiscStats from '../components/MiscStats.jsx'
import HallOfFame from '../components/HallOfFame.jsx'
import SectionTabs from '../components/SectionTabs.jsx'

const SECTIONS = [
  { id: 'sec-region', label: '지역별 1등 배출' },
  { id: 'sec-store', label: '명당 분석' },
  { id: 'sec-latest', label: '최신 회차' },
  { id: 'sec-freq', label: '번호별 출현 빈도' },
  { id: 'sec-hotcold', label: '착시 코너' },
  { id: 'sec-stats', label: '한눈에 보는 통계' },
  { id: 'sec-hall', label: '명예의 전당' },
]

export default function Stats() {
  return (
    <>
    <SectionTabs items={SECTIONS} />
    <div className="grid">
      {/* 지역별 1등 배출(지도)이 첫 화면의 맨 위 */}
      <RegionStats />
      <LatestDraw />
      <FreqChart />
      <HotCold />
      <MiscStats />
      <HallOfFame />
    </div>
    </>
  )
}
