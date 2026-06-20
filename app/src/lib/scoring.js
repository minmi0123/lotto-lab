// 로또 공 색상 클래스
export function ballClass(n) {
  return n <= 10 ? 'b1' : n <= 20 ? 'b2' : n <= 30 ? 'b3' : n <= 40 ? 'b4' : 'b5'
}

// ---------- 경제 설계 ----------
export const START_POINTS = 100
export const SPIN_COST = 10
export const REFILL_POINTS = 100 // 파산 시 무료 충전 (추후 광고 충전 C로 전환)

// ---------- 슬롯 확률표 (게임용 보정, 실제 로또 확률 아님) ----------
// prob 의 합 미만이면 꽝. reward 는 pt. EV ≈ 9.1 / 비용 10 → 스핀당 약 -0.9pt.
export const SLOT_TABLE = [
  { grade: 1, match: 6, bonus: false, reward: 20000, prob: 1 / 8000, label: '🎰 1등 잭팟!!!' },
  { grade: 2, match: 5, bonus: true, reward: 3000, prob: 1 / 2000, label: '🥈 2등! (5개+보너스)' },
  { grade: 3, match: 5, bonus: false, reward: 900, prob: 1 / 600, label: '🥉 3등! (5개 일치)' },
  { grade: 4, match: 4, bonus: false, reward: 150, prob: 1 / 120, label: '4등 (4개 일치)' },
  { grade: 5, match: 3, bonus: false, reward: 25, prob: 1 / 18, label: '5등 (3개 일치)' },
  { grade: 6, match: 2, bonus: false, reward: 5, prob: 1 / 5, label: '아쉽! (2개 일치)' },
]

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 결과 등급에 맞춰 "추첨 6+보너스"를 구성 (정확히 match개가 mine과 겹치도록)
function buildDraw(mine, match, bonus) {
  const mineSet = new Set(mine)
  const others = shuffle([...Array(45)].map((_, i) => i + 1).filter((n) => !mineSet.has(n)))
  const matched = shuffle([...mine]).slice(0, match) // 겹칠 내 번호
  const fill = others.slice(0, 6 - match) // 나머지는 내 번호 아닌 걸로
  const n = [...matched, ...fill].sort((a, b) => a - b)
  let b
  if (bonus) {
    // 5+보너스: 추첨번호에 안 들어간 내 번호를 보너스로 → 보너스 일치
    b = mine.find((x) => !matched.includes(x))
  } else {
    // 그 외: 내 번호와도, n 과도 안 겹치는 번호를 보너스로
    b = others[6 - match]
  }
  return { n, b }
}

// 슬롯 1회: 확률표로 등급 추첨 → 그에 맞는 draw 구성 → 결과 반환
export function rollSpin(mine) {
  const r = Math.random()
  let acc = 0,
    tier = null
  for (const t of SLOT_TABLE) {
    acc += t.prob
    if (r < acc) {
      tier = t
      break
    }
  }
  if (!tier) {
    // 꽝 (0~1개 일치 연출)
    const m = Math.random() < 0.5 ? 1 : 0
    return { match: m, bonus: false, grade: 0, reward: 0, label: '꽝 😢', draw: buildDraw(mine, m, false) }
  }
  return {
    match: tier.match,
    bonus: tier.bonus,
    grade: tier.grade,
    reward: tier.reward,
    label: tier.label,
    draw: buildDraw(mine, tier.match, tier.bonus),
  }
}

// 무작위 6개 번호 생성 (오름차순)
export function randomNumbers() {
  const s = new Set()
  while (s.size < 6) s.add(1 + Math.floor(Math.random() * 45))
  return [...s].sort((a, b) => a - b)
}
