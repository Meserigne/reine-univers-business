<script setup lang="ts">
import { PhShoppingCart, PhList, PhUser } from '@phosphor-icons/vue'

defineProps<{ menuOpen: boolean }>()
const emit = defineEmits<{ toggleMenu: [] }>()

const { itemCount, openCart } = useCart()
const { isLoggedIn, customer, ensureSession } = useAuth()
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 12
}

onMounted(() => {
  ensureSession()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

const navLinks = [
  { to: '/', label: 'Accueil', route: true },
  { href: '#catalogue', label: 'Catalogue' },
  { href: '#livraison', label: 'Livraison' },
  { href: '#fidelite', label: 'Fidélité' },
  { href: '#contact', label: 'Contact' },
]
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 border-b bg-surface/80 backdrop-blur-xl transition-[background,box-shadow,border-color] duration-300"
    :class="
      scrolled
        ? 'border-line bg-surface/95 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]'
        : 'border-line/80'
    "
  >
    <div class="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="group flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="Reine Univers Business"
          class="h-11 w-11 object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <span class="hidden flex-col leading-tight sm:flex">
          <span class="font-display text-sm font-bold tracking-tight text-ink transition-colors group-hover:text-brand">
            Reine Univers Business
          </span>
          <span class="text-[10px] font-medium uppercase tracking-[0.14em] text-brand">
            Viande fraîche
          </span>
        </span>
      </NuxtLink>

      <nav class="hidden items-center gap-8 md:flex">
        <NuxtLink
          v-for="link in navLinks.filter((l) => l.route)"
          :key="link.label"
          :to="link.to!"
          class="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          {{ link.label }}
        </NuxtLink>
        <a
          v-for="link in navLinks.filter((l) => !l.route)"
          :key="link.label"
          :href="link.href"
          class="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full text-ink md:hidden"
          aria-label="Menu"
          @click="emit('toggleMenu')"
        >
          <PhList :size="22" weight="bold" />
        </button>
        <NuxtLink
          :to="isLoggedIn ? '/compte' : '/compte/connexion'"
          class="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-canvas sm:h-11 sm:w-auto sm:gap-2 sm:px-3"
          :aria-label="isLoggedIn ? 'Mon compte' : 'Connexion'"
        >
          <PhUser :size="18" weight="bold" />
          <span class="hidden text-sm font-semibold sm:inline">
            {{ isLoggedIn ? customer?.name?.split(' ')[0] : 'Compte' }}
          </span>
        </NuxtLink>
        <button
          type="button"
          class="relative flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          @click="openCart"
        >
          <PhShoppingCart :size="18" weight="bold" />
          <span class="hidden sm:inline">Panier</span>
          <span
            v-if="itemCount > 0"
            class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white"
          >
            {{ itemCount }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>
