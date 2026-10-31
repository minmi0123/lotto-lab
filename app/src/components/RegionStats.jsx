import { useState } from 'react'
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
const winRank = [...byRegion].sort((a, b) => b.wins - a.wins || b.shops - a.shops)
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
const fmtExp = (v) => (v < 0.05 ? '0.01곳 미만' : v < 1 ? `${v.toFixed(1)}곳` : `${Math.round(v)}곳`)

export default function RegionStats() {
  const [sel, setSel] = useState(null)
  return (
    <div className="card full" id="sec-region">
      <h2><Icon name="map" />지역별 1등 배출<small>판매점 수 보정</small></h2>

      {/* 1단계 — 지도는 "경기·서울이 명당인가?" 라는 착시를 일부러 만든다.
          아래 forest plot 이 그걸 깬다.
          한때 판매점 수 지도를 옆에 같이 뒀는데, 두 장이 거의 똑같이 생겨서
          비교로 읽히기 전에 "잘못 그려진 것 아닌가" 로 먼저 읽혔다. 판매점과
          같이 움직인다는 근거는 아래 forest plot 의 각 행(N건 / 판매점 N곳)에
          이미 다 있으므로 지도는 한 장만 둔다. */}
      <KoreaMap title="1등 배출 건수" regions={regions} values={winVals} unit="건" selected={sel} onSelect={setSel}>
        <div className="region-table-wrap">
          <table className="region-table">
            <thead>
              <tr><th>순위</th><th>지역</th><th>1등 배출</th></tr>
            </thead>
            <tbody>
              {winRank.map((r, i) => {
                const on = sel === r.name
                const pick = () => setSel(on ? null : r.name)
                return (
                  <tr
                    key={r.name}
                    className={on ? 'on' : undefined}
                    tabIndex={0}
                    aria-selected={on}
                    onClick={pick}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick())}
                  >
                    <td>{i + 1}</td>
                    <td>{label(r.name)}</td>
                    <td>{r.wins}건</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </KoreaMap>

      <div className="hint" style={{ marginTop: 12 }}>
        표기 참고
        <ul className="hint-list">
          <li>원의 넓이가 값을 나타냄</li>
          <li>울릉도·독도 등 작은 섬은 생략</li>
          <li>전남과 광주는 원본 데이터가 통합 표기여서 하나로 묶음</li>
        </ul>
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
        1등(자동) {totals.winTotal}건, 전국 판매점 {totals.shopTotal.toLocaleString()}곳 기준이다.{' '}
        {outliers.length === 0 ? (
          <>
            <b>기대 범위를 벗어난 지역은 없다.</b> 지역별 1등 배출 건수는 해당 지역의 판매점 수로
            대부분 설명된다. 배출 1·2위인 경기·서울은 판매점 수도 1·2위다.
          </>
        ) : (
          <>
            기대 범위를 벗어난 지역: <b>{outliers.map((r) => label(r.name)).join(', ')}</b>. 다만 16개
            지역을 동시에 검사하면 무작위로도 평균 0.7개 정도는 ±2σ 밖으로 나간다.
          </>
        )}
      </div>

      <h2 style={{ marginTop: 28 }}>
        <Icon name="store" />
        &lsquo;명당&rsquo;은 있을까
        <small>판매점 한 곳이 여러 번 배출할 확률</small>
      </h2>

      <div className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
        모든 판매점의 판매량이 같다면 한 곳에서 1년에 1등이 여러 번 나오는 일은 거의 없어야 한다.
        아래는 실제 집계와 그 기대값이다.
      </div>

      {storeHist.map((h) => (
        <div className="stat" key={h.k}>
          <span>1년에 {h.k}번 배출한 판매점</span>
          <b>
            {h.observed}곳{' '}
            <span className="mini" style={{ fontWeight: 400 }}>
              (판매량이 모두 같을 때 기대값 {fmtExp(h.expected)})
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
        <b>쏠림은 실제로 존재한다. 다만 원인은 &lsquo;기운&rsquo;이 아니다.</b> 3번 배출한 판매점은 {storeHist[2].observed}곳이지만
        판매량이 모두 같다면 {storeHist[2].expected.toFixed(1)}곳이어야 한다. 이 정도로 쏠린 원인은
        판매점별 판매량 차이다. 많이 파는 판매점에서 1등도 많이 나온다. 또한
        명당으로 소문이 나면 손님이 몰려 판매량이 늘고 다시 1등이 나온다. 인과의 순서가 반대다.
        <b> 그 판매점에서 산다고 복권 한 장의 당첨 확률이 올라가지는 않는다.</b>
      </div>

      <div className="hint">
        출처: 공공데이터포털 <a href="https://www.data.go.kr/data/15059963/fileData.do" target="_blank" rel="noreferrer">온라인복권 1등 당첨 판매점 현황</a>,{' '}
        <a href="https://www.data.go.kr/data/15086355/fileData.do" target="_blank" rel="noreferrer">복권판매점 목록</a> (기획예산처, 이용허락범위 제한 없음).
        원본에는 <b>1등 &lsquo;자동 선택&rsquo;만</b> 포함되어 수동 1등은 빠져 있다. 집계 기간은 최근 1년이며
        자료 수집일은 {meta.asof}이다. 인터넷 구매분 {online}건은 판매 지역이 없어 지역 통계에서 제외했다. 지도의 시도 경계는{' '}
        <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth</a>
        {' '}(퍼블릭 도메인) 자료를 사용했다.
      </div>
    </div>
  )
}
