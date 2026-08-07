<script setup lang="ts">
import { PhMinus, PhPlus, PhShoppingBag } from '@phosphor-icons/vue'
import type { Product } from '~/types/catalog'
import { categoryLabels, formatPrice } from '~/types/catalog'

const props = defineProps<{
  product: Product
  index: number
}>()

const { addItem, items, setQuantity } = useCart()
const inCart = computed(() => items.value.find((i) => i.product.id === props.product.id))
</script>

<template>
  <article class="group flex flex-col overflow-hidden rounded-2xl bg-surface">
    <div class="relative aspect-[4/3] overflow-hidden bg-canvas">
      <img
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span
        v-if="product.badge"
        class="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
      >
        {{ product.badge }}
      </span>
      <span class="absolute bottom-3 right-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold text-white">
        {{ product.cut }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
        {{ categoryLabels[product.category] || product.category }} · {{ product.unit }} · cru
      </p>
      <h3 class="mt-1.5 font-display text-xl font-semibold tracking-tight text-ink">
        {{ product.name }}
      </h3>
      <p class="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {{ product.description }}
      </p>

      <div class="mt-5 flex items-center justify-between gap-3">
        <p class="font-display text-lg font-bold text-ink">
          {{ formatPrice(product.price) }}
        </p>

        <div v-if="inCart" class="flex items-center gap-2 rounded-full bg-canvas p-1">
          <button
            type="button"
            aria-label="Diminuer"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition hover:bg-brand hover:text-white"
            @click="setQuantity(product.id, inCart.quantity - 1)"
          >
            <PhMinus :size="14" weight="bold" />
          </button>
          <span class="min-w-6 text-center text-sm font-bold">{{ inCart.quantity }}</span>
          <button
            type="button"
            aria-label="Augmenter"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition hover:bg-brand hover:text-white"
            @click="setQuantity(product.id, inCart.quantity + 1)"
          >
            <PhPlus :size="14" weight="bold" />
          </button>
        </div>

        <button
          v-else
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand"
          @click="addItem(product)"
        >
          <PhShoppingBag :size="16" weight="bold" />
          Ajouter
        </button>
      </div>
    </div>
  </article>
</template>
