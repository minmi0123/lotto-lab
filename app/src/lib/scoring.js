import { DATA } from '../data/lottoData.js'

// 로또 공 색상 클래스
export function ballClass(n) {
  return n <= 10 ? 'b1' : n <= 20 ? 'b2' : n <= 30 ? 'b3' : n <= 40 ? 'b4' : 'b5'
}

// ---------- 경제 설계 (todo.md 확정값) ----------
export const START_POINTS = 100
export const SPIN_COST = 10
export const REFILL_POINTS = 100 // 파산 시 무료 충전 (추후 광고 충전 C로 전환)

// 일치 개수(+보너스) → 등수/보상/라벨
// grade: 1~5등, 0=꽝
const PRIZE = {
  6: { grade: 1, reward: 1000000, label: '🎰 1등 잭팟!!!' },
  '5b': { grade: 2, reward: 200000, label: '🥈 2등! (5개+보너스)' },
  5: { grade: 3, reward: 20000, label: '🥉 3등! (5개 일치)' },
  4: { grade: 4, reward: 1500, label: '4등 (4개 일치)' },
  3: { grade: 5, reward: 150, label: '5등 (3개 일치)' },
  2: { grade: 6, reward: 20, label: '아쉽! (2개 일치)' },
}

// 내 6개 번호를 한 회차(draw={n:[6], b})와 비교 채점
export function scoreDraw(mine, draw) {
  const mset = new Set(mine)
  const match = draw.n.filter((x) => mset.has(x)).length
  const bonus = mset.has(draw.b)
  let key = null
  if (match === 6) key = 6
  else if (match === 5 && bonus) key = '5b'
  else if (match === 5) key = 5
  else if (match === 4) key = 4
  else if (match === 3) key = 3
  else if (match === 2) key = 2
  const p = key != null ? PRIZE[key] : { grade: 0, reward: 0, label: '꽝 😢' }
  return { match, bonus, grade: p.grade, reward: p.reward, label: p.label }
}

// 역대 회차 중 무작위 1회 추첨
export function randomDraw() {
  return DATA[Math.floor(Math.random() * DATA.length)]
}

// 무작위 6개 번호 생성 (오름차순)
export function randomNumbers() {
  const s = new Set()
  while (s.size < 6) s.add(1 + Math.floor(Math.random() * 45))
  return [...s].sort((a, b) => a - b)
}
