<script setup lang="ts">
import { PhX, PhMinus, PhPlus, PhTrash } from '@phosphor-icons/vue'
import { formatPrice } from '~/types/catalog'

const {
  items,
  total,
  isOpen,
  closeCart,
  openCheckout,
  setQuantity,
  removeItem,
} = useCart()
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[70]">
      <button
        type="button"
        class="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        aria-label="Fermer le panier"
        @click="closeCart"
      />
      <aside class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-2xl">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 class="font-display text-xl font-bold">Panier</h2>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-canvas"
            aria-label="Fermer"
            @click="closeCart"
          >
            <PhX :size="20" weight="bold" />
          </button>
        </div>

        <div v-if="items.length === 0" class="flex flex-1 items-center justify-center p-8 text-ink-muted">
          Votre panier est vide.
        </div>

        <ul v-else class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <li
            v-for="item in items"
            :key="item.product.id"
            class="flex gap-3 border-b border-line pb-4"
          >
            <img
              :src="item.product.image"
              :alt="item.product.name"
              class="h-20 w-20 rounded-xl object-cover"
            />
            <div class="flex flex-1 flex-col">
              <p class="font-display font-semibold">{{ item.product.name }}</p>
              <p class="text-sm text-ink-muted">{{ formatPrice(item.product.price) }}</p>
              <div class="mt-auto flex items-center justify-between">
                <div class="flex items-center gap-2 rounded-full bg-canvas p-1">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-surface"
                    @click="setQuantity(item.product.id, item.quantity - 1)"
                  >
                    <PhMinus :size="12" weight="bold" />
                  </button>
                  <span class="min-w-5 text-center text-sm font-bold">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-surface"
                    @click="setQuantity(item.product.id, item.quantity + 1)"
                  >
                    <PhPlus :size="12" weight="bold" />
                  </button>
                </div>
                <button
                  type="button"
                  class="text-ink-muted hover:text-brand"
                  aria-label="Retirer"
                  @click="removeItem(item.product.id)"
                >
                  <PhTrash :size="18" />
                </button>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="items.length" class="border-t border-line p-5">
          <div class="mb-4 flex justify-between font-display text-lg font-bold">
            <span>Total</span>
            <span>{{ formatPrice(total) }}</span>
          </div>
          <button
            type="button"
            class="w-full rounded-full bg-brand py-3.5 text-sm font-bold uppercase tracking-wider text-white"
            @click="openCheckout"
          >
            Commander
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
