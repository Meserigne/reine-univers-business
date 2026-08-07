<script setup lang="ts">
import type { AdminCourier, AdminZone } from '~/composables/useAdminApi'
import { formatPrice } from '~/types/catalog'

definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const tab = ref<'couriers' | 'zones' | 'settings'>('couriers')
const error = ref('')
const saving = ref(false)
const seeding = ref(false)

const [
  { data: couriers, pending: pendingCouriers, refresh: refreshCouriers },
  { data: zones, pending: pendingZones, refresh: refreshZones },
  { data: settings, pending: pendingSettings, refresh: refreshSettings },
] = await Promise.all([
  useAsyncData('admin-couriers', () => api.couriers()),
  useAsyncData('admin-zones', () => api.zones()),
  useAsyncData('admin-delivery-settings', () => api.deliverySettings()),
])

const showCourierForm = ref(false)
const editingCourier = ref<AdminCourier | null>(null)
const courierForm = reactive({
  name: '',
  phone: '',
  active: true,
  available: true,
  sortOrder: 0,
})

const showZoneForm = ref(false)
const editingZone = ref<AdminZone | null>(null)
const zoneForm = reactive({
  name: '',
  keywords: '',
  fee: 1000,
  durationMinutes: 25,
  prepMinutes: 8,
  active: true,
  sortOrder: 0,
})

const settingsForm = reactive({
  defaultPrepMinutes: 8,
  defaultDurationMinutes: 25,
  defaultFee: 1000,
  useMapsEstimate: true,
})

watch(
  settings,
  (s) => {
    if (!s) return
    Object.assign(settingsForm, {
      defaultPrepMinutes: s.defaultPrepMinutes,
      defaultDurationMinutes: s.defaultDurationMinutes,
      defaultFee: s.defaultFee,
      useMapsEstimate: s.useMapsEstimate,
    })
  },
  { immediate: true },
)

function openCourierCreate() {
  editingCourier.value = null
  Object.assign(courierForm, {
    name: '',
    phone: '',
    active: true,
    available: true,
    sortOrder: (couriers.value?.length ?? 0) + 1,
  })
  error.value = ''
  showCourierForm.value = true
}

function openCourierEdit(c: AdminCourier) {
  editingCourier.value = c
  Object.assign(courierForm, {
    name: c.name,
    phone: c.phone,
    active: c.active,
    available: c.available,
    sortOrder: c.sortOrder,
  })
  error.value = ''
  showCourierForm.value = true
}

async function saveCourier() {
  saving.value = true
  error.value = ''
  try {
    const body = {
      name: courierForm.name.trim(),
      phone: courierForm.phone.trim(),
      active: courierForm.active,
      available: courierForm.available,
      sortOrder: Number(courierForm.sortOrder),
    }
    if (editingCourier.value) {
      await api.updateCourier(editingCourier.value.id, body)
    } else {
      await api.createCourier(body)
    }
    showCourierForm.value = false
    await refreshCouriers()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur livreur'
  } finally {
    saving.value = false
  }
}

async function removeCourier(c: AdminCourier) {
  if (!confirm(`Supprimer le livreur « ${c.name} » ?`)) return
  try {
    await api.deleteCourier(c.id)
    await refreshCouriers()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Suppression impossible'
  }
}

async function toggleCourier(c: AdminCourier, field: 'active' | 'available') {
  await api.updateCourier(c.id, { [field]: !c[field] })
  await refreshCouriers()
}

function openZoneCreate() {
  editingZone.value = null
  Object.assign(zoneForm, {
    name: '',
    keywords: '',
    fee: 1000,
    durationMinutes: 25,
    prepMinutes: 8,
    active: true,
    sortOrder: (zones.value?.length ?? 0) + 1,
  })
  error.value = ''
  showZoneForm.value = true
}

function openZoneEdit(z: AdminZone) {
  editingZone.value = z
  Object.assign(zoneForm, {
    name: z.name,
    keywords: z.keywords,
    fee: z.fee,
    durationMinutes: z.durationMinutes,
    prepMinutes: z.prepMinutes,
    active: z.active,
    sortOrder: z.sortOrder,
  })
  error.value = ''
  showZoneForm.value = true
}

async function saveZone() {
  saving.value = true
  error.value = ''
  try {
    const body = {
      name: zoneForm.name.trim(),
      keywords: zoneForm.keywords.trim(),
      fee: Number(zoneForm.fee),
      durationMinutes: Number(zoneForm.durationMinutes),
      prepMinutes: Number(zoneForm.prepMinutes),
      active: zoneForm.active,
      sortOrder: Number(zoneForm.sortOrder),
    }
    if (editingZone.value) {
      await api.updateZone(editingZone.value.id, body)
    } else {
      await api.createZone(body)
    }
    showZoneForm.value = false
    await refreshZones()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur zone'
  } finally {
    saving.value = false
  }
}

async function removeZone(z: AdminZone) {
  if (!confirm(`Supprimer la zone « ${z.name} » ?`)) return
  try {
    await api.deleteZone(z.id)
    await refreshZones()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Suppression impossible'
  }
}

async function toggleZone(z: AdminZone) {
  await api.updateZone(z.id, { active: !z.active })
  await refreshZones()
}

async function saveSettings() {
  saving.value = true
  error.value = ''
  try {
    await api.updateDeliverySettings({
      defaultPrepMinutes: Number(settingsForm.defaultPrepMinutes),
      defaultDurationMinutes: Number(settingsForm.defaultDurationMinutes),
      defaultFee: Number(settingsForm.defaultFee),
      useMapsEstimate: settingsForm.useMapsEstimate,
    })
    await refreshSettings()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur paramètres'
  } finally {
    saving.value = false
  }
}

async function seedDefaults() {
  seeding.value = true
  error.value = ''
  try {
    await api.seedDelivery()
    await Promise.all([refreshCouriers(), refreshZones(), refreshSettings()])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Seed impossible'
  } finally {
    seeding.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Livraison</h1>
        <p class="mt-1 text-ink-muted">
          Livreurs, frais par zone et temps du compte à rebours
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-60"
        :disabled="seeding"
        @click="seedDefaults"
      >
        {{ seeding ? 'Chargement…' : 'Charger les données Dakar' }}
      </button>
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="t in [
          { id: 'couriers' as const, label: 'Livreurs' },
          { id: 'zones' as const, label: 'Zones & frais' },
          { id: 'settings' as const, label: 'Compte à rebours' },
        ]"
        :key="t.id"
        type="button"
        class="rounded-full px-3 py-1.5 text-sm font-medium"
        :class="tab === t.id ? 'bg-brand text-white' : 'border border-line bg-surface'"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
      {{ error }}
    </p>

    <!-- Livreurs -->
    <div v-if="tab === 'couriers'">
      <div class="mb-4 flex justify-end">
        <button
          type="button"
          class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          @click="openCourierCreate"
        >
          + Nouveau livreur
        </button>
      </div>
      <div v-if="pendingCouriers && !couriers" class="text-ink-muted">Chargement…</div>
      <p v-else-if="!couriers?.length" class="text-ink-muted">
        Aucun livreur.
        <button type="button" class="font-semibold text-brand hover:underline" @click="seedDefaults">
          Charger les livreurs par défaut
        </button>
      </p>
      <div v-else class="space-y-2">
        <article
          v-for="c in couriers"
          :key="c.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4"
        >
          <div>
            <p class="font-semibold">{{ c.name }}</p>
            <p class="text-sm text-ink-muted">
              {{ c.phone }}
              <span v-if="c._count"> · {{ c._count.orders }} commande(s)</span>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="c.active ? 'bg-emerald-50 text-emerald-800' : 'bg-canvas text-ink-muted'"
              @click="toggleCourier(c, 'active')"
            >
              {{ c.active ? 'Actif' : 'Inactif' }}
            </button>
            <button
              type="button"
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="c.available ? 'bg-sky-50 text-sky-800' : 'bg-amber-50 text-amber-800'"
              @click="toggleCourier(c, 'available')"
            >
              {{ c.available ? 'Disponible' : 'Occupé' }}
            </button>
            <button
              type="button"
              class="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
              @click="openCourierEdit(c)"
            >
              Modifier
            </button>
            <button
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand"
              @click="removeCourier(c)"
            >
              Supprimer
            </button>
          </div>
        </article>
      </div>
    </div>

    <!-- Zones -->
    <div v-else-if="tab === 'zones'">
      <div class="mb-4 flex justify-end">
        <button
          type="button"
          class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          @click="openZoneCreate"
        >
          + Nouvelle zone
        </button>
      </div>
      <p class="mb-4 text-sm text-ink-muted">
        Les mots-clés de l’adresse client déterminent la zone, les frais et le temps de livraison.
      </p>
      <div v-if="pendingZones && !zones" class="text-ink-muted">Chargement…</div>
      <p v-else-if="!zones?.length" class="text-ink-muted">Aucune zone configurée.</p>
      <div v-else class="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="border-b border-line text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th class="px-4 py-3 font-medium">Zone</th>
              <th class="px-4 py-3 font-medium">Mots-clés</th>
              <th class="px-4 py-3 font-medium">Frais</th>
              <th class="px-4 py-3 font-medium">Prépa</th>
              <th class="px-4 py-3 font-medium">Route</th>
              <th class="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="z in zones" :key="z.id" class="border-b border-line last:border-0">
              <td class="px-4 py-3">
                <p class="font-semibold">{{ z.name }}</p>
                <button
                  type="button"
                  class="mt-1 text-xs"
                  :class="z.active ? 'text-emerald-700' : 'text-ink-muted'"
                  @click="toggleZone(z)"
                >
                  {{ z.active ? 'Active' : 'Inactive' }}
                </button>
              </td>
              <td class="px-4 py-3 text-ink-muted">{{ z.keywords }}</td>
              <td class="px-4 py-3 font-medium">{{ formatPrice(z.fee) }}</td>
              <td class="px-4 py-3">{{ z.prepMinutes }} min</td>
              <td class="px-4 py-3">{{ z.durationMinutes }} min</td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="mr-2 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
                  @click="openZoneEdit(z)"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  class="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand"
                  @click="removeZone(z)"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Settings / countdown defaults -->
    <div v-else class="max-w-xl space-y-4 rounded-2xl border border-line bg-surface p-6">
      <p class="text-sm text-ink-muted">
        Valeurs utilisées si l’adresse ne correspond à aucune zone. Le compte à rebours d’une
        commande se contrôle aussi depuis Commandes.
      </p>
      <div v-if="pendingSettings && !settings" class="text-ink-muted">Chargement…</div>
      <form v-else class="space-y-4" @submit.prevent="saveSettings">
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Préparation par défaut (min)</span>
          <input
            v-model.number="settingsForm.defaultPrepMinutes"
            type="number"
            min="0"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Durée de route par défaut (min)</span>
          <input
            v-model.number="settingsForm.defaultDurationMinutes"
            type="number"
            min="1"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Frais de livraison par défaut</span>
          <input
            v-model.number="settingsForm.defaultFee"
            type="number"
            min="0"
            step="100"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="settingsForm.useMapsEstimate" type="checkbox" class="rounded" />
          Utiliser l’estimation Google Maps / distance quand disponible
        </label>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </form>
    </div>

    <!-- Courier modal -->
    <div v-if="showCourierForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" class="absolute inset-0 bg-ink/40" aria-label="Fermer" @click="showCourierForm = false" />
      <form
        class="relative z-10 w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="saveCourier"
      >
        <h2 class="font-display text-xl font-bold">
          {{ editingCourier ? 'Modifier le livreur' : 'Nouveau livreur' }}
        </h2>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nom</span>
          <input
            v-model="courierForm.name"
            required
            minlength="2"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Téléphone</span>
          <input
            v-model="courierForm.phone"
            required
            minlength="8"
            type="tel"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Ordre</span>
          <input
            v-model.number="courierForm.sortOrder"
            type="number"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <div class="flex gap-4 text-sm">
          <label class="flex items-center gap-2">
            <input v-model="courierForm.active" type="checkbox" /> Actif
          </label>
          <label class="flex items-center gap-2">
            <input v-model="courierForm.available" type="checkbox" /> Disponible
          </label>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="rounded-xl border border-line px-4 py-2 text-sm" @click="showCourierForm = false">
            Annuler
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>

    <!-- Zone modal -->
    <div v-if="showZoneForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" class="absolute inset-0 bg-ink/40" aria-label="Fermer" @click="showZoneForm = false" />
      <form
        class="relative z-10 max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="saveZone"
      >
        <h2 class="font-display text-xl font-bold">
          {{ editingZone ? 'Modifier la zone' : 'Nouvelle zone' }}
        </h2>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nom de la zone</span>
          <input
            v-model="zoneForm.name"
            required
            minlength="2"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Mots-clés (séparés par des virgules)</span>
          <textarea
            v-model="zoneForm.keywords"
            required
            minlength="2"
            rows="2"
            placeholder="ex: almadies, ngor, yoff"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Frais (F)</span>
            <input
              v-model.number="zoneForm.fee"
              type="number"
              min="0"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Prépa (min)</span>
            <input
              v-model.number="zoneForm.prepMinutes"
              type="number"
              min="0"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Route (min)</span>
            <input
              v-model.number="zoneForm.durationMinutes"
              type="number"
              min="1"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="zoneForm.active" type="checkbox" /> Zone active
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="rounded-xl border border-line px-4 py-2 text-sm" @click="showZoneForm = false">
            Annuler
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
