import LatestDraw from '../components/LatestDraw.jsx'
import FreqChart from '../components/FreqChart.jsx'
import HotCold from '../components/HotCold.jsx'
import MiscStats from '../components/MiscStats.jsx'
import HallOfFame from '../components/HallOfFame.jsx'

export default function Stats() {
  return (
    <div className="grid">
      <LatestDraw />
      <FreqChart />
      <HotCold />
      <MiscStats />
      <HallOfFame />
    </div>
  )
}
