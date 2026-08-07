<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { data: stats, pending, refresh } = await useAsyncData('admin-stats', () => api.stats())

const cards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'Catégories', value: s.categories, to: '/admin/categories' },
    { label: 'Produits', value: s.products, to: '/admin/produits' },
    { label: 'Commandes', value: s.orders, to: '/admin/commandes' },
    { label: 'Factures', value: s.orders, to: '/admin/factures' },
    { label: 'En attente', value: s.pendingOrders, to: '/admin/commandes' },
    { label: 'Messages', value: s.messages, to: '/admin/messages' },
    { label: 'Comptes fidélité', value: s.loyaltyAccounts, to: '/admin/fidelite' },
  ]
})

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F CFA'
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p class="mt-1 text-ink-muted">Vue d'ensemble de Reine Univers Business</p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-canvas"
        @click="refresh()"
      >
        Actualiser
      </button>
    </div>

    <div v-if="pending && !stats" class="text-ink-muted">Chargement…</div>

    <template v-else>
      <div class="mb-8 rounded-2xl bg-brand px-6 py-8 text-white">
        <p class="text-sm font-medium uppercase tracking-wider text-white/70">CA confirmé</p>
        <p class="mt-2 font-display text-4xl font-bold">{{ formatMoney(stats?.revenue ?? 0) }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="card in cards"
          :key="card.label"
          :to="card.to"
          class="rounded-2xl border border-line bg-surface p-5 transition hover:border-brand/40 hover:shadow-sm"
        >
          <p class="text-sm text-ink-muted">{{ card.label }}</p>
          <p class="mt-2 font-display text-3xl font-bold">{{ card.value }}</p>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
