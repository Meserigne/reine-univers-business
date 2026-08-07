<script setup lang="ts">
import { formatPrice } from '~/types/catalog'
import { POINT_VALUE_FCFA, formatPoints } from '~/utils/loyalty'

definePageMeta({ layout: 'default' })
useHead({ title: 'Mon compte — Reine Univers Business' })

const { customer, isLoggedIn, ensureSession, logout, updateProfile, myOrders, refreshMe } = useAuth()
await ensureSession()

if (!isLoggedIn.value) {
  await navigateTo('/compte/connexion?redirect=/compte')
}

const { data: orders, refresh: refreshOrders } = await useAsyncData(
  'my-orders',
  () => myOrders(),
  { immediate: !!isLoggedIn.value },
)

const tab = ref<'orders' | 'fidelity' | 'profile'>('orders')
const saving = ref(false)
const message = ref('')
const error = ref('')

const profile = reactive({
  name: customer.value?.name || '',
  email: customer.value?.email || '',
  address: customer.value?.address || '',
  password: '',
})

watch(
  customer,
  (c) => {
    if (!c) return
    profile.name = c.name
    profile.email = c.email || ''
    profile.address = c.address || ''
  },
  { immediate: true },
)

const points = computed(() => customer.value?.points ?? 0)
const pointsValue = computed(
  () => customer.value?.pointsValueFcfa ?? points.value * POINT_VALUE_FCFA,
)

const statusLabel: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

async function saveProfile() {
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    await updateProfile({
      name: profile.name,
      email: profile.email || undefined,
      address: profile.address || undefined,
      password: profile.password || undefined,
    })
    profile.password = ''
    message.value = 'Profil mis à jour'
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur'
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  logout()
  await navigateTo('/')
}

onMounted(() => {
  void refreshMe()
})
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-surface">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="font-display text-lg font-bold">
          Reine <span class="text-brand">Univers</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <NuxtLink to="/commander" class="text-sm text-ink-muted hover:text-brand">Catalogue</NuxtLink>
          <button type="button" class="text-sm font-medium text-brand" @click="handleLogout">
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <main v-if="customer" class="mx-auto max-w-3xl px-4 py-10">
      <div class="mb-8">
        <h1 class="font-display text-3xl font-bold tracking-tight">
          Bonjour {{ customer.name.split(' ')[0] }}
        </h1>
        <p class="mt-1 text-ink-muted">{{ customer.phone }}</p>
      </div>

      <div class="mb-8 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          class="rounded-2xl border border-line bg-surface p-5 text-left hover:border-brand"
          @click="tab = 'fidelity'"
        >
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Points fidélité</p>
          <p class="mt-2 font-display text-3xl font-bold text-brand">{{ points }}</p>
          <p class="mt-1 text-sm text-ink-muted">= {{ formatPrice(pointsValue) }}</p>
        </button>
        <div class="rounded-2xl border border-line bg-surface p-5">
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Commandes</p>
          <p class="mt-2 font-display text-3xl font-bold">{{ customer.orderCount ?? orders?.length ?? 0 }}</p>
        </div>
        <div class="rounded-2xl bg-brand p-5 text-white">
          <p class="text-xs font-semibold uppercase tracking-wider text-white/70">Payer avec points</p>
          <p class="mt-2 font-display text-lg font-bold">Au checkout</p>
          <p class="mt-1 text-sm text-white/80">1 pt = {{ formatPrice(POINT_VALUE_FCFA) }}</p>
        </div>
      </div>

      <div class="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full px-4 py-2 text-sm font-semibold"
          :class="tab === 'orders' ? 'bg-brand text-white' : 'border border-line bg-surface'"
          @click="tab = 'orders'; refreshOrders()"
        >
          Mes commandes
        </button>
        <button
          type="button"
          class="rounded-full px-4 py-2 text-sm font-semibold"
          :class="tab === 'fidelity' ? 'bg-brand text-white' : 'border border-line bg-surface'"
          @click="tab = 'fidelity'"
        >
          Fidélité
        </button>
        <button
          type="button"
          class="rounded-full px-4 py-2 text-sm font-semibold"
          :class="tab === 'profile' ? 'bg-brand text-white' : 'border border-line bg-surface'"
          @click="tab = 'profile'"
        >
          Mon profil
        </button>
      </div>

      <div v-if="tab === 'orders'" class="space-y-3">
        <p v-if="!orders?.length" class="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-ink-muted">
          Aucune commande pour le moment.
          <NuxtLink to="/commander" class="mt-2 block font-semibold text-brand">Commander</NuxtLink>
        </p>
        <article
          v-for="order in orders"
          :key="order.id"
          class="rounded-2xl border border-line bg-surface p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-mono text-xs font-semibold text-brand">
                {{ order.invoiceNumber || order.id.slice(-8).toUpperCase() }}
              </p>
              <p class="mt-1 text-sm text-ink-muted">{{ formatDate(order.createdAt) }}</p>
              <p class="mt-1 text-sm">{{ order.address }}</p>
            </div>
            <div class="text-right">
              <p class="font-display text-lg font-bold">{{ formatPrice(order.total) }}</p>
              <p v-if="order.pointsRedeemed" class="text-xs text-emerald-700">
                −{{ order.pointsRedeemed }} pt
              </p>
              <p class="text-xs font-medium text-ink-muted">{{ statusLabel[order.status] || order.status }}</p>
            </div>
          </div>
          <ul class="mt-3 space-y-1 text-sm text-ink-muted">
            <li v-for="(item, i) in order.items" :key="i">
              {{ item.quantity }}× {{ item.productName }}
            </li>
          </ul>
          <div class="mt-4 flex flex-wrap gap-2">
            <NuxtLink
              :to="`/suivi/${order.id}`"
              class="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white"
            >
              Suivi
            </NuxtLink>
            <NuxtLink
              :to="`/facture/${order.id}`"
              class="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
            >
              Facture
            </NuxtLink>
          </div>
        </article>
      </div>

      <div v-else-if="tab === 'fidelity'" class="space-y-4">
        <div class="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Votre solde</p>
          <p class="mt-2 font-display text-5xl font-bold text-brand">{{ points }}</p>
          <p class="mt-2 text-lg text-ink-muted">
            Valeur : <strong class="text-ink">{{ formatPrice(pointsValue) }}</strong>
          </p>
          <NuxtLink
            to="/commander"
            class="mt-6 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Commander et utiliser mes points
          </NuxtLink>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-6">
          <h2 class="font-display text-xl font-bold">Comment ça marche</h2>
          <ul class="mt-4 space-y-3 text-sm text-ink-muted">
            <li>
              <strong class="text-ink">Gagner :</strong>
              1 point pour chaque {{ formatPrice(POINT_VALUE_FCFA) }} payés (hors part réglée en points).
            </li>
            <li>
              <strong class="text-ink">Payer :</strong>
              au checkout, choisissez « Utiliser mes points ».
              {{ formatPoints(1) }} = {{ formatPrice(POINT_VALUE_FCFA) }} de réduction.
            </li>
            <li>
              <strong class="text-ink">Livraison :</strong>
              si les points ne couvrent pas tout, le reste se paie à la livraison.
            </li>
          </ul>
        </div>
      </div>

      <form
        v-else
        class="max-w-lg space-y-4 rounded-2xl border border-line bg-surface p-6"
        @submit.prevent="saveProfile"
      >
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nom</span>
          <input
            v-model="profile.name"
            required
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Téléphone</span>
          <input
            :value="customer.phone"
            disabled
            class="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-ink-muted"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Email</span>
          <input
            v-model="profile.email"
            type="email"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Adresse</span>
          <input
            v-model="profile.address"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nouveau mot de passe</span>
          <input
            v-model="profile.password"
            type="password"
            minlength="6"
            placeholder="Laisser vide pour ne pas changer"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <p v-if="message" class="text-sm text-emerald-700">{{ message }}</p>
        <p v-if="error" class="text-sm text-brand">{{ error }}</p>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </form>
    </main>
  </div>
</template>
