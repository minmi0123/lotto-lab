import Ball from './Ball.jsx'
import { ranked } from '../lib/stats.js'

export default function HotCold() {
  const hot = ranked.slice(0, 6).map((r) => r.num)
  const cold = ranked.slice(-6).map((r) => r.num).reverse()
  return (
    <div className="card" id="sec-hotcold">
      <h2>🔥 핫넘버 <small>최다 출현 Top 6</small></h2>
      <div className="balls">
        {hot.map((n, i) => (
          <Ball key={i} n={n} />
        ))}
      </div>
      <h2 style={{ marginTop: 16 }}>❄️ 콜드넘버 <small>최소 출현 Bottom 6</small></h2>
      <div className="balls">
        {cold.map((n, i) => (
          <Ball key={i} n={n} />
        ))}
      </div>
    </div>
  )
}
