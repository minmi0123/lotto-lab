import { useRef, useEffect, useState } from 'react'
import { freq, bonusFreq, maxC, ballDetail } from '../lib/stats.js'
import { ballClass } from '../lib/scoring.js'

const W = 1040,
  H = 240,
  pad = 28

export default function FreqChart() {
  const cvRef = useRef(null)
  const [sel, setSel] = useState(null) // 선택된 번호

  useEffect(() => {
    const ctx = cvRef.current.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    const bw = (W - pad * 2) / 45
    const colors = { b1: '#fbc531', b2: '#3b82f6', b3: '#ef4444', b4: '#7b8499', b5: '#22c55e' }
    for (let n = 1; n <= 45; n++) {
      const h = (freq[n] / maxC) * (H - pad * 2)
      const x = pad + (n - 1) * bw,
        y = H - pad - h
      ctx.fillStyle = colors[ballClass(n)]
      ctx.fillRect(x + 1, y, bw - 2, h)
      if (n % 5 === 0 || n === 1) {
        ctx.fillStyle = '#9aa3d4'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(n, x + bw / 2, H - pad + 12)
      }
    }
    ctx.strokeStyle = '#2e3766'
    ctx.beginPath()
    ctx.moveTo(pad, H - pad)
    ctx.lineTo(W - pad, H - pad)
    ctx.stroke()
  }, [])

  function handleClick(e) {
    const cv = cvRef.current
    const rect = cv.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (W / rect.width)
    const bw = (W - pad * 2) / 45
    const n = Math.floor((x - pad) / bw) + 1
    if (n >= 1 && n <= 45) setSel(n)
  }

  const det = sel != null ? ballDetail(sel) : null

  return (
    <div className="card full" id="sec-freq">
      <h2>📊 번호별 출현 빈도 <small>1~45번 역대 누적</small></h2>
      <canvas
        ref={cvRef}
        width={W}
        height={H}
        onClick={handleClick}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
      />
      <div className="hint">
        막대를 클릭하면 해당 번호의 상세 통계를 볼 수 있어요. 색은 실제 로또 공 색상 기준(노랑1-10 / 파랑11-20 / 빨강21-30 / 회색31-40 / 초록41-45).
      </div>
      {sel != null && (
        <div className="result" style={{ marginTop: 14, padding: 14, borderRadius: 12, background: '#11163a', border: '1px solid var(--line)' }}>
          <div className="row" style={{ gap: 14 }}>
            <span className={`ball ${ballClass(sel)}`}>{sel}</span>
            <div>
              <b>{sel}번</b> · 출현 <b>{freq[sel]}</b>회 (보너스 {bonusFreq[sel]}회)
              <br />
              <span className="mini">
                출현 순위 {det.rank}/45위 · 마지막 등장{' '}
                {det.lastRound ? `${det.lastRound}회 (${det.gap}회 전)` : '-'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
