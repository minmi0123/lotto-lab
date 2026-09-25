// 시도 타일 카토그램.
//
// 진짜 지도 모양을 쓰지 않는 이유: 면적이 데이터와 반대로 움직인다.
// 서울은 배출 2위(86건)인데 실제 지도에선 점만 하고, 경북은 20건인데 서울의
// 40배 면적을 차지한다. 모든 시도를 같은 크기 타일로 두면 그 왜곡이 사라지고
// 세종·제주처럼 작은 지역도 묻히지 않는다.
//
// 색은 무채색 한 줄기(어두움→밝음)만 쓴다. 이 두 지도는 "배출이 많은 곳과
// 판매점이 많은 곳이 같다"를 보여주려고 나란히 놓는 것이라, 한쪽에만 눈이
// 가게 만드는 색을 넣으면 안 된다. 브랜드 노랑은 여기 쓰지 않는다.

const TILE_W = 76,
  TILE_H = 60,
  GAP = 6,
  COLS = 4,
  ROWS = 6,
  LEGEND_H = 30

// [열, 행] — 대략의 지리적 배치. 좌상단이 서북쪽.
const LAYOUT = {
  경기: [2, 1],
  강원: [3, 1],
  인천: [1, 2],
  서울: [2, 2],
  충남: [1, 3],
  세종: [2, 3],
  충북: [3, 3],
  경북: [4, 3],
  전북: [1, 4],
  대전: [2, 4],
  대구: [4, 4],
  전남광주: [1, 5],
  경남: [3, 5],
  울산: [4, 5],
  제주: [1, 6],
  부산: [3, 6],
}

// 원본 데이터는 전남과 광주가 한 덩어리다(판매점 목록 파일이 통합 표기).
const LABELS = { 전남광주: '전남·광주' }
export const label = (name) => LABELS[name] || name

const LOW = [0x24, 0x24, 0x24] // --surface-elevated
const HIGH = [0xf2, 0xf2, 0xf2]
const mix = (t) =>
  `rgb(${LOW.map((l, i) => Math.round(l + (HIGH[i] - l) * t)).join(',')})`

const W = COLS * (TILE_W + GAP) - GAP
const H = ROWS * (TILE_H + GAP) - GAP + LEGEND_H

export default function TileMap({ title, regions, values, unit }) {
  const max = Math.max(...values)
  const rows = regions.map((name, i) => ({ name, v: values[i], pos: LAYOUT[name] }))
  const ranked = [...rows].sort((a, b) => b.v - a.v)

  return (
    <figure className="tilemap">
      <figcaption className="map-title">{title}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`시도별 ${title}. 많은 순으로 ${ranked
          .slice(0, 3)
          .map((r) => `${label(r.name)} ${r.v}${unit}`)
          .join(', ')}. 가장 적은 곳은 ${label(ranked[ranked.length - 1].name)} ${
          ranked[ranked.length - 1].v
        }${unit}.`}
      >
        {rows.map(({ name, v, pos }) => {
          if (!pos) return null
          const [c, r] = pos
          const x = (c - 1) * (TILE_W + GAP)
          const y = (r - 1) * (TILE_H + GAP)
          const t = max ? v / max : 0
          const text = label(name)
          // 타일이 밝아지면 글자를 어둡게 뒤집는다
          const ink = t > 0.55 ? '#0a0a0a' : '#cccccc'
          return (
            <g key={name}>
              <rect x={x} y={y} width={TILE_W} height={TILE_H} rx={6} fill={mix(t)}>
                <title>
                  {text} · {v.toLocaleString()}
                  {unit}
                </title>
              </rect>
              <text
                className="tile-name"
                x={x + TILE_W / 2}
                y={y + 22}
                textAnchor="middle"
                fill={ink}
                opacity={0.8}
                {...(text.length > 3 ? { textLength: TILE_W - 12, lengthAdjust: 'spacingAndGlyphs' } : {})}
              >
                {text}
              </text>
              <text className="tile-val" x={x + TILE_W / 2} y={y + 44} textAnchor="middle" fill={ink}>
                {v.toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* 범례 — 색이 무엇을 뜻하는지 */}
        <g transform={`translate(0 ${H - LEGEND_H + 12})`}>
          <defs>
            <linearGradient id={`ramp-${unit}`} x1="0" x2="1">
              <stop offset="0" stopColor={mix(0)} />
              <stop offset="1" stopColor={mix(1)} />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={110} height={8} rx={2} fill={`url(#ramp-${unit})`} />
          <text className="noise-tick" x={0} y={20} textAnchor="start">0</text>
          <text className="noise-tick" x={110} y={20} textAnchor="middle">
            {max.toLocaleString()}
            {unit}
          </text>
        </g>
      </svg>
    </figure>
  )
}
