import { DATA } from '../data/lottoData.js'

// 역대 1등 조합(=매 회차 당첨번호)으로 패턴 분포 학습 → 나이브 베이즈
const total = DATA.length
const sumD = {},
  oddD = {},
  conD = {},
  decD = {}

function feat(s) {
  // s: 오름차순 정렬된 6개
  const sum = s.reduce((a, b) => a + b, 0)
  const odd = s.filter((x) => x % 2).length
  let con = 0
  for (let i = 1; i < s.length; i++) if (s[i] - s[i - 1] === 1) con++
  const dc = [0, 0, 0, 0, 0]
  s.forEach((x) => dc[Math.min(4, Math.floor((x - 1) / 10))]++)
  return { sum, odd, con, dec: dc.join('') }
}

DATA.forEach((d) => {
  const s = [...d.n].sort((a, b) => a - b)
  const f = feat(s)
  const sb = Math.round(f.sum / 5) * 5
  sumD[sb] = (sumD[sb] || 0) + 1
  oddD[f.odd] = (oddD[f.odd] || 0) + 1
  conD[f.con] = (conD[f.con] || 0) + 1
  decD[f.dec] = (decD[f.dec] || 0) + 1
})

// 라플라스 스무딩 로그우도
function lp(map, key) {
  return Math.log((map[key] || 0) + 1) - Math.log(total + 50)
}
function score(s) {
  const f = feat(s)
  const sb = Math.round(f.sum / 5) * 5
  return lp(sumD, sb) + lp(oddD, f.odd) + lp(conD, f.con) + lp(decD, f.dec)
}

// 무작위 후보 4만개 중 패턴 적합도 상위 5조합
export function recommend() {
  const seen = new Set(),
    cand = []
  let lo = Infinity,
    hi = -Infinity
  for (let i = 0; i < 40000; i++) {
    const st = new Set()
    while (st.size < 6) st.add(1 + Math.floor(Math.random() * 45))
    const s = [...st].sort((a, b) => a - b)
    const k = s.join('-')
    if (seen.has(k)) continue
    seen.add(k)
    const sc = score(s)
    if (sc < lo) lo = sc
    if (sc > hi) hi = sc
    cand.push({ s, sc })
  }
  cand.sort((a, b) => b.sc - a.sc)
  return cand.slice(0, 5).map((c) => ({
    s: c.s,
    fit: Math.round(((c.sc - lo) / (hi - lo)) * 100),
  }))
}
