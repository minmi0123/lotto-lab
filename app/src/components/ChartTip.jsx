import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// 그래프 요소용 툴팁. 브라우저 기본 툴팁(<title>)은 뜨는 데 시간이 걸리고
// 모양을 못 바꾸며 터치에서 안 뜬다. 이건 올리는 즉시, 폰에서는 탭하면 뜬다.
//
// 쓰는 법:
//   const tip = useChartTip()
//   <circle {...tip.bind('22번 · 148회')} />
//   <ChartTip tip={tip} />
export function useChartTip() {
  const [state, setState] = useState(null) // { text, x, y, key }

  const hide = useCallback(() => setState(null), [])

  const showAt = useCallback((el, text, key) => {
    const r = el.getBoundingClientRect()
    // 화면 좌우 끝에서 잘리지 않게 가운데 기준점을 안쪽으로 당긴다
    const x = Math.min(Math.max(r.left + r.width / 2, 90), window.innerWidth - 90)
    setState({ text, key, x, y: r.top, b: r.bottom })
  }, [])

  // 스크롤·크기 변경 때는 위치가 틀어지므로 닫는다
  useEffect(() => {
    if (!state) return
    window.addEventListener('scroll', hide, { passive: true })
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide)
      window.removeEventListener('resize', hide)
    }
  }, [state, hide])

  // 터치에서 바깥을 탭하면 닫는다
  useEffect(() => {
    if (!state) return
    const onDown = (e) => {
      if (!e.target.closest?.('[data-tip]')) hide()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [state, hide])

  const bind = (text, key = text) => ({
    'data-tip': '',
    onPointerEnter: (e) => {
      if (e.pointerType === 'mouse') showAt(e.currentTarget, text, key)
    },
    onPointerLeave: (e) => {
      if (e.pointerType === 'mouse') hide()
    },
    // 터치·펜: 탭으로 열고, 같은 걸 다시 탭하면 닫는다
    onPointerUp: (e) => {
      if (e.pointerType === 'mouse') return
      if (state?.key === key) hide()
      else showAt(e.currentTarget, text, key)
    },
  })

  return { state, bind, hide }
}

export default function ChartTip({ tip }) {
  const s = tip.state
  if (!s) return null
  // 화면 위쪽 끝에 붙으면 아래로 뒤집는다
  const below = s.y < 70
  return createPortal(
    <div
      className={`chart-tip${below ? ' below' : ''}`}
      style={{ left: s.x, top: below ? s.b + 10 : s.y - 10 }}
      role="tooltip"
    >
      {s.text}
    </div>,
    document.body,
  )
}
