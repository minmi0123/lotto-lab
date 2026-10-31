import Ball from './Ball.jsx'
import Icon from './Icon.jsx'
import HelpStat from './HelpStat.jsx'
import ChartTip, { useChartTip } from './ChartTip.jsx'
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

// ---------- 전반 핫·콜드 → 후반 순위 (slope) ----------
// 핫 = 브랜드 노랑, 콜드 = 밝은 무채색. 로또 공 색(번호대 의미)과 겹치지 않게 빨강/파랑은 쓰지 않는다
const COLD = '#d4d4d4'
const SW = 600,
  SH = 300,
  sT = 34,
  sB = 16,
  xa = 140,
  xb = 400
const sy = (r) => sT + ((r - 1) / 44) * (SH - sT - sB)
const lateAvg = (g) => g.reduce((s, d) => s + d.late, 0) / g.length

const gap = Math.max(...freq.slice(1)) - Math.min(...freq.slice(1))
const most = ranked[0].num
const least = ranked[ranked.length - 1].num

export default function HotCold() {
  const tip = useChartTip()
  return (
    <>
    <div className="card full" id="sec-hotcold">
      <h2><Icon name="eye" />핫·콜드 분석</h2>

      <svg viewBox={`0 0 ${W} ${H}`} className="noise" role="img"
        aria-label={`45개 번호의 출현 횟수 분포. 평균 ${freqMean.toFixed(1)}회, 무작위 기대 변동폭 1σ ±${freqSd.toFixed(2)}회. 최다 ${Math.max(...freq.slice(1))}회, 최소 ${Math.min(...freq.slice(1))}회로 ${within2}/45개가 ±2σ 안에 있음.`}>
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
            stroke={d.edge ? CARD : 'none'} strokeWidth={2}
            {...tip.bind(`${d.n}번 · ${freq[d.n]}회`)} />
        ))}
      </svg>
      <ChartTip tip={tip} />

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
        <HelpStat
          label="최다 − 최소 격차"
          value={`${gap}회`}
          help={<>가장 많이 나온 번호({most}번, {freq[most]}회)와 가장 적게 나온 번호({least}번, {freq[least]}회)의 출현 횟수 차이.</>}
        />
        <HelpStat
          label="무작위로 뽑아도 생기는 변동폭"
          value={`±${freqSd.toFixed(2)}회`}
          help={<>
            {totalRounds}회 동안 매번 6개를 무작위로 뽑으면 번호 하나의 평균 출현은 {freqMean.toFixed(1)}회다.
            실제 출현 횟수는 이 평균에서 위아래로 흔들리며, 그 흔들림의 표준 크기(표준편차, 1σ)가 ±{freqSd.toFixed(2)}회다.
            무작위라면 번호의 약 68%가 평균 ±{freqSd.toFixed(2)}회({(freqMean - freqSd).toFixed(1)}~{(freqMean + freqSd).toFixed(1)}회) 안에 든다.
            <div className="help-easy">
              <b>쉬운 설명</b>
              {totalRounds}회 동안 6개씩 뽑는다고 가정했을 때, 한 번호당 평균 {freqMean.toFixed(1)}회 나와야 합니다.
              하지만 공정하게 뽑아도 딱 {Math.round(freqMean)}회로 맞지 않습니다.
              (동전을 100번 던져도 정확히 앞면 50번이 나오는 경우는 드문 것과 같은 원리입니다.)
              이 정도는 위아래로 흔들리는 게 정상이라는 폭이 ±{freqSd.toFixed(2)}회입니다.
            </div>
          </>}
        />
        <HelpStat
          label="95% 기대 범위(±2σ) 안"
          value={`${within2}/45개 (기대 ${expect2}개)`}
          help={<>
            출현 횟수가 평균 ±2σ({(freqMean - 2 * freqSd).toFixed(1)}~{(freqMean + 2 * freqSd).toFixed(1)}회) 안에 든 번호 수.
            무작위라면 약 95%, 45개 중 {expect2}개가 이 범위에 든다.
            <div className="help-easy">
              <b>쉬운 설명</b>
              위의 변동폭을 두 배(±{(2 * freqSd).toFixed(1)}회)로 잡았을 때, 번호의 95%는 그 안에 들어옵니다.
              (45개 중 약 {expect2}개)
              <p className="help-note">* 변동폭 두 배의 기준은 일반 통계, 여론조사, 의학 연구 등에서 쓰는 표준 기준입니다.</p>
            </div>
          </>}
        />
      </div>
    </div>

    <div className="card full" id="sec-hcsplit">
      <h2><Icon name="split" />핫·콜드 번호 전후반 순위
        <small>1~{splitHalf.half}회 상위·하위 6개가 {splitHalf.half + 1}~{totalRounds}회에서 기록한 출현 순위</small></h2>
      <svg viewBox={`0 0 ${SW} ${SH}`} className="noise slope" role="img"
        aria-label={`전반 핫 6개의 후반 평균 순위 ${splitHalf.hotLateRank}위, 전반 콜드 6개의 후반 평균 순위 ${splitHalf.coldLateRank}위, 무작위 기대 ${splitHalf.chance}위`}>
        {/* 20위 눈금은 기대 순위(23위) 라벨과 겹쳐서 뺀다. 23위는 점선 끝 라벨로 */}
        <text x={xa - 38} y={sy(splitHalf.chance) + 3} textAnchor="end" className="noise-tick slope-avg">{splitHalf.chance}위</text>
        {[1, 10, 30, 40, 45].map((r) => (
          <g key={r}>
            <line x1={xa - 30} x2={xb + 10} y1={sy(r)} y2={sy(r)} stroke={AXIS} strokeWidth={0.6} />
            <text x={xa - 38} y={sy(r) + 3} textAnchor="end" className="noise-tick">{r}위</text>
          </g>
        ))}
        <text x={xa} y={sT - 16} textAnchor="middle" className="noise-cap">전반 순위</text>
        <text x={xb} y={sT - 16} textAnchor="middle" className="noise-cap">후반 순위</text>

        <line x1={xa - 30} x2={xb + 10} y1={sy(splitHalf.chance)} y2={sy(splitHalf.chance)}
          stroke={CTX} strokeWidth={1} strokeDasharray="4 3" />

        {[[splitHalf.hot, HI, '핫'], [splitHalf.cold, COLD, '콜드']].map(([g, col, name]) =>
          g.map((d) => (
            <g key={name + d.n}>
              <line x1={xa} y1={sy(d.early)} x2={xb} y2={sy(d.late)} stroke={col} strokeWidth={1.5} opacity={0.55} />
              {[['early', xa], ['late', xb]].map(([k, x]) => (
                <circle key={k} cx={x} cy={sy(d[k])} r={4} fill={col} stroke={CARD} strokeWidth={1.5}
                  {...tip.bind(`${name} ${d.n}번 · 전반 ${d.early}위 → 후반 ${d.late}위`)} />
              ))}
            </g>
          ))
        )}

        {[[splitHalf.hot, HI, '핫'], [splitHalf.cold, COLD, '콜드']].map(([g, col, name]) => {
          const v = lateAvg(g)
          return (
            <g key={name}>
              <rect x={xb - 9} y={sy(v) - 2} width={18} height={4} rx={2} fill={col} />
              <text x={xb + 18} y={sy(v) + 3} className="noise-cap slope-avg">{name} {v.toFixed(1)}위</text>
            </g>
          )
        })}

      </svg>
      <div className="legend">
        <i style={{ background: HI }} /> 핫 (전반 1~6위)
        <span style={{ color: 'var(--muted-soft)' }}>·</span>
        <i style={{ background: COLD }} /> 콜드 (전반 40~45위)
        <span style={{ color: 'var(--muted-soft)' }}>·</span>
        막대 = 6개 평균
        <span style={{ color: 'var(--muted-soft)' }}>·</span>
        점선 = 무작위로 골랐을 때 기대 순위
      </div>

      <div style={{ marginTop: 8 }}>
        <HelpStat
          label="전반 핫 Top6 → 후반 평균"
          value={`${splitHalf.hotLateRank}위`}
          valueClass="neg"
          help={<>
            전체 회차를 반으로 나눠 전반(1~{splitHalf.half}회)에서 가장 많이 나온 6개 번호를 고르고,
            이 번호들이 후반({splitHalf.half + 1}~{totalRounds}회) 출현 순위에서 몇 위였는지 평균한 값.
          </>}
        />
        <HelpStat
          label="전반 콜드 Bottom6 → 후반 평균"
          value={`${splitHalf.coldLateRank}위`}
          valueClass="pos"
          help={<>
            전반(1~{splitHalf.half}회)에서 가장 적게 나온 6개 번호가 후반({splitHalf.half + 1}~{totalRounds}회)
            출현 순위에서 몇 위였는지 평균한 값.
          </>}
        />
        <HelpStat
          label="무작위일 때 기대값"
          value={`둘 다 ${splitHalf.chance}위`}
          help={<>45개 번호 중 아무 번호나 골랐을 때 기대되는 평균 순위. 1위와 45위의 가운데인 {splitHalf.chance}위.</>}
        />
      </div>
    </div>
    </>
  )
}
