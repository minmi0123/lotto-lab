import { useState, useCallback } from 'react'
import { START_POINTS, SPIN_COST, REFILL_POINTS } from '../lib/scoring.js'

const KEY = 'lotto_lab_save_v1'

const fresh = () => ({
  balance: START_POINTS,
  best: START_POINTS, // 최고 보유 포인트
  spins: 0,
  wins: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, // 등수별 당첨 횟수
  biggest: 0, // 단일 스핀 최대 획득
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    return { ...fresh(), ...JSON.parse(raw) }
  } catch {
    return fresh()
  }
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* localStorage 불가 환경(시크릿 등) 무시 */
  }
}

// 포인트 + 통계 공유 상태. localStorage 동기화 포함.
export function usePoints() {
  const [state, setState] = useState(load)

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev)
      save(next)
      return next
    })
  }, [])

  // 스핀 1회 정산: 비용 차감 + 보상 반영 + 통계 갱신
  const applySpin = useCallback(
    ({ reward, grade }) => {
      update((s) => {
        const balance = s.balance - SPIN_COST + reward
        const wins = { ...s.wins }
        if (grade >= 1 && grade <= 5) wins[grade] += 1
        return {
          ...s,
          balance,
          best: Math.max(s.best, balance),
          spins: s.spins + 1,
          wins,
          biggest: Math.max(s.biggest, reward),
        }
      })
    },
    [update],
  )

  // 파산 시 무료 충전 (추후 광고 충전으로 전환)
  const refill = useCallback(() => {
    update((s) => ({ ...s, balance: s.balance + REFILL_POINTS }))
  }, [update])

  const canSpin = state.balance >= SPIN_COST

  return { ...state, canSpin, applySpin, refill }
}
