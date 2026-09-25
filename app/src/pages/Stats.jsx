import RegionStats from '../components/RegionStats.jsx'
import LatestDraw from '../components/LatestDraw.jsx'
import FreqChart from '../components/FreqChart.jsx'
import HotCold from '../components/HotCold.jsx'
import MiscStats from '../components/MiscStats.jsx'
import HallOfFame from '../components/HallOfFame.jsx'

export default function Stats() {
  return (
    <div className="grid">
      {/* 지역별 1등 배출(지도)이 첫 화면의 맨 위 */}
      <RegionStats />
      <LatestDraw />
      <FreqChart />
      <HotCold />
      <MiscStats />
      <HallOfFame />
    </div>
  )
}
