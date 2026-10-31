import { useId, useState } from 'react'

// 지표 한 줄 + 이름 옆 ? 버튼. 누르면 줄 바로 아래에 설명이 펼쳐진다.
// 설명은 정의와 계산 방법만 쓴다 (해석·판단은 넣지 않는다).
export default function HelpStat({ label, value, valueClass, help }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <div className="stat">
        <span className="stat-label">
          {label}
          <button
            type="button"
            className={`help-btn${open ? ' on' : ''}`}
            aria-expanded={open}
            aria-controls={id}
            aria-label={`${label} 설명`}
            onClick={() => setOpen((v) => !v)}
          >
            ?
          </button>
        </span>
        <b className={valueClass}>{value}</b>
      </div>
      {open && (
        <div className="stat-help" id={id}>
          {help}
        </div>
      )}
    </>
  )
}
