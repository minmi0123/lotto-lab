import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Ball from './Ball.jsx'
import Icon from './Icon.jsx'
import { usePointsCtx } from '../state/PointsContext.jsx'
import { SPIN_COST, rollSpin, randomNumbers } from '../lib/scoring.js'

export default function SlotMachine() {
  const { balance, canSpin, applySpin, refill, spins, wins, best, biggest, myNumbers, clearMyNumbers } =
    usePointsCtx()
  const navigate = useNavigate()
  // 내 번호가 지정돼 있으면 기본 '내 번호' 모드, 아니면 '자동'
  const [mode, setMode] = useState(myNumbers ? 'mine' : 'auto')
  const [phase, setPhase] = useState('idle') // idle | spinning | done
  const [reel, setReel] = useState(myNumbers || [1, 2, 3, 4, 5, 6])
  const [draw, setDraw] = useState(null)
  const [result, setResult] = useState(null)
  const timers = useRef([])

  // interval/timeout 을 섞어 담으므로 종류를 같이 기록해 각각 정확히 해제
  function clearTimers() {
    timers.current.forEach(({ kind, id }) => (kind === 'interval' ? clearInterval(id) : clearTimeout(id)))
    timers.current = []
  }

  // 스핀 도중 페이지 이탈 시 타이머 정리 (setState 경고 방지)
  useEffect(() => clearTimers, [])

  // 내 번호 모드인데 고정 번호가 없으면 자동으로 폴백
  const useMine = mode === 'mine' && myNumbers && myNumbers.length === 6

  function spin() {
    if (!canSpin || phase === 'spinning') return
    clearTimers()
    const mine = useMine ? myNumbers : randomNumbers()
    const res = rollSpin(mine) // 확률표로 결과 추첨 + draw 구성

    setPhase('spinning')
    setDraw(null)
    setResult(null)

    // 릴 굴러가는 연출 (내 번호 모드면 마지막에 내 번호로 멈춤 → 서스펜스는 '추첨 공개'로)
    const iv = setInterval(() => setReel(randomNumbers()), 80)
    timers.current.push({ kind: 'interval', id: iv })

    const stop = setTimeout(() => {
      clearInterval(iv)
      setReel(mine)
      setDraw(res.draw)
      setResult(res)
      setPhase('done')
      applySpin(res) // 비용 차감 + 보상 정산
    }, 900)
    timers.current.push({ kind: 'timeout', id: stop })
  }

  function release() {
    clearMyNumbers()
    setMode('auto')
    setReel(randomNumbers())
  }

  const mset = new Set(reel)
  const spinning = phase === 'spinning'

  return (
    <div className="card full slot">
      <h2>
        <Icon name="slot" />
        로또 슬롯
        <small>역대 회차와 겨뤄 포인트를 불려요 (1회 -{SPIN_COST}pt)</small>
      </h2>

      {/* 모드 토글 */}
      <div className="seg" style={{ justifyContent: 'center' }}>
        <button className={mode === 'auto' ? 'on' : ''} onClick={() => setMode('auto')} disabled={spinning}>
          <Icon name="dice" size={16} />자동
        </button>
        <button
          className={mode === 'mine' ? 'on' : ''}
          onClick={() => (myNumbers ? setMode('mine') : navigate('/analyze'))}
          disabled={spinning}
          title={myNumbers ? '' : '생성기·추천에서 번호를 먼저 골라오세요'}
        >
          <Icon name="star" size={16} />내 번호
        </button>
      </div>

      {/* 내 번호 모드 안내 */}
      {useMine && (
        <div className="row" style={{ justifyContent: 'center', marginBottom: 8 }}>
          <span className="mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="star" size={14} />고정된 내 번호
          </span>
          <button className="mini-btn" onClick={release} disabled={spinning}>해제</button>
          <button
            className="mini-btn"
            onClick={() => navigate('/analyze', { state: { nums: myNumbers } })}
            disabled={spinning}
          >
            바꾸기
          </button>
        </div>
      )}
      {mode === 'mine' && !useMine && (
        <div className="row" style={{ justifyContent: 'center', marginBottom: 8 }}>
          <span className="mini">고정된 번호가 없어요. <a href="#/analyze" onClick={(e) => { e.preventDefault(); navigate('/analyze') }}>생성기·추천에서 고르기</a></span>
        </div>
      )}

      <div className="reel">
        {reel.map((n, i) => (
          <Ball key={i} n={n} spin={spinning} />
        ))}
      </div>

      {draw && (
        <>
          <div className="vs"><Icon name="chevronDown" size={14} />추첨 결과<Icon name="chevronDown" size={14} /></div>
          <div className="reel draw">
            {draw.n.map((n, i) => (
              <Ball key={i} n={n} className={mset.has(n) ? 'hit' : ''} />
            ))}
            <span className="plus">+</span>
            <Ball n={draw.b} className={mset.has(draw.b) ? 'hit' : ''} />
          </div>
        </>
      )}

      <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
        {canSpin ? (
          <button className="primary" onClick={spin} disabled={spinning}>
            <Icon name={spinning ? 'dice' : 'slot'} size={16} />
            {spinning ? '돌리는 중...' : `스핀 (-${SPIN_COST}pt)`}
          </button>
        ) : (
          <button className="primary" onClick={refill}>
            <Icon name="refresh" size={16} />포인트 소진! 무료 충전 받기 (+100pt)
          </button>
        )}
      </div>

      <div className="result">
        {result ? (
          <div>
            <div className={`grade g${result.grade} ${result.grade === 1 ? 'jackpot' : ''}`}>
              {result.label}
            </div>
            <div className="mini" style={{ marginTop: 8 }}>
              {result.match}개 일치{result.bonus ? ' + 보너스' : ''} ·{' '}
              {result.reward > 0 ? (
                <b style={{ color: 'var(--emerald)' }}>+{result.reward.toLocaleString()}pt</b>
              ) : (
                <b style={{ color: 'var(--rose)' }}>-{SPIN_COST}pt</b>
              )}
            </div>
          </div>
        ) : (
          <span className="mini">{useMine ? '내 번호로 스핀을 돌려보세요' : '스핀을 돌려보세요'}</span>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="stat"><span>총 스핀</span><b>{spins}회</b></div>
        <div className="stat"><span>당첨 횟수</span><b>1등 {wins[1]} · 2등 {wins[2]} · 3등 {wins[3]} · 4등 {wins[4]} · 5등 {wins[5]}</b></div>
        <div className="stat"><span>최고 보유 / 단일 최대 획득</span><b>{best.toLocaleString()}pt / {biggest.toLocaleString()}pt</b></div>
      </div>

      <div className="hint">
        <Icon name="alert" size={15} />
        <span>
          포인트는 재미용 가상 점수예요. 슬롯은 게임용 확률표(1등 1/8,000 등)로 추첨하며 실제 로또 확률과는 달라요.
          {' '}스핀당 평균 약 -0.9pt로 천천히 닳고, 가끔 잭팟이 터집니다.
        </span>
      </div>
    </div>
  )
}
