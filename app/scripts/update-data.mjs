#!/usr/bin/env node
// 역대 당첨번호(src/data/lottoData.js) 갱신 스크립트.
//
//   node scripts/update-data.mjs --probe     # API 응답을 저장된 회차와 대조 (네트워크 확인용)
//   node scripts/update-data.mjs --dry-run   # 새 회차를 가져오되 파일은 건드리지 않음
//   node scripts/update-data.mjs             # 새 회차를 가져와 파일에 추가
//   node scripts/update-data.mjs --reformat  # 네트워크 없이 파일 포맷만 다시 씀
//
// 동행복권은 공개·문서화된 오픈 API를 제공하지 않습니다. 아래 주소는 당첨결과 페이지
// (/lt645/result)가 스스로 호출하는 내부 주소라 약관·가용성 보장이 없고 예고 없이 막힐 수
// 있습니다. 실제로 예전에 쓰던 common.do / gameResult.do 는 사이트 개편으로 사라졌습니다.
// 그래서 이 스크립트는 (1) 주 1회 정도만 돌리고 (2) 응답을 검증하며
// (3) 조금이라도 이상하면 파일을 쓰지 않고 멈춥니다.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = resolve(HERE, '../src/data/lottoData.js')
const BASE = process.env.LOTTO_BASE || 'https://www.dhlottery.co.kr'
const DELAY_MS = Number(process.env.LOTTO_DELAY_MS ?? 1200) // 연속 요청 사이 간격
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const PAGE = 10 // 이 API 가 한 번에 돌려주는 회차 수

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const argOf = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log(...a)
const fail = (msg) => {
  console.error(`\n✖ ${msg}`)
  process.exit(1)
}

// ---------- 파일 읽기/쓰기 ----------

async function readData() {
  const mod = await import(`file://${DATA_FILE}?t=${Date.now()}`)
  if (!Array.isArray(mod.DATA)) fail('lottoData.js 에서 DATA 배열을 찾지 못했습니다.')
  return mod.DATA
}

// 한 줄 = 한 회차. 주간 갱신 diff 가 "+1줄"로 남아 눈으로 검토할 수 있게.
function serialize(rows) {
  const body = rows
    .map((d) =>
      JSON.stringify({ round: d.round, n: d.n, b: d.b, w1: d.w1, c1: d.c1, w2: d.w2, c2: d.c2 }),
    )
    .join(',\n')
  return (
    '// 역대 로또 당첨번호\n' +
    '// {round, n:[6번호], b:보너스, w1:1등당첨금, c1:1등인원, w2:2등당첨금, c2:2등인원}\n' +
    '// 갱신: npm run update-data  (scripts/update-data.mjs · 한 줄 = 한 회차)\n' +
    'export const DATA = [\n' +
    body +
    '\n]\n'
  )
}

// ---------- 응답 검증 ----------

const isInt = (v) => Number.isInteger(v)
const isMoney = (v) => isInt(v) && v >= 0

// 한 회차가 앱이 기대하는 모양인지 확인. 여기서 걸러야 잘못된 값이 파일에 박히지 않음.
function validate(d) {
  const e = []
  if (!isInt(d.round) || d.round < 1) e.push(`round=${d.round}`)
  if (!Array.isArray(d.n) || d.n.length !== 6) e.push(`n 이 6개가 아님(${d.n?.length})`)
  else {
    if (d.n.some((x) => !isInt(x) || x < 1 || x > 45)) e.push(`n 에 1~45 밖 값: ${d.n}`)
    if (new Set(d.n).size !== 6) e.push(`n 에 중복: ${d.n}`)
    if (d.n.some((x, i) => i && x <= d.n[i - 1])) e.push(`n 이 오름차순이 아님: ${d.n}`)
  }
  if (!isInt(d.b) || d.b < 1 || d.b > 45) e.push(`b=${d.b}`)
  if (d.n?.includes(d.b)) e.push(`보너스 ${d.b} 가 당첨번호에 포함됨`)
  for (const k of ['w1', 'c1', 'w2', 'c2']) if (!isMoney(d[k])) e.push(`${k}=${d[k]}`)
  // 당첨자가 있는데 금액이 0이면(또는 그 반대) 수집이 어긋난 것
  if ((d.c1 > 0) !== (d.w1 > 0)) e.push(`1등 인원(${d.c1})과 금액(${d.w1})이 안 맞음`)
  if ((d.c2 > 0) !== (d.w2 > 0)) e.push(`2등 인원(${d.c2})과 금액(${d.w2})이 안 맞음`)
  return e
}

// ---------- 수집 ----------

// 당첨결과 페이지가 쓰는 조회 주소. 한 번에 최대 10회차, 1등과 2등이 같은 응답에 들어 있다.
//   srchDir=center + srchLtEpsd        지정 회차부터 과거로 10개
//   srchDir=latest + srchCursorLtEpsd  커서보다 최신인 회차 10개 (없으면 빈 리스트)
async function fetchList(params) {
  const url = `${BASE}/lt645/selectPstLt645InfoNew.do?${new URLSearchParams(params)}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Referer: `${BASE}/lt645/result`,
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`)
  const raw = await res.text()
  let j
  try {
    j = JSON.parse(raw)
  } catch {
    throw new Error(
      `JSON 이 아닌 응답. 주소가 막혔거나 바뀌었습니다.\n  ${url}\n  앞 200자:\n${raw.slice(0, 200)}`,
    )
  }
  const list = j?.data?.list
  if (!Array.isArray(list)) throw new Error(`응답에 data.list 가 없습니다. 앞 200자:\n${raw.slice(0, 200)}`)
  return list
}

// API 한 건을 앱이 쓰는 모양으로. 필드가 하나라도 없으면 구조가 바뀐 것이라 즉시 멈춘다.
function toRow(item) {
  const need = [
    'ltEpsd',
    'bnsWnNo',
    'rnk1WnAmt',
    'rnk1WnNope',
    'rnk2WnAmt',
    'rnk2WnNope',
    'tm1WnNo',
    'tm2WnNo',
    'tm3WnNo',
    'tm4WnNo',
    'tm5WnNo',
    'tm6WnNo',
  ]
  const missing = need.filter((k) => item?.[k] == null)
  if (missing.length) throw new Error(`응답에 ${missing.join(', ')} 가 없습니다 — 구조가 바뀐 듯합니다.`)
  return {
    round: item.ltEpsd,
    n: [item.tm1WnNo, item.tm2WnNo, item.tm3WnNo, item.tm4WnNo, item.tm5WnNo, item.tm6WnNo].sort(
      (a, b) => a - b,
    ),
    b: item.bnsWnNo,
    w1: item.rnk1WnAmt, // 1게임당 1등 당첨금 (rnk1SumWnAmt 는 등위별 총액이라 다른 값)
    c1: item.rnk1WnNope,
    w2: item.rnk2WnAmt,
    c2: item.rnk2WnNope,
    _date: item.ltRflYmd,
  }
}

// 지정 회차 하나. 응답에 그 회차가 없으면 null.
async function fetchRound(round) {
  const list = await fetchList({ srchDir: 'center', srchLtEpsd: String(round) })
  const hit = list.find((x) => Number(x.ltEpsd) === round)
  return hit ? toRow(hit) : null
}

// 커서보다 최신인 회차들을 오름차순으로.
async function fetchNewer(cursor) {
  const list = await fetchList({ srchDir: 'latest', srchCursorLtEpsd: String(cursor) })
  const rows = list.map(toRow).sort((a, b) => a.round - b.round)
  const stale = rows.filter((r) => r.round <= cursor)
  if (stale.length)
    throw new Error(`${cursor}회보다 최신을 요청했는데 ${stale.map((r) => r.round).join(',')}회가 왔습니다.`)
  return rows
}

// ---------- 모드 ----------

async function probe() {
  const rows = await readData()
  const round = Number(argOf('--round', rows[rows.length - 1].round))
  const stored = rows.find((d) => d.round === round)
  if (!stored) fail(`${round}회가 저장된 데이터에 없습니다. --round 로 다른 회차를 지정하세요.`)

  log(`▶ ${round}회를 다시 가져와 저장된 값과 대조합니다.\n  ${BASE}\n`)

  const got = await fetchRound(round)
  if (!got) fail(`${round}회를 응답에서 찾지 못했습니다.`)
  const { _date, ...row } = got
  log(`― 가져온 값 (추첨일 ${_date}) ―`)
  log(JSON.stringify(row))

  const cmp = ['n', 'b', 'w1', 'c1', 'w2', 'c2'].map((k) => {
    const a = JSON.stringify(stored[k]),
      b = JSON.stringify(row[k])
    return { 필드: k, 저장됨: a, 가져옴: b, 일치: a === b ? '✓' : '✗' }
  })
  log('\n― 대조 ―')
  console.table(cmp)

  const bad = cmp.filter((c) => c.일치 === '✗')
  if (!bad.length) log('\n✔ 전부 일치합니다. 이대로 갱신을 돌려도 됩니다.')
  else log(`\n⚠ ${bad.map((b) => b.필드).join(', ')} 가 다릅니다. 파서를 고쳐야 합니다.`)
}

async function update({ dryRun }) {
  const rows = await readData()
  const last = rows[rows.length - 1].round
  const max = Number(argOf('--max', 20))
  log(`▶ 저장된 마지막 회차: ${last}회. ${last + 1}회부터 확인합니다.\n`)

  const added = []
  let cursor = last
  for (let page = 0; page * PAGE < max; page++) {
    if (page) await sleep(DELAY_MS)
    const got = await fetchNewer(cursor)
    if (!got.length) {
      log(`  ${cursor + 1}회는 아직 없음 — 여기서 멈춥니다.`)
      break
    }
    for (const { _date, ...row } of got) {
      if (added.length >= max) break
      // 중간이 비면 "배열 순서 = 회차" 라는 앱의 전제가 깨진다
      const prev = added.length ? added[added.length - 1].round : last
      if (row.round !== prev + 1) fail(`${prev}회 다음이 ${row.round}회입니다 — 회차가 건너뛰었습니다.`)
      const errs = validate(row)
      if (errs.length) fail(`${row.round}회 응답이 이상합니다:\n  - ${errs.join('\n  - ')}`)
      added.push(row)
      log(`  ${row.round}회 (${_date}) ${row.n.join(',')} + ${row.b} · 1등 ${row.c1}명 · 2등 ${row.c2}명`)
    }
    cursor = added[added.length - 1].round
    if (added.length >= max) {
      log(`\n  --max ${max} 에 걸려 멈췄습니다. 남은 회차가 있으면 한 번 더 돌리세요.`)
      break
    }
  }

  if (!added.length) return log('\n새 회차가 없습니다. 파일을 건드리지 않았습니다.')
  if (dryRun) return log(`\n[--dry-run] ${added.length}개를 가져왔지만 파일은 쓰지 않았습니다.`)

  await writeFile(DATA_FILE, serialize([...rows, ...added]), 'utf8')
  log(`\n✔ ${added.length}개 회차 추가 (${last + 1}~${added[added.length - 1].round}회).`)
  log('  git diff 로 추가된 줄을 확인한 뒤 커밋하세요.')
}

// 네트워크 없이 포맷만 다시 쓴다. 내용이 바뀌지 않았음을 직접 확인한 뒤에만 기록.
async function reformat() {
  const before = await readData()
  const out = serialize(before)
  const prev = await readFile(DATA_FILE, 'utf8')
  await writeFile(DATA_FILE, out, 'utf8')
  const after = await readData()
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    await writeFile(DATA_FILE, prev, 'utf8')
    fail('재포맷 전후 데이터가 달라져 되돌렸습니다.')
  }
  const bad = before.flatMap((d) => validate(d).map((e) => `${d.round}회: ${e}`))
  log(`✔ ${after.length}개 회차를 한 줄씩으로 다시 썼습니다 (내용 동일 확인).`)
  if (bad.length) log(`⚠ 기존 데이터 중 검증에 걸린 항목 ${bad.length}건:\n  ${bad.join('\n  ')}`)
}

const mode = has('--probe') ? probe : has('--reformat') ? reformat : () => update({ dryRun: has('--dry-run') })
mode().catch((e) => fail(e.message))
