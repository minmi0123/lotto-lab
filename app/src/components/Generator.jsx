import { useState } from 'react'
import Ball from './Ball.jsx'
import Icon from './Icon.jsx'
import { comboSet, pairScore, avgPairScore } from '../lib/stats.js'
import { randomNumbers } from '../lib/scoring.js'

const STRATS = [
  { key: 'random', label: '완전 랜덤', desc: '순수 무작위 6개' },
  { key: 'balance', label: '합계 균형형', desc: '합계가 역대 평균대(약 130~145)에 들도록' },
  { key: 'never', label: '미출현 궁합형', desc: '역대에 서로 함께 나온 적이 가장 적은 번호끼리 조합' },
]

function generate(strategy) {
  let nums,
    meta = ''
  if (strategy === 'balance') {
    let t = 0
    do {
      nums = randomNumbers()
      t++
    } while ((nums.reduce((a, b) => a + b, 0) < 130 || nums.reduce((a, b) => a + b, 0) > 145) && t < 2000)
  } else if (strategy === 'never') {
    // 6조합 단위 '미출현'은 8,145,060개 중 역대 출현이 1,228개뿐이라 랜덤과 사실상 구분이 안 됨.
    // → 쌍(pair) 동반출현 합계가 가장 낮은 후보를 골라 '안 만나본 번호끼리'를 실제로 구현.
    let bestSc = Infinity
    for (let i = 0; i < 3000; i++) {
      const c = randomNumbers()
      const sc = pairScore(c)
      if (sc < bestSc) {
        bestSc = sc
        nums = c
      }
    }
    meta =
      `역대 동반출현 ${bestSc}회 (무작위 평균 약 ${avgPairScore}회)` +
      (comboSet.has(nums.join('-')) ? ' · 이 조합은 과거에 나온 적 있어요' : ' · 6조합 자체도 역대 미출현')
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
      <h2><Icon name="dice" />행운 번호 생성기<small>전략을 골라보세요</small></h2>
      <div className="seg">
        {STRATS.map((s) => (
          <button key={s.key} className={strategy === s.key ? 'on' : ''} onClick={() => setStrategy(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="row">
        <button className="primary" onClick={onGen}><Icon name="dice" size={16} />번호 뽑기</button>
        {result && <button onClick={() => onSlot(result.nums)}><Icon name="slot" size={16} />이 번호로 슬롯</button>}
        {result && <button onClick={() => onAnalyze(result.nums)}><Icon name="target" size={16} />분석·시뮬 하기</button>}
        <span className="mini">{desc}</span>
      </div>
      {result && (
        <>
          <div className="balls" style={{ marginTop: 16 }}>
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
