import Ball from './Ball.jsx'
import Icon from './Icon.jsx'
import { latest, drawDate } from '../lib/stats.js'

export default function LatestDraw() {
  return (
    <div className="card full" id="sec-latest">
      <h2>
        <Icon name="clock" />
        최신 회차
        <small>
          {latest.round}회 · {drawDate(latest.round)}
        </small>
      </h2>
      <div className="balls">
        {latest.n.map((n, i) => (
          <Ball key={i} n={n} />
        ))}
        <span className="plus">+</span>
        <Ball n={latest.b} />
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="stat">
          <span>1등</span>
          <b>{latest.c1 ? `${latest.c1}명 · 1인당 ${(latest.w1 / 1e8).toFixed(1)}억원` : '당첨자 없음'}</b>
        </div>
      </div>
    </div>
  )
}
