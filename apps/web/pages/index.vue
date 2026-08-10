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
  PhArrowRight,
  PhLightning,
  PhTruck,
  PhSealCheck,
} from '@phosphor-icons/vue'

const { itemCount, openCart } = useCart()
const { getHomePage } = useApi()
const { data: home } = await useAsyncData('home-page', () => getHomePage(), {
  lazy: true,
  server: false,
})
const menuOpen = ref(false)
const scrolled = ref(false)

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
    'Poulet, œufs, mouton, veau et porc — frais du jour, livrés rapidement à Dakar.',
)
const ctaLabel = computed(() => home.value?.hero.ctaLabel ?? 'Commander')
const brandName = computed(() => home.value?.brandName ?? 'Reine Univers Business')
const contact = computed(
  () =>
    home.value?.contact ?? {
      phone: '+221784802640',
      whatsapp: '221784802640',
      email: 'commande@reineunivers.sn',
    },
)

const categories = [
  { id: 'poulet', label: 'Poulet', image: '/chicken.png', to: '/commander?category=poulet' },
  { id: 'oeuf', label: 'Œufs', image: '/eggs.png', to: '/commander?category=oeuf' },
  { id: 'mouton', label: 'Mouton', image: '/mouton.png', to: '/commander?category=mouton' },
  { id: 'veau', label: 'Veau', image: '/veau.png', to: '/commander?category=veau' },
  { id: 'porc', label: 'Porc', image: '/porc.png', to: '/commander?category=porc' },
]

const steps = [
  {
    n: '01',
    title: 'Choisissez',
    text: 'Parcourez le catalogue et composez votre panier en quelques taps.',
    Icon: PhLightning,
  },
  {
    n: '02',
    title: 'On prépare',
    text: 'Vos pièces sont préparées le jour même, prêtes pour la route.',
    Icon: PhSealCheck,
  },
  {
    n: '03',
    title: 'Livré chez vous',
    text: 'Suivi en direct jusqu’à votre porte, partout à Dakar.',
    Icon: PhTruck,
  },
]

const highlights = [
  { src: '/chicken.jpg', label: 'Poulet', to: '/commander?category=poulet' },
  { src: '/mouton.jpg', label: 'Mouton', to: '/commander?category=mouton' },
  { src: '/veau.jpg', label: 'Veau', to: '/commander?category=veau' },
]

function onScroll() {
  scrolled.value = window.scrollY > 24
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

useReveal()
</script>

<template>
  <div class="min-h-[100dvh] bg-[#f4f4f5] text-ink">
    <!-- Minimal floating header -->
    <header
      class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      :class="
        scrolled
          ? 'border-b border-black/5 bg-white/90 text-ink shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] backdrop-blur-xl'
          : 'bg-transparent text-white'
      "
    >
      <div class="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full transition"
          :class="scrolled ? 'hover:bg-black/5' : 'hover:bg-white/10'"
          aria-label="Menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <PhX v-if="menuOpen" :size="24" weight="bold" />
          <PhList v-else :size="24" weight="bold" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt=""
            class="h-9 w-9 rounded-full object-contain"
            :class="scrolled ? 'bg-canvas p-0.5' : 'bg-white p-0.5'"
          />
          <span class="hidden font-display text-sm font-bold tracking-tight sm:inline">
            {{ brandName }}
          </span>
        </NuxtLink>

        <button
          type="button"
          class="relative flex h-10 w-10 items-center justify-center rounded-full transition"
          :class="scrolled ? 'bg-ink text-white' : 'bg-white text-ink'"
          aria-label="Panier"
          @click="openCart"
        >
          <PhShoppingCart :size="20" weight="bold" />
          <span
            v-if="itemCount"
            class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white"
          >
            {{ itemCount }}
          </span>
        </button>
      </div>

      <nav
        v-if="menuOpen"
        class="border-t border-black/5 bg-white text-ink shadow-lg"
      >
        <ul class="mx-auto max-w-[1280px] px-4 py-2 sm:px-6">
          <li v-for="item in menuItems" :key="item.label">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 border-b border-line py-4 last:border-0"
              @click="menuOpen = false"
            >
              <component :is="item.Icon" :size="22" class="text-brand" />
              <span class="font-display text-lg font-semibold">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <!-- Split hero: editorial butcher -->
    <section class="relative grid min-h-[100dvh] lg:grid-cols-2">
      <div class="relative flex flex-col justify-end bg-ink px-6 pb-14 pt-28 text-white sm:px-10 sm:pb-16 lg:px-14 lg:pb-20 lg:pt-32">
        <div
          class="pointer-events-none absolute -right-24 top-24 h-64 w-64 rounded-full bg-brand/30 blur-3xl"
          aria-hidden="true"
        />
        <p class="hero-in text-[11px] font-semibold uppercase tracking-[0.28em] text-brand">
          Dakar · Frais du jour
        </p>
        <h1
          class="hero-in hero-in-1 mt-4 max-w-lg font-display text-[2.75rem] font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-[4.25rem]"
        >
          <span class="block text-white">{{ brandName }}</span>
        </h1>
        <p
          class="hero-in hero-in-2 mt-5 max-w-md font-display text-2xl font-semibold leading-snug text-white/90 sm:text-3xl"
        >
          {{ heroTitle }}
        </p>
        <p class="hero-in hero-in-3 mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
          {{ heroSubtitle }}
        </p>
        <div class="hero-in hero-in-4 mt-9 flex flex-wrap gap-3">
          <NuxtLink
            to="/commander"
            class="group inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-ink"
          >
            {{ ctaLabel }}
            <PhArrowRight
              :size="14"
              weight="bold"
              class="transition-transform group-hover:translate-x-1"
            />
          </NuxtLink>
          <a
            :href="`https://wa.me/${contact.whatsapp}`"
            target="_blank"
            rel="noreferrer"
            class="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-white hover:bg-white/10"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <div class="relative min-h-[48dvh] overflow-hidden bg-[#1a1a1a] lg:min-h-[100dvh]">
        <img
          src="/chicken.jpg"
          alt="Poulet frais"
          class="absolute inset-0 h-full w-full object-cover object-center opacity-95"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-ink/40"
          aria-hidden="true"
        />
        <!-- Floating category rail on image -->
        <div class="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8">
          <div class="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            <NuxtLink
              v-for="cat in categories"
              :key="cat.id"
              :to="cat.to"
              class="group flex shrink-0 items-center gap-3 rounded-full bg-white/95 py-2 pl-2 pr-4 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0]">
                <img
                  :src="cat.image"
                  :alt="cat.label"
                  class="h-10 w-10 object-contain transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span class="pr-1 text-sm font-bold text-ink">{{ cat.label }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Steps -->
    <section class="border-b border-line bg-white">
      <div class="mx-auto grid max-w-[1280px] divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <article
          v-for="(step, i) in steps"
          :key="step.n"
          class="reveal px-6 py-10 sm:px-8 sm:py-12"
          :class="`reveal-delay-${i + 1}`"
        >
          <div class="flex items-center justify-between">
            <span class="font-display text-4xl font-extrabold tracking-tight text-brand/20">
              {{ step.n }}
            </span>
            <component :is="step.Icon" :size="28" weight="duotone" class="text-brand" />
          </div>
          <h2 class="mt-4 font-display text-xl font-bold tracking-tight">
            {{ step.title }}
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-ink-muted">
            {{ step.text }}
          </p>
        </article>
      </div>
    </section>

    <!-- Magazine product rows -->
    <section class="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div class="reveal mb-10 flex items-end justify-between gap-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">
            Sélection
          </p>
          <h2 class="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ce que l’on commande le plus
          </h2>
        </div>
        <NuxtLink
          to="/commander"
          class="hidden text-sm font-bold text-ink underline-offset-4 hover:text-brand hover:underline sm:inline"
        >
          Tout voir
        </NuxtLink>
      </div>

      <div class="space-y-4 sm:space-y-5">
        <NuxtLink
          v-for="(item, idx) in highlights"
          :key="item.label"
          :to="item.to"
          class="reveal group grid overflow-hidden rounded-3xl bg-white sm:grid-cols-[1.2fr_1fr]"
          :class="[
            idx % 2 === 1 ? 'sm:grid-cols-[1fr_1.2fr]' : '',
            `reveal-delay-${(idx % 3) + 1}`,
          ]"
        >
          <div
            class="relative min-h-[220px] overflow-hidden sm:min-h-[280px]"
            :class="idx % 2 === 1 ? 'sm:order-2' : ''"
          >
            <img
              :src="item.src"
              :alt="item.label"
              loading="lazy"
              class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div
            class="flex flex-col justify-center px-7 py-10 sm:px-10"
            :class="idx % 2 === 1 ? 'sm:order-1' : ''"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
              Catégorie
            </p>
            <h3 class="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {{ item.label }}
            </h3>
            <p class="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
              Fraîcheur garantie, découpes soignées, prêt à cuisiner ce soir.
            </p>
            <span
              class="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand transition group-hover:gap-3"
            >
              Voir les produits
              <PhArrowRight :size="16" weight="bold" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA band -->
    <section class="reveal px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div
        class="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 overflow-hidden rounded-[2rem] bg-brand px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12"
      >
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Prêt à commander ?
          </p>
          <h2 class="mt-2 max-w-md font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Votre viande fraîche, livrée aujourd’hui.
          </h2>
        </div>
        <NuxtLink
          to="/commander"
          class="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-ink transition hover:bg-ink hover:text-white"
        >
          {{ ctaLabel }}
          <PhArrowRight
            :size="14"
            weight="bold"
            class="transition-transform group-hover:translate-x-1"
          />
        </NuxtLink>
      </div>
    </section>

    <SiteFooter
      :brand-name="brandName"
      :phone="contact.phone"
      :whatsapp="contact.whatsapp"
      :email="contact.email"
    />

    <CartDrawer />
    <CheckoutModal />
  </div>
</template>

<style scoped>
.hero-in {
  animation: rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.hero-in-1 {
  animation-delay: 0.08s;
}
.hero-in-2 {
  animation-delay: 0.16s;
}
.hero-in-3 {
  animation-delay: 0.24s;
}
.hero-in-4 {
  animation-delay: 0.34s;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-in {
    animation: none;
  }
}
</style>
