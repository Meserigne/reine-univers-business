<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Connexion — Reine Univers Business' })

const { login, isLoggedIn, ensureSession } = useAuth()
const route = useRoute()
await ensureSession()

if (isLoggedIn.value) {
  await navigateTo((route.query.redirect as string) || '/compte')
}

const form = reactive({ phone: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login({ phone: form.phone, password: form.password })
    await navigateTo((route.query.redirect as string) || '/compte')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Connexion impossible'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-surface">
      <div class="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="font-display text-lg font-bold">
          Reine <span class="text-brand">Univers</span>
        </NuxtLink>
        <NuxtLink to="/commander" class="text-sm text-ink-muted hover:text-brand">Catalogue</NuxtLink>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 py-12">
      <h1 class="font-display text-3xl font-bold tracking-tight">Connexion</h1>
      <p class="mt-2 text-sm text-ink-muted">
        Accédez à vos commandes, factures et points fidélité.
      </p>

      <form class="mt-8 space-y-4 rounded-3xl border border-line bg-surface p-6" @submit.prevent="submit">
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Téléphone</span>
          <input
            v-model="form.phone"
            required
            type="tel"
            minlength="8"
            placeholder="+22177…"
            class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Mot de passe</span>
          <input
            v-model="form.password"
            required
            type="password"
            minlength="6"
            class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
          />
        </label>
        <p v-if="error" class="text-sm text-brand">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-full bg-brand py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
        >
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-ink-muted">
        Pas encore de compte ?
        <NuxtLink to="/compte/inscription" class="font-semibold text-brand hover:underline">
          Créer un compte
        </NuxtLink>
      </p>
    </main>
  </div>
</template>
