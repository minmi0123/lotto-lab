# 🎱 Lotto Lab — TODO / 기획 노트

## 🎮 포인트 게이미피케이션 (진행 중)

> "통계 구경" → "계속 돌리고 싶은 앱". 슬롯형 포인트 게임을 붙인다.

### ✅ 확정 결정

| 항목 | 결정 |
|------|------|
| 게임 루프 | **스핀(슬롯)형** — 비용 차감 → 채점 → 보상 |
| 채점 대상 | **역대 랜덤 회차** (1228회 중 무작위 1회의 당첨번호+보너스와 비교) |
| 기술 스택 | **React + Vite** (정적 빌드 → GitHub Pages 그대로 배포) |
| 파산 처리 | **A. 무료 충전**(0pt → 버튼 +100) → 추후 **C. 광고 보고 충전**으로 전환 |

### 경제 밸런스 (strawman, 추후 튜닝 가능)

```yaml
시작: 100pt
스핀 비용: 10pt
```

| 일치 | 등수 | 보상 | 대략 확률 |
|------|------|------|:---:|
| 2개 | - | +20pt | ~15% |
| 3개 | 5등 | +150pt | ~2.2% |
| 4개 | 4등 | +1,500pt | ~0.14% |
| 5개 | 3등 | +20,000pt | ~0.003% |
| 5+보너스 | 2등 | +200,000pt | 희귀 |
| 6개 | 1등 | +1,000,000pt 🎰 | ~1/800만 |

> 기대값 ≈ 9.1pt / 비용 10pt → 스핀당 평균 -0.9pt로 천천히 닳음(긴장감 + 잭팟 꿈).

### 마이그레이션 전략

```yaml
원칙:
  - 현재 index.html(정적 앱)은 legacy/ 로 보존 → 마이그레이션 중 라이브 안전
  - 새 앱은 app/ 하위에 React+Vite로 구축
  - 기능 패리티 도달 시 루트로 승격 + Pages 배포 dist/ 로 전환
  - 데이터 1228회차 배열은 app/src/data/lottoData.js 로 분리(컴포넌트에 인라인 금지)

프로젝트 구조(목표):
  app/
    src/
      data/lottoData.js       # 1228회차
      lib/scoring.js          # 일치수→등수→보상(순수함수)
      state/usePoints.js      # 공유 포인트 상태 + localStorage 동기화
      components/
        Header.jsx            # 포인트 표시
        SlotMachine.jsx       # 신규 핵심
        Freq/HotCold/Stats/Generator/Lucky/HallOfFame/LabModal  # 기존 이전
```

### 단계 체크리스트

- [x] 1. legacy/ 로 현재 앱 보존
- [x] 2. DATA 배열 → app/src/data/lottoData.js
- [x] 3. Vite+React 스캐폴딩(app/)
- [x] 4. usePoints + scoring 코어
- [x] 5. Header + SlotMachine (신규 동작)
- [x] 6. build 검증
- [x] 7. 기존 카드 컴포넌트 이전(빈도·차트·핫콜드·통계·생성기·추천·명예의전당·분석시뮬)
- [x] 8. GitHub Pages를 Actions(app/ 빌드) 배포로 전환 → https://minmi0123.github.io/lotto-lab/ 라이브
- [ ] 9. (추후) 광고 충전(C), 서버/DB 랭킹(2단계)
- [ ] 10. (선택) 밸런스 튜닝, nav 스크롤-스파이, 슬롯→분석 연동

---

## 기타 아이디어 (메모)

- 광고: 1단계 쿠팡 파트너스 배너 → 트래픽 붙으면 AdSense(승인 관문: 독자 도메인·Privacy Policy 필요)
