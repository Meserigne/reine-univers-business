<script setup lang="ts">
definePageMeta({ layout: 'admin' })

type CustomerRow = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  active: boolean
  createdAt: string
  _count: { orders: number }
}

const api = useAdminApi()
const { ensureSession } = useAdminAuth()

const { data: customers, pending, refresh, error } = await useAsyncData(
  'admin-customers',
  async () => {
    await ensureSession()
    return api.customers()
  },
  { server: false },
)

const search = ref('')

const filtered = computed(() => {
  const list = customers.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q),
  )
})

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(iso))
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Clients</h1>
        <p class="mt-1 text-ink-muted">
          {{ filtered.length }} compte{{ filtered.length > 1 ? 's' : '' }} client
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

    <input
      v-model="search"
      type="search"
      placeholder="Rechercher nom, téléphone, email…"
      class="mb-4 w-full max-w-md rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
    />

    <div v-if="pending && !customers" class="text-ink-muted">Chargement…</div>
    <p v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      Impossible de charger les clients. Reconnecte-toi à l’admin puis actualise.
    </p>
    <p v-else-if="!filtered.length" class="text-ink-muted">Aucun client inscrit.</p>

    <div v-else class="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="border-b border-line bg-canvas text-ink-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Client</th>
            <th class="px-4 py-3 font-medium">Contact</th>
            <th class="px-4 py-3 font-medium">Commandes</th>
            <th class="px-4 py-3 font-medium">Inscrit le</th>
            <th class="px-4 py-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in filtered"
            :key="c.id"
            class="border-b border-line last:border-0"
          >
            <td class="px-4 py-3">
              <p class="font-semibold">{{ c.name }}</p>
              <p v-if="c.address" class="text-xs text-ink-muted">{{ c.address }}</p>
            </td>
            <td class="px-4 py-3">
              <p>{{ c.phone }}</p>
              <p v-if="c.email" class="text-xs text-ink-muted">{{ c.email }}</p>
            </td>
            <td class="px-4 py-3">{{ c._count.orders }}</td>
            <td class="px-4 py-3 text-ink-muted">{{ formatDate(c.createdAt) }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-medium"
                :class="c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-canvas text-ink-muted'"
              >
                {{ c.active ? 'Actif' : 'Inactif' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
