// 이모지 대신 쓰는 선 아이콘. 전부 currentColor 라 색은 부모가 정한다.
// viewBox 24 고정 · stroke 1.75 · round cap — ClickHouse 계열의 '엔지니어링' 톤에 맞춤.
const P = {
  // 슬롯 릴 3개가 든 프레임
  slot: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M9 5v14M15 5v14" /></>,
  dice: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" /></>,
  chart: <><path d="M4 20h16" /><path d="M6 20v-7M11 20V6M16 20v-10M21 20v-4" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  flame: <><path d="M12 3c3.2 3 4.8 5.5 4.8 8a4.8 4.8 0 0 1-9.6 0c0-1 .3-2 .9-3 .3 1.2.9 1.9 1.8 2.1-.3-2.6.4-5 2.1-7.1Z" /></>,
  snow: <><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /><path d="M12 6.6 9.9 4.8M12 6.6l2.1-1.8M12 17.4l-2.1 1.8M12 17.4l2.1 1.8" /></>,
  map: <><path d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8 9 4.5Z" /><path d="M9 4.5v12.7M15 6.8v12.7" /></>,
  store: <><path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" /><path d="M3 9.5 5 4.5h14l2 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" /></>,
  sigma: <><path d="M17.5 5.5H6.8l5.2 6.5-5.2 6.5h10.7" /></>,
  trophy: <><path d="M7 4.5h10v4.6a5 5 0 0 1-10 0V4.5Z" /><path d="M7 6.2H4.4v1.3A3.2 3.2 0 0 0 7.3 10.6M17 6.2h2.6v1.3a3.2 3.2 0 0 1-2.9 3.1" /><path d="M12 14.1V17m-3.3 2.5h6.6" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M15.8 15.8 20 20" /></>,
  coins: <><ellipse cx="12" cy="6.8" rx="7.5" ry="3.3" /><path d="M4.5 6.8v4.4c0 1.8 3.4 3.3 7.5 3.3s7.5-1.5 7.5-3.3V6.8" /><path d="M4.5 11.2v4.4c0 1.8 3.4 3.3 7.5 3.3s7.5-1.5 7.5-3.3v-4.4" /></>,
  play: <><path d="M8 5.2 19 12 8 18.8V5.2Z" /></>,
  alert: <><path d="M12 4.2 21 19.5H3L12 4.2Z" /><path d="M12 10v4" /><circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" /></>,
  star: <><path d="m12 4 2.5 5.1 5.6.8-4 3.9 1 5.6L12 16.8 6.9 19.4l1-5.6-4-3.9 5.6-.8L12 4Z" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4.5V10h-5.5" /></>,
  up: <><path d="M4 16.5 10 10l4 4 6-6.5" /><path d="M14.5 7.5H20V13" /></>,
  down: <><path d="M4 7.5 10 14l4-4 6 6.5" /><path d="M14.5 16.5H20V11" /></>,
  diamond: <><path d="m12 4 6 5-6 11L6 9l6-5Z" /><path d="m6 9h12M12 4 9 9l3 11M12 4l3 5-3 11" /></>,
  users: <><circle cx="9" cy="8.5" r="3.3" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" /><path d="M16 5.6a3.3 3.3 0 0 1 0 5.8M17.5 14.8a5.5 5.5 0 0 1 3 4.7" /></>,
  split: <><path d="M12 4v16" /><path d="M12 12H5.5M12 12h6.5" /><path d="M8 8.5 4.5 12 8 15.5M16 8.5 19.5 12 16 15.5" /></>,
  calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3.5v4M16 3.5v4" /></>,
  chevronDown: <><path d="m6 9.5 6 6 6-6" /></>,
  link: <><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.3-1.3" /><path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3" /></>,
}

export default function Icon({ name, size = 18, className = '' }) {
  const d = P[name]
  if (!d) return null
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {d}
    </svg>
  )
}
