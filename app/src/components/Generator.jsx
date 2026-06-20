import { useState } from 'react'
import Ball from './Ball.jsx'
import { freq, maxC, comboSet } from '../lib/stats.js'
import { randomNumbers } from '../lib/scoring.js'

const STRATS = [
  { key: 'random', label: '완전 랜덤', desc: '순수 무작위 6개' },
  { key: 'hot', label: '핫넘버 가중', desc: '많이 나온 번호일수록 잘 뽑힘' },
  { key: 'cold', label: '콜드넘버 가중', desc: '적게 나온 번호일수록 잘 뽑힘' },
  { key: 'balance', label: '합계 균형형', desc: '합계가 역대 평균대(약 130~145)에 들도록' },
  { key: 'never', label: '역대 미출현 조합', desc: '역대에 한 번도 함께 나온 적 없는 6조합' },
]

function weightedPick(weights) {
  const pool = []
  for (let n = 1; n <= 45; n++) for (let k = 0; k < weights[n]; k++) pool.push(n)
  const set = new Set()
  while (set.size < 6) set.add(pool[Math.floor(Math.random() * pool.length)])
  return [...set].sort((a, b) => a - b)
}

function generate(strategy) {
  let nums,
    meta = ''
  if (strategy === 'hot') {
    const w = []
    for (let n = 0; n <= 45; n++) w[n] = freq[n] || 0
    nums = weightedPick(w)
  } else if (strategy === 'cold') {
    const w = []
    for (let n = 0; n <= 45; n++) w[n] = n >= 1 ? maxC - freq[n] + 1 : 0
    nums = weightedPick(w)
  } else if (strategy === 'balance') {
    let t = 0
    do {
      nums = randomNumbers()
      t++
    } while ((nums.reduce((a, b) => a + b, 0) < 130 || nums.reduce((a, b) => a + b, 0) > 145) && t < 2000)
  } else if (strategy === 'never') {
    let t = 0
    do {
      nums = randomNumbers()
      t++
    } while (comboSet.has(nums.join('-')) && t < 2000)
    meta = comboSet.has(nums.join('-')) ? '(이 조합은 과거에 나온 적 있어요!)' : '역대 미출현 조합 ✓'
  } else {
    nums = randomNumbers()
  }
  return { nums, meta }
}

export default function Generator({ onAnalyze, onSlot }) {
  const [strategy, setStrategy] = useState('random')
  const [result, setResult] = useState(null) // { nums, meta }

  const desc = STRATS.find((s) => s.key === strategy).desc

  function onGen() {
    setResult(generate(strategy))
  }

  return (
    <div className="card full" id="sec-gen">
      <h2>🎰 행운 번호 생성기 <small>전략을 골라보세요</small></h2>
      <div className="seg">
        {STRATS.map((s) => (
          <button key={s.key} className={strategy === s.key ? 'on' : ''} onClick={() => setStrategy(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="row">
        <button className="primary" onClick={onGen}>🎲 번호 뽑기</button>
        {result && <button onClick={() => onSlot(result.nums)}>🎰 이 번호로 슬롯</button>}
        {result && <button onClick={() => onAnalyze(result.nums)}>🎯 분석·시뮬 하기</button>}
        <span className="mini">{desc}</span>
      </div>
      {result && (
        <>
          <div className="balls" style={{ marginTop: 14 }}>
            {result.nums.map((n, i) => (
              <Ball key={i} n={n} />
            ))}
          </div>
          <div className="hint">
            합계 {result.nums.reduce((a, b) => a + b, 0)} · 홀{result.nums.filter((x) => x % 2).length}:짝
            {6 - result.nums.filter((x) => x % 2).length}
            {result.meta ? ' · ' + result.meta : ''}
          </div>
        </>
      )}
    </div>
  )
}
