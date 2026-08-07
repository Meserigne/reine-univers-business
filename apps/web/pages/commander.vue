<script setup lang="ts">
import { PhX } from '@phosphor-icons/vue'

const menuOpen = ref(false)
const { getShopPage } = useApi()
const { data: page } = await useAsyncData('shop-page', () => getShopPage())

const mobileLinks = [
  { href: '/', label: 'Accueil' },
  { href: '#catalogue', label: 'Catalogue' },
  { href: '#livraison', label: 'Livraison' },
  { href: '#fidelite', label: 'Fidélité' },
  { href: '#contact', label: 'Contact' },
]

onMounted(() => {
  if (import.meta.client && window.location.hash) {
    nextTick(() => {
      document
        .querySelector(window.location.hash)
        ?.scrollIntoView({ behavior: 'smooth' })
    })
  }
})
</script>

<template>
  <div>
    <ShopHeader :menu-open="menuOpen" @toggle-menu="menuOpen = true" />

    <div v-if="menuOpen" class="fixed inset-0 z-[55] md:hidden">
      <button
        type="button"
        class="absolute inset-0 bg-ink/40"
        aria-label="Fermer"
        @click="menuOpen = false"
      />
      <nav class="absolute inset-x-4 top-20 z-[56] rounded-2xl bg-surface p-5 shadow-xl">
        <div class="mb-3 flex justify-end">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-canvas"
            aria-label="Fermer"
            @click="menuOpen = false"
          >
            <PhX :size="18" weight="bold" />
          </button>
        </div>
        <div class="flex flex-col gap-1">
          <a
            v-for="link in mobileLinks"
            :key="link.label"
            :href="link.href"
            class="rounded-xl px-4 py-3 font-display text-lg font-semibold hover:bg-canvas"
            @click="menuOpen = false"
          >
            {{ link.label }}
          </a>
        </div>
      </nav>
    </div>

    <main class="pt-16">
      <Catalogue
        :eyebrow="page?.catalogue.eyebrow"
        :title="page?.catalogue.title"
        :categories="page?.catalogue.categories"
      />
      <DeliverySection
        v-if="page"
        :eyebrow="page.delivery.eyebrow"
        :title="page.delivery.title"
        :text="page.delivery.text"
        :points="page.delivery.points"
      />
      <LoyaltySection
        v-if="page"
        :eyebrow="page.loyalty.eyebrow"
        :title="page.loyalty.title"
        :text="page.loyalty.text"
      />
    </main>
    <SiteFooter
      v-if="page"
      :brand-name="page.brandName"
      :phone="page.contact.phone"
      :whatsapp="page.contact.whatsapp"
      :email="page.contact.email"
    />
    <CartDrawer />
    <CheckoutModal />
  </div>
</template>
