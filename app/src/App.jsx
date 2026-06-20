import { useState, useCallback } from 'react'
import { usePoints } from './state/usePoints.js'
import Header from './components/Header.jsx'
import SlotMachine from './components/SlotMachine.jsx'
import LatestDraw from './components/LatestDraw.jsx'
import FreqChart from './components/FreqChart.jsx'
import HotCold from './components/HotCold.jsx'
import MiscStats from './components/MiscStats.jsx'
import Generator from './components/Generator.jsx'
import LuckyPick from './components/LuckyPick.jsx'
import HallOfFame from './components/HallOfFame.jsx'
import LabModal from './components/LabModal.jsx'

export default function App() {
  const pts = usePoints()
  const [labOpen, setLabOpen] = useState(false)
  const [labNums, setLabNums] = useState(null)

  // 생성기·추천에서 번호 받아 분석 모달 열기
  const openLab = useCallback((nums) => {
    setLabNums(nums || null)
    setLabOpen(true)
  }, [])

  return (
    <div className="wrap">
      <h1>🎱 로또 랩 <span className="v">Lotto Lab</span></h1>
      <p className="lead">
        역대 당첨번호로 노는 데이터 토이앱 ·{' '}
        <span className="mini">통계·포인트는 재미용이며 당첨을 보장하지 않습니다 😉</span>
      </p>

      <Header balance={pts.balance} />

      <nav className="nav">
        <a href="#sec-slot">🎰 슬롯</a>
        <a href="#sec-latest">🆕 최신</a>
        <a href="#sec-freq">📊 빈도</a>
        <a href="#sec-hotcold">🔥 핫/콜드</a>
        <a href="#sec-stats">🧮 통계</a>
        <a href="#sec-gen">🎲 생성기</a>
        <a href="#sec-lucky">🏆 추천</a>
        <a href="#sec-hall">🏅 명예의전당</a>
        <a href="javascript:void(0)" onClick={() => openLab(null)}>🎯 분석·시뮬</a>
      </nav>

      <div className="grid">
        <div id="sec-slot" style={{ gridColumn: '1/-1' }}>
          <SlotMachine
            balance={pts.balance}
            canSpin={pts.canSpin}
            applySpin={pts.applySpin}
            refill={pts.refill}
            spins={pts.spins}
            wins={pts.wins}
            best={pts.best}
            biggest={pts.biggest}
          />
        </div>
        <LatestDraw />
        <FreqChart />
        <HotCold />
        <MiscStats />
        <Generator onAnalyze={openLab} />
        <LuckyPick onAnalyze={openLab} />
        <HallOfFame />
      </div>

      <LabModal open={labOpen} initialNums={labNums} onClose={() => setLabOpen(false)} />
    </div>
  )
}
