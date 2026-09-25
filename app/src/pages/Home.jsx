import SlotMachine from '../components/SlotMachine.jsx'

export default function Home() {
  // 카드 한 장짜리 페이지라 grid 를 쓰지 않는다 (2열 grid 에 full 한 장 = 빈 열만 생김)
  return (
    <div id="sec-slot">
      <SlotMachine />
    </div>
  )
}
