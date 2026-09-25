import Icon from './Icon.jsx'
import KoreaMap from './KoreaMap.jsx'
import { regions, label, byRegion, within2, outliers, storeHist, multi, totals, top, online, meta } from '../lib/regionStats.js'

// forest plot. 가로축은 "판매점 수에 비례했을 때의 기대 배출" 대비 비율이라
// 1.0 이 기준선이고, 가로 막대는 무작위로도 생기는 변동폭(±2σ)이다.
// 막대가 1.0 을 가로지르면 그 지역은 '차이 없음'.
//
// 색은 HotCold 와 같은 규칙: 강조 1색(브랜드 노랑) + 맥락 무채색. 축 위치가 이미 크기를
// 말하므로 색으로 또 나누지 않고, 기대 범위를 벗어난 지역에만 강조를 쓴다.
const HI = '#faff69' // --primary
const CTX = '#888888' // --muted
const REF = '#ffffff' // 기준선(1.0)은 무채색
const W = 600,
  LABEL = 54,
  PLOT_L = 62,
  PLOT_R = 448,
  ROW = 17,
  TOP_PAD = 30

const rows = [...byRegion].sort((a, b) => b.ratio - a.ratio)

// 지도용. byRegion 은 REGIONS 와 같은 순서라 그대로 뽑아 쓴다.
const winVals = byRegion.map((r) => r.wins)
const shopVals = byRegion.map((r) => r.shops)
// 두 지도가 실제로 얼마나 닮았는지 — 순위 상관(스피어만)으로 재서 글로도 말해준다.
// 배출 건수엔 동점이 많다(20건이 3곳, 23건이 2곳). 동점에 임의 순위를 주면
// 값이 흔들리므로 평균 순위를 매기고, 그 위에서 피어슨을 구한다.
const spearman = (() => {
  const rank = (vals) => {
    const idx = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0])
    const out = new Array(vals.length)
    let i = 0
    while (i < idx.length) {
      let j = i
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++
      const avg = (i + j) / 2 + 1
      for (let k = i; k <= j; k++) out[idx[k][1]] = avg
      i = j + 1
    }
    return out
  }
  const a = rank(winVals),
    b = rank(shopVals)
  const mean = (x) => x.reduce((p, c) => p + c, 0) / x.length
  const ma = mean(a),
    mb = mean(b)
  const cov = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0)
  const sa = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0))
  const sb = Math.sqrt(b.reduce((s, v) => s + (v - mb) ** 2, 0))
  return sa && sb ? cov / (sa * sb) : 0
})()
// ±2σ 를 비율 단위로. 배출이 적은 지역일수록 넓다
const half = (r) => (r.exp ? 2 / Math.sqrt(r.exp) : 0)

const lo = Math.max(0, Math.min(...rows.map((r) => r.ratio - half(r))) - 0.05)
const hi = Math.max(...rows.map((r) => r.ratio + half(r))) + 0.05
const sx = (v) => PLOT_L + ((v - lo) / (hi - lo)) * (PLOT_R - PLOT_L)

const H = TOP_PAD + rows.length * ROW + 28
// 0.25 같은 간격은 소수 한 자리로 찍으면 0.3·0.8 로 보여 눈금이 거짓말을 한다
const step = [0.1, 0.2, 0.5, 1].find((s) => (hi - lo) / s <= 8) ?? 1
const ticks = []
for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(Math.round(t * 100) / 100)

// 4번 배출의 기대값은 0.004곳이라 반올림하면 '0.0곳' 이 되어 뜻이 뭉개진다
const fmtExp = (v) => (v < 0.05 ? '0.01곳도 안 된다' : v < 1 ? `${v.toFixed(1)}곳` : `${Math.round(v)}곳`)

export default function RegionStats() {
  return (
    <div className="card full" id="sec-region">
      <h2><Icon name="map" />지역별 1등 배출<small>판매점 수로 보정해서</small></h2>

      {/* 1단계 — 지도 두 장을 나란히. "많이 나온 곳"과 "판매점이 많은 곳"이
          같은 모양이라는 걸 보고 나면 아래 forest plot 이 설명이 된다.
          땅은 값으로 칠하지 않고 원 넓이로만 말한다 (KoreaMap 주석 참고). */}
      <div className="maps">
        <KoreaMap title="1등 배출 건수" regions={regions} values={winVals} unit="건" />
        <KoreaMap title="로또 판매점 수" regions={regions} values={shopVals} unit="곳" />
      </div>

      <div className="hint" style={{ marginTop: 12 }}>
        <b>두 지도가 거의 같은 모양이다.</b> 1등이 많이 나온 곳(경기 {byRegion[1].wins}건, 서울 {byRegion[0].wins}건)은
        판매점도 가장 많은 곳(경기 {byRegion[1].shops.toLocaleString()}곳, 서울 {byRegion[0].shops.toLocaleString()}곳)이다.
        16개 시도의 배출 순위와 판매점 순위는 {spearman.toFixed(2)}만큼 함께 움직인다(1.00이면 완전히 같은 순서).
        많이 파니까 많이 나오는 것이지, 그 지역의 운이 좋은 게 아니다. 아래는 판매점 수로 나눠서 다시 본 것이다.
        {' '}<span className="mini">(원 넓이가 값이다. 제주는 지면을 아끼려고 실제보다 위로 당겨 그렸고,
        울릉도·독도 등 작은 섬은 생략했다. 전남과 광주는 원본이 통합 표기라 한 덩어리다.)</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="noise"
        role="img"
        aria-label={`16개 시도의 1등(자동) 배출 ${totals.winTotal}건을 지역별 판매점 수 대비로 본 그래프. 무작위 기대 범위(±2σ) 안에 ${within2}/16개 지역이 들어옴.`}
      >
        <line
          x1={sx(1)}
          y1={TOP_PAD - 8}
          x2={sx(1)}
          y2={TOP_PAD + rows.length * ROW - 4}
          stroke={REF}
          strokeWidth="1.5"
          opacity={0.35}
        />
        <text className="noise-cap" x={sx(1)} y={TOP_PAD - 14} textAnchor="middle">
          판매점 수만큼
        </text>
        {ticks.map((t) => (
          <text key={t} className="noise-tick" x={sx(t)} y={H - 14} textAnchor="middle">
            {t.toFixed(1)}
          </text>
        ))}

        {rows.map((r, i) => {
          const y = TOP_PAD + i * ROW + 6
          const h = half(r)
          const odd = Math.abs(r.z) > 2
          const c = odd ? HI : CTX
          return (
            <g key={r.name}>
              <text className="noise-tick" x={LABEL} y={y + 3} textAnchor="end" fill={odd ? HI : undefined}>
                {label(r.name)}
              </text>
              <line x1={sx(Math.max(lo, r.ratio - h))} y1={y} x2={sx(r.ratio + h)} y2={y} stroke={c} strokeWidth="1.5" opacity={0.55} />
              {/* 배출이 적은 지역은 아래쪽 끝이 0 밑으로 내려가 잘린다. 그때는 끝 표시를 생략 */}
              {r.ratio - h >= lo && (
                <line x1={sx(r.ratio - h)} y1={y - 3} x2={sx(r.ratio - h)} y2={y + 3} stroke={c} strokeWidth="1.5" opacity={0.55} />
              )}
              <line x1={sx(r.ratio + h)} y1={y - 3} x2={sx(r.ratio + h)} y2={y + 3} stroke={c} strokeWidth="1.5" opacity={0.55} />
              <circle cx={sx(r.ratio)} cy={y} r={3.4} fill={c} />
              <text className="noise-tick" x={PLOT_R + 12} y={y + 3}>
                {r.wins}건 / 판매점 {r.shops.toLocaleString()}곳
              </text>
            </g>
          )
        })}
      </svg>

      <div className="stat">
        <span>무작위 기대 범위(±2σ) 안에 든 지역</span>
        <b>{within2} / 16개</b>
      </div>

      <div className="hint">
        1등(자동) {totals.winTotal}건, 전국 판매점 {totals.shopTotal.toLocaleString()}곳 기준.{' '}
        {outliers.length === 0 ? (
          <>
            <b>기대 범위를 벗어난 지역은 하나도 없다.</b> 어느 지역에서 1등이 많이 나오느냐는
            그 지역에 판매점이 몇 곳 있느냐로 거의 다 설명된다. 배출 1·2위인 경기·서울은
            판매점 수도 1·2위다.
          </>
        ) : (
          <>
            기대 범위를 벗어난 지역은 <b>{outliers.map((r) => label(r.name)).join(', ')}</b>. 다만 16개
            지역을 한꺼번에 재면 그중 0.7개쯤은 무작위로도 ±2σ 밖으로 나간다.
          </>
        )}
      </div>

      <h2 style={{ marginTop: 28 }}>
        <Icon name="store" />
        &lsquo;명당&rsquo;은 있을까
        <small>판매점 한 곳이 여러 번 배출할 확률</small>
      </h2>

      <div className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
        전국 판매점이 다 똑같이 판다면 한 곳이 1년에 여러 번 1등을 내는 일은 거의 없어야 한다.
        실제와 견줘 보면:
      </div>

      {storeHist.map((h) => (
        <div className="stat" key={h.k}>
          <span>1년에 {h.k}번 배출한 판매점</span>
          <b>
            {h.observed}곳{' '}
            <span className="mini" style={{ fontWeight: 400 }}>
              (다 똑같이 팔았다면 {fmtExp(h.expected)})
            </span>
          </b>
        </div>
      ))}

      <div className="stat">
        <span>2번 이상 배출한 판매점</span>
        <b>
          {multi.observed}곳 · 기대의 {multi.times.toFixed(1)}배
        </b>
      </div>

      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
        {top.slice(0, 9).map((s) => (
          <span className="tag" key={s.n + s.g}>
            {s.c}건 · {s.n} <span className="mini">({s.g})</span>
          </span>
        ))}
      </div>

      <div className="hint">
        <b>쏠림은 진짜다. 다만 이유가 &lsquo;기운&rsquo;은 아니다.</b> 3번 배출한 곳이 {storeHist[2].observed}곳인데
        모두 똑같이 팔았다면 {storeHist[2].expected.toFixed(1)}곳이어야 한다. 이만큼 쏠렸다는 건
        판매점마다 파는 양이 크게 다르다는 뜻이다 — 많이 파는 가게가 많이 배출한다. 게다가
        명당으로 소문나면 사람이 몰려 더 많이 팔고, 그래서 또 배출한다. 순서가 거꾸로다.
        <b> 그 가게에서 산다고 내 한 장의 확률이 올라가지는 않는다.</b>
      </div>

      <div className="hint">
        출처: 공공데이터포털 <a href="https://www.data.go.kr/data/15059963/fileData.do" target="_blank" rel="noreferrer">온라인복권 1등 당첨 판매점 현황</a>,{' '}
        <a href="https://www.data.go.kr/data/15086355/fileData.do" target="_blank" rel="noreferrer">복권판매점 목록</a> (기획예산처, 이용허락범위 제한 없음).
        원본이 <b>1등 &lsquo;자동 선택&rsquo;만</b> 담고 있어 수동 1등은 빠져 있고, 최근 1년치이며 연 1회 갱신된다
        (내려받은 날 {meta.asof}). 인터넷 구매 {online}건은 판매점이 아닌데 동행복권 소재지인
        서울 서초구로 기록돼 지역 통계에서 뺐다. 지도의 시도 경계는{' '}
        <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth</a>
        {' '}(퍼블릭 도메인).
      </div>
    </div>
  )
}
