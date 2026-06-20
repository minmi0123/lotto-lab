import Ball from './Ball.jsx'
import { latest } from '../lib/stats.js'

export default function LatestDraw() {
  return (
    <div className="card full" id="sec-latest">
      <h2>
        🆕 최신 회차{' '}
        <small>
          {latest.round}회 · 1등 {latest.c1}명 · {(latest.w1 / 1e8).toFixed(1)}억원
        </small>
      </h2>
      <div className="balls">
        {latest.n.map((n, i) => (
          <Ball key={i} n={n} />
        ))}
        <span className="plus">+</span>
        <Ball n={latest.b} />
      </div>
    </div>
  )
}
