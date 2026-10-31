import RegionStats from '../components/RegionStats.jsx'
import LatestDraw from '../components/LatestDraw.jsx'
import FreqChart from '../components/FreqChart.jsx'
import HotCold from '../components/HotCold.jsx'
import MiscStats from '../components/MiscStats.jsx'
import HallOfFame from '../components/HallOfFame.jsx'
import SectionTabs from '../components/SectionTabs.jsx'

const SECTIONS = [
  { id: 'sec-latest', label: '최신 회차' },
  { id: 'sec-region', label: '지역별 1등 배출' },
  { id: 'sec-expect', label: '기대치 분석' },
  { id: 'sec-store', label: '명당 분석' },
  { id: 'sec-freq', label: '번호별 출현 빈도' },
  { id: 'sec-hotcold', label: '핫·콜드 분석' },
  { id: 'sec-hcsplit', label: '핫·콜드 전후반 순위' },
  { id: 'sec-stats', label: '한눈에 보는 통계' },
  { id: 'sec-hall', label: '명예의 전당' },
]

export default function Stats() {
  return (
    <>
    <SectionTabs items={SECTIONS} />
    <div className="grid">
      {/* 최신 회차가 첫 화면의 맨 위 */}
      <LatestDraw />
      <RegionStats />
      <FreqChart />
      <HotCold />
      <MiscStats />
      <HallOfFame />
    </div>
    </>
  )
}
