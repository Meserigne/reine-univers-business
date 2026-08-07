<script setup lang="ts">
const props = defineProps<{
  eyebrow?: string
  title?: string
  categories?: { id: string; label: string }[]
}>()

const filters = computed(
  () =>
    props.categories ?? [
      { id: 'tous', label: 'Tout' },
      { id: 'poulet', label: 'Poulet' },
      { id: 'oeuf', label: 'Œufs' },
      { id: 'mouton', label: 'Mouton' },
      { id: 'veau', label: 'Veau' },
      { id: 'porc', label: 'Porc' },
    ],
)

const labelById = computed(() => {
  const map: Record<string, string> = {}
  for (const f of filters.value) {
    if (f.id !== 'tous') map[f.id] = f.label
  }
  return map
})

const categoryOrder = computed(() =>
  filters.value.filter((f) => f.id !== 'tous').map((f) => f.id),
)

const { getProducts } = useApi()
const { data: products, pending, error } = await useAsyncData('products', () => getProducts())

const filter = ref('tous')
const cutFilter = ref<string | null>(null)

const filtered = computed(() => {
  const list = products.value ?? []
  let result = filter.value === 'tous' ? list : list.filter((p) => p.category === filter.value)
  if (cutFilter.value) {
    result = result.filter((p) => p.cut === cutFilter.value)
  }
  return result
})

const groups = computed(() =>
  categoryOrder.value
    .map((category) => {
      const items = filtered.value.filter((p) => p.category === category)
      const cuts = [...new Set(items.map((p) => p.cut))]
      return { category, items, cuts }
    })
    .filter((g) => g.items.length > 0),
)

watch(filter, () => {
  cutFilter.value = null
})
</script>

<template>
  <section id="catalogue" class="scroll-mt-20 bg-canvas py-16 sm:py-20">
    <div class="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        {{ eyebrow || 'Catalogue' }}
      </p>
      <h2 class="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ title || 'Viande fraîche du jour' }}
      </h2>

      <div class="mt-8 flex flex-wrap gap-2">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-semibold transition"
          :class="
            filter === f.id
              ? 'bg-brand text-white'
              : 'bg-surface text-ink-muted hover:text-ink'
          "
          @click="filter = f.id"
        >
          {{ f.label }}
        </button>
      </div>

      <p v-if="pending" class="mt-10 text-ink-muted">Chargement du catalogue…</p>
      <p v-else-if="error" class="mt-10 text-brand">
        Impossible de charger les produits. Vérifiez que l’API tourne.
      </p>

      <div v-else class="mt-12 space-y-14">
        <div v-for="group in groups" :key="group.category">
          <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h3 class="font-display text-2xl font-bold">
              {{ labelById[group.category] || group.category }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="!cutFilter ? 'bg-ink text-white' : 'bg-surface text-ink-muted'"
                @click="cutFilter = null"
              >
                Toutes découpes
              </button>
              <button
                v-for="cut in group.cuts"
                :key="cut"
                type="button"
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="cutFilter === cut ? 'bg-ink text-white' : 'bg-surface text-ink-muted'"
                @click="cutFilter = cut"
              >
                {{ cut }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ProductCard
              v-for="(product, index) in group.items"
              :key="product.id"
              :product="product"
              :index="index"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
