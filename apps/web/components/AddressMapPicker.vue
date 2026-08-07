<script setup lang="ts">
import { PhCrosshair, PhMapPin, PhSpinner } from '@phosphor-icons/vue'
import {
  DAKAR_CENTER,
  DAKAR_DEFAULT_ZOOM,
  DAKAR_LABEL,
  dakarMapOptions,
  isInDakar,
  loadLeaflet,
} from '~/composables/useLeafletMap'

const address = defineModel<string>('address', { required: true })
const destLat = defineModel<number | null>('destLat', { default: null })
const destLng = defineModel<number | null>('destLng', { default: null })

const mapEl = ref<HTMLElement | null>(null)
const locating = ref(false)
const error = ref('')

type LeafletMap = {
  setView: (c: [number, number], z: number) => void
  remove: () => void
  on: (e: string, fn: (ev: { latlng: { lat: number; lng: number } }) => void) => void
  invalidateSize: () => void
  setMaxBounds: (b: [[number, number], [number, number]]) => void
}
type LeafletMarker = {
  setLatLng: (c: [number, number]) => void
  getLatLng: () => { lat: number; lng: number }
}

let L: Awaited<ReturnType<typeof loadLeaflet>> | null = null
let map: LeafletMap | null = null
let marker: LeafletMarker | null = null

async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      'accept-language': 'fr',
      countrycodes: 'sn',
      zoom: '18',
    })}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return
    const data = (await res.json()) as {
      display_name?: string
      address?: {
        suburb?: string
        neighbourhood?: string
        quarter?: string
        road?: string
        city?: string
        town?: string
        state?: string
      }
    }
    const a = data.address
    if (a) {
      const parts = [
        a.road,
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || 'Dakar',
      ].filter(Boolean)
      const line = parts.join(', ')
      address.value = line.includes('Dakar') ? line : `${line}, Dakar`
      return
    }
    if (data.display_name) {
      const short = data.display_name.split(',').slice(0, 4).join(',').trim()
      address.value = short.includes('Dakar') ? short : `${short}, Dakar`
    }
  } catch {
    if (!address.value?.trim()) address.value = DAKAR_LABEL
  }
}

function setPin(lat: number, lng: number, reverse = true) {
  if (!isInDakar(lat, lng)) {
    error.value = 'Livraison uniquement dans la région de Dakar. Placez le pin sur Dakar.'
    return
  }
  error.value = ''
  destLat.value = lat
  destLng.value = lng
  if (map && marker) {
    marker.setLatLng([lat, lng])
    map.setView([lat, lng], 16)
  }
  if (reverse) void reverseGeocode(lat, lng)
}

async function initMap() {
  if (!import.meta.client || !mapEl.value || map) return
  L = await loadLeaflet()
  const start: [number, number] =
    destLat.value != null && destLng.value != null && isInDakar(destLat.value, destLng.value)
      ? [destLat.value, destLng.value]
      : DAKAR_CENTER

  map = L.map(mapEl.value, {
    ...dakarMapOptions(),
  }).setView(start, destLat.value != null ? 16 : DAKAR_DEFAULT_ZOOM) as unknown as LeafletMap

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap — Dakar',
    maxZoom: 19,
  }).addTo(map as never)

  const m = L.marker(start, { draggable: true }).addTo(map as never)
  marker = m as unknown as LeafletMarker
  m.on('dragend', () => {
    const { lat, lng } = m.getLatLng()
    setPin(lat, lng, true)
  })

  map.on('click', (e) => {
    setPin(e.latlng.lat, e.latlng.lng, true)
  })

  setTimeout(() => map?.invalidateSize(), 120)
}

async function useMyLocation() {
  error.value = ''
  if (!import.meta.client || !navigator.geolocation) {
    error.value = 'La géolocalisation n’est pas disponible sur cet appareil.'
    return
  }
  locating.value = true
  try {
    if (!map) await initMap()
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })
    const { latitude: lat, longitude: lng } = pos.coords
    if (!isInDakar(lat, lng)) {
      error.value =
        'Votre GPS n’est pas à Dakar. Placez le pin manuellement sur votre quartier à Dakar.'
      map?.setView(DAKAR_CENTER, DAKAR_DEFAULT_ZOOM)
      return
    }
    setPin(lat, lng, true)
  } catch (e: unknown) {
    const code = (e as GeolocationPositionError)?.code
    if (code === 1) {
      error.value = 'Autorisez la localisation dans votre navigateur pour partager votre position.'
    } else if (code === 3) {
      error.value = 'Délai dépassé. Réessayez à l’extérieur ou placez le pin sur Dakar.'
    } else {
      error.value = 'Impossible d’obtenir votre position. Placez le pin sur la carte de Dakar.'
    }
  } finally {
    locating.value = false
  }
}

function clearGps() {
  destLat.value = null
  destLng.value = null
  map?.setView(DAKAR_CENTER, DAKAR_DEFAULT_ZOOM)
  marker?.setLatLng(DAKAR_CENTER)
}

onMounted(() => {
  void initMap()
})

onUnmounted(() => {
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        :disabled="locating"
        @click="useMyLocation"
      >
        <PhSpinner v-if="locating" :size="14" class="animate-spin" weight="bold" />
        <PhCrosshair v-else :size="14" weight="bold" />
        {{ locating ? 'Détection…' : 'Ma position à Dakar' }}
      </button>
      <span
        v-if="destLat != null && destLng != null"
        class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
      >
        <PhMapPin :size="12" weight="fill" />
        GPS Dakar
        <button type="button" class="ml-1 underline" @click="clearGps">retirer</button>
      </span>
    </div>

    <p class="text-xs text-ink-muted">
      Carte centrée sur {{ DAKAR_LABEL }}. Activez le GPS ou déplacez le pin — livraison dans Dakar uniquement.
    </p>

    <div
      ref="mapEl"
      class="h-52 w-full overflow-hidden rounded-xl border border-line bg-canvas sm:h-64"
    />

    <p v-if="error" class="text-xs text-brand">{{ error }}</p>
    <p
      v-else-if="destLat != null && destLng != null"
      class="font-mono text-[11px] text-ink-muted"
    >
      {{ destLat.toFixed(6) }}, {{ destLng.toFixed(6) }} · Dakar
    </p>
  </div>
</template>
