import { useEffect, useState } from 'react'
import Ball from './Ball.jsx'
import { DATA } from '../data/lottoData.js'
import { freq } from '../lib/stats.js'
import { ballClass, randomNumbers } from '../lib/scoring.js'

const PRIZE3 = 1500000,
  PRIZE4 = 50000,
  PRIZE5 = 5000,
  TICKET = 1000
const gName = { 1: '1등', 2: '2등', 3: '3등', 4: '4등', 5: '5등' }

function won(v) {
  const a = Math.abs(v)
  if (a >= 1e8) return (v / 1e8).toFixed(a >= 1e9 ? 0 : 1) + '억'
  if (a >= 1e4) return Math.round(v / 1e4).toLocaleString() + '만'
  return Math.round(v).toLocaleString()
}
function gradeOf(m, bon) {
  if (m === 6) return 1
  if (m === 5 && bon) return 2
  if (m === 5) return 3
  if (m === 4) return 4
  if (m === 3) return 5
  return 0
}

function computeAnalyze(mine) {
  const mset = new Set(mine)
  let best = { grade: 99, round: null, match: 0 }
  const gradeCnt = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const sims = []
  DATA.forEach((d) => {
    const m = d.n.filter((x) => mset.has(x)).length,
      bon = mset.has(d.b)
    sims.push({ d, m, bon })
    const g = gradeOf(m, bon)
    if (g) {
      gradeCnt[g]++
      if (g < best.grade) best = { grade: g, round: d.round, match: m, bonus: bon }
    }
  })
  sims.sort((a, b) => b.m - a.m || b.bon - a.bon || b.d.round - a.d.round)
  return {
    best,
    gradeCnt,
    top3: sims.slice(0, 3),
    sum: mine.reduce((a, b) => a + b, 0),
    odd: mine.filter((x) => x % 2).length,
    totalFreq: mine.reduce((a, n) => a + freq[n], 0),
  }
}

function computeSim(mine, weekly, span) {
  const mset = new Set(mine)
  const games = weekly / TICKET
  const draws = DATA.slice(Math.max(0, DATA.length - span))
  let spend = 0,
    payout = 0
  const cnt = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let best = { g: 99, d: null, pz: 0 }
  draws.forEach((d) => {
    spend += TICKET * games
    const m = d.n.filter((x) => mset.has(x)).length,
      bon = mset.has(d.b)
    const g = gradeOf(m, bon)
    let pz = 0
    if (g === 1) pz = d.w1
    else if (g === 2) pz = d.w2
    else if (g === 3) pz = PRIZE3
    else if (g === 4) pz = PRIZE4
    else if (g === 5) pz = PRIZE5
    if (g) {
      cnt[g]++
      payout += pz * games
      if (g < best.g) best = { g, d, pz }
    }
  })
  const profit = payout - spend,
    roi = spend ? (profit / spend) * 100 : 0
  return { spend, payout, profit, roi, cnt, best, games, draws: draws.length }
}

// 분석·시뮬 본체 (페이지 카드). initialNums 가 오면 채우고 자동 실행.
export default function Analyzer({ initialNums }) {
  const [nums, setNums] = useState(['', '', '', '', '', ''])
  const [mode, setMode] = useState('anal')
  const [weekly, setWeekly] = useState(5000)
  const [span, setSpan] = useState(9999)
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (initialNums) {
      const filled = ['', '', '', '', '', '']
      initialNums.slice(0, 6).forEach((n, i) => (filled[i] = String(n)))
      setNums(filled)
      setShow(true)
      setErr('')
    }
  }, [initialNums])

  const mine = nums.map((v) => parseInt(v, 10))
  const valid = mine.every((v) => v >= 1 && v <= 45) && new Set(mine).size === 6

  function setNum(i, v) {
    const next = [...nums]
    next[i] = v
    setNums(next)
  }
  function run() {
    if (!valid) {
      setErr('1~45 사이 서로 다른 6개 번호를 입력하세요.')
      setShow(false)
      return
    }
    setErr('')
    setShow(true)
  }
  function fillRandom() {
    setNums(randomNumbers().map(String))
    setShow(true)
    setErr('')
  }

  const a = show && valid && mode === 'anal' ? computeAnalyze(mine) : null
  const s = show && valid && mode === 'sim' ? computeSim(mine, weekly, span) : null

  return (
    <div className="card full" id="sec-analyze">
      <h2>🎯 내 번호 분석 & 시뮬레이터 <small>한 세트로 둘 다</small></h2>

      <div className="row">
        {nums.map((v, i) => (
          <input
            key={i}
            className="num-in"
            type="number"
            min="1"
            max="45"
            placeholder={String(i + 1)}
            value={v}
            onChange={(e) => setNum(i, e.target.value)}
          />
        ))}
        <button onClick={fillRandom}>🎲 랜덤</button>
      </div>

      <div className="seg" style={{ marginTop: 12 }}>
        <button className={mode === 'anal' ? 'on' : ''} onClick={() => setMode('anal')}>🔍 분석</button>
        <button className={mode === 'sim' ? 'on' : ''} onClick={() => setMode('sim')}>💰 시뮬레이션</button>
      </div>

      {mode === 'sim' && (
        <div className="row">
          <label className="mini">주당 금액{' '}
            <select value={weekly} onChange={(e) => setWeekly(+e.target.value)}>
              <option value={1000}>1,000원 (1게임)</option>
              <option value={5000}>5,000원 (5게임)</option>
              <option value={10000}>10,000원 (10게임)</option>
            </select>
          </label>
          <label className="mini">기간{' '}
            <select value={span} onChange={(e) => setSpan(+e.target.value)}>
              <option value={52}>최근 1년 (52회)</option>
              <option value={156}>최근 3년 (156회)</option>
              <option value={260}>최근 5년 (260회)</option>
              <option value={9999}>역대 전체</option>
            </select>
          </label>
        </div>
      )}

      <div className="row" style={{ marginTop: 10 }}>
        <button className="primary" onClick={run}>▶ 실행</button>
        <span className="mini">
          {mode === 'sim' ? '이 번호로 꾸준히 샀다면 수익을 계산합니다' : '역대 당첨 이력과 내 번호를 비교합니다'}
        </span>
      </div>

      {err && <div className="res"><span className="g0">{err}</span></div>}
      {a && <AnalyzeView mine={mine} a={a} />}
      {s && <SimView mine={mine} s={s} />}

      {mode === 'sim' && (
        <div className="hint" style={{ marginTop: 8 }}>
          매 회차 같은 번호로 (주당금액÷1,000)장씩 샀다고 가정합니다. 1·2등은 회차별 실제값, 3등 150만·4등 5만·5등 5천원은 통상 근사값이에요.
        </div>
      )}
    </div>
  )
}

function AnalyzeView({ mine, a }) {
  const mset = new Set(mine)
  return (
    <div className="res">
      {a.best.grade < 99 ? (
        <div className={`grade g${a.best.grade}`}>
          🎉 역대 최고 {gName[a.best.grade]} 적중 이력! <span className="mini">({a.best.round}회차 기준)</span>
        </div>
      ) : (
        <div className="grade g0">아쉽게도 역대에 3등 이상 적중한 적은 없어요.</div>
      )}
      <div className="balls" style={{ margin: '12px 0' }}>
        {mine.map((n, i) => (
          <Ball key={i} n={n} />
        ))}
      </div>
      <div className="stat"><span>이 조합으로 받았을 등수 횟수</span><b>1등 {a.gradeCnt[1]} · 2등 {a.gradeCnt[2]} · 3등 {a.gradeCnt[3]} · 4등 {a.gradeCnt[4]} · 5등 {a.gradeCnt[5]}</b></div>
      <div className="stat"><span>합계 / 홀짝</span><b>{a.sum} (평균대 130~145) · 홀{a.odd}:짝{6 - a.odd}</b></div>
      <div className="stat"><span>6개 번호 누적 출현 횟수</span><b>{a.totalFreq}회</b></div>
      <div className="hint">각 번호 출현: {mine.map((n) => <span className="tag" key={n}>{n}번 {freq[n]}회</span>)}</div>
      <div className="hint" style={{ marginTop: 14, color: 'var(--txt)', fontSize: 13 }}>
        📅 내 번호와 가장 닮았던 역대 회차 TOP 3 <span className="mini">(겹친 번호만 진하게)</span>
      </div>
      {a.top3.map((sm) => (
        <div className="row" key={sm.d.round} style={{ gap: 10, marginTop: 8, alignItems: 'center' }}>
          <span className="tag" style={{ minWidth: 54, textAlign: 'center' }}>{sm.d.round}회</span>
          <div className="balls">
            {sm.d.n.map((n, i) => (
              <span className={`ball ${ballClass(n)}`} key={i} style={{ opacity: mset.has(n) ? 1 : 0.28 }}>{n}</span>
            ))}
            <span className="plus">+</span>
            <span className={`ball ${ballClass(sm.d.b)}`} style={{ opacity: mset.has(sm.d.b) ? 1 : 0.28 }}>{sm.d.b}</span>
          </div>
          <span className="mini">{sm.m}개 일치{sm.bon ? ' + 보너스' : ''}</span>
        </div>
      ))}
    </div>
  )
}

function SimView({ mine, s }) {
  const pc = s.profit >= 0 ? 'g3' : 'g0'
  return (
    <div className="res">
      <div className={`grade ${pc}`}>
        {s.profit >= 0 ? '📈 +' : '📉 '}
        {won(s.profit)}원 {s.profit >= 0 ? '수익!' : '손해'}
      </div>
      <div className="balls" style={{ margin: '12px 0' }}>
        {mine.map((n, i) => (
          <Ball key={i} n={n} />
        ))}
      </div>
      <div className="stat"><span>총 구매 ({s.draws}회 × {s.games}게임)</span><b>{won(s.spend)}원</b></div>
      <div className="stat"><span>총 당첨금</span><b>{won(s.payout)}원</b></div>
      <div className="stat"><span>순손익 / 수익률</span><b className={pc}>{s.profit >= 0 ? '+' : ''}{won(s.profit)}원 ({s.roi.toFixed(1)}%)</b></div>
      <div className="stat"><span>당첨 횟수</span><b>1등 {s.cnt[1]} · 2등 {s.cnt[2]} · 3등 {s.cnt[3]} · 4등 {s.cnt[4]} · 5등 {s.cnt[5]}</b></div>
      {s.best.d ? (
        <div className="hint" style={{ marginTop: 8 }}>
          ✨ 최고의 순간: <b>{s.best.d.round}회 {gName[s.best.g]}</b> 당첨 ({won(s.best.pz * s.games)}원)
        </div>
      ) : (
        <div className="hint" style={{ marginTop: 8 }}>아쉽게도 이 기간엔 당첨이 없었어요 😢</div>
      )}
    </div>
  )
}
