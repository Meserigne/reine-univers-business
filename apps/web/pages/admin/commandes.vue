<script setup lang="ts">
import { PhPlus, PhMinus, PhTrash } from '@phosphor-icons/vue'
import type { AdminCourier, AdminOrder, AdminProduct } from '~/composables/useAdminApi'
import { formatPrice } from '~/types/catalog'

definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const [
  { data: orders, pending, refresh },
  { data: products },
  { data: couriers },
] = await Promise.all([
  useAsyncData('admin-orders', () => api.orders()),
  useAsyncData('admin-products-for-orders', () => api.products()),
  useAsyncData('admin-couriers-for-orders', () => api.couriers()),
])

const activeCouriers = computed(() =>
  ((couriers.value as AdminCourier[] | null) ?? []).filter((c) => c.active),
)

const statusFilter = ref('ALL')
const expanded = ref<string | null>(null)
const error = ref('')
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const createdLinks = ref<{ id: string; invoiceNumber?: string | null } | null>(null)

const statuses = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'PREPARING', label: 'Préparation' },
  { id: 'OUT_FOR_DELIVERY', label: 'En livraison' },
  { id: 'CONFIRMED', label: 'Confirmées' },
  { id: 'DELIVERED', label: 'Livrées' },
  { id: 'CANCELLED', label: 'Annulées' },
] as const

const form = reactive({
  customerName: '',
  phone: '',
  address: '',
  note: '',
})

type Line = { productId: string; quantity: number }
const lines = ref<Line[]>([{ productId: '', quantity: 1 }])

const activeProducts = computed(() =>
  ((products.value as AdminProduct[] | null) ?? []).filter((p) => p.active),
)

const formTotal = computed(() =>
  lines.value.reduce((sum, line) => {
    const p = activeProducts.value.find((x) => x.id === line.productId)
    if (!p || line.quantity < 1) return sum
    return sum + p.price * line.quantity
  }, 0),
)

const filtered = computed(() => {
  if (!orders.value) return []
  if (statusFilter.value === 'ALL') return orders.value
  return orders.value.filter((o) => o.status === statusFilter.value)
})

const statusLabel: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'Préparation',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
}

const statusClass: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  CONFIRMED: 'bg-sky-50 text-sky-800',
  PREPARING: 'bg-orange-50 text-orange-800',
  OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-800',
  DELIVERED: 'bg-emerald-50 text-emerald-800',
  CANCELLED: 'bg-canvas text-ink-muted',
}

function openCreate() {
  Object.assign(form, { customerName: '', phone: '', address: '', note: '' })
  lines.value = [
    {
      productId: activeProducts.value[0]?.id ?? '',
      quantity: 1,
    },
  ]
  formError.value = ''
  createdLinks.value = null
  error.value = ''
  showForm.value = true
}

function addLine() {
  lines.value.push({
    productId: activeProducts.value[0]?.id ?? '',
    quantity: 1,
  })
}

function removeLine(index: number) {
  if (lines.value.length <= 1) return
  lines.value.splice(index, 1)
}

function productLabel(id: string) {
  const p = activeProducts.value.find((x) => x.id === id)
  return p ? `${p.name} — ${formatPrice(p.price)} / ${p.unit}` : id
}

async function saveOrder() {
  saving.value = true
  formError.value = ''
  createdLinks.value = null
  try {
    const items = lines.value
      .filter((l) => l.productId && l.quantity > 0)
      .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) }))

    if (!items.length) {
      formError.value = 'Ajoutez au moins un produit'
      return
    }

    const result = (await api.createOrder({
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      note: form.note.trim() || undefined,
      items,
    })) as { id: string; invoiceNumber?: string | null }

    createdLinks.value = {
      id: result.id,
      invoiceNumber: result.invoiceNumber,
    }
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    formError.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Impossible de créer la commande'
  } finally {
    saving.value = false
  }
}

async function setStatus(order: AdminOrder, status: AdminOrder['status']) {
  error.value = ''
  try {
    await api.updateOrderStatus(order.id, status)
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Mise à jour impossible'
  }
}

async function patchTracking(
  order: AdminOrder,
  body: Parameters<typeof api.updateOrderTracking>[1],
) {
  error.value = ''
  try {
    await api.updateOrderTracking(order.id, body)
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Mise à jour du suivi impossible'
  }
}

function arrivalLabel(order: AdminOrder) {
  if (!order.estimatedArrivalAt) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(order.estimatedArrivalAt))
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Commandes</h1>
        <p class="mt-1 text-ink-muted">Création manuelle, suivi et facturation</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-canvas"
          @click="refresh()"
        >
          Actualiser
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          @click="openCreate"
        >
          <PhPlus :size="16" weight="bold" />
          Nouvelle commande
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="s in statuses"
        :key="s.id"
        type="button"
        class="rounded-full px-3 py-1.5 text-sm font-medium"
        :class="statusFilter === s.id ? 'bg-brand text-white' : 'border border-line bg-surface'"
        @click="statusFilter = s.id"
      >
        {{ s.label }}
      </button>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
      {{ error }}
    </p>

    <div v-if="pending && !orders" class="text-ink-muted">Chargement…</div>
    <p v-else-if="!filtered.length" class="text-ink-muted">
      Aucune commande.
      <button type="button" class="ml-1 font-semibold text-brand hover:underline" @click="openCreate">
        Créer une commande manuelle
      </button>
    </p>

    <div v-else class="space-y-3">
      <article
        v-for="order in filtered"
        :key="order.id"
        class="rounded-2xl border border-line bg-surface"
      >
        <button
          type="button"
          class="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
          @click="expanded = expanded === order.id ? null : order.id"
        >
          <div>
            <p class="font-semibold">{{ order.customerName }}</p>
            <p class="text-sm text-ink-muted">
              <span v-if="order.invoiceNumber" class="font-mono text-brand">{{ order.invoiceNumber }}</span>
              <span v-if="order.invoiceNumber"> · </span>
              {{ order.phone }} · {{ formatDate(order.createdAt) }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="statusClass[order.status]"
            >
              {{ statusLabel[order.status] }}
            </span>
            <span class="font-display font-bold">{{ formatPrice(order.total) }}</span>
          </div>
        </button>

        <div v-if="expanded === order.id" class="border-t border-line px-5 py-4">
          <p class="text-sm"><span class="text-ink-muted">Adresse :</span> {{ order.address }}</p>
          <p v-if="order.note" class="mt-1 text-sm"><span class="text-ink-muted">Note :</span> {{ order.note }}</p>
          <p v-if="order.zoneName" class="mt-1 text-sm">
            <span class="text-ink-muted">Zone :</span> {{ order.zoneName }}
            <span v-if="order.deliveryFee != null">
              · Livraison {{ formatPrice(order.deliveryFee) }}
            </span>
          </p>
          <p v-if="order.courierName" class="mt-1 text-sm">
            <span class="text-ink-muted">Livreur :</span> {{ order.courierName }}
          </p>
          <ul class="mt-3 space-y-1 text-sm">
            <li v-for="item in order.items" :key="item.id" class="flex justify-between">
              <span>{{ item.quantity }}× {{ item.productName }}</span>
              <span>{{ formatPrice(item.unitPrice * item.quantity) }}</span>
            </li>
          </ul>

          <div
            v-if="order.status !== 'CANCELLED'"
            class="mt-4 rounded-xl border border-line bg-canvas p-3"
          >
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Compte à rebours
            </p>
            <p class="mb-3 text-sm">
              Arrivée estimée :
              <span class="font-semibold">{{ arrivalLabel(order) }}</span>
              <span v-if="order.prepSeconds != null || order.durationSeconds" class="text-ink-muted">
                · prépa {{ Math.round((order.prepSeconds || 0) / 60) }} min
                · route {{ Math.round((order.durationSeconds || 0) / 60) }} min
              </span>
            </p>
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <label class="text-xs text-ink-muted">Livreur</label>
              <select
                class="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
                :value="order.courierId || ''"
                @change="
                  patchTracking(order, {
                    courierId: ($event.target as HTMLSelectElement).value || undefined,
                  })
                "
              >
                <option value="">— Choisir —</option>
                <option v-for="c in activeCouriers" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold"
                @click="patchTracking(order, { addMinutes: -5 })"
              >
                −5 min
              </button>
              <button
                type="button"
                class="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold"
                @click="patchTracking(order, { addMinutes: 5 })"
              >
                +5 min
              </button>
              <button
                type="button"
                class="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold"
                @click="patchTracking(order, { addMinutes: 10 })"
              >
                +10 min
              </button>
              <button
                type="button"
                class="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                @click="patchTracking(order, { markDeparted: true })"
              >
                Départ livreur
              </button>
              <button
                type="button"
                class="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                @click="patchTracking(order, { markArrived: true })"
              >
                Arrivée
              </button>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <NuxtLink
              :to="`/facture/${order.id}`"
              target="_blank"
              class="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white"
            >
              Voir la facture
            </NuxtLink>
            <NuxtLink
              :to="`/suivi/${order.id}`"
              target="_blank"
              class="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
            >
              Suivi livraison
            </NuxtLink>
            <NuxtLink
              :to="order.livreurPath || `/livreur/${order.id}`"
              target="_blank"
              class="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-teal-800"
            >
              Mode livreur GPS
            </NuxtLink>
            <button
              v-for="s in (['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const)"
              :key="s"
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-semibold"
              :class="
                order.status === s
                  ? 'bg-ink text-white'
                  : 'border border-line hover:bg-canvas'
              "
              @click="setStatus(order, s)"
            >
              {{ statusLabel[s] }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Manual order modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        class="absolute inset-0 bg-ink/40"
        aria-label="Fermer"
        @click="showForm = false"
      />
      <div
        class="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
      >
        <div v-if="createdLinks" class="py-4 text-center">
          <p class="font-display text-xl font-bold text-emerald-700">Commande créée</p>
          <p v-if="createdLinks.invoiceNumber" class="mt-2 font-mono text-sm text-brand">
            {{ createdLinks.invoiceNumber }}
          </p>
          <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <NuxtLink
              :to="`/facture/${createdLinks.id}`"
              target="_blank"
              class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              Voir la facture
            </NuxtLink>
            <NuxtLink
              :to="`/suivi/${createdLinks.id}`"
              target="_blank"
              class="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              Suivi livraison
            </NuxtLink>
            <button
              type="button"
              class="rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
              @click="openCreate"
            >
              Nouvelle commande
            </button>
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-muted"
              @click="showForm = false"
            >
              Fermer
            </button>
          </div>
        </div>

        <form v-else class="space-y-5" @submit.prevent="saveOrder">
          <h2 class="font-display text-xl font-bold">Nouvelle commande manuelle</h2>
          <p class="text-sm text-ink-muted">
            Pour les commandes téléphone / WhatsApp. Facture et suivi créés automatiquement.
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm sm:col-span-2">
              <span class="mb-1 block font-medium">Nom du client</span>
              <input
                v-model="form.customerName"
                required
                minlength="2"
                class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
              />
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium">Téléphone</span>
              <input
                v-model="form.phone"
                required
                minlength="8"
                type="tel"
                class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
              />
            </label>
            <label class="block text-sm sm:col-span-2">
              <span class="mb-1 block font-medium">Adresse de livraison</span>
              <textarea
                v-model="form.address"
                required
                minlength="5"
                rows="2"
                class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
              />
            </label>
            <label class="block text-sm sm:col-span-2">
              <span class="mb-1 block font-medium">Note (optionnel)</span>
              <input
                v-model="form.note"
                class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
              />
            </label>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <p class="text-sm font-semibold">Articles</p>
              <button
                type="button"
                class="text-sm font-medium text-brand hover:underline"
                @click="addLine"
              >
                + Ajouter un produit
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(line, index) in lines"
                :key="index"
                class="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-canvas p-2"
              >
                <select
                  v-model="line.productId"
                  required
                  class="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-brand"
                >
                  <option disabled value="">Choisir un produit</option>
                  <option
                    v-for="p in activeProducts"
                    :key="p.id"
                    :value="p.id"
                  >
                    {{ productLabel(p.id) }}
                  </option>
                </select>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-surface"
                    @click="line.quantity = Math.max(1, line.quantity - 1)"
                  >
                    <PhMinus :size="14" weight="bold" />
                  </button>
                  <input
                    v-model.number="line.quantity"
                    type="number"
                    min="1"
                    class="w-14 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-sm"
                  />
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-surface"
                    @click="line.quantity += 1"
                  >
                    <PhPlus :size="14" weight="bold" />
                  </button>
                </div>
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-brand"
                  :disabled="lines.length <= 1"
                  @click="removeLine(index)"
                >
                  <PhTrash :size="16" />
                </button>
              </div>
            </div>
            <p class="mt-3 text-right font-display text-lg font-bold">
              Total : {{ formatPrice(formTotal) }}
            </p>
          </div>

          <p v-if="formError" class="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl border border-line px-4 py-2 text-sm font-medium"
              @click="showForm = false"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="saving || !activeProducts.length"
              class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {{ saving ? 'Création…' : 'Créer la commande' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
