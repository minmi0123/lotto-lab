import SlotMachine from '../components/SlotMachine.jsx'

export default function Home() {
  return (
    <div className="grid">
      <div id="sec-slot" style={{ gridColumn: '1/-1' }}>
        <SlotMachine />
      </div>
    </div>
  )
}
