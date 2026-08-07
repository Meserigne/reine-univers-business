<script setup lang="ts">
import type { OrderTracking } from '~/types/tracking'

const props = defineProps<{
  tracking: OrderTracking
  size?: number
}>()

const size = computed(() => props.size ?? 220)
const stroke = 10
const radius = computed(() => (size.value - stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const localRemaining = ref(props.tracking.remainingSeconds)

watch(
  () => props.tracking.remainingSeconds,
  (v) => {
    localRemaining.value = v
  },
)

let tick: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  tick = setInterval(() => {
    if (localRemaining.value > 0 && props.tracking.phase !== 'delivered') {
      localRemaining.value -= 1
    }
  }, 1000)
})
onUnmounted(() => {
  if (tick) clearInterval(tick)
})

const displayRemaining = computed(() =>
  props.tracking.phase === 'delivered' ? 0 : Math.max(0, localRemaining.value),
)

const progress = computed(() => {
  if (props.tracking.phase === 'delivered') return 1
  const total =
    (props.tracking.prepSeconds + (props.tracking.durationSeconds ?? 0)) || 1
  return Math.min(1, Math.max(0, (total - displayRemaining.value) / total))
})

const dashOffset = computed(
  () => circumference.value * (1 - progress.value),
)

function formatClock(totalSec: number) {
  const s = Math.max(0, totalSec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const statusLabel = computed(() => {
  if (props.tracking.phase === 'delivered') return 'Livré'
  if (props.tracking.phase === 'cancelled') return 'Annulé'
  if (props.tracking.phase === 'preparing') return 'Préparation'
  return 'En route'
})
</script>

<template>
  <div class="relative mx-auto" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg
      :width="size"
      :height="size"
      class="-rotate-90"
      :aria-label="`Temps restant ${formatClock(displayRemaining)}`"
    >
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="currentColor"
        class="text-line"
        :stroke-width="stroke"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="currentColor"
        class="text-brand transition-[stroke-dashoffset] duration-1000 ease-linear"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {{ statusLabel }}
      </p>
      <p class="mt-1 font-display text-4xl font-bold tabular-nums tracking-tight">
        {{ tracking.phase === 'delivered' ? '00:00' : formatClock(displayRemaining) }}
      </p>
      <p class="mt-1 text-xs text-ink-muted">
        {{ tracking.phase === 'delivered' ? 'Bon appétit' : 'estimé restant' }}
      </p>
    </div>
  </div>
</template>
