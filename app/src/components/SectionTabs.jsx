import { useEffect, useRef, useState } from 'react'

// 페이지 안 소제목 탭. 포인트 바 바로 아래에 붙어 따라오고,
// 스크롤 위치에 맞는 탭을 켠다. 누르면 그 섹션으로 이동한다.
export default function SectionTabs({ items }) {
  const [active, setActive] = useState(items[0]?.id)
  const barRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const bar = barRef.current
      if (!bar) return
      const line = bar.getBoundingClientRect().bottom + 24
      let cur = items[0]?.id
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (el && el.getBoundingClientRect().top <= line) cur = it.id
      }
      // 맨 아래까지 내리면 마지막 섹션이 기준선에 못 닿아도 마지막 탭을 켠다
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        cur = items[items.length - 1]?.id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  // 모바일에서 탭 줄이 가로로 넘칠 때 켜진 탭이 보이게 (세로 스크롤은 건드리지 않는다)
  useEffect(() => {
    const bar = barRef.current
    const btn = bar?.querySelector('[aria-current="true"]')
    if (!bar || !btn) return
    const l = btn.offsetLeft - bar.offsetLeft
    if (l < bar.scrollLeft || l + btn.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: l - 16, behavior: 'smooth' })
    }
  }, [active])

  return (
    <nav className="sectabs" ref={barRef} aria-label="섹션 이동">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-current={active === it.id}
          className={active === it.id ? 'on' : undefined}
          onClick={() => document.getElementById(it.id)?.scrollIntoView({ block: 'start' })}
        >
          {it.label}
        </button>
      ))}
    </nav>
  )
}
