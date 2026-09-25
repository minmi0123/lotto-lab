import Ball from './Ball.jsx'
import Icon from './Icon.jsx'
import { ranked, freq, freqMean, freqSd, splitHalf, totalRounds } from '../lib/stats.js'

// emphasis 형태: 강조 1색 + 맥락 회색.
// 핫/콜드는 '축 위치'(왼쪽 끝=콜드, 오른쪽 끝=핫)가 이미 구분하므로 색으로 또 나누지 않는다.
// 빨강/파랑을 쓰면 바로 아래 로또 공 색(번호대 의미)과 충돌해 같은 카드에서 색이 두 뜻을 갖게 됨.
// 강조는 브랜드 노랑(유채색), 맥락은 무채색 회색 — 명도와 채도가 함께 달라 색각이상에서도 갈린다.
const HI = '#faff69' // --primary
const CTX = '#888888' // --muted
const BAND = '#ffffff' // 기대 변동폭 띠는 무채색으로. 두 번째 브랜드 컬러를 만들지 않는다
const AXIS = '#3a3a3a' // --hairline-strong
const MEAN = '#5a5a5a' // --muted-soft
const CARD = '#1a1a1a' // --surface-card

const W = 600,
  H = 112,
  padX = 34,
  baseY = 74,
  axisY = 80,
  ROW = 9

const hot = ranked.slice(0, 6).map((r) => r.num)
const cold = ranked.slice(-6).map((r) => r.num).reverse()
const edge = new Set([...hot, ...cold])

// x축 도메인: ±2σ 구간과 실제 관측치를 모두 담게
const lo = Math.min(...freq.slice(1), freqMean - 2 * freqSd) - 5
const hi = Math.max(...freq.slice(1), freqMean + 2 * freqSd) + 5
const sx = (v) => padX + ((v - lo) / (hi - lo)) * (W - padX * 2)

// 점이 겹치면 위로 쌓는 간이 비스웜 배치
const dots = (() => {
  const placed = []
  return [...Array(45)]
    .map((_, i) => i + 1)
    .sort((a, b) => freq[a] - freq[b])
    .map((n) => {
      const x = sx(freq[n])
      let row = 0
      while (placed.some((p) => p.row === row && Math.abs(p.x - x) < ROW)) row++
      placed.push({ x, row })
      return { n, x, y: baseY - row * ROW, edge: edge.has(n) }
    })
})()

const ticks = []
for (let t = Math.ceil(lo / 10) * 10; t <= hi; t += 10) ticks.push(t)

// 무작위 기대 변동폭 안에 실제로 몇 개가 들어오는지
const within2 = freq.slice(1).filter((c) => Math.abs(c - freqMean) <= 2 * freqSd).length
const expect2 = Math.round(45 * 0.954)

const gap = Math.max(...freq.slice(1)) - Math.min(...freq.slice(1))

export default function HotCold() {
  return (
    <div className="card full" id="sec-hotcold">
      <h2><Icon name="eye" />착시 코너<small>핫·콜드 넘버, 진짜 신호일까?</small></h2>

      <svg viewBox={`0 0 ${W} ${H}`} className="noise" role="img"
        aria-label={`45개 번호의 출현 횟수 분포. 평균 ${freqMean.toFixed(1)}회, 무작위 기대 변동폭 1σ ±${freqSd.toFixed(1)}회. 최다 ${Math.max(...freq.slice(1))}회, 최소 ${Math.min(...freq.slice(1))}회로 ${within2}/45개가 ±2σ 안에 있음.`}>
        {/* 무작위로 뽑아도 생기는 변동폭. 바깥 띠 95%(±2σ), 안쪽 띠 68%(±1σ) */}
        <rect x={sx(freqMean - 2 * freqSd)} y={18} width={sx(freqMean + 2 * freqSd) - sx(freqMean - 2 * freqSd)}
          height={axisY - 18} rx={4} fill={BAND} opacity={0.05} />
        <rect x={sx(freqMean - freqSd)} y={18} width={sx(freqMean + freqSd) - sx(freqMean - freqSd)}
          height={axisY - 18} rx={4} fill={BAND} opacity={0.09} />
        <line x1={sx(freqMean)} y1={18} x2={sx(freqMean)} y2={axisY}
          stroke={MEAN} strokeWidth={1} strokeDasharray="3 3" />

        {/* 핫·콜드는 색이 아니라 '축의 양 끝'이라는 사실 자체로 구분 */}
        <text x={sx(freqMean)} y={12} textAnchor="middle" className="noise-cap">평균 {freqMean.toFixed(1)}회</text>
        <text x={padX} y={12} textAnchor="start" className="noise-cap">콜드 Bottom6</text>
        <text x={W - padX} y={12} textAnchor="end" className="noise-cap">핫 Top6</text>

        {/* 축 */}
        <line x1={padX} y1={axisY} x2={W - padX} y2={axisY} stroke={AXIS} strokeWidth={1} />
        {ticks.map((t) => (
          <text key={t} x={sx(t)} y={axisY + 13} textAnchor="middle" className="noise-tick">{t}</text>
        ))}
        <text x={W / 2} y={H - 2} textAnchor="middle" className="noise-cap">← 출현 횟수 →</text>

        {/* 45개 번호 전부. 양 끝 12개만 강조하고 나머지는 뒤로 물러남 */}
        {dots.map((d) => (
          <circle key={d.n} cx={d.x} cy={d.y}
            r={d.edge ? 5 : 2.6}
            fill={d.edge ? HI : CTX}
            opacity={d.edge ? 1 : 0.5}
            stroke={d.edge ? CARD : 'none'} strokeWidth={2}>
            <title>{d.n}번 · {freq[d.n]}회</title>
          </circle>
        ))}
      </svg>

      <div className="legend">
        <i style={{ background: HI }} /> 핫·콜드 12개(양 끝)
        <span style={{ color: 'var(--muted-soft)' }}>·</span>
        <i style={{ background: CTX }} /> 나머지 33개
        <span style={{ color: 'var(--muted-soft)' }}>·</span>
        밝은 띠 = 무작위로 뽑아도 생기는 변동폭 (진한 쪽 68%, 연한 쪽 95%)
      </div>

      <h2 style={{ marginTop: 24 }}><Icon name="flame" />핫넘버<small>최다 출현 Top 6</small></h2>
      <div className="balls">
        {hot.map((n) => (
          <span className="hc-item" key={n}><Ball n={n} /><span className="mini">{freq[n]}회</span></span>
        ))}
      </div>
      <h2 style={{ marginTop: 20 }}><Icon name="snow" />콜드넘버<small>최소 출현 Bottom 6</small></h2>
      <div className="balls">
        {cold.map((n) => (
          <span className="hc-item" key={n}><Ball n={n} /><span className="mini">{freq[n]}회</span></span>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="stat">
          <span>최다 − 최소 격차</span><b>{gap}회</b>
        </div>
        <div className="stat">
          <span>무작위로 뽑아도 생기는 변동폭</span><b>±{freqSd.toFixed(1)}회</b>
        </div>
        <div className="stat">
          <span>95% 기대 범위(±2σ) 안</span><b>{within2}/45개 (기대 {expect2}개)</b>
        </div>
        <div className="stat">
          <span>전반 핫 Top6 → 후반 평균</span>
          <b className="neg">{splitHalf.hotLateRank}위</b>
        </div>
        <div className="stat">
          <span>전반 콜드 Bottom6 → 후반 평균</span>
          <b className="pos">{splitHalf.coldLateRank}위</b>
        </div>
        <div className="stat">
          <span>무작위라면 나와야 할 값</span><b>둘 다 {splitHalf.chance}위</b>
        </div>
      </div>

      <div className="hint">
        45개를 줄 세우면 1등과 꼴찌는 <b>반드시</b> 생깁니다. {totalRounds}회를 완전 무작위로 뽑아도 번호마다
        ±{freqSd.toFixed(1)}회쯤 흔들립니다. 45개 중 {within2}개가 무작위 기대 범위(±2σ) 안에 들어와 있으니
        지금의 {gap}회 격차는 잡음이에요.
        {' '}실제로 전반 {splitHalf.half}회의 핫넘버는 후반에 평균 {splitHalf.hotLateRank}위로 <b>오히려 내려갔고</b>,
        콜드넘버가 {splitHalf.coldLateRank}위로 올라왔습니다. 즉 <b>과거 출현 빈도에는 예측력이 없습니다.</b>
        {' '}그래서 이 앱은 핫/콜드로 번호를 밀어주지 않아요.
      </div>
    </div>
  )
}
