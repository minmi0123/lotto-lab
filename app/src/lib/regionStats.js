import { REGIONS, WINS, SHOPS, ONLINE, TOP, HIST, META } from '../data/storeData.js'

// "어느 지역에서 1등이 많이 나왔나" 는 그냥 세면 판매점이 많은 지역이 이긴다.
// 그래서 판매점 수에 비례한다는 가정(귀무가설)을 세우고, 관측이 그 가정에서
// 무작위로도 생기는 변동폭 안에 있는지를 본다. 핫/콜드를 ±2σ 로 재는 것과 같은 방식.

export const regions = REGIONS
export const meta = META
export const online = ONLINE
export const top = TOP

const winTotal = WINS.reduce((a, b) => a + b, 0)
const shopTotal = SHOPS.reduce((a, b) => a + b, 0)

export const byRegion = REGIONS.map((name, i) => {
  const exp = (winTotal * SHOPS[i]) / shopTotal // 판매점 수에 비례했을 때의 기대 배출
  const sd = Math.sqrt(exp) // 포아송 근사
  return {
    name,
    wins: WINS[i],
    shops: SHOPS[i],
    exp,
    sd,
    z: sd ? (WINS[i] - exp) / sd : 0,
    ratio: exp ? WINS[i] / exp : 0, // 1.0 = 판매점 수만큼 정확히 나옴
    per1k: (WINS[i] / SHOPS[i]) * 1000,
  }
})

export const within2 = byRegion.filter((r) => Math.abs(r.z) <= 2).length
export const outliers = byRegion.filter((r) => Math.abs(r.z) > 2)

// 적합도 검정: '판매점 수에 비례' 가정과 관측이 통째로 얼마나 어긋나는지.
// 자유도 15 에서 기대되는 χ² 값은 15 근처다.
export const chi2 = byRegion.reduce((s, r) => s + (r.exp ? (r.wins - r.exp) ** 2 / r.exp : 0), 0)
export const df = REGIONS.length - 1

// ---------- 판매점 단위: '명당'은 있는가 ----------
// 모든 판매점이 똑같이 판다면 배출 건수는 포아송 분포를 따른다.
// 실제가 그보다 쏠려 있다면 판매점마다 파는 양이 다르다는 뜻이다.
const lambda = winTotal / shopTotal

const factorial = (n) => {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}
const poisson = (k) => (Math.exp(-lambda) * lambda ** k) / factorial(k)

export const storeHist = [1, 2, 3, 4].map((k) => ({
  k,
  observed: HIST[k] || 0,
  expected: shopTotal * poisson(k),
}))

export const multi = (() => {
  const observed = Object.entries(HIST).reduce((a, [k, v]) => (+k >= 2 ? a + v : a), 0)
  const expected = shopTotal * (1 - poisson(0) - poisson(1))
  return { observed, expected, times: expected ? observed / expected : 0 }
})()

export const totals = { winTotal, shopTotal, lambda }
