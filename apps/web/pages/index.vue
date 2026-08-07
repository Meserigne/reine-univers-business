<script setup lang="ts">
import {
  PhList,
  PhShoppingCart,
  PhX,
  PhHouse,
  PhStorefront,
  PhScooter,
  PhPhone,
  PhStar,
} from '@phosphor-icons/vue'

const { itemCount, openCart } = useCart()
const { getHomePage } = useApi()
const { data: home } = await useAsyncData('home-page', () => getHomePage())
const menuOpen = ref(false)

const menuIcons = {
  Accueil: PhHouse,
  Catalogue: PhStorefront,
  Livraison: PhScooter,
  Fidélité: PhStar,
  Contact: PhPhone,
} as const

const menuItems = computed(() =>
  (home.value?.menu ?? [
    { label: 'Accueil', href: '/' },
    { label: 'Catalogue', href: '/commander' },
    { label: 'Livraison', href: '/commander#livraison' },
    { label: 'Fidélité', href: '/commander#fidelite' },
    { label: 'Contact', href: '/commander#contact' },
  ]).map((item) => ({
    to: item.href,
    label: item.label,
    Icon: menuIcons[item.label as keyof typeof menuIcons] ?? PhHouse,
  })),
)

const heroTitle = computed(() => home.value?.hero.title ?? 'Viande fraîche livrée chez vous')
const heroSubtitle = computed(
  () =>
    home.value?.hero.subtitle ??
    'Poulet, œufs, mouton, veau et porc, toujours frais du jour',
)
const ctaLabel = computed(() => home.value?.hero.ctaLabel ?? 'Commander')
const brandName = computed(() => home.value?.brandName ?? 'Reine Univers Business')

const collage = [
  {
    src: '/chicken.png',
    alt: 'Poulet entier frais',
    wrap: 'col-span-2 flex items-end justify-center rounded-[2rem] bg-[#f5f5f5] p-3 sm:p-4 md:col-span-2 md:row-span-2 md:min-h-[280px] lg:min-h-[340px]',
    img: 'h-auto max-h-[240px] w-full object-contain sm:max-h-[280px] md:max-h-[320px] lg:max-h-[380px]',
    delay: '0s',
  },
  {
    src: '/eggs.png',
    alt: 'Œufs frais',
    wrap: 'flex items-center justify-center rounded-[1.5rem] bg-[#f5f5f5] p-2 sm:p-3',
    img: 'h-auto max-h-[140px] w-full object-contain sm:max-h-[160px] md:max-h-[180px]',
    delay: '0.2s',
  },
  {
    src: '/mouton.png',
    alt: 'Mouton frais',
    wrap: 'flex items-center justify-center rounded-[1.5rem] bg-[#f5f5f5] p-2 sm:p-3',
    img: 'h-auto max-h-[140px] w-full object-contain sm:max-h-[160px] md:max-h-[180px]',
    delay: '0.4s',
  },
  {
    src: '/veau.png',
    alt: 'Veau frais',
    wrap: 'flex items-center justify-center rounded-[1.5rem] bg-[#f5f5f5] p-2 sm:p-3',
    img: 'h-auto max-h-[120px] w-full object-contain sm:max-h-[140px]',
    delay: '0.6s',
  },
  {
    src: '/porc.png',
    alt: 'Porc frais',
    wrap: 'flex items-center justify-center rounded-[1.5rem] bg-[#f5f5f5] p-2 sm:p-3 md:col-span-2',
    img: 'h-auto max-h-[120px] w-full object-contain sm:max-h-[140px] md:max-h-[150px]',
    delay: '0.8s',
  },
]
</script>

<template>
  <div class="relative flex min-h-[100dvh] flex-col bg-white">
    <header class="sticky top-0 z-50 bg-[#c8102e] text-white shadow-sm">
      <div class="mx-auto grid h-14 max-w-[1400px] grid-cols-3 items-center px-4 sm:h-16 sm:px-6">
        <button
          type="button"
          class="justify-self-start rounded-md p-2 transition-opacity hover:opacity-90"
          aria-label="Menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <PhX v-if="menuOpen" :size="28" weight="bold" />
          <PhList v-else :size="28" weight="bold" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2 justify-self-center">
          <img
            src="/logo.png"
            alt=""
            class="h-9 w-9 rounded-full bg-white object-contain p-0.5 sm:h-10 sm:w-10"
          />
          <span class="text-center font-display text-[13px] font-bold leading-tight tracking-tight sm:text-base md:text-lg">
            {{ brandName }}
          </span>
        </NuxtLink>

        <button
          type="button"
          class="relative flex h-11 w-11 items-center justify-center justify-self-end rounded-md transition-opacity hover:opacity-90"
          aria-label="Panier"
          @click="openCart"
        >
          <PhShoppingCart :size="28" weight="bold" class="text-white" />
          <span class="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold leading-none text-brand">
            {{ itemCount }}
          </span>
        </button>
      </div>

      <nav
        v-if="menuOpen"
        class="overflow-hidden border-t border-black/10 bg-white"
      >
        <ul class="mx-auto max-w-[1400px] bg-white px-6 py-1 sm:px-8">
          <li v-for="(item, i) in menuItems" :key="item.label">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-4 py-4 text-ink transition-colors hover:bg-canvas"
              :class="i < menuItems.length - 1 ? 'border-b border-dotted border-ink/25' : ''"
              @click="menuOpen = false"
            >
              <component :is="item.Icon" :size="26" weight="regular" class="shrink-0 text-ink" />
              <span class="font-display text-lg font-semibold tracking-wide text-ink">
                {{ item.label }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <div class="relative z-20 w-full px-6 pt-5 sm:px-10 sm:pt-6 lg:px-16 lg:pt-7">
      <div class="mx-auto flex w-full max-w-[1400px] justify-start">
        <img
          src="/logo.png"
          :alt="brandName"
          class="h-28 w-auto bg-transparent object-contain sm:h-32 md:h-40"
        />
      </div>
    </div>

    <section class="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 items-center gap-8 px-6 pb-12 pt-6 md:grid-cols-2 md:gap-10 md:px-10 md:pb-16 md:pt-8 lg:gap-12 lg:px-16 lg:pb-20 lg:pt-10">
      <div class="relative z-20 max-w-xl">
        <h1 class="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-[3.4rem] lg:text-[4rem]">
          <span v-html="heroTitle.replace(' livrée ', '<br />livrée ')" />
        </h1>

        <p class="mt-5 text-base text-ink/70 sm:text-lg">
          {{ heroSubtitle }}
        </p>

        <div class="mt-8 sm:mt-10">
          <NuxtLink
            to="/commander"
            class="inline-flex items-center justify-center rounded-full bg-brand px-9 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_30px_rgba(200,16,46,0.28)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            {{ ctaLabel }}
          </NuxtLink>
        </div>
      </div>

      <div class="relative mx-auto grid w-full max-w-[560px] grid-cols-2 gap-3 sm:gap-4 md:max-w-none md:grid-cols-3 md:gap-3 lg:gap-4">
        <div
          v-for="item in collage"
          :key="item.src"
          :class="`${item.wrap} transition-transform hover:-translate-y-1 hover:scale-[1.02]`"
        >
          <img
            :src="item.src"
            :alt="item.alt"
            :class="item.img"
            class="animate-float"
            :style="{ animationDelay: item.delay }"
          />
        </div>
      </div>
    </section>

    <div class="relative z-30 flex h-3 w-full sm:h-4">
      <div class="w-1/2 bg-[#1a1a1a]" />
      <div class="w-1/2 bg-brand" />
    </div>

    <CartDrawer />
    <CheckoutModal />
  </div>
</template>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
