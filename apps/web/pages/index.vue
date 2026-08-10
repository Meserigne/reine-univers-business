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
  PhCaretRight,
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
    'Poulet, œufs, mouton, veau et porc, toujours frais du jour',
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

const marqueeItems = [
  'Frais du jour',
  'Livraison Dakar',
  'Poulet · Œufs · Mouton',
  'Veau · Porc',
  'Qualité garantie',
  'Commander en 2 min',
]

const categories = [
  {
    id: 'poulet',
    label: 'Poulet',
    text: 'Entier, découpes, toujours frais',
    image: '/chicken.jpg',
    to: '/commander?category=poulet',
    featured: true,
  },
  {
    id: 'oeuf',
    label: 'Œufs',
    text: 'Fraîcheur du jour',
    image: '/eggs.jpg',
    to: '/commander?category=oeuf',
  },
  {
    id: 'mouton',
    label: 'Mouton',
    text: 'Découpes soignées',
    image: '/mouton.jpg',
    to: '/commander?category=mouton',
  },
  {
    id: 'veau',
    label: 'Veau',
    text: 'Tendreté premium',
    image: '/veau.jpg',
    to: '/commander?category=veau',
  },
  {
    id: 'porc',
    label: 'Porc',
    text: 'Qualité contrôlée',
    image: '/porc.jpg',
    to: '/commander?category=porc',
  },
]

function onScroll() {
  scrolled.value = window.scrollY > 12
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
  <div class="relative min-h-[100dvh] bg-canvas text-ink">
    <!-- Header glass -->
    <header
      class="sticky top-0 z-50 text-white transition-[background,box-shadow] duration-300"
      :class="
        scrolled
          ? 'bg-[#c8102e]/95 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl'
          : 'bg-brand'
      "
    >
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

        <NuxtLink to="/" class="group flex items-center gap-2 justify-self-center">
          <img
            src="/logo.png"
            alt=""
            class="h-9 w-9 rounded-full bg-white object-contain p-0.5 transition-transform duration-500 group-hover:scale-105 sm:h-10 sm:w-10"
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
          <span
            class="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold leading-none text-brand"
          >
            {{ itemCount }}
          </span>
        </button>
      </div>

      <nav v-if="menuOpen" class="overflow-hidden border-t border-black/10 bg-white">
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

    <!-- Full-bleed hero -->
    <section class="relative min-h-[78dvh] w-full overflow-hidden sm:min-h-[88dvh]">
      <img
        src="/chicken.jpg"
        alt=""
        class="hero-media absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/90 via-[#9e0c24]/65 to-black/35"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent"
        aria-hidden="true"
      />

      <div
        class="relative z-10 mx-auto flex min-h-[78dvh] max-w-[900px] flex-col items-center justify-center px-6 pb-24 pt-10 text-center text-white sm:min-h-[88dvh]"
      >
        <p class="hero-fade mb-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          {{ brandName }}
        </p>
        <p
          class="hero-fade hero-fade-delay-1 mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80"
        >
          Viande fraîche · Dakar
        </p>
        <h1
          class="hero-fade hero-fade-delay-2 max-w-2xl font-display text-[1.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl"
        >
          {{ heroTitle }}
        </h1>
        <p
          class="hero-fade hero-fade-delay-3 mt-5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base"
        >
          {{ heroSubtitle }}
        </p>
        <div class="hero-fade hero-fade-delay-4 mt-10">
          <NuxtLink
            to="/commander"
            class="group inline-flex min-w-[200px] items-center justify-center gap-2 bg-white px-10 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand transition duration-300 hover:bg-brand hover:text-white"
          >
            {{ ctaLabel }}
            <PhArrowRight
              :size="14"
              weight="bold"
              class="transition-transform group-hover:translate-x-1"
            />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Marquee -->
    <div
      class="relative z-10 -mt-8 overflow-hidden border-y border-ink/10 bg-white/90 py-3 backdrop-blur-md"
      aria-hidden="true"
    >
      <div class="marquee-track gap-10 px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/50">
        <template v-for="pass in 2" :key="pass">
          <span
            v-for="(item, i) in marqueeItems"
            :key="`${pass}-${i}`"
            class="inline-flex items-center gap-10 whitespace-nowrap"
          >
            {{ item }}
            <span class="text-brand">●</span>
          </span>
        </template>
      </div>
    </div>

    <!-- Category bento -->
    <section class="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div class="reveal mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Nos univers
          </p>
          <h2 class="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Choisissez votre fraîcheur
          </h2>
        </div>
        <NuxtLink
          to="/commander"
          class="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60 transition hover:text-brand"
        >
          Voir le catalogue
          <PhCaretRight
            :size="14"
            weight="bold"
            class="transition-transform group-hover:translate-x-0.5"
          />
        </NuxtLink>
      </div>

      <div
        class="grid auto-rows-[210px] gap-3 sm:auto-rows-[240px] sm:grid-cols-2 lg:auto-rows-[260px] lg:grid-cols-4 lg:gap-4"
      >
        <NuxtLink
          v-for="(cat, idx) in categories"
          :key="cat.id"
          :to="cat.to"
          class="reveal group relative overflow-hidden rounded-2xl"
          :class="[
            cat.featured ? 'sm:col-span-2 sm:row-span-2 min-h-[280px] sm:min-h-0' : '',
            `reveal-delay-${(idx % 3) + 1}`,
          ]"
        >
          <img
            :src="cat.image"
            :alt="cat.label"
            loading="lazy"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
            aria-hidden="true"
          />
          <div class="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
            <h3
              class="font-display font-bold leading-tight"
              :class="cat.featured ? 'text-3xl sm:text-4xl' : 'text-2xl'"
            >
              {{ cat.label }}
            </h3>
            <p class="mt-1 text-xs text-white/80 sm:text-sm">{{ cat.text }}</p>
            <span
              class="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition group-hover:gap-2.5"
            >
              Commander
              <PhArrowRight :size="12" weight="bold" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Trust / delivery strip -->
    <section class="reveal bg-ink text-white">
      <div class="mx-auto grid max-w-[1400px] gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6 sm:py-16 lg:px-8">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            Fraîcheur
          </p>
          <h3 class="mt-2 font-display text-2xl font-bold">Du jour, chez vous</h3>
          <p class="mt-2 text-sm text-white/65">
            Produits préparés pour une qualité constante, livraison rapide à Dakar.
          </p>
        </div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            Simple
          </p>
          <h3 class="mt-2 font-display text-2xl font-bold">Commandez en ligne</h3>
          <p class="mt-2 text-sm text-white/65">
            Catalogue clair, panier rapide, suivi de livraison en direct.
          </p>
        </div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            Fidélité
          </p>
          <h3 class="mt-2 font-display text-2xl font-bold">Gagnez des points</h3>
          <p class="mt-2 text-sm text-white/65">
            Chaque commande vous rapproche d’avantages exclusifs.
          </p>
        </div>
      </div>
      <div class="border-t border-white/10 px-4 py-8 text-center sm:px-6">
        <NuxtLink
          to="/commander"
          class="group inline-flex items-center gap-2 bg-brand px-10 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-brand"
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
.hero-media {
  animation: hero-zoom 14s ease-out forwards;
}

.hero-fade {
  animation: hero-rise 1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.hero-fade-delay-1 {
  animation-delay: 0.1s;
}
.hero-fade-delay-2 {
  animation-delay: 0.2s;
}
.hero-fade-delay-3 {
  animation-delay: 0.3s;
}
.hero-fade-delay-4 {
  animation-delay: 0.42s;
}

@keyframes hero-zoom {
  from {
    transform: scale(1.08);
  }
  to {
    transform: scale(1);
  }
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-media,
  .hero-fade {
    animation: none;
  }
}
</style>
