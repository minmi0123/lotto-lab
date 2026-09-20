#!/usr/bin/env node
// 공공데이터포털(data.go.kr)의 공식 복권 데이터로 src/data/storeData.js 를 만든다.
//
//   node scripts/update-stores.mjs            # 내려받아 집계 후 파일 갱신
//   node scripts/update-stores.mjs --dry-run  # 내려받아 확인만, 파일은 안 건드림
//
// 동행복권 사이트를 긁지 않는다. 쓰는 건 둘 다 "이용허락범위 제한 없음" 인 공식
// 파일데이터이고 로그인 없이 받을 수 있다. 요청은 데이터셋당 2건(페이지+파일)뿐이다.
//
//   15059963  기획예산처_온라인복권 1등 당첨 판매점 현황 정보
//             순번, 상호, 지역(시도 시군구), 1등 자동 당첨 건수
//   15086355  기획예산처_복권판매점 목록
//             순서, 판매점명, 도로명주소, 판매점종류(온라인복권=1, 인쇄복권=2)
//
// 둘 다 갱신주기가 '연간'이라 주간 자동 갱신에는 넣지 않는다. 1년에 한 번 손으로 돌린다.
//
// 주의: 1등 '자동 선택'만 들어 있다. 수동으로 1등이 나온 판매점은 이 데이터에 없다.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = resolve(HERE, '../src/data/storeData.js')
const PORTAL = 'https://www.data.go.kr'
const WIN_PK = '15059963' // 1등 당첨 판매점 현황
const SHOP_PK = '15086355' // 복권판매점 목록
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// 두 파일의 시도 표기가 다르다. 당첨 파일은 광주·전남이 따로, 판매점 파일은
// 통합 표기라 비교하려면 한쪽으로 맞춰야 한다.
const ALIAS = { 광주: '전남광주', 전남: '전남광주' }
const REGIONS = [
  '서울', '경기', '부산', '대구', '인천', '대전', '울산', '강원',
  '충북', '충남', '전남광주', '전북', '경북', '경남', '제주', '세종',
]

const dryRun = process.argv.includes('--dry-run')
const log = (...a) => console.log(...a)
const fail = (msg) => {
  console.error(`\n✖ ${msg}`)
  process.exit(1)
}

// ---------- 내려받기 ----------

// 파일 아이디는 데이터셋이 갱신되면 바뀌므로 상세 페이지에서 그때그때 읽는다.
async function fetchCsv(pk) {
  const pageUrl = `${PORTAL}/data/${pk}/fileData.do`
  const page = await fetch(pageUrl, { headers: { 'User-Agent': UA } })
  if (!page.ok) throw new Error(`HTTP ${page.status} — ${pageUrl}`)
  const html = await page.text()

  const m = html.match(/fileDownload\.do\?atchFileId=([A-Za-z0-9_]+)&fileDetailSn=(\d+)/)
  if (!m) throw new Error(`${pk}: 페이지에서 다운로드 링크를 찾지 못했습니다. 화면 구조가 바뀐 듯합니다.`)

  // 제목에 기준일자가 붙어 있어(…_20260606) 언제 것인지 파일에 남길 수 있다
  const title = ((html.match(/<title>([^<]+)<\/title>/) || [])[1] || pk)
    .replace(/\s*\|\s*공공데이터포털\s*$/, '')
    .trim()
  const url = `${PORTAL}/cmm/cmm/fileDownload.do?atchFileId=${m[1]}&fileDetailSn=${m[2]}&insertDataPrcus=N`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: pageUrl } })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)

  // 공공데이터포털 CSV 는 EUC-KR 로 내려온다 (Content-Type 은 UTF-8 이라고 하지만 거짓말)
  const buf = Buffer.from(await res.arrayBuffer())
  const text = new TextDecoder('euc-kr').decode(buf)
  if (!/^[가-힣]/.test(text.trim())) throw new Error(`${pk}: 디코딩 결과가 한글이 아닙니다. 인코딩이 바뀌었을 수 있습니다.`)
  return { title, text, bytes: buf.length }
}

// 주소에 쉼표가 들어가 따옴표로 감싼 행이 있어 split(',') 으로는 깨진다
function parseCsv(text) {
  const rows = []
  let row = [],
    field = '',
    quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((f) => f.trim()))
}

const sidoOf = (s) => {
  const raw = String(s || '').trim().split(/\s+/)[0]
  return ALIAS[raw] || raw
}

// ---------- 집계 ----------

function buildWins(text) {
  const rows = parseCsv(text.trim()).slice(1)
  const wins = new Array(REGIONS.length).fill(0)
  const stores = []
  let online = 0
  const odd = new Set()

  for (const r of rows) {
    if (r.length < 4) continue
    const name = r[1].trim()
    const count = Number(r[3])
    if (!Number.isInteger(count) || count < 1) throw new Error(`당첨 건수가 숫자가 아닙니다: ${r.join(',')}`)

    // 인터넷 구매분은 판매점이 아닌데 '서울 서초구'(동행복권 소재지)로 기록된다.
    // 그대로 두면 서울이 부풀려지므로 따로 센다.
    if (/인터넷/.test(name)) { online += count; continue }

    const sido = sidoOf(r[2])
    const i = REGIONS.indexOf(sido)
    if (i < 0) { odd.add(sido); continue }
    wins[i] += count
    stores.push({ n: name, g: r[2].trim(), c: count })
  }
  if (odd.size) throw new Error(`REGIONS 에 없는 시도: ${[...odd].join(', ')} — ALIAS 를 손봐야 합니다.`)

  stores.sort((a, b) => b.c - a.c || a.n.localeCompare(b.n))
  return { wins, online, stores, storeCount: stores.length }
}

function buildShops(text) {
  const rows = parseCsv(text.trim()).slice(1)
  const shops = new Array(REGIONS.length).fill(0)
  const odd = new Set()
  let skipped = 0

  for (const r of rows) {
    if (r.length < 4) continue
    if (r[3].trim() !== '1') continue // 온라인복권(로또)을 파는 곳만
    const sido = sidoOf(r[2])
    const i = REGIONS.indexOf(sido)
    if (i < 0) { odd.add(sido); skipped++; continue }
    shops[i]++
  }
  if (odd.size) throw new Error(`REGIONS 에 없는 시도: ${[...odd].join(', ')} — ALIAS 를 손봐야 합니다.`)
  return { shops, skipped }
}

// ---------- 출력 ----------

function serialize({ wins, shops, online, stores, winTitle, shopTitle, asof }) {
  const top = stores.slice(0, 12)
  return (
    '// 지역별 1등(자동) 배출과 판매점 수. 공공데이터포털 공식 파일데이터에서 생성.\n' +
    '// 갱신: npm run update-stores  (원본 갱신주기가 연 1회라 1년에 한 번만 돌리면 된다)\n' +
    `//   ${winTitle}\n` +
    `//   ${shopTitle}\n` +
    '//\n' +
    '// 1등 "자동 선택"만 집계된 데이터다. 수동 1등은 원본에 없다.\n' +
    '\n' +
    `export const REGIONS = ${JSON.stringify(REGIONS)}\n` +
    '\n' +
    '// 지역별 1등(자동) 배출 건수 — 인터넷 구매분 제외\n' +
    `export const WINS = ${JSON.stringify(wins)}\n` +
    '\n' +
    '// 지역별 온라인복권(로또) 판매점 수. 배출 수를 이걸로 나눠야\n' +
    '// "판매점이 많아서" 인지 아닌지 갈린다.\n' +
    `export const SHOPS = ${JSON.stringify(shops)}\n` +
    '\n' +
    '// 인터넷 복권판매사이트 배출 건수 (지역 통계에서는 뺀 값)\n' +
    `export const ONLINE = ${online}\n` +
    '\n' +
    '// 여러 번 배출한 판매점 상위 — {n:상호, g:지역, c:건수}\n' +
    `export const TOP = [\n${top.map((s) => JSON.stringify(s)).join(',\n')}\n]\n` +
    '\n' +
    '// 배출 건수별 판매점 수 {1:426, 2:27, ...} — 무작위 기대와 비교용\n' +
    `export const HIST = ${JSON.stringify(
      stores.reduce((a, s) => ((a[s.c] = (a[s.c] || 0) + 1), a), {}),
    )}\n` +
    '\n' +
    `export const META = ${JSON.stringify(
      {
        asof,
        winStores: stores.length,
        winTotal: wins.reduce((a, b) => a + b, 0),
        shopTotal: shops.reduce((a, b) => a + b, 0),
      },
      null,
      0,
    )}\n`
  )
}

// ---------- 실행 ----------

async function main() {
  log('▶ 공공데이터포털에서 공식 파일 2건을 내려받습니다.\n')

  const win = await fetchCsv(WIN_PK)
  log(`  ${win.title} (${(win.bytes / 1024).toFixed(0)}KB)`)
  const shop = await fetchCsv(SHOP_PK)
  log(`  ${shop.title} (${(shop.bytes / 1024).toFixed(0)}KB)\n`)

  const w = buildWins(win.text)
  const s = buildShops(shop.text)

  const winTotal = w.wins.reduce((a, b) => a + b, 0)
  const shopTotal = s.shops.reduce((a, b) => a + b, 0)
  if (!winTotal) fail('1등 배출 건수가 0입니다.')
  if (!shopTotal) fail('판매점 수가 0입니다.')
  if (s.skipped) log(`  (판매점 ${s.skipped}건은 시도를 못 읽어 제외)\n`)

  log(`  1등(자동) 배출  ${winTotal}건 · 배출 판매점 ${w.storeCount}곳 · 인터넷 ${w.online}건`)
  log(`  온라인복권 판매점  ${shopTotal}곳`)
  log(`  최다 배출  ${w.stores.slice(0, 3).map((x) => `${x.n}(${x.g}) ${x.c}건`).join(' · ')}\n`)
  REGIONS.forEach((r, i) => {
    const per = s.shops[i] ? ((w.wins[i] / s.shops[i]) * 1000).toFixed(1) : '-'
    log(`  ${r.padEnd(5)} 배출 ${String(w.wins[i]).padStart(4)}  판매점 ${String(s.shops[i]).padStart(5)}  (1000곳당 ${per})`)
  })

  if (dryRun) return log('\n[--dry-run] 파일은 쓰지 않았습니다.')

  await writeFile(
    DATA_FILE,
    serialize({
      wins: w.wins,
      shops: s.shops,
      online: w.online,
      stores: w.stores,
      winTitle: win.title,
      shopTitle: shop.title,
      asof: new Date().toISOString().slice(0, 10),
    }),
    'utf8',
  )
  log(`\n✔ src/data/storeData.js 갱신.`)
}

main().catch((e) => fail(e.message))
