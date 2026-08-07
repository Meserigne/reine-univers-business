<script setup lang="ts">
import {
  PhChartBar,
  PhTag,
  PhPackage,
  PhShoppingCart,
  PhReceipt,
  PhUsers,
  PhArticle,
  PhEnvelope,
  PhStar,
  PhStorefront,
  PhMotorcycle,
  PhList,
  PhX,
  PhUserGear,
  PhBell,
} from '@phosphor-icons/vue'

useHead({ title: 'Admin — Reine Univers Business' })

const route = useRoute()
const open = ref(false)

const { admin, logout, ensureSession } = useAdminAuth()
await ensureSession()

async function handleLogout() {
  logout()
  await navigateTo('/admin/connexion')
}

const links = [
  { to: '/admin', label: 'Tableau de bord', icon: PhChartBar, exact: true },
  { to: '/admin/categories', label: 'Catégories', icon: PhTag },
  { to: '/admin/produits', label: 'Produits', icon: PhPackage },
  { to: '/admin/commandes', label: 'Commandes', icon: PhShoppingCart },
  { to: '/admin/livraison', label: 'Livraison', icon: PhMotorcycle },
  { to: '/admin/factures', label: 'Facturation', icon: PhReceipt },
  { to: '/admin/clients', label: 'Clients', icon: PhUsers },
  { to: '/admin/contenu', label: 'Contenu du site', icon: PhArticle },
  { to: '/admin/messages', label: 'Messages', icon: PhEnvelope },
  { to: '/admin/fidelite', label: 'Fidélité', icon: PhStar },
  { to: '/admin/comptes', label: 'Comptes', icon: PhUserGear },
  { to: '/admin/notifications', label: 'Notifications', icon: PhBell },
]

function isActive(to: string, exact?: boolean) {
  if (exact) return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="min-h-screen bg-canvas text-ink">
    <div class="flex min-h-screen">
      <aside
        class="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-line bg-surface transition-transform lg:static lg:translate-x-0"
        :class="open ? 'translate-x-0' : ''"
      >
        <div class="flex h-16 items-center justify-between border-b border-line px-5">
          <NuxtLink to="/admin" class="font-display text-lg font-bold tracking-tight" @click="open = false">
            Admin <span class="text-brand">RUB</span>
          </NuxtLink>
          <button
            type="button"
            class="rounded-lg p-2 hover:bg-canvas lg:hidden"
            aria-label="Fermer"
            @click="open = false"
          >
            <PhX :size="18" weight="bold" />
          </button>
        </div>
        <nav class="flex flex-col gap-1 p-3">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            :class="
              isActive(link.to, link.exact)
                ? 'bg-brand text-white'
                : 'text-ink-muted hover:bg-canvas hover:text-ink'
            "
            @click="open = false"
          >
            <component :is="link.icon" :size="18" weight="duotone" />
            {{ link.label }}
          </NuxtLink>
        </nav>
        <div class="absolute bottom-0 inset-x-0 border-t border-line p-3">
          <NuxtLink
            to="/"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-canvas hover:text-ink"
          >
            <PhStorefront :size="18" weight="duotone" />
            Voir le site
          </NuxtLink>
        </div>
      </aside>

      <div
        v-if="open"
        class="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        @click="open = false"
      />

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:px-8">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-lg p-2 hover:bg-canvas lg:hidden"
              aria-label="Menu"
              @click="open = true"
            >
              <PhList :size="20" weight="bold" />
            </button>
            <p class="font-display text-base font-semibold">Gestion de l'application</p>
          </div>
          <div v-if="admin" class="flex items-center gap-3">
            <img
              v-if="admin.picture"
              :src="admin.picture"
              alt=""
              class="h-8 w-8 rounded-full border border-line object-cover"
            />
            <div class="hidden text-right sm:block">
              <p class="text-xs font-semibold">{{ admin.name }}</p>
              <p class="text-[11px] text-ink-muted">{{ admin.email }}</p>
            </div>
            <button
              type="button"
              class="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold hover:bg-canvas"
              @click="handleLogout"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <main class="flex-1 p-4 lg:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
