<script setup lang="ts">
import {
  PhCrosshair,
  PhMotorcycle,
  PhNavigationArrow,
  PhSpinner,
  PhMapPin,
} from '@phosphor-icons/vue'
import type { OrderTracking } from '~/types/tracking'

definePageMeta({ layout: 'default' })

const route = useRoute()
const orderId = computed(() => String(route.params.id || ''))
const { getOrderTracking, updateCourierLocation } = useApi()

const { data: initial, error } = await useAsyncData(
  `courier-track-${orderId.value}`,
  () => getOrderTracking(orderId.value),
)

const tracking = ref<OrderTracking | null>((initial.value as OrderTracking | null) ?? null)
const sharing = ref(false)
const shareError = ref('')
const lastSent = ref('')
let watchId: number | null = null
let poll: ReturnType<typeof setInterval> | null = null

useHead({
  title: 'Mode livreur — Reine Univers Business',
})

async function refresh() {
  try {
    tracking.value = await getOrderTracking(orderId.value)
  } catch {
    /* keep last */
  }
}

async function push(lat: number, lng: number) {
  try {
    tracking.value = await updateCourierLocation(orderId.value, {
      courierLat: lat,
      courierLng: lng,
    })
    lastSent.value = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())
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
    shareError.value = 'Géolocalisation indisponible sur cet appareil'
    return
  }
  sharing.value = true
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      void push(pos.coords.latitude, pos.coords.longitude)
    },
    (err) => {
      sharing.value = false
      shareError.value =
        err.code === 1
          ? 'Autorisez la localisation pour partager votre position.'
          : 'GPS indisponible. Réessayez à l’extérieur.'
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
  )
}

const done = computed(
  () =>
    tracking.value?.phase === 'delivered' || tracking.value?.phase === 'cancelled',
)

const navUrl = computed(
  () => tracking.value?.navigationUrl || tracking.value?.mapsUrl || null,
)

onMounted(() => {
  poll = setInterval(() => {
    if (!sharing.value && !done.value) void refresh()
  }, 10000)
})

onUnmounted(() => {
  if (poll) clearInterval(poll)
  stopSharing()
})

watch(done, (v) => {
  if (v) stopSharing()
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-surface">
      <div class="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="font-display text-lg font-bold">
          Mode <span class="text-brand">Livreur</span>
        </NuxtLink>
        <NuxtLink
          :to="`/suivi/${orderId}`"
          class="text-sm font-medium text-ink-muted hover:text-brand"
        >
          Voir suivi client
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto max-w-lg space-y-5 px-4 py-8">
      <div v-if="error || !tracking" class="rounded-2xl bg-brand-soft p-6 text-center text-brand-dark">
        Commande introuvable.
      </div>

      <template v-else>
        <div class="rounded-3xl border border-line bg-surface p-6">
          <div class="flex items-start gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
              <PhMotorcycle :size="24" weight="fill" />
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Livraison</p>
              <p class="font-display text-xl font-bold">{{ tracking.customerName }}</p>
              <p class="mt-1 text-sm text-ink-muted">{{ tracking.address }}</p>
              <p v-if="tracking.courierName" class="mt-1 text-sm">
                Livreur : <span class="font-semibold">{{ tracking.courierName }}</span>
              </p>
            </div>
          </div>
        </div>

        <ClientOnly>
          <DeliveryMap :tracking="tracking" height="280px" />
        </ClientOnly>

        <div class="rounded-3xl border border-line bg-surface p-6">
          <p class="font-semibold">Partager ma position GPS</p>
          <p class="mt-1 text-sm text-ink-muted">
            Le client voit votre trajet en direct sur la carte jusqu’à son adresse.
          </p>

          <div v-if="!done" class="mt-4 flex flex-wrap gap-2">
            <button
              v-if="!sharing"
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white"
              @click="startSharing"
            >
              <PhCrosshair :size="16" weight="bold" />
              Démarrer le suivi live
            </button>
            <button
              v-else
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              @click="stopSharing"
            >
              <PhSpinner :size="16" class="animate-spin" weight="bold" />
              En direct — arrêter
            </button>
          </div>
          <p v-else class="mt-3 text-sm text-ink-muted">Commande terminée.</p>

          <p v-if="shareError" class="mt-2 text-sm text-brand">{{ shareError }}</p>
          <p v-else-if="lastSent" class="mt-2 text-xs text-emerald-700">
            Position envoyée à {{ lastSent }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <a
            v-if="navUrl"
            :href="navUrl"
            target="_blank"
            rel="noreferrer"
            class="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
          >
            <PhNavigationArrow :size="18" weight="fill" />
            Naviguer vers le client (Google Maps)
          </a>
          <a
            v-if="tracking.phone"
            :href="`tel:${tracking.phone}`"
            class="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-3 text-sm font-semibold"
          >
            <PhMapPin :size="16" weight="fill" />
            Appeler {{ tracking.phone }}
          </a>
        </div>
      </template>
    </main>
  </div>
</template>
