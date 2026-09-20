import { misc } from '../lib/stats.js'

export default function MiscStats() {
  return (
    <div className="card" id="sec-stats">
      <h2>🧮 한눈에 보는 통계</h2>
      <div className="stat"><span>당첨번호 합계 평균</span><b>{misc.avgSum}</b></div>
      <div className="stat"><span>홀수 비율</span><b>{misc.oddPct}%</b></div>
      <div className="stat"><span>연속번호 포함 회차</span><b>{misc.consecPct}%</b></div>
      <div className="stat"><span>역대 최고 1등 당첨금</span><b>{(misc.maxW / 1e8).toFixed(1)}억 ({misc.maxWdRound}회)</b></div>
      <div className="stat"><span>역대 평균 1등 인원</span><b>{misc.avgWinners}명</b></div>
    </div>
  )
}
