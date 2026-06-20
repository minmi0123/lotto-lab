import { useState } from 'react'
import Ball from './Ball.jsx'
import { ranked } from '../lib/stats.js'
import { recommend } from '../lib/lucky.js'

export default function LuckyPick({ onAnalyze, onSlot }) {
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(false)

  function onPick() {
    setBusy(true)
    // 무거운 계산 → 버튼 상태 갱신 후 다음 틱에 실행
    setTimeout(() => {
      setList(recommend())
      setBusy(false)
    }, 20)
  }

  return (
    <div className="card full" id="sec-lucky">
      <h2>🏆 1등 닮은꼴 추천 <small>역대 1등 조합 패턴과 가장 닮은 번호</small></h2>
      <div className="row">
        <button className="primary" onClick={onPick} disabled={busy}>
          {busy ? '🔄 계산 중...' : list ? '✨ 다시 추천' : '✨ 추천 받기'}
        </button>
        <span className="mini">수만 개 후보 중 역대 1등 패턴 적합도 상위 5조합을 골라드려요</span>
      </div>

      <div style={{ marginTop: 6 }}>
        {list?.map((c, i) => {
          const sum = c.s.reduce((a, b) => a + b, 0)
          const odd = c.s.filter((x) => x % 2).length
          const decCov = new Set(c.s.map((x) => Math.min(4, Math.floor((x - 1) / 10)))).size
          const hot = c.s.filter((x) => ranked.findIndex((r) => r.num === x) < 15).length
          return (
            <div className="res" key={i} style={{ marginTop: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="balls">
                  <span className="tag" style={{ background: 'var(--accent2)', border: 'none', color: '#fff' }}>#{i + 1}</span>
                  {c.s.map((n, j) => (
                    <Ball key={j} n={n} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="tag">패턴 적합도 <b style={{ color: 'var(--accent)' }}>{c.fit}</b></span>
                  <button className="mini-btn" onClick={() => onSlot(c.s)}>🎰 슬롯</button>
                  <button className="mini-btn" onClick={() => onAnalyze(c.s)}>🎯 분석·시뮬</button>
                </div>
              </div>
              <div className="mini" style={{ marginTop: 8 }}>
                합계 {sum} · 홀{odd}:짝{6 - odd} · 번호대 {decCov}/5 분포 · 핫넘버 {hot}개 포함
              </div>
            </div>
          )
        })}
      </div>

      <div className="hint">
        ⚠️ 로또는 완전 무작위 추첨이라 모든 조합의 1등 확률은 <b>1/8,145,060</b> 으로 똑같습니다. 이 추천은 역대 1등 번호들의 합계·홀짝·번호대 분포 '패턴'과 닮은 조합을 고른 <b>재미용</b>이며 당첨을 보장하지 않아요 😉
      </div>
    </div>
  )
}
