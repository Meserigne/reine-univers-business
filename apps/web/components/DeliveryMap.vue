<script setup lang="ts">
import type { OrderTracking } from '~/types/tracking'
import {
  DAKAR_CENTER,
  dakarMapOptions,
  fetchDrivingRoute,
  loadLeaflet,
  type MapHandles,
} from '~/composables/useLeafletMap'

const props = defineProps<{
  tracking: OrderTracking
  height?: string
}>()

const mapEl = ref<HTMLElement | null>(null)
const routeLabel = ref('')
let handles: MapHandles | null = null
let Lmod: Awaited<ReturnType<typeof loadLeaflet>> | null = null
let lastRouteKey = ''

function courierIcon(L: Awaited<ReturnType<typeof loadLeaflet>>) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:9999px;
      background:#0f766e;color:#fff;display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid #fff;
      font:700 13px/1 system-ui,sans-serif;letter-spacing:.02em;
    ">L</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function destIcon(L: Awaited<ReturnType<typeof loadLeaflet>>) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:9999px;
      background:#b91c1c;color:#fff;display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid #fff;
      font:700 12px/1 system-ui,sans-serif;
    ">C</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

async function ensureMap() {
  if (!import.meta.client || !mapEl.value) return null
  if (props.tracking.destLat == null || props.tracking.destLng == null) return null

  if (handles) return handles

  Lmod = await loadLeaflet()
  const L = Lmod
  const dest: [number, number] = [props.tracking.destLat, props.tracking.destLng]
  const store: [number, number] | null =
    props.tracking.storeLat != null && props.tracking.storeLng != null
      ? [props.tracking.storeLat, props.tracking.storeLng]
      : null

  const map = L.map(mapEl.value, { zoomControl: true, ...dakarMapOptions() })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap · OSRM — Dakar',
    maxZoom: 19,
  }).addTo(map)

  const destMarker = L.marker(dest, { icon: destIcon(L) })
    .addTo(map)
    .bindPopup('Chez le client')

  let storeMarker: MapHandles['storeMarker'] = null
  if (store) {
    storeMarker = L.circleMarker(store, {
      radius: 7,
      color: '#7f1d1d',
      fillColor: '#ef4444',
      fillOpacity: 0.95,
      weight: 2,
    })
      .addTo(map)
      .bindPopup('Magasin')
  }

  handles = {
    map,
    destMarker,
    storeMarker,
    courierMarker: null,
    routeLine: null,
  }

  setTimeout(() => map.invalidateSize(), 80)
  return handles
}

async function syncMap() {
  const h = await ensureMap()
  if (!h || !Lmod) return
  const L = Lmod
  const t = props.tracking
  if (t.destLat == null || t.destLng == null) return

  const dest: [number, number] = [t.destLat, t.destLng]
  h.destMarker.setLatLng(dest)

  const hasCourier = t.courierLat != null && t.courierLng != null
  const courier: [number, number] | null = hasCourier
    ? [t.courierLat!, t.courierLng!]
    : null
  const store: [number, number] | null =
    t.storeLat != null && t.storeLng != null ? [t.storeLat, t.storeLng] : null

  if (courier) {
    if (!h.courierMarker) {
      h.courierMarker = L.marker(courier, { icon: courierIcon(L) })
        .addTo(h.map)
        .bindPopup(t.courierName ? `${t.courierName} (en route)` : 'Livreur')
    } else {
      h.courierMarker.setLatLng(courier)
    }
  }

  const from = courier ?? store
  // Re-route only when origin/dest moves ~100m (avoid OSRM spam)
  const routeKey = from
    ? `${from[0].toFixed(3)},${from[1].toFixed(3)}>${dest[0].toFixed(3)},${dest[1].toFixed(3)}`
    : ''

  if (from && routeKey !== lastRouteKey) {
    lastRouteKey = routeKey
    const coords = await fetchDrivingRoute(from, dest)
    const latlngs = coords ?? [from, dest]
    if (h.routeLine) {
      h.routeLine.setLatLngs(latlngs)
    } else {
      h.routeLine = L.polyline(latlngs, {
        color: '#0f766e',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round',
      }).addTo(h.map)
    }
    routeLabel.value = coords
      ? courier
        ? 'Itinéraire livreur → client'
        : 'Itinéraire magasin → client'
      : 'Ligne directe (itinéraire indisponible)'

    const points: [number, number][] = [dest, ...latlngs]
    if (store) points.push(store)
    if (courier) points.push(courier)
    h.map.fitBounds(L.latLngBounds(points).pad(0.2))
  } else if (!from) {
    h.map.setView(dest ?? DAKAR_CENTER, 14)
  } else if (courier) {
    // Keep courier in view without re-fitting every tick
    const b = h.map.getBounds()
    if (!b.contains(courier)) {
      h.map.panTo(courier, { animate: true })
    }
  }
}

watch(
  () =>
    [
      props.tracking.destLat,
      props.tracking.destLng,
      props.tracking.storeLat,
      props.tracking.storeLng,
      props.tracking.courierLat,
      props.tracking.courierLng,
    ] as const,
  () => {
    void syncMap()
  },
)

onMounted(() => {
  void syncMap()
})

onUnmounted(() => {
  handles?.map.remove()
  handles = null
  lastRouteKey = ''
})
</script>

<template>
  <div v-if="tracking.destLat != null && tracking.destLng != null" class="space-y-2">
    <div
      ref="mapEl"
      class="w-full overflow-hidden rounded-2xl border border-line"
      :style="{ height: height || '240px' }"
    />
    <p v-if="routeLabel" class="text-center text-xs text-ink-muted">
      {{ routeLabel }}
      <span v-if="tracking.courierLive" class="text-emerald-700"> · livreur en direct</span>
    </p>
  </div>
</template>
