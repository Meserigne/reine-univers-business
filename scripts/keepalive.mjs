#!/usr/bin/env node
/**
 * Keep-alive: ping l’API Render pour éviter le sleep (free tier ~15 min).
 *
 * Usage:
 *   node scripts/keepalive.mjs
 *   API_URL=https://rub-api.onrender.com node scripts/keepalive.mjs
 *   node scripts/keepalive.mjs --loop   # toutes les 60s (local)
 */
const API_URL = (process.env.API_URL || 'https://rub-api.onrender.com').replace(
  /\/$/,
  '',
)
const TARGET = `${API_URL}/health`
const loop = process.argv.includes('--loop')
const intervalMs = Number(process.env.KEEPALIVE_INTERVAL_MS || 60_000)

async function ping() {
  const started = Date.now()
  try {
    const res = await fetch(TARGET, {
      method: 'GET',
      headers: { 'User-Agent': 'rub-keepalive/1.0' },
      signal: AbortSignal.timeout(25_000),
    })
    const ms = Date.now() - started
    const body = await res.text().catch(() => '')
    const line = `[keepalive] ${new Date().toISOString()} ${res.status} ${ms}ms ${TARGET}`
    if (!res.ok) {
      console.error(line, body.slice(0, 120))
      return false
    }
    console.log(line)
    return true
  } catch (err) {
    console.error(
      `[keepalive] ${new Date().toISOString()} FAIL ${TARGET}`,
      err instanceof Error ? err.message : err,
    )
    return false
  }
}

async function main() {
  if (!loop) {
    const ok = await ping()
    process.exit(ok ? 0 : 1)
  }
  console.log(`[keepalive] loop every ${intervalMs}ms → ${TARGET}`)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await ping()
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

main()
