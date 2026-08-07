<script setup lang="ts">
import {
  PhMapPin,
  PhMotorcycle,
  PhNavigationArrow,
  PhPhone,
  PhPath,
  PhCrosshair,
  PhSpinner,
} from '@phosphor-icons/vue'
import type { OrderTracking } from '~/types/tracking'

const props = defineProps<{
  orderId: string
  initial?: OrderTracking | null
  compact?: boolean
}>()

const { getOrderTracking, updateOrderLocation, trackingStreamUrl } = useApi()

const tracking = ref<OrderTracking | null>(props.initial ?? null)
const error = ref('')
const loading = ref(!props.initial)
const sharing = ref(false)
const shareError = ref('')
let watchId: number | null = null
let es: EventSource | null = null

async function refresh() {
  try {
    tracking.value = await getOrderTracking(props.orderId)
    error.value = ''
  } catch {
    error.value = 'Impossible de charger le suivi'
  } finally {
    loading.value = false
  }
}

async function pushLocation(lat: number, lng: number) {
  try {
    tracking.value = await updateOrderLocation(props.orderId, {
      destLat: lat,
      destLng: lng,
    })
    shareError.value = ''
  } catch {
    shareError.value = 'Envoi de la position impossible'
  }
}

function stopSharing() {
  sharing.value = false
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

function startSharing() {
  shareError.value = ''
  if (!import.meta.client || !navigator.geolocation) {
    shareError.value = 'Géolocalisation indisponible'
    return
  }
  sharing.value = true
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      void pushLocation(pos.coords.latitude, pos.coords.longitude)
    },
    (err) => {
      sharing.value = false
      shareError.value =
        err.code === 1
          ? 'Autorisez la localisation pour que le livreur vous trouve.'
          : 'Impossible de suivre votre position.'
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  )
}

const canShareLive = computed(
  () =>
    tracking.value &&
    tracking.value.phase !== 'delivered' &&
    tracking.value.phase !== 'cancelled',
)

let poll: ReturnType<typeof setInterval> | null = null
function startPoll() {
  if (poll) clearInterval(poll)
  // Fallback poll if SSE unavailable
  const ms = tracking.value?.courierLive ? 5000 : 10000
  poll = setInterval(() => {
    if (tracking.value?.phase === 'delivered' || tracking.value?.phase === 'cancelled') {
      return
    }
    if (!sharing.value && !es) void refresh()
  }, ms)
}

function startLiveStream() {
  if (!import.meta.client || typeof EventSource === 'undefined') return
  try {
    es?.close()
    es = new EventSource(trackingStreamUrl(props.orderId))
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as {
          payload?: OrderTracking
        }
        if (data.payload?.id) tracking.value = data.payload
      } catch {
        /* ignore */
      }
    }
    es.onerror = () => {
      es?.close()
      es = null
      startPoll()
    }
  } catch {
    startPoll()
  }
}

onMounted(async () => {
  if (!props.initial) await refresh()
  startLiveStream()
  startPoll()
})
onUnmounted(() => {
  if (poll) clearInterval(poll)
  es?.close()
  es = null
  stopSharing()
})

watch(
  () => tracking.value?.courierLive,
  () => startPoll(),
)

watch(
  () => props.initial,
  (v) => {
    if (v) tracking.value = v
  },
)

watch(
  () => tracking.value?.phase,
  (phase) => {
    if (phase === 'delivered' || phase === 'cancelled') stopSharing()
  },
)

const arrivalLabel = computed(() => {
  if (!tracking.value?.estimatedArrivalAt) return null
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(tracking.value.estimatedArrivalAt))
})

const phaseText = computed(() => {
  const t = tracking.value
  if (!t) return ''
  if (t.phase === 'delivered') return 'Votre commande a été livrée.'
  if (t.phase === 'cancelled') return 'Cette commande a été annulée.'
  if (t.phase === 'preparing')
    return 'Votre commande est en préparation. Le livreur partira juste après.'
  return `${t.courierName ?? 'Le livreur'} est en route vers vous.`
})

const courierNavUrl = computed(
  () => tracking.value?.navigationUrl || tracking.value?.mapsUrl || null,
)

const etaLabel = computed(() => {
  const src = tracking.value?.etaSource
  if (src === 'gps') return 'position GPS du client'
  if (src === 'google') return 'via Google Maps (temps réel trafic)'
  if (src === 'zone') return 'selon la zone de livraison'
  return 'estimée selon la distance'
})
</script>

<template>
  <div v-if="loading" class="py-10 text-center text-ink-muted">Chargement du suivi…</div>
  <div v-else-if="error && !tracking" class="py-10 text-center text-brand">{{ error }}</div>
  <div v-else-if="tracking" class="space-y-6">
    <DeliveryCountdown :tracking="tracking" :size="compact ? 180 : 220" />

    <div class="text-center">
      <p class="font-display text-lg font-semibold">{{ phaseText }}</p>
      <p v-if="arrivalLabel && tracking.phase !== 'delivered'" class="mt-1 text-sm text-ink-muted">
        Arrivée estimée vers {{ arrivalLabel }}
      </p>
    </div>

    <ol
      v-if="tracking.steps?.length"
      class="grid gap-2 rounded-2xl border border-line bg-canvas p-4 sm:grid-cols-4"
    >
      <li
        v-for="(step, idx) in tracking.steps"
        :key="step.key"
        class="flex items-start gap-2 text-left"
      >
        <span
          class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          :class="step.done ? 'bg-brand text-white' : 'bg-line text-ink-muted'"
        >
          {{ idx + 1 }}
        </span>
        <span>
          <span class="block text-xs font-semibold" :class="step.done ? 'text-ink' : 'text-ink-muted'">
            {{ step.label }}
          </span>
          <span v-if="step.at" class="block text-[10px] text-ink-muted">
            {{ new Date(step.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </span>
      </li>
    </ol>

    <p
      v-if="tracking.courierLive"
      class="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-800"
    >
      GPS livreur actif — suivi en temps réel
    </p>

    <ClientOnly>
      <DeliveryMap
        v-if="tracking.destLat != null"
        :tracking="tracking"
        :height="compact ? '180px' : '240px'"
      />
    </ClientOnly>

    <div
      v-if="canShareLive"
      class="rounded-2xl border border-line bg-canvas p-4"
    >
      <p class="text-sm font-semibold">Partager ma position au livreur</p>
      <p class="mt-1 text-xs text-ink-muted">
        Activez le GPS en direct pour que le livreur suive exactement jusqu’à chez vous.
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-if="!sharing"
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
          @click="startSharing"
        >
          <PhCrosshair :size="14" weight="bold" />
          Activer le GPS live
        </button>
        <button
          v-else
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
          @click="stopSharing"
        >
          <PhSpinner :size="14" class="animate-spin" weight="bold" />
          Position partagée — arrêter
        </button>
      </div>
      <p v-if="shareError" class="mt-2 text-xs text-brand">{{ shareError }}</p>
      <p v-else-if="tracking.hasGps" class="mt-2 text-xs text-emerald-700">
        Position GPS enregistrée pour le livreur.
      </p>
    </div>

    <div class="grid gap-3 rounded-2xl border border-line bg-canvas p-4">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <PhMotorcycle :size="20" weight="fill" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Livreur</p>
          <p class="font-display text-lg font-bold">
            {{ tracking.courierName || 'Attribution en cours…' }}
          </p>
          <a
            v-if="tracking.courierPhone"
            :href="`tel:${tracking.courierPhone}`"
            class="mt-0.5 inline-flex items-center gap-1 text-sm text-brand hover:underline"
          >
            <PhPhone :size="14" weight="fill" />
            {{ tracking.courierPhone }}
          </a>
        </div>
      </div>

      <div class="h-px bg-line" />

      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand">
          <PhPath :size="20" weight="duotone" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Distance</p>
          <p class="font-semibold">
            {{ tracking.distanceLabel || 'Calcul…' }}
            <span v-if="tracking.durationSeconds" class="font-normal text-ink-muted">
              · ~{{ Math.max(1, Math.round(tracking.durationSeconds / 60)) }} min de route
            </span>
          </p>
          <p class="mt-0.5 text-xs text-ink-muted">ETA {{ etaLabel }}</p>
          <p v-if="tracking.zoneName" class="mt-0.5 text-xs text-ink-muted">
            Zone {{ tracking.zoneName }}
            <span v-if="tracking.deliveryFee">
              · frais {{ tracking.deliveryFee.toLocaleString('fr-FR') }} F
            </span>
          </p>
        </div>
      </div>

      <div class="h-px bg-line" />

      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand">
          <PhMapPin :size="20" weight="duotone" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Livraison à</p>
          <p class="font-semibold leading-snug">{{ tracking.address }}</p>
          <p
            v-if="tracking.destLat != null && tracking.destLng != null"
            class="mt-0.5 font-mono text-[11px] text-ink-muted"
          >
            {{ tracking.destLat.toFixed(5) }}, {{ tracking.destLng.toFixed(5) }}
          </p>
        </div>
      </div>
    </div>

    <a
      v-if="courierNavUrl"
      :href="courierNavUrl"
      target="_blank"
      rel="noreferrer"
      class="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
    >
      <PhNavigationArrow :size="18" weight="fill" />
      {{ tracking.hasGps ? 'Navigation GPS vers le client' : 'Itinéraire Google Maps' }}
    </a>

    <NuxtLink
      v-if="canShareLive"
      :to="`/livreur/${tracking.id}`"
      class="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-line px-4 py-3 text-sm font-semibold text-ink-muted hover:border-brand hover:text-brand"
    >
      <PhMotorcycle :size="18" weight="fill" />
      Mode livreur (GPS live)
    </NuxtLink>

    <NuxtLink
      :to="`/facture/${tracking.id}`"
      class="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-brand"
    >
      Voir / imprimer la facture
      <span v-if="tracking.invoiceNumber" class="font-mono text-xs opacity-80">
        {{ tracking.invoiceNumber }}
      </span>
    </NuxtLink>

    <p class="text-center text-xs text-ink-muted">
      Commande n° {{ tracking.id.slice(-8).toUpperCase() }}
    </p>
  </div>
</template>
