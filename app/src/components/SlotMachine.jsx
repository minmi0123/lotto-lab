import { useRef, useState, useEffect } from 'react'
import Ball from './Ball.jsx'
import { usePointsCtx } from '../state/PointsContext.jsx'
import { SPIN_COST, scoreDraw, randomDraw, randomNumbers } from '../lib/scoring.js'

export default function SlotMachine() {
  const { balance, canSpin, applySpin, refill, spins, wins, best, biggest } = usePointsCtx()
  const [phase, setPhase] = useState('idle') // idle | spinning | done
  const [reel, setReel] = useState([1, 2, 3, 4, 5, 6])
  const [draw, setDraw] = useState(null)
  const [result, setResult] = useState(null)
  const timers = useRef([])

  function clearTimers() {
    timers.current.forEach((t) => clearInterval(t) || clearTimeout(t))
    timers.current = []
  }

  // 스핀 도중 페이지 이탈 시 타이머 정리 (setState 경고 방지)
  useEffect(() => clearTimers, [])

  function spin() {
    if (!canSpin || phase === 'spinning') return
    clearTimers()
    const mine = randomNumbers()
    const d = randomDraw()
    const res = scoreDraw(mine, d)

    setPhase('spinning')
    setDraw(null)
    setResult(null)

    // 릴 굴러가는 연출
    const iv = setInterval(() => setReel(randomNumbers()), 80)
    timers.current.push(iv)

    const stop = setTimeout(() => {
      clearInterval(iv)
      setReel(mine)
      setDraw(d)
      setResult(res)
      setPhase('done')
      applySpin(res) // 비용 차감 + 보상 정산
    }, 900)
    timers.current.push(stop)
  }

  const mset = new Set(reel)
  const spinning = phase === 'spinning'

  return (
    <div className="card full slot">
      <h2>🎰 로또 슬롯 <small>역대 회차와 겨뤄 포인트를 불려요 (1회 -{SPIN_COST}pt)</small></h2>

      <div className="reel">
        {reel.map((n, i) => (
          <Ball key={i} n={n} spin={spinning} />
        ))}
      </div>

      {draw && (
        <>
          <div className="vs">▼ {draw.round}회차 당첨번호와 비교 ▼</div>
          <div className="reel draw">
            {draw.n.map((n, i) => (
              <Ball key={i} n={n} className={mset.has(n) ? 'hit' : ''} />
            ))}
            <span className="plus">+</span>
            <Ball n={draw.b} className={mset.has(draw.b) ? 'hit' : ''} />
          </div>
        </>
      )}

      <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
        {canSpin ? (
          <button className="primary" onClick={spin} disabled={spinning}>
            {spinning ? '🎲 돌리는 중...' : `🎰 스핀 (-${SPIN_COST}pt)`}
          </button>
        ) : (
          <button className="primary" onClick={refill}>
            💸 포인트 소진! 무료 충전 받기 (+100pt)
          </button>
        )}
      </div>

      <div className="result">
        {result ? (
          <div>
            <div className={`grade g${result.grade} ${result.grade === 1 ? 'jackpot' : ''}`}>
              {result.label}
            </div>
            <div className="mini" style={{ marginTop: 6 }}>
              {result.match}개 일치{result.bonus ? ' + 보너스' : ''} ·{' '}
              {result.reward > 0 ? (
                <b style={{ color: 'var(--good)' }}>+{result.reward.toLocaleString()}pt</b>
              ) : (
                <b style={{ color: 'var(--bad)' }}>-{SPIN_COST}pt</b>
              )}
            </div>
          </div>
        ) : (
          <span className="mini">스핀을 돌려보세요!</span>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="stat"><span>총 스핀</span><b>{spins}회</b></div>
        <div className="stat"><span>당첨 횟수</span><b>1등 {wins[1]} · 2등 {wins[2]} · 3등 {wins[3]} · 4등 {wins[4]} · 5등 {wins[5]}</b></div>
        <div className="stat"><span>최고 보유 / 단일 최대 획득</span><b>{best.toLocaleString()}pt / {biggest.toLocaleString()}pt</b></div>
      </div>

      <div className="hint">
        ⚠️ 포인트는 재미용 가상 점수예요. 매 스핀 역대 1228회차 중 무작위 1회를 뽑아 그 회차 당첨번호와 비교합니다.
      </div>
    </div>
  )
}
