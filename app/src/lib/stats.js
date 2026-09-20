import { DATA } from '../data/lottoData.js'

export const totalRounds = DATA.length
export const latest = DATA[DATA.length - 1]

// 번호별 누적 출현 빈도
export const freq = new Array(46).fill(0)
export const bonusFreq = new Array(46).fill(0)
DATA.forEach((d) => {
  d.n.forEach((x) => freq[x]++)
  bonusFreq[d.b]++
})
export const maxC = Math.max(...freq.slice(1))

// 출현 순위 (많은 순)
export const ranked = [...Array(45)]
  .map((_, i) => ({ num: i + 1, c: freq[i + 1] }))
  .sort((a, b) => b.c - a.c)

// 한 번도 함께 안 나온 조합 판별용
export const comboSet = new Set(DATA.map((d) => [...d.n].sort((a, b) => a - b).join('-')))

// 잡학 통계 (1회 계산)
export const misc = (() => {
  let odd = 0,
    even = 0,
    sumAll = 0,
    consec = 0
  DATA.forEach((d) => {
    const s = [...d.n].sort((a, b) => a - b)
    s.forEach((x) => (x % 2 ? odd++ : even++))
    sumAll += s.reduce((a, b) => a + b, 0)
    for (let i = 1; i < s.length; i++)
      if (s[i] - s[i - 1] === 1) {
        consec++
        break
      }
  })
  const maxW = Math.max(...DATA.map((d) => d.w1))
  const maxWd = DATA.find((d) => d.w1 === maxW)
  return {
    avgSum: (sumAll / DATA.length).toFixed(1),
    oddPct: ((odd / (odd + even)) * 100).toFixed(1),
    consecPct: ((consec / DATA.length) * 100).toFixed(1),
    maxW,
    maxWdRound: maxWd.round,
    avgWinners: (DATA.reduce((a, d) => a + d.c1, 0) / DATA.length).toFixed(1),
  }
})()

// 번호 n의 상세: 순위 / 마지막 등장 회차 / 몇 회 전
export function ballDetail(n) {
  const rank = ranked.findIndex((r) => r.num === n) + 1
  const last = [...DATA].reverse().find((d) => d.n.includes(n))
  const gap = last ? latest.round - last.round : null
  return { rank, lastRound: last ? last.round : null, gap }
}

// 두 번호가 같은 회차에 함께 나온 횟수 (동반출현 행렬)
export const pairFreq = Array.from({ length: 46 }, () => new Array(46).fill(0))
DATA.forEach((d) => {
  const s = d.n
  for (let i = 0; i < s.length; i++)
    for (let j = i + 1; j < s.length; j++) {
      pairFreq[s[i]][s[j]]++
      pairFreq[s[j]][s[i]]++
    }
})

// 조합 6개가 만드는 15개 쌍의 동반출현 합계 (낮을수록 '역대에 안 만난 사이')
export function pairScore(s) {
  let t = 0
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) t += pairFreq[s[i]][s[j]]
  return t
}

// 무작위 조합의 기대 동반출현 합계 = 15쌍 × (전체 쌍 출현 / 가능한 쌍 990개)
export const avgPairScore = Math.round((totalRounds * 15 * 15) / 990)

// ---------- 착시 코너용: '핫/콜드 격차'가 잡음 범위인지 판별하는 기준선 ----------
// 번호 하나의 기대 출현 = 회차×6/45, 표준편차 = 이항분포 √(n·p·(1-p))
export const freqMean = (totalRounds * 6) / 45
export const freqSd = Math.sqrt(totalRounds * 6 * (1 / 45) * (44 / 45))

// 전반부에서 뽑은 핫/콜드가 후반부에도 유지되는지(= 예측력이 있는지) 자체 검증.
// 무작위라면 후반 평균 순위는 23위(=(1+45)/2) 근처여야 한다.
export const splitHalf = (() => {
  const half = Math.floor(totalRounds / 2)
  const count = (rows) => {
    const a = new Array(46).fill(0)
    rows.forEach((d) => d.n.forEach((x) => a[x]++))
    return a
  }
  const order = (a) => [...Array(45)].map((_, i) => i + 1).sort((x, y) => a[y] - a[x])
  const early = order(count(DATA.slice(0, half)))
  const lateOrder = order(count(DATA.slice(half)))
  const lateRank = (n) => lateOrder.indexOf(n) + 1
  const avg = (ns) => ns.reduce((s, n) => s + lateRank(n), 0) / ns.length
  return {
    half,
    hotLateRank: avg(early.slice(0, 6)).toFixed(1),
    coldLateRank: avg(early.slice(-6)).toFixed(1),
    chance: (1 + 45) / 2,
  }
})()
