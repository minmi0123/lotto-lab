import { MAP_W, MAP_H, SHAPES } from '../data/koreaMap.js'
import { label } from '../lib/regionStats.js'

// 시도 경계 + 면적 비례 원.
//
// 땅은 전부 같은 색으로 칠하고 값은 원 넓이로만 말한다. 땅을 값으로 칠하면
// (코로플레스) 면적이 큰 지역이 무조건 세 보인다 — 서울은 배출 2위인데 땅은
// 점만 하고 경북은 20건인데 서울의 40배다. 원은 땅 크기와 무관하니 그 왜곡이
// 없고, 작은 지역 위에 큰 원이 얹히는 게 오히려 사실에 맞는다.
//
// 수도권은 원끼리 겹칠 수밖에 없다(경기가 서울을 감싼다). 속을 채우는 대신
// 옅게 칠하고 테두리를 살려서, 겹쳐도 각 원의 크기를 따로 읽을 수 있게 했다.
//
// 색은 무채색만 쓴다. 예외는 옆 표에서 고른 지역 하나로, 파란색으로 짚어 준다.

const R_MAX = 34 // 가장 큰 값의 원 반지름
const LAND = '#2e2e2e'
const EDGE = '#141414' // 시도 경계선. 카드 배경(#1a1a1a)보다 어두워 땅이 떠 보인다
const DOT = '#e8e8e8'
const ZERO = '#6b6b6b'
const SEL = '#3b82f6' // 선택 지역 (로또 공 파랑과 같은 색)

export default function KoreaMap({ title, regions, values, unit, selected, onSelect, children }) {
  const max = Math.max(...values)
  const byName = new Map(regions.map((n, i) => [n, values[i]]))
  const ranked = [...byName.entries()].sort((a, b) => b[1] - a[1])
  const r = (v) => (max ? R_MAX * Math.sqrt(v / max) : 0)

  return (
    <figure className="koreamap">
      <figcaption className="map-title">{title}</figcaption>

      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        role="img"
        aria-label={`시도별 ${title}. 많은 순으로 ${ranked
          .slice(0, 3)
          .map(([n, v]) => `${label(n)} ${v.toLocaleString()}${unit}`)
          .join(', ')}. 가장 적은 곳은 ${label(ranked[ranked.length - 1][0])} ${ranked[
          ranked.length - 1
        ][1].toLocaleString()}${unit}.`}
      >
        {/* 1. 땅 */}
        {SHAPES.map((s) => (
          <path key={s.name} d={s.d} fill={LAND} stroke={EDGE} strokeWidth={1} strokeLinejoin="round" />
        ))}

        {/* 2. 값. 큰 원부터 그려 아래에 깔고, 작은 원이 그 위에 오게 한다 */}
        {[...SHAPES]
          .sort((a, b) => (byName.get(b.name) ?? 0) - (byName.get(a.name) ?? 0))
          .sort((a, b) => (a.name === selected) - (b.name === selected))
          .map((s) => {
            const v = byName.get(s.name) ?? 0
            const tip = `${label(s.name)} · ${v.toLocaleString()}${unit}`
            const on = s.name === selected
            const pick = onSelect ? () => onSelect(on ? null : s.name) : undefined
            // 0 은 원이 사라져 지도에서 없는 지역처럼 보인다. 빈 고리로 자리를 남긴다
            if (v === 0) {
              return (
                <circle key={s.name} cx={s.cx} cy={s.cy} r={on ? 6 : 4} fill="none" stroke={on ? SEL : ZERO}
                  strokeWidth={on ? 2 : 1.2} strokeDasharray="2 2" onClick={pick} className={onSelect ? 'map-pick' : undefined}>
                  <title>{tip}</title>
                </circle>
              )
            }
            return (
              <circle
                key={s.name}
                cx={s.cx}
                cy={s.cy}
                r={r(v)}
                fill={on ? SEL : DOT}
                fillOpacity={on ? 0.6 : 0.26}
                stroke={on ? SEL : DOT}
                strokeWidth={on ? 2 : 1.4}
                onClick={pick}
                className={onSelect ? 'map-pick' : undefined}
              >
                <title>{tip}</title>
              </circle>
            )
          })}
      </svg>

      {/* 가운데 칸: 상위 3곳. 숫자를 지도 위에 얹으면 수도권에서 겹쳐 못 읽는다 */}
      <div className="map-foot">
        <p className="map-top-title">Top 3 Regions</p>
        <ol className="map-top">
          {ranked.slice(0, 3).map(([n, v], i) => (
            <li key={n}>
              <span className="rank">{i + 1}</span>
              {label(n)} <b>{v.toLocaleString()}{unit}</b>
            </li>
          ))}
        </ol>
      </div>

      {/* 오른쪽 칸: 부모가 넘긴 내용(지역별 표). 높이는 지도에 맞추고 안에서 스크롤 */}
      {children && <div className="map-side">{children}</div>}
    </figure>
  )
}
