<script setup lang="ts">
import { PhMagnifyingGlass, PhPlus, PhArrowClockwise } from '@phosphor-icons/vue'
import type { AdminProduct } from '~/composables/useAdminApi'
import { formatPrice } from '~/types/catalog'

definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const [{ data: products, pending, refresh }, { data: categories }] = await Promise.all([
  useAsyncData('admin-products', () => api.products(), { watch: [] }),
  useAsyncData('admin-categories-for-products', () => api.categories()),
])

const showForm = ref(false)
const editing = ref<AdminProduct | null>(null)
const error = ref('')
const formError = ref('')
const saving = ref(false)
const refreshing = ref(false)
const filter = ref('tous')
const statusFilter = ref<'all' | 'active' | 'inactive' | 'popular'>('all')
const search = ref('')

const units = ['kg', 'pièce', 'plateau', 'douzaine', 'boîte']

const availableImages = [
  '/products/poulet-entier.png',
  '/products/poulet-cuisses.jpg',
  '/products/poulet-pilons.jpg',
  '/products/poulet-ailes.jpg',
  '/products/poulet-blanc.jpg',
  '/products/poulet-hauts.jpg',
  '/products/poulet-decoupe.jpg',
  '/products/poulet-abats.jpg',
  '/products/oeufs-plateau.png',
  '/products/oeufs-douzaine.jpg',
  '/products/oeufs-boite.jpg',
  '/products/mouton-gigot.png',
  '/products/mouton-epaule.jpg',
  '/products/mouton-cotelettes.jpg',
  '/products/mouton-cotes.jpg',
  '/products/mouton-collier.jpg',
  '/products/mouton-poitrine.jpg',
  '/products/mouton-hache.jpg',
  '/products/mouton-foie.jpg',
  '/products/veau-filet.png',
  '/products/veau-escalope.jpg',
  '/products/veau-jarret.jpg',
  '/products/veau-cotes.jpg',
  '/products/veau-saute.jpg',
  '/products/veau-foie.jpg',
  '/products/veau-epaule.jpg',
  '/products/porc-cotelettes.jpg',
  '/products/porc-travers.jpg',
  '/products/porc-echine.jpg',
  '/products/porc-filet.jpg',
  '/products/porc-epaule.jpg',
  '/products/porc-poitrine.png',
  '/products/porc-hache.jpg',
]

const form = reactive({
  id: '',
  name: '',
  description: '',
  price: 0,
  unit: 'kg',
  categoryId: '',
  cut: '',
  image: '',
  badge: '',
  popular: false,
  active: true,
})

const filtered = computed(() => {
  let list = products.value ?? []
  if (filter.value !== 'tous') {
    list = list.filter((p) => (p.categoryId || p.category) === filter.value)
  }
  if (statusFilter.value === 'active') list = list.filter((p) => p.active)
  if (statusFilter.value === 'inactive') list = list.filter((p) => !p.active)
  if (statusFilter.value === 'popular') list = list.filter((p) => p.popular)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.cut.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.badge ?? '').toLowerCase().includes(q),
    )
  }
  return list
})

const counts = computed(() => {
  const list = products.value ?? []
  return {
    total: list.length,
    active: list.filter((p) => p.active).length,
    shown: filtered.value.length,
  }
})

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const idManual = ref(false)

watch(
  () => form.name,
  (name) => {
    if (editing.value || idManual.value) return
    form.id = slugify(name)
  },
)

function openCreate() {
  editing.value = null
  const first = categories.value?.find((c) => c.active)?.id ?? categories.value?.[0]?.id ?? ''
  idManual.value = false
  Object.assign(form, {
    id: '',
    name: '',
    description: '',
    price: 0,
    unit: 'kg',
    categoryId: first,
    cut: '',
    image: '',
    badge: '',
    popular: false,
    active: true,
  })
  formError.value = ''
  error.value = ''
  showForm.value = true
}

function openEdit(p: AdminProduct) {
  editing.value = p
  Object.assign(form, {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    unit: p.unit,
    categoryId: p.categoryId || p.category,
    cut: p.cut,
    image: p.image,
    badge: p.badge ?? '',
    popular: p.popular,
    active: p.active,
  })
  formError.value = ''
  error.value = ''
  showForm.value = true
}

async function doRefresh() {
  refreshing.value = true
  try {
    await refresh()
  } finally {
    refreshing.value = false
  }
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      unit: form.unit.trim(),
      categoryId: form.categoryId,
      cut: form.cut.trim(),
      image: form.image.trim(),
      badge: form.badge.trim() || undefined,
      popular: form.popular,
      active: form.active,
    }
    if (editing.value) {
      await api.updateProduct(editing.value.id, payload)
    } else {
      const id = slugify(form.id || form.name)
      if (!id) throw { data: { message: 'Identifiant invalide' } }
      await api.createProduct({ id, ...payload })
    }
    showForm.value = false
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    formError.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Erreur lors de l’enregistrement'
  } finally {
    saving.value = false
  }
}

async function remove(p: AdminProduct) {
  if (!confirm(`Supprimer « ${p.name} » ?\n\nSi le produit est lié à des commandes, désactivez-le plutôt.`))
    return
  error.value = ''
  try {
    await api.deleteProduct(p.id)
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value =
      err?.data?.message ||
      'Suppression impossible (produit lié à des commandes). Désactivez-le à la place.'
  }
}

async function toggle(p: AdminProduct, field: 'active' | 'popular') {
  error.value = ''
  try {
    await api.updateProduct(p.id, { [field]: !p[field] })
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Mise à jour impossible'
  }
}

function catLabel(id: string) {
  return categories.value?.find((c) => c.id === id)?.label ?? id
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Produits</h1>
        <p class="mt-1 text-ink-muted">
          {{ counts.shown }} affiché{{ counts.shown > 1 ? 's' : '' }}
          · {{ counts.active }} actif{{ counts.active > 1 ? 's' : '' }}
          · {{ counts.total }} au total
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium hover:bg-canvas"
          :disabled="refreshing"
          @click="doRefresh"
        >
          <PhArrowClockwise :size="16" weight="bold" :class="refreshing ? 'animate-spin' : ''" />
          Actualiser
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          @click="openCreate"
        >
          <PhPlus :size="16" weight="bold" />
          Nouveau produit
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label class="relative block min-w-0 flex-1">
        <PhMagnifyingGlass
          :size="18"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher un produit, une coupe…"
          class="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand"
        />
      </label>
      <select
        v-model="statusFilter"
        class="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
      >
        <option value="all">Tous les statuts</option>
        <option value="active">Actifs seulement</option>
        <option value="inactive">Inactifs</option>
        <option value="popular">Populaires</option>
      </select>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full px-3 py-1.5 text-sm font-medium"
        :class="filter === 'tous' ? 'bg-brand text-white' : 'border border-line bg-surface'"
        @click="filter = 'tous'"
      >
        Tout
      </button>
      <button
        v-for="c in categories"
        :key="c.id"
        type="button"
        class="rounded-full px-3 py-1.5 text-sm font-medium"
        :class="filter === c.id ? 'bg-brand text-white' : 'border border-line bg-surface'"
        @click="filter = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
      {{ error }}
    </p>

    <div v-if="pending && !products" class="text-ink-muted">Chargement…</div>

    <div
      v-else-if="!filtered.length"
      class="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center"
    >
      <p class="font-display text-lg font-semibold">Aucun produit</p>
      <p class="mt-1 text-sm text-ink-muted">
        {{ search || filter !== 'tous' || statusFilter !== 'all'
          ? 'Aucun résultat pour ces filtres.'
          : 'Ajoutez votre premier produit au catalogue.' }}
      </p>
      <button
        type="button"
        class="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        @click="openCreate"
      >
        + Nouveau produit
      </button>
    </div>

    <div v-else class="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table class="w-full min-w-[900px] text-left text-sm">
        <thead class="border-b border-line bg-canvas text-ink-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Produit</th>
            <th class="px-4 py-3 font-medium">Catégorie</th>
            <th class="px-4 py-3 font-medium">Prix</th>
            <th class="px-4 py-3 font-medium">Statut</th>
            <th class="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filtered"
            :key="p.id"
            class="border-b border-line last:border-0 hover:bg-canvas/60"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img
                  :src="p.image"
                  :alt="p.name"
                  class="size-12 rounded-lg bg-canvas object-cover"
                  @error="($event.target as HTMLImageElement).src = '/logo.png'"
                />
                <div>
                  <p class="font-semibold">{{ p.name }}</p>
                  <p class="text-xs text-ink-muted">
                    {{ p.cut }} · {{ p.unit }}
                    <span v-if="p.badge" class="text-brand"> · {{ p.badge }}</span>
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">{{ catLabel(p.categoryId || p.category) }}</td>
            <td class="px-4 py-3 font-medium">{{ formatPrice(p.price) }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <button
                  type="button"
                  class="rounded-full px-2 py-0.5 text-xs"
                  :class="p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-canvas text-ink-muted'"
                  @click="toggle(p, 'active')"
                >
                  {{ p.active ? 'Actif' : 'Inactif' }}
                </button>
                <button
                  type="button"
                  class="rounded-full px-2 py-0.5 text-xs"
                  :class="p.popular ? 'bg-brand-soft text-brand-dark' : 'bg-canvas text-ink-muted'"
                  @click="toggle(p, 'popular')"
                >
                  {{ p.popular ? 'Populaire' : 'Normal' }}
                </button>
              </div>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button
                type="button"
                class="mr-2 text-sm font-medium text-brand hover:underline"
                @click="openEdit(p)"
              >
                Modifier
              </button>
              <button
                type="button"
                class="text-sm font-medium text-ink-muted hover:text-brand"
                @click="remove(p)"
              >
                Supprimer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        class="absolute inset-0 bg-ink/40"
        aria-label="Fermer"
        @click="showForm = false"
      />
      <form
        class="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="save"
      >
        <h2 class="font-display text-xl font-bold">
          {{ editing ? 'Modifier le produit' : 'Nouveau produit' }}
        </h2>

        <p
          v-if="formError"
          class="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-dark"
        >
          {{ formError }}
        </p>

        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <label class="block text-sm sm:col-span-2">
            <span class="mb-1 block font-medium">Nom</span>
            <input
              v-model="form.name"
              required
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          <label v-if="!editing" class="block text-sm sm:col-span-2">
            <span class="mb-1 block font-medium">Identifiant (slug)</span>
            <input
              v-model="form.id"
              required
              placeholder="ex: poulet-entier"
              class="w-full rounded-xl border border-line px-3 py-2.5 font-mono text-xs outline-none focus:border-brand"
              @input="idManual = true"
            />
          </label>

          <label class="block text-sm sm:col-span-2">
            <span class="mb-1 block font-medium">Description</span>
            <textarea
              v-model="form.description"
              required
              rows="2"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          <label class="block text-sm">
            <span class="mb-1 block font-medium">Prix (F CFA)</span>
            <input
              v-model.number="form.price"
              type="number"
              min="0"
              step="100"
              required
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          <label class="block text-sm">
            <span class="mb-1 block font-medium">Unité</span>
            <select
              v-model="form.unit"
              required
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            >
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </label>

          <label class="block text-sm">
            <span class="mb-1 block font-medium">Catégorie</span>
            <select
              v-model="form.categoryId"
              required
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            >
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </label>

          <label class="block text-sm">
            <span class="mb-1 block font-medium">Coupe / type</span>
            <input
              v-model="form.cut"
              required
              placeholder="ex: Cuisses, Entier…"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          <label class="block text-sm sm:col-span-2">
            <span class="mb-1 block font-medium">Image (chemin ou URL)</span>
            <input
              v-model="form.image"
              required
              placeholder="/products/…"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          <div v-if="form.image" class="sm:col-span-2">
            <p class="mb-2 text-xs font-medium text-ink-muted">Aperçu</p>
            <img
              :src="form.image"
              alt=""
              class="h-28 w-28 rounded-xl border border-line bg-canvas object-cover"
              @error="($event.target as HTMLImageElement).style.opacity = '0.3'"
            />
          </div>

          <div class="sm:col-span-2">
            <p class="mb-2 text-xs font-medium text-ink-muted">Choisir une image existante</p>
            <div class="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8">
              <button
                v-for="img in availableImages"
                :key="img"
                type="button"
                class="aspect-square overflow-hidden rounded-lg border-2 bg-canvas"
                :class="form.image === img ? 'border-brand' : 'border-transparent'"
                @click="form.image = img"
              >
                <img :src="img" alt="" class="h-full w-full object-cover" />
              </button>
            </div>
          </div>

          <label class="block text-sm sm:col-span-2">
            <span class="mb-1 block font-medium">Badge (optionnel)</span>
            <input
              v-model="form.badge"
              placeholder="Frais du jour, Premium…"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>

          <div class="flex gap-6 sm:col-span-2">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.popular" type="checkbox" class="size-4 accent-brand" />
              Populaire (accueil)
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.active" type="checkbox" class="size-4 accent-brand" />
              Visible sur le site
            </label>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-xl border border-line px-4 py-2 text-sm font-medium"
            @click="showForm = false"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
