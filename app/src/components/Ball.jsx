import { ballClass } from '../lib/scoring.js'

export default function Ball({ n, className = '', spin = false }) {
  return (
    <span className={`ball ${ballClass(n)} ${spin ? 'spin' : ''} ${className}`}>{n}</span>
  )
}
