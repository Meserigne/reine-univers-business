<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Connexion Admin — Reine Univers Business' })

const route = useRoute()
const config = useRuntimeConfig()
const {
  ensureSession,
  isLoggedIn,
  loginWithPassword,
  loginWithGoogleCredential,
  loginBootstrap,
  acceptToken,
  refreshMe,
  googleStartUrl,
  fetchStatus,
} = useAdminAuth()

const error = ref('')
const loading = ref(true)
const googleLoading = ref(false)
const status = ref<{
  googleEnabled: boolean
  googleConfigured?: boolean
  clientId: string | null
  allowlistConfigured: boolean
  passwordLoginEnabled?: boolean
} | null>(null)

const form = reactive({
  identifier: '',
  password: '',
})
const submitting = ref(false)

const bootstrap = reactive({
  email: '',
  secret: '',
})
const bootstrapping = ref(false)
const showBootstrap = ref(false)

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void
          prompt: (cb?: (n: { isNotDisplayed?: boolean; getNotDisplayedReason?: () => string }) => void) => void
        }
      }
    }
  }
}

async function goAdmin() {
  const redirect = String(route.query.redirect || '/admin')
  await navigateTo(redirect.startsWith('/admin') ? redirect : '/admin')
}

async function submitPassword() {
  submitting.value = true
  error.value = ''
  try {
    await loginWithPassword(form.identifier.trim(), form.password)
    await goAdmin()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Identifiant ou mot de passe incorrect'
  } finally {
    submitting.value = false
  }
}

async function handleCredential(response: { credential?: string }) {
  error.value = ''
  if (!response.credential) {
    error.value = 'Réponse Google invalide'
    return
  }
  try {
    await loginWithGoogleCredential(response.credential)
    await goAdmin()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Connexion Google refusée'
  } finally {
    googleLoading.value = false
  }
}

function loadGis() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.querySelector('script[data-google-gis]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.dataset.googleGis = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Impossible de charger Google Identity'))
    document.head.appendChild(script)
  })
}

async function continueWithGoogle() {
  error.value = ''
  const clientId =
    status.value?.clientId || (config.public.googleClientId as string) || ''

  if (!clientId) {
    error.value =
      'Google n’est pas configuré. Connectez-vous avec admin / admin123, puis ouvrez Comptes pour coller votre Client ID Google.'
    return
  }

  googleLoading.value = true
  try {
    await loadGis()
    if (!window.google?.accounts?.id) {
      // Fallback OAuth redirect
      window.location.href = googleStartUrl
      return
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      ux_mode: 'popup',
    })
    window.google.accounts.id.prompt((notification) => {
      if (notification?.isNotDisplayed?.()) {
        // Popup blocked / One Tap unavailable → redirect portal
        window.location.href = googleStartUrl
      }
    })
  } catch (e) {
    console.error(e)
    // Last resort: OAuth redirect
    window.location.href = googleStartUrl
  } finally {
    // keep loading until credential callback or redirect
    setTimeout(() => {
      googleLoading.value = false
    }, 2500)
  }
}

async function submitBootstrap() {
  bootstrapping.value = true
  error.value = ''
  try {
    await loginBootstrap(bootstrap.email.trim(), bootstrap.secret)
    await goAdmin()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Connexion impossible'
  } finally {
    bootstrapping.value = false
  }
}

onMounted(async () => {
  const qToken = String(route.query.token || '')
  if (qToken) {
    acceptToken(qToken)
    await refreshMe()
    if (isLoggedIn.value) {
      await goAdmin()
      return
    }
  }

  await ensureSession()
  if (isLoggedIn.value) {
    await goAdmin()
    return
  }

  try {
    status.value = await fetchStatus()
  } catch (e) {
    console.error(e)
    error.value = 'Impossible de charger le statut d’authentification'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12">
    <div
      class="pointer-events-none absolute inset-0 opacity-80"
      style="
        background:
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(185, 28, 28, 0.12), transparent),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(15, 118, 110, 0.1), transparent);
      "
    />

    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 text-center">
        <img src="/logo.png" alt="" class="mx-auto h-16 w-16 object-contain" />
        <h1 class="mt-4 font-display text-3xl font-bold tracking-tight">
          Admin <span class="text-brand">RUB</span>
        </h1>
        <p class="mt-2 text-sm text-ink-muted">
          Identifiant / mot de passe ou Google
        </p>
      </div>

      <div class="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div v-if="loading" class="py-10 text-center text-ink-muted">Chargement…</div>

        <div v-else class="space-y-5">
          <form class="space-y-4" @submit.prevent="submitPassword">
            <label class="block text-sm">
              <span class="mb-1 block font-medium">Identifiant</span>
              <input
                v-model="form.identifier"
                required
                minlength="2"
                autocomplete="username"
                placeholder="Email ou nom d’utilisateur"
                class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
              />
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium">Mot de passe</span>
              <input
                v-model="form.password"
                type="password"
                required
                minlength="6"
                autocomplete="current-password"
                class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
              />
            </label>
            <button
              type="submit"
              :disabled="submitting"
              class="w-full rounded-full bg-brand py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
            >
              {{ submitting ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>

          <div class="relative flex items-center gap-3">
            <div class="h-px flex-1 bg-line" />
            <span class="text-xs font-medium uppercase tracking-wider text-ink-muted">ou</span>
            <div class="h-px flex-1 bg-line" />
          </div>

          <!-- Toujours visible -->
          <button
            type="button"
            class="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-canvas disabled:opacity-60"
            :disabled="googleLoading"
            @click="continueWithGoogle"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 37.3 44 32.5 44 24c0-1.2-.1-2.3-.4-3.5z" />
            </svg>
            {{ googleLoading ? 'Ouverture Google…' : 'Continuer avec Google' }}
          </button>

          <p v-if="error" class="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            {{ error }}
          </p>

          <div class="border-t border-line pt-4">
            <button
              type="button"
              class="text-xs font-medium text-ink-muted hover:text-brand"
              @click="showBootstrap = !showBootstrap"
            >
              {{ showBootstrap ? 'Masquer' : 'Accès de secours (dev)' }}
            </button>
            <form
              v-if="showBootstrap"
              class="mt-3 space-y-3"
              @submit.prevent="submitBootstrap"
            >
              <label class="block text-sm">
                <span class="mb-1 block font-medium">Email admin</span>
                <input
                  v-model="bootstrap.email"
                  type="email"
                  required
                  class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label class="block text-sm">
                <span class="mb-1 block font-medium">Secret bootstrap</span>
                <input
                  v-model="bootstrap.secret"
                  type="password"
                  required
                  minlength="6"
                  class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <button
                type="submit"
                :disabled="bootstrapping"
                class="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {{ bootstrapping ? 'Connexion…' : 'Se connecter' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-ink-muted">
        <NuxtLink to="/" class="hover:text-brand">← Retour au site</NuxtLink>
      </p>
    </div>
  </div>
</template>
