import { useState, useCallback } from 'react'
import { START_POINTS, SPIN_COST, REFILL_POINTS } from '../lib/scoring.js'

const KEY = 'lotto_lab_save_v1'

const fresh = () => ({
  balance: START_POINTS,
  best: START_POINTS, // 최고 보유 포인트
  spins: 0,
  wins: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, // 등수별 당첨 횟수
  biggest: 0, // 단일 스핀 최대 획득
  myNumbers: null, // 슬롯에 고정한 내 번호 (생성기·추천에서 지정)
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const base = fresh()
    const saved = JSON.parse(raw)
    // wins 는 한 겹 더 들어가 있어서 얕게 덮으면 통째로 갈린다. 등수 키가
    // 빠진 저장본(옛 버전·손으로 고친 값)이 오면 그 등수가 undefined 가 되고,
    // 화면엔 빈칸, 그 등수에 당첨되는 순간 undefined + 1 = NaN 이 된다.
    return { ...base, ...saved, wins: { ...base.wins, ...(saved?.wins || {}) } }
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

  // 파산 시 무료 충전 (버튼 한 번, 조건 없음)
  const refill = useCallback(() => {
    update((s) => ({ ...s, balance: s.balance + REFILL_POINTS }))
  }, [update])

  // 슬롯에 고정할 내 번호 지정/해제 (생성기·추천에서 호출)
  const setMyNumbers = useCallback((nums) => {
    update((s) => ({ ...s, myNumbers: nums ? [...nums].slice(0, 6) : null }))
  }, [update])
  const clearMyNumbers = useCallback(() => {
    update((s) => ({ ...s, myNumbers: null }))
  }, [update])

  const canSpin = state.balance >= SPIN_COST

  return { ...state, canSpin, applySpin, refill, setMyNumbers, clearMyNumbers }
}
