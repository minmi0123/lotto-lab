import { useState } from 'react'
import Ball from './Ball.jsx'
import Icon from './Icon.jsx'
import { DATA } from '../data/lottoData.js'

function won(v) {
  if (v >= 1e8) return (v / 1e8).toFixed(1) + '억'
  if (v >= 1e4) return Math.round(v / 1e4).toLocaleString() + '만'
  return v.toLocaleString()
}

const RANKINGS = {
  topPrize: {
    icon: 'diamond',
    btn: '최고 당첨금',
    title: '역대 1등 1인당 최고 당첨금',
    list: [...DATA].sort((a, b) => b.w1 - a.w1).slice(0, 5),
    val: (d) => `${won(d.w1)}원`,
    sub: (d) => `1등 ${d.c1}명`,
  },
  topWinners: {
    icon: 'users',
    btn: '1등 최다 배출',
    title: '1등 당첨자 최다 배출 회차',
    list: [...DATA].sort((a, b) => b.c1 - a.c1).slice(0, 5),
    val: (d) => `${d.c1}명`,
    sub: (d) => `1인당 ${won(d.w1)}원`,
  },
  lowPrize: {
    icon: 'split',
    btn: '최소 당첨금',
    title: '1등 1인당 최소 당첨금 (많이 나눠가짐)',
    list: [...DATA].filter((d) => d.w1 > 0).sort((a, b) => a.w1 - b.w1).slice(0, 5),
    val: (d) => `${won(d.w1)}원`,
    sub: (d) => `1등 ${d.c1}명`,
  },
}

export default function HallOfFame() {
  const [key, setKey] = useState('topPrize')
  const R = RANKINGS[key]
  return (
    <div className="card full" id="sec-hall">
      <h2><Icon name="trophy" />명예의 전당<small>역대 회차 랭킹</small></h2>
      <div className="seg">
        {Object.entries(RANKINGS).map(([k, v]) => (
          <button key={k} className={key === k ? 'on' : ''} onClick={() => setKey(k)}>
            <Icon name={v.icon} size={16} />{v.btn}
          </button>
        ))}
      </div>
      <div className="hint" style={{ margin: '4px 0 0', color: 'var(--body-strong)' }}>{R.title}</div>
      {R.list.map((d, i) => (
        <div className="res" key={d.round} style={{ marginTop: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="balls">
              {/* 메달 이모지 대신 순위 배지. 1위만 브랜드 노랑 */}
              <span className={`rank ${i === 0 ? 'rank-1' : ''}`}>{i + 1}</span>
              <span className="tag">{d.round}회</span>
              {d.n.map((n, j) => (
                <Ball key={j} n={n} />
              ))}
              <span className="plus">+</span>
              <Ball n={d.b} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <b style={{ color: 'var(--primary)', fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{R.val(d)}</b>
              <br />
              <span className="mini">{R.sub(d)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
