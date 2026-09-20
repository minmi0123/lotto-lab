# 🎱 로또 랩 (Lotto Lab)

역대 로또 당첨번호 이력으로 노는 데이터 토이앱. **React + Vite**로 빌드하며, 외부 UI 라이브러리 없이 바닐라 로직 + Canvas로 동작합니다.

🔗 **Live**: https://minmi0123.github.io/lotto-lab/

## 기능

- 🎰 **로또 슬롯** — 포인트(기본 100)로 스핀, 역대 무작위 회차와 겨뤄 포인트 적립 (localStorage 저장)
- 🆕 **최신 회차** — 당첨번호·보너스·당첨금/인원
- 📊 **번호별 출현 빈도** — Canvas 막대그래프, 막대 클릭 시 상세
- 🎭 **착시 코너** — 핫/콜드 Top6를 무작위 기대 변동폭(±1σ) 위에 얹어, 그 격차가 신호가 아님을 보여줌
- 🗺️ **지역별 1등 배출** — 판매점 수로 보정한 forest plot + '명당' 쏠림을 무작위 기대와 대조 (공공데이터)
- 🧮 **통계** — 합계 평균, 홀짝 비율, 연속번호 포함률 등
- 🎲 **행운 번호 생성기** — 랜덤/합계균형/미출현궁합 3가지 전략
- 🏅 **명예의 전당** — 최고/최소 당첨금·1등 최다 배출 랭킹
- 🎯 **분석 & 시뮬레이터**(팝업) — 내 번호 역대 적중 이력 + "꾸준히 샀다면 수익은?" 시뮬

## 개발

```bash
cd app
npm install
npm run dev      # 로컬 개발 서버
npm run build    # dist/ 정적 빌드
```

## 구조

```
app/                  # React + Vite 프론트엔드
  src/
    data/             # 역대 회차 + 지역별 배출 데이터
    lib/              # 통계·채점·추천 로직
    state/            # 포인트 공유 상태(localStorage)
    components/       # 카드/슬롯 컴포넌트
  scripts/            # 당첨번호 · 지역별 배출 데이터 갱신
.github/workflows/    # GitHub Pages 자동 배포(Actions)
todo.md               # 기획/로드맵
```

## 데이터 갱신

역대 회차는 `app/src/data/lottoData.js`에 정적으로 들어 있습니다 (한 줄 = 한 회차).
새 회차는 아래로 추가합니다.

```bash
cd app
npm run update-data -- --probe      # 저장된 회차를 다시 받아 대조 (처음 한 번 확인용)
npm run update-data -- --dry-run    # 새 회차를 가져오되 파일은 안 건드림
npm run update-data                 # 새 회차 추가 → git diff 로 확인 후 커밋
```

마지막 저장 회차 다음부터만 받아오므로 주간 실행 시 요청은 1건입니다(한 응답에
최대 10회차, 1등·2등이 함께 들어 있습니다). 응답이 조금이라도 이상하면(JSON 아님 ·
필드 누락 · 회차 건너뜀 · 보너스 번호 중복 · 인원과 금액 불일치 · HTTP 오류)
**파일을 쓰지 않고 멈춥니다.**

> ⚠️ 동행복권은 공개·문서화된 오픈 API를 제공하지 않습니다. 이 스크립트가 쓰는
> 주소는 당첨결과 페이지(`/lt645/result`)가 스스로 호출하는 내부 주소라 약관·가용성
> 보장이 없고 예고 없이 막힐 수 있습니다. 실제로 예전에 쓰던 `common.do` /
> `gameResult.do` 는 사이트 개편으로 사라졌습니다. 그래서 자동화는 **주 1회**(토요일 추첨 이후)로만
> 잡고, 요청 사이에 간격을 둡니다(`LOTTO_DELAY_MS`, 기본 1200ms).
> CI(GitHub Actions)는 해외 IP에서 돌아 차단될 수 있으니 국내 PC에서 돌리는 쪽을 권합니다.
>
> **짧은 시간에 많이 요청하면 IP가 막힙니다.** 2026-09-20에 약 1,100건을 0.9초 간격으로
> 보냈다가 홈페이지까지 전부 TCP 타임아웃이 됐습니다. 주간 갱신(요청 1건)은 무관하지만,
> 과거 회차를 훑는 작업은 하지 마세요.

### 지역별 1등 배출 데이터

`app/src/data/storeData.js`는 **공공데이터포털의 공식 파일데이터**에서 만듭니다.
동행복권을 긁지 않으므로 차단 위험이 없고, 요청도 데이터셋당 2건(페이지+파일)뿐입니다.

```bash
cd app
npm run update-stores -- --dry-run   # 내려받아 집계만 확인
npm run update-stores                # storeData.js 갱신
```

| 데이터셋 | 쓰는 것 |
|---|---|
| [온라인복권 1등 당첨 판매점 현황](https://www.data.go.kr/data/15059963/fileData.do) | 지역별 1등 배출 건수 (분자) |
| [복권판매점 목록](https://www.data.go.kr/data/15086355/fileData.do) | 지역별 온라인복권 판매점 수 (분모) |

둘 다 기획예산처 제공, 이용허락범위 제한 없음, 로그인 없이 다운로드됩니다.
**갱신주기가 연 1회**라 주간 자동 실행에는 넣지 않았습니다 — 1년에 한 번 손으로 돌리면 됩니다.

주의할 점:

- 원본이 **1등 '자동 선택'만** 담고 있어 수동 1등은 빠져 있습니다
- 최근 1년치(52회차)뿐입니다
- 두 파일의 시도 표기가 다릅니다 (당첨 파일은 `광주`·`전남` 분리, 판매점 파일은 `전남광주`
  통합). 스크립트의 `ALIAS`에서 통합 기준으로 맞춥니다
- CSV가 **EUC-KR**로 내려옵니다 (`Content-Type`은 UTF-8이라고 하지만 거짓말)
- `인터넷 복권판매사이트`는 판매점이 아닌데 동행복권 소재지인 `서울 서초구`로
  기록되어, 그대로 두면 서울이 부풀려집니다. 따로 세서 지역 통계에서 뺍니다

### 자동 실행 (Windows)

`scripts/auto-update.ps1` 이 **갱신 → 커밋 → main 푸시**까지 한 번에 합니다.
푸시되면 Actions 가 빌드해 Pages 에 배포하므로 손댈 일이 없습니다.

아래 중 하나라도 걸리면 **아무것도 하지 않고 종료**합니다: 현재 브랜치가 main 이
아님 · 워킹트리에 커밋 안 된 변경이 있음 · `origin/main` 과 갈라져 fast-forward
불가 · 갱신 스크립트 실패 · `lottoData.js` 외의 파일이 바뀜.

로그는 저장소 바깥 `..\lotto-update.log` 에 쌓입니다 (1MB 넘으면 `.1` 로 회전).

```powershell
# 매주 일요일 09:00 등록
$ps1 = "C:\study\toy\lotto-lab\scripts\auto-update.ps1"
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ps1`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 9:00am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName 'lotto-lab-update' -Action $action `
  -Trigger $trigger -Settings $settings -Description '로또 랩 당첨번호 주간 자동 갱신'

Start-ScheduledTask -TaskName 'lotto-lab-update'     # 즉시 한 번 돌려보기
Get-ScheduledTaskInfo -TaskName 'lotto-lab-update'   # 마지막 실행 결과
Unregister-ScheduledTask -TaskName 'lotto-lab-update' -Confirm:$false  # 해제
```

`-StartWhenAvailable` 이라 그 시각에 PC 가 꺼져 있었으면 켜진 뒤 따라잡습니다.
푸시에는 Git Credential Manager 에 저장된 자격증명을 쓰므로, 작업은 **등록한
사용자 계정으로 로그온된 상태**에서 실행돼야 합니다.

```bash
# macOS / Linux 는 데이터 갱신만 (crontab -e)
0 9 * * 0 cd ~/lotto-lab/app && npm run update-data >> ~/lotto-update.log 2>&1
```

## 배포

`main` 푸시 → GitHub Actions가 `app/`을 빌드해 GitHub Pages에 자동 배포합니다.

## 면책

로또는 완전 무작위 추첨이라 모든 조합의 1등 확률은 동일(1/8,145,060)합니다. 모든 통계·포인트는 **재미용**이며 당첨을 보장하지 않습니다 😉

그래서 이 앱은 **당첨 확률을 높여준다고 주장하는 기능을 두지 않습니다.** 핫/콜드 넘버는 예측 도구가 아니라
'착시 코너'로 두고, 그 격차가 무작위 잡음 범위임을 데이터로 보여줍니다.
