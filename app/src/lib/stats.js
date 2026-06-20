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
