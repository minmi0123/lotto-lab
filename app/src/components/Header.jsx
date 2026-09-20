import { useEffect, useRef, useState } from 'react'

// 포인트 표시 + 변동 시 플래시 애니메이션
export default function Header({ balance }) {
  const [flash, setFlash] = useState(false)
  const prev = useRef(balance)

  useEffect(() => {
    if (prev.current !== balance) {
      setFlash(true)
      prev.current = balance
      const t = setTimeout(() => setFlash(false), 500)
      return () => clearTimeout(t)
    }
  }, [balance])

  return (
    <div className="ptbar">
      <div>
        <span className={`pt ${flash ? 'pt-flash' : ''}`} style={{ display: 'inline-block' }}>
          {balance.toLocaleString()}
          <small>pt</small>
        </span>
      </div>
      <span className="mini">🎰 스핀을 돌려 포인트를 불려보세요</span>
    </div>
  )
}
