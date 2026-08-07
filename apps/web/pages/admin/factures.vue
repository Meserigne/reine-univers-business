<script setup lang="ts">
import { PhMagnifyingGlass, PhReceipt, PhPrinter } from '@phosphor-icons/vue'
import { formatPrice } from '~/types/catalog'

definePageMeta({ layout: 'admin' })

type InvoiceRow = {
  id: string
  invoiceNumber: string | null
  customerName: string
  phone: string
  address: string
  status: string
  total: number
  itemCount: number
  createdAt: string
  courierName: string | null
}

const api = useAdminApi()
const { data: invoices, pending, refresh } = await useAsyncData('admin-invoices', () =>
  api.invoices(),
)

const search = ref('')
const statusFilter = ref('ALL')

const filtered = computed(() => {
  let list = (invoices.value as InvoiceRow[] | null) ?? []
  if (statusFilter.value !== 'ALL') {
    list = list.filter((i) => i.status === statusFilter.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (i) =>
        (i.invoiceNumber ?? '').toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.phone.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q),
    )
  }
  return list
})

const revenue = computed(() =>
  filtered.value
    .filter((i) => i.status === 'CONFIRMED' || i.status === 'DELIVERED')
    .reduce((s, i) => s + i.total, 0),
)

const statusLabel: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
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
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Facturation</h1>
        <p class="mt-1 text-ink-muted">
          {{ filtered.length }} facture{{ filtered.length > 1 ? 's' : '' }}
          · CA filtré {{ formatPrice(revenue) }}
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-canvas"
        @click="refresh()"
      >
        Actualiser
      </button>
    </div>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row">
      <label class="relative block min-w-0 flex-1">
        <PhMagnifyingGlass
          :size="18"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          v-model="search"
          type="search"
          placeholder="N° facture, client, téléphone…"
          class="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand"
        />
      </label>
      <select
        v-model="statusFilter"
        class="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
      >
        <option value="ALL">Tous les statuts</option>
        <option value="CONFIRMED">Confirmées</option>
        <option value="DELIVERED">Livrées</option>
        <option value="PENDING">En attente</option>
      </select>
    </div>

    <div v-if="pending && !invoices" class="text-ink-muted">Chargement…</div>

    <div
      v-else-if="!filtered.length"
      class="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center"
    >
      <PhReceipt :size="40" class="mx-auto text-ink-muted" />
      <p class="mt-3 font-display text-lg font-semibold">Aucune facture</p>
      <p class="mt-1 text-sm text-ink-muted">
        Les factures sont créées automatiquement à chaque commande.
      </p>
    </div>

    <div v-else class="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table class="w-full min-w-[880px] text-left text-sm">
        <thead class="border-b border-line bg-canvas text-ink-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Facture</th>
            <th class="px-4 py-3 font-medium">Client</th>
            <th class="px-4 py-3 font-medium">Date</th>
            <th class="px-4 py-3 font-medium">Articles</th>
            <th class="px-4 py-3 font-medium">Statut</th>
            <th class="px-4 py-3 font-medium">Total</th>
            <th class="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="inv in filtered"
            :key="inv.id"
            class="border-b border-line last:border-0 hover:bg-canvas/60"
          >
            <td class="px-4 py-3">
              <p class="font-mono text-xs font-semibold text-brand">
                {{ inv.invoiceNumber || '—' }}
              </p>
              <p class="text-[11px] text-ink-muted">{{ inv.id.slice(-8).toUpperCase() }}</p>
            </td>
            <td class="px-4 py-3">
              <p class="font-semibold">{{ inv.customerName }}</p>
              <p class="text-xs text-ink-muted">{{ inv.phone }}</p>
            </td>
            <td class="px-4 py-3 text-ink-muted">{{ formatDate(inv.createdAt) }}</td>
            <td class="px-4 py-3">{{ inv.itemCount }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium">
                {{ statusLabel[inv.status] || inv.status }}
              </span>
            </td>
            <td class="px-4 py-3 font-semibold">{{ formatPrice(inv.total) }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <NuxtLink
                :to="`/facture/${inv.id}`"
                class="mr-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                target="_blank"
              >
                <PhPrinter :size="14" weight="bold" />
                Voir
              </NuxtLink>
              <NuxtLink
                :to="`/admin/commandes`"
                class="text-sm font-medium text-ink-muted hover:text-brand"
              >
                Commande
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
