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

const { data: customers, pending, refresh, error: loadError } = await useAsyncData(
  'admin-customers',
  async () => {
    await ensureSession()
    return api.customers()
  },
  { server: false },
)

const search = ref('')
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  password: '',
})

const filtered = computed(() => {
  const list = (customers.value as CustomerRow[] | null) ?? []
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

function openCreate() {
  Object.assign(form, { name: '', phone: '', email: '', address: '', password: '' })
  formError.value = ''
  showForm.value = true
}

async function saveCustomer() {
  saving.value = true
  formError.value = ''
  try {
    await api.createCustomer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      password: form.password,
    })
    showForm.value = false
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    formError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur création'
  } finally {
    saving.value = false
  }
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
          class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          @click="openCreate"
        >
          + Nouveau client
        </button>
      </div>
    </div>

    <input
      v-model="search"
      type="search"
      placeholder="Rechercher nom, téléphone, email…"
      class="mb-4 w-full max-w-md rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
    />

    <div v-if="pending && !customers" class="text-ink-muted">Chargement…</div>
    <p v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" class="absolute inset-0 bg-ink/40" aria-label="Fermer" @click="showForm = false" />
      <form
        class="relative z-10 w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="saveCustomer"
      >
        <h2 class="font-display text-xl font-bold">Nouveau client</h2>
        <p v-if="formError" class="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-dark">
          {{ formError }}
        </p>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nom</span>
          <input
            v-model="form.name"
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
            placeholder="774823939"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Email <span class="font-normal text-ink-muted">(optionnel)</span></span>
          <input
            v-model="form.email"
            type="email"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Adresse <span class="font-normal text-ink-muted">(optionnel)</span></span>
          <input
            v-model="form.address"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Mot de passe</span>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="rounded-xl border border-line px-4 py-2 text-sm" @click="showForm = false">
            Annuler
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {{ saving ? 'Création…' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
