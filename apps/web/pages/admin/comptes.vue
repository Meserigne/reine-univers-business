<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const error = ref('')
const saving = ref(false)

const { data: accounts, pending, refresh } = await useAsyncData('admin-accounts', () =>
  api.adminAccounts(),
)
const { data: authSettings, refresh: refreshSettings } = await useAsyncData(
  'admin-auth-settings',
  () => api.adminAuthSettings(),
)

const showForm = ref(false)
const form = reactive({
  email: '',
  username: '',
  name: '',
  password: '',
})

const googleForm = reactive({
  googleClientId: '',
  googleClientSecret: '',
  googleAllowedEmails: '',
})

watch(
  authSettings,
  (s) => {
    if (!s) return
    googleForm.googleClientId = s.googleClientId || ''
    googleForm.googleAllowedEmails = s.googleAllowedEmails || ''
    googleForm.googleClientSecret = ''
  },
  { immediate: true },
)

function openCreate() {
  Object.assign(form, { email: '', username: '', name: '', password: '' })
  error.value = ''
  showForm.value = true
}

async function saveAccount() {
  saving.value = true
  error.value = ''
  try {
    await api.createAdminAccount({
      email: form.email.trim(),
      username: form.username.trim(),
      name: form.name.trim(),
      password: form.password,
    })
    showForm.value = false
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur création'
  } finally {
    saving.value = false
  }
}

async function removeAccount(id: string, label: string) {
  if (!confirm(`Supprimer le compte « ${label} » ?`)) return
  error.value = ''
  try {
    await api.deleteAdminAccount(id)
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Suppression impossible'
  }
}

async function toggleActive(id: string, active: boolean) {
  await api.updateAdminAccount(id, { active: !active })
  await refresh()
}

async function saveGoogle() {
  saving.value = true
  error.value = ''
  try {
    const body: Record<string, string> = {
      googleClientId: googleForm.googleClientId.trim(),
      googleAllowedEmails: googleForm.googleAllowedEmails.trim(),
    }
    if (googleForm.googleClientSecret.trim()) {
      body.googleClientSecret = googleForm.googleClientSecret.trim()
    }
    await api.updateAdminAuthSettings(body)
    googleForm.googleClientSecret = ''
    await refreshSettings()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur Google'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-3xl font-bold tracking-tight">Comptes admin</h1>
      <p class="mt-1 text-ink-muted">
        Comptes mot de passe et configuration Google Sign-In
      </p>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
      {{ error }}
    </p>

    <!-- Google config -->
    <section class="mb-8 rounded-2xl border border-line bg-surface p-6">
      <h2 class="font-display text-xl font-bold">Continuer avec Google</h2>
      <p class="mt-1 text-sm text-ink-muted">
        Créez un client OAuth sur
        <a
          href="https://console.cloud.google.com/apis/credentials"
          target="_blank"
          rel="noreferrer"
          class="text-brand underline"
        >Google Cloud Console</a>
        (type Application Web). Origines :
        <code class="text-xs">http://127.0.0.1:3000</code>
      </p>
      <form class="mt-4 grid gap-3 sm:grid-cols-2" @submit.prevent="saveGoogle">
        <label class="block text-sm sm:col-span-2">
          <span class="mb-1 block font-medium">Google Client ID</span>
          <input
            v-model="googleForm.googleClientId"
            placeholder="xxxxx.apps.googleusercontent.com"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm sm:col-span-2">
          <span class="mb-1 block font-medium">
            Google Client Secret
            <span v-if="authSettings?.googleClientSecretSet" class="text-emerald-700">(déjà enregistré)</span>
          </span>
          <input
            v-model="googleForm.googleClientSecret"
            type="password"
            placeholder="Laisser vide pour ne pas changer"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label class="block text-sm sm:col-span-2">
          <span class="mb-1 block font-medium">Emails Google autorisés (virgules)</span>
          <input
            v-model="googleForm.googleAllowedEmails"
            placeholder="toi@gmail.com, autre@gmail.com"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
          <span class="mt-1 block text-xs text-ink-muted">
            Les emails des comptes admin ci-dessous sont aussi acceptés automatiquement.
          </span>
        </label>
        <div class="sm:col-span-2">
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {{ saving ? 'Enregistrement…' : 'Enregistrer Google' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Accounts -->
    <div class="mb-4 flex items-end justify-between gap-3">
      <h2 class="font-display text-xl font-bold">Comptes (user / password)</h2>
      <button
        type="button"
        class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        @click="openCreate"
      >
        + Nouvel admin
      </button>
    </div>

    <div v-if="pending && !accounts" class="text-ink-muted">Chargement…</div>
    <div v-else class="space-y-2">
      <article
        v-for="a in accounts"
        :key="a.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4"
      >
        <div>
          <p class="font-semibold">{{ a.name }}</p>
          <p class="text-sm text-ink-muted">
            {{ a.username }} · {{ a.email }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full px-2.5 py-1 text-xs font-medium"
            :class="a.active ? 'bg-emerald-50 text-emerald-800' : 'bg-canvas text-ink-muted'"
            @click="toggleActive(a.id, a.active)"
          >
            {{ a.active ? 'Actif' : 'Inactif' }}
          </button>
          <button
            type="button"
            class="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand"
            @click="removeAccount(a.id, a.username)"
          >
            Supprimer
          </button>
        </div>
      </article>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" class="absolute inset-0 bg-ink/40" aria-label="Fermer" @click="showForm = false" />
      <form
        class="relative z-10 w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="saveAccount"
      >
        <h2 class="font-display text-xl font-bold">Nouvel admin</h2>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nom</span>
          <input v-model="form.name" required minlength="2" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Nom d’utilisateur</span>
          <input v-model="form.username" required minlength="2" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Email</span>
          <input v-model="form.email" type="email" required class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Mot de passe</span>
          <input v-model="form.password" type="password" required minlength="6" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="rounded-xl border border-line px-4 py-2 text-sm" @click="showForm = false">
            Annuler
          </button>
          <button type="submit" :disabled="saving" class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            Créer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
