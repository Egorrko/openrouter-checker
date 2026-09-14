<script setup>
const STORAGE_KEY = 'openrouter_key'

const apiKey = ref('')
const input = ref('')
const info = ref(null)
const credits = ref(null)
const error = ref('')
const loading = ref(false)
const updatedAt = ref(null)

const LABELS = {
  label: 'KEY LABEL',
  usage: 'TOTAL SPENT',
  limit: 'KEY LIMIT',
  limit_remaining: 'LIMIT LEFT',
  limit_reset: 'LIMIT RESET',
  is_free_tier: 'FREE TIER',
  is_provisioning_key: 'PROVISIONING KEY',
  usage_daily: 'SPENT TODAY',
  usage_weekly: 'SPENT THIS WEEK',
  usage_monthly: 'SPENT THIS MONTH',
  byok_usage: 'BYOK USAGE',
  include_byok_in_limit: 'BYOK IN LIMIT',
  expires_at: 'EXPIRES',
  rate_limit: 'RATE LIMIT',
}
const MONEY = new Set(['usage', 'limit', 'limit_remaining', 'usage_daily', 'usage_weekly', 'usage_monthly', 'byok_usage'])

const usd = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

function fmt(k, v) {
  if (v == null) return k.startsWith('limit') ? 'UNLIMITED' : '—'
  if (typeof v === 'boolean') return v ? 'YES' : 'NO'
  if (MONEY.has(k)) return usd(v)
  if (k === 'expires_at') return new Date(v).toLocaleString()
  if (k === 'rate_limit' && v.requests) return `${v.requests} REQ / ${v.interval}`
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const rows = computed(() =>
  Object.entries(info.value ?? {}).map(([k, v]) => ({
    k,
    label: LABELS[k] ?? k.toUpperCase().replace(/_/g, ' '),
    value: fmt(k, v),
  })),
)

const remaining = computed(() => credits.value ? credits.value.total_credits - credits.value.total_usage : null)
const usedPct = computed(() => {
  if (!credits.value?.total_credits) return 0
  return Math.min(100, Math.round((credits.value.total_usage / credits.value.total_credits) * 100))
})
const masked = computed(() => apiKey.value.slice(0, 9) + '••••••••' + apiKey.value.slice(-4))

async function load() {
  loading.value = true
  error.value = ''
  const headers = { Authorization: `Bearer ${apiKey.value}` }
  try {
    const [k, c] = await Promise.all([
      $fetch('https://openrouter.ai/api/v1/auth/key', { headers }),
      $fetch('https://openrouter.ai/api/v1/credits', { headers }).catch(() => null),
    ])
    info.value = k.data
    credits.value = c?.data ?? null
    updatedAt.value = new Date()
  } catch (e) {
    error.value = e?.data?.error?.message || e?.message || 'REQUEST FAILED'
  } finally {
    loading.value = false
  }
}

function save() {
  const k = input.value.trim()
  if (!k.startsWith('sk-or-')) {
    error.value = 'KEY MUST START WITH sk-or-'
    return
  }
  apiKey.value = k
  localStorage.setItem(STORAGE_KEY, k)
  load()
}

function forget() {
  localStorage.removeItem(STORAGE_KEY)
  apiKey.value = ''
  input.value = ''
  info.value = null
  credits.value = null
  error.value = ''
}

onMounted(() => {
  const k = localStorage.getItem(STORAGE_KEY)
  if (k) {
    apiKey.value = k
    load()
  }
})
</script>

<template>
  <div class="crt">
    <main class="wrap">
      <h1 class="glitch" data-text="OR//CREDITS">OR//CREDITS</h1>
      <p class="sub">// OPENROUTER BALANCE TERMINAL v1.0</p>

      <section v-if="!apiKey" class="panel">
        <label class="lbl" for="key">&gt; ENTER API KEY</label>
        <form class="row" @submit.prevent="save">
          <input id="key" v-model="input" type="password" placeholder="sk-or-v1-..." autocomplete="off" spellcheck="false">
          <button type="submit">CONNECT</button>
        </form>
        <p class="hint">KEY IS STORED ONLY IN YOUR BROWSER (localStorage) AND SENT ONLY TO openrouter.ai</p>
      </section>

      <section v-else class="panel">
        <div class="row between">
          <span class="lbl">&gt; KEY: <span class="cyan">{{ masked }}</span></span>
          <span class="row">
            <button :disabled="loading" @click="load">{{ loading ? 'LOADING' : 'REFRESH' }}</button>
            <button class="danger" @click="forget">FORGET</button>
          </span>
        </div>
      </section>

      <p v-if="error" class="err">!! {{ error }}</p>

      <template v-if="info">
        <section v-if="credits" class="panel">
          <p class="lbl">&gt; ACCOUNT CREDITS</p>
          <div class="stats">
            <div class="stat"><span>BOUGHT</span><b>{{ usd(credits.total_credits) }}</b></div>
            <div class="stat"><span>USED</span><b class="magenta">{{ usd(credits.total_usage) }}</b></div>
            <div class="stat"><span>LEFT</span><b class="cyan">{{ usd(remaining) }}</b></div>
          </div>
          <div class="bar" :title="usedPct + '% used'">
            <div class="fill" :style="{ width: usedPct + '%' }" />
          </div>
          <p class="hint">{{ usedPct }}% OF CREDITS BURNED</p>
        </section>

        <section class="panel">
          <p class="lbl">&gt; KEY INFO</p>
          <table>
            <tbody>
              <tr v-for="r in rows" :key="r.k">
                <td>{{ r.label }}</td>
                <td :class="{ cyan: MONEY.has(r.k) }">{{ r.value }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="updatedAt" class="hint">LAST SYNC {{ updatedAt.toLocaleTimeString() }}</p>
        </section>
      </template>

      <p v-else-if="loading" class="lbl blink">&gt; FETCHING DATA_</p>
    </main>
  </div>
</template>

<style>
:root {
  --bg: #07060f;
  --panel: #0e0c1d;
  --cyan: #00f0ff;
  --magenta: #ff2bd6;
  --yellow: #f7e017;
  --text: #d6d3ff;
  --dim: #6f6a9c;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--text); }
body { font-family: 'VT323', monospace; font-size: 22px; line-height: 1.3; }

.crt { min-height: 100vh; position: relative; overflow-x: hidden; }
.crt::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 2;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.25) 0 2px, transparent 2px 4px);
}
.crt::after {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.7));
}

.wrap { max-width: 720px; margin: 0 auto; padding: 48px 16px 64px; position: relative; z-index: 3; }

h1 {
  font-family: 'Press Start 2P', monospace; font-size: clamp(22px, 6vw, 40px);
  color: var(--cyan); margin: 0; letter-spacing: 2px; position: relative;
  text-shadow: 0 0 8px var(--cyan), 0 0 24px rgba(0,240,255,.4);
}
.glitch::before, .glitch::after {
  content: attr(data-text); position: absolute; inset: 0; opacity: .8;
}
.glitch::before { color: var(--magenta); animation: g1 3s infinite linear alternate-reverse; clip-path: inset(0 0 60% 0); }
.glitch::after { color: var(--yellow); animation: g2 2.5s infinite linear alternate-reverse; clip-path: inset(60% 0 0 0); }
@keyframes g1 { 0%,90%,100% { transform: none; } 92% { transform: translate(-3px,-1px); } 96% { transform: translate(3px,1px); } }
@keyframes g2 { 0%,88%,100% { transform: none; } 90% { transform: translate(3px,1px); } 94% { transform: translate(-3px,-2px); } }

.sub { color: var(--dim); margin: 8px 0 32px; }

.panel {
  background: var(--panel); padding: 20px; margin-bottom: 20px; position: relative;
  border: 2px solid var(--cyan);
  box-shadow: 4px 4px 0 var(--magenta), 0 0 20px rgba(0,240,255,.15);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
}

.lbl { font-family: 'Press Start 2P', monospace; font-size: 11px; color: var(--yellow); margin: 0 0 14px; display: block; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.between { justify-content: space-between; }
.between .lbl { margin: 0; }

input {
  flex: 1; min-width: 200px; background: #000; color: var(--cyan); border: 2px solid var(--dim);
  font: inherit; padding: 8px 12px; outline: none; letter-spacing: 1px;
}
input:focus { border-color: var(--cyan); box-shadow: 0 0 10px rgba(0,240,255,.4); }

button {
  font-family: 'Press Start 2P', monospace; font-size: 11px; cursor: pointer;
  background: var(--cyan); color: #000; border: 0; padding: 12px 16px;
  box-shadow: 3px 3px 0 var(--magenta); transition: transform .05s;
}
button:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 var(--magenta); }
button:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 var(--magenta); }
button:disabled { opacity: .5; cursor: wait; }
button.danger { background: var(--magenta); color: #fff; box-shadow: 3px 3px 0 var(--cyan); }

.hint { color: var(--dim); font-size: 17px; margin: 12px 0 0; }
.err { color: var(--magenta); border-left: 4px solid var(--magenta); padding-left: 12px; text-shadow: 0 0 8px var(--magenta); }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat { background: #000; padding: 12px; border: 1px solid var(--dim); }
.stat span { display: block; color: var(--dim); font-size: 16px; }
.stat b { font-size: 30px; font-weight: normal; text-shadow: 0 0 10px currentColor; }

.bar { height: 18px; background: #000; border: 2px solid var(--dim); padding: 2px; }
.fill {
  height: 100%; transition: width .6s steps(20);
  background: repeating-linear-gradient(90deg, var(--magenta) 0 8px, var(--cyan) 8px 16px);
  box-shadow: 0 0 10px var(--magenta);
}

table { width: 100%; border-collapse: collapse; }
td { padding: 8px 10px; border-bottom: 1px dashed #2a2650; }
td:first-child { color: var(--dim); width: 45%; }
td:last-child { text-align: right; word-break: break-all; }
tr:hover td { background: rgba(0,240,255,.05); }

.cyan { color: var(--cyan); }
.magenta { color: var(--magenta); }
.blink { animation: blink 1s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0; } }
</style>
