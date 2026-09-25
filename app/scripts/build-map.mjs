// 시도 경계 GeoJSON -> SVG path 상수 (app/src/data/koreaMap.js) 생성기.
//
// 자주 돌릴 일이 없다(행정구역이 바뀌어야 다시 돈다). 40MB 원본을 repo 에
// 넣지 않으려고, 원본은 인자로 받고 결과 JS 만 커밋한다.
//
//   원본: Natural Earth 10m Admin 1 – States, Provinces
//   https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
//   라이선스: 퍼블릭 도메인. 사용 허가도 출처 표기도 필요 없다(상업 이용 포함).
//   https://www.naturalearthdata.com/about/terms-of-use/
//   GADM 계열은 비상업 전용이라 쓰지 않았다 — 이 사이트는 광고를 붙일 계획이다.
//
//   사용: node scripts/build-map.mjs <ne_10m_admin_1_states_provinces.geojson>

import fs from 'node:fs'
import path from 'node:path'

const src = process.argv[2]
if (!src) {
  console.error('사용: node scripts/build-map.mjs <ne_10m_admin_1_states_provinces.geojson>')
  process.exit(1)
}

// storeData.js 의 REGIONS 와 같은 이름으로 맞춘다.
// 전남과 광주는 원본 판매점 목록이 통합 표기라 한 덩어리로 합친다
// (광주가 전남에 둘러싸여 있어 경계가 자연스럽게 사라진다).
const MAP = {
  'KR-11': '서울',
  'KR-41': '경기',
  'KR-26': '부산',
  'KR-27': '대구',
  'KR-28': '인천',
  'KR-30': '대전',
  'KR-31': '울산',
  'KR-42': '강원',
  'KR-43': '충북',
  'KR-44': '충남',
  'KR-46': '전남광주',
  'KR-29': '전남광주',
  'KR-45': '전북',
  'KR-47': '경북',
  'KR-48': '경남',
  'KR-49': '제주',
  'KR-50': '세종',
}
const ORDER = ['서울','경기','부산','대구','인천','대전','울산','강원','충북','충남','전남광주','전북','경북','경남','제주','세종']

const W = 560 // 출력 viewBox 폭
const PAD = 8
// 본토에서 멀리 떨어진 부속 도서(독도·울릉도 등)는 지도 전체를 동쪽으로 늘려
// 본토를 납작하게 만든다. 화면에선 점 하나라 정보도 없다.
const LON_MAX = 130.0
const MIN_AREA = 0.0009 // 제곱도. 이보다 작은 섬은 버린다 (제주 본섬은 통과)
const TOL = 0.55 // 단순화 허용 오차 (출력 px)

const geo = JSON.parse(fs.readFileSync(src, 'utf8'))

// ---------- 1. 시도별 폴리곤 링 모으기 ----------
const byRegion = new Map(ORDER.map((n) => [n, []]))
for (const f of geo.features) {
  const name = MAP[f.properties.iso_3166_2]
  if (!name) continue
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  for (const poly of polys) byRegion.get(name).push(poly[0]) // 외곽 링만 (내부 구멍 없음)
}

const ringArea = (r) => {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]
  return Math.abs(a / 2)
}

// 작은 섬 제거. 단, 시도마다 가장 큰 링 하나는 무조건 남긴다
for (const [name, rings] of byRegion) {
  rings.sort((a, b) => ringArea(b) - ringArea(a))
  const kept = rings.filter((r, i) => i === 0 || (ringArea(r) >= MIN_AREA && r.every(([lon]) => lon <= LON_MAX)))
  byRegion.set(name, kept)
}

// ---------- 2. 투영 ----------
// 경도 1도는 위도 1도보다 짧다. 평균 위도의 cos 를 곱해 가로를 줄이면
// 작은 나라 한 곳을 그리는 데는 정각도법 없이도 모양이 충분히 맞는다.
const all = [...byRegion.values()].flat().flat()
const lats = all.map((p) => p[1])
const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2
const K = Math.cos((lat0 * Math.PI) / 180)
const px = (p) => [p[0] * K, -p[1]]

const proj = all.map(px)
const minX = Math.min(...proj.map((p) => p[0])),
  maxX = Math.max(...proj.map((p) => p[0]))
const minY = Math.min(...proj.map((p) => p[1])),
  maxY = Math.max(...proj.map((p) => p[1]))
const scale = (W - PAD * 2) / (maxX - minX)
const H = Math.round((maxY - minY) * scale + PAD * 2)
const to = (p) => {
  const [x, y] = px(p)
  return [(x - minX) * scale + PAD, (y - minY) * scale + PAD]
}

// ---------- 3. 단순화 (Douglas-Peucker) ----------
function dp(pts, tol) {
  if (pts.length < 3) return pts
  const d2 = (p, a, b) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1]
    const L = dx * dx + dy * dy
    let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0
    t = Math.max(0, Math.min(1, t))
    const ex = a[0] + t * dx - p[0],
      ey = a[1] + t * dy - p[1]
    return ex * ex + ey * ey
  }
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [s, e] = stack.pop()
    let far = -1,
      max = tol * tol
    for (let i = s + 1; i < e; i++) {
      const d = d2(pts[i], pts[s], pts[e])
      if (d > max) {
        max = d
        far = i
      }
    }
    if (far > 0) {
      keep[far] = 1
      stack.push([s, far], [far, e])
    }
  }
  return pts.filter((_, i) => keep[i])
}

// ---------- 4. path + 라벨 위치 ----------
// 라벨은 면적 중심(무게중심)에 둔다. 경기처럼 서울을 감싸는 모양은
// 중심이 남의 땅에 떨어지므로 아래 NUDGE 로 손본다.
// 수도권이 관건이다. 경기의 무게중심은 서울 바로 위에 떨어지는데, 경기가
// 서울을 감싸는 모양이라 그렇다. 그대로 두면 배출 1위(경기) 원이 2위(서울)
// 원을 통째로 덮어 서울이 지도에서 사라진다. 경기 표식을 북서쪽 안쪽으로
// 확실히 밀어 둘이 갈라지게 한다.
const NUDGE = {
  경기: [-37, -45],
  서울: [6, -3],
  인천: [-13, 5],
  충남: [-10, 4], // 세종·대전 쪽으로 파여 있다
  전남광주: [-6, 10], // 광주를 합쳐 중심이 북쪽으로 당겨진다
  경북: [6, 4],
}

// 제주를 실제 위치에 두면 본토와의 사이에 90px 넘는 빈 바다가 생겨
// 지도가 쓸데없이 길어진다. 한국 지도에서 흔히 하듯 위로 당겨 붙인다.
// (당겼다는 사실은 화면에도 적는다)
const JEJU_GAP = 18
const mainlandMaxY = Math.max(
  ...ORDER.filter((n) => n !== '제주')
    .flatMap((n) => byRegion.get(n))
    .flat()
    .map((p) => to(p)[1])
)
const jejuMinY = Math.min(...byRegion.get('제주').flat().map((p) => to(p)[1]))
const JEJU_DY = -(jejuMinY - mainlandMaxY - JEJU_GAP)

const out = []
let bottom = 0
for (const name of ORDER) {
  const rings = byRegion.get(name)
  const dy = name === '제주' ? JEJU_DY : 0
  let d = ''
  for (const ring of rings) {
    const pts = dp(ring.map(to), TOL)
    if (pts.length < 3) continue
    d +=
      'M' +
      pts
        .map(([x, y]) => {
          const yy = y + dy
          if (yy > bottom) bottom = yy
          return `${x.toFixed(1)} ${yy.toFixed(1)}`
        })
        .join('L') +
      'Z'
  }
  // 가장 큰 링의 무게중심
  const big = rings[0].map(to)
  let a = 0,
    cx = 0,
    cy = 0
  for (let i = 0, j = big.length - 1; i < big.length; j = i++) {
    const f = big[j][0] * big[i][1] - big[i][0] * big[j][1]
    a += f
    cx += (big[j][0] + big[i][0]) * f
    cy += (big[j][1] + big[i][1]) * f
  }
  a /= 2
  cx = cx / (6 * a)
  cy = cy / (6 * a)
  const [nx, ny] = NUDGE[name] || [0, 0]
  out.push({ name, d, cx: +(cx + nx).toFixed(1), cy: +(cy + ny + dy).toFixed(1) })
}

// 제주를 당겨 올렸으니 전체 높이도 그만큼 줄인다
const H2 = Math.round(bottom + PAD)

// ---------- 5. 쓰기 ----------
const header = `// 시도 경계 SVG path. scripts/build-map.mjs 가 생성한다 — 직접 고치지 말 것.
//
// 원본: Natural Earth 10m Admin 1 (퍼블릭 도메인, 출처 표기·허가 불필요)
//       https://www.naturalearthdata.com/about/terms-of-use/
// 전남과 광주는 한 덩어리다. 원본 판매점 목록이 통합 표기라 데이터를 쪼갤 수 없다.
// cx, cy 는 숫자 뱃지를 놓을 자리(면적 중심 + 수동 보정).
`
const body =
  `export const MAP_W = ${W}\nexport const MAP_H = ${H2}\n\n` +
  `export const SHAPES = [\n` +
  out.map((r) => `  { name: ${JSON.stringify(r.name)}, cx: ${r.cx}, cy: ${r.cy}, d: ${JSON.stringify(r.d)} },`).join('\n') +
  `\n]\n`

const dest = path.join(process.cwd(), 'src/data/koreaMap.js')
fs.writeFileSync(dest, header + body)

console.log(`viewBox 0 0 ${W} ${H2}`)
out.forEach((r) => console.log(`  ${r.name.padEnd(8)} path ${String(r.d.length).padStart(6)}자  라벨 (${r.cx}, ${r.cy})`))
console.log(`\n${dest} — ${(fs.statSync(dest).size / 1024).toFixed(1)}KB`)
