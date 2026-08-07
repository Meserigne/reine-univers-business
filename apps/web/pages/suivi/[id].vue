<script setup lang="ts">
import type { OrderTracking } from '~/types/tracking'

definePageMeta({ layout: 'default' })

const route = useRoute()
const orderId = computed(() => String(route.params.id || ''))

const { getOrderTracking } = useApi()
const { data: initial, error } = await useAsyncData(
  `order-tracking-${orderId.value}`,
  () => getOrderTracking(orderId.value),
)

useHead({
  title: 'Suivi de livraison — Reine Univers Business',
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-surface">
      <div class="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="font-display text-lg font-bold">
          Reine <span class="text-brand">Univers</span>
        </NuxtLink>
        <NuxtLink to="/commander" class="text-sm font-medium text-ink-muted hover:text-brand">
          Catalogue
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto max-w-lg px-4 py-10">
      <h1 class="mb-2 text-center font-display text-3xl font-bold tracking-tight">
        Suivi en direct
      </h1>
      <p class="mb-8 text-center text-sm text-ink-muted">
        Décompte en temps réel jusqu’à l’arrivée de votre livreur
      </p>

      <div v-if="error" class="rounded-2xl bg-brand-soft p-6 text-center text-brand-dark">
        Commande introuvable.
        <NuxtLink to="/commander" class="mt-3 block font-semibold underline">
          Retour au catalogue
        </NuxtLink>
      </div>

      <div v-else class="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <DeliveryTracker :order-id="orderId" :initial="(initial as OrderTracking | null)" />
      </div>
    </main>
  </div>
</template>
