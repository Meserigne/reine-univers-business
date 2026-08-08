<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const error = ref('')
const success = ref('')
const saving = ref(false)
const testing = ref(false)

const { data: settings, refresh: refreshSettings } = await useAsyncData(
  'admin-notification-settings',
  () => api.notificationSettings(),
)
const { data: logs, refresh: refreshLogs } = await useAsyncData(
  'admin-notifications',
  () => api.notifications(),
)

const form = reactive({
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  notifyPlaced: true,
  notifyPreparing: true,
  notifyDeparted: true,
  notifyDelivered: true,
  notifyCancelled: true,
  emailProvider: 'resend',
  emailFrom: 'RUBFresh <onboarding@resend.dev>',
  resendApiKey: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
})

const testTo = ref('meserigne@gmail.com')

watch(
  settings,
  (s) => {
    if (!s) return
    form.emailEnabled = s.emailEnabled
    form.smsEnabled = s.smsEnabled
    form.pushEnabled = s.pushEnabled
    form.inAppEnabled = s.inAppEnabled
    form.notifyPlaced = s.notifyPlaced
    form.notifyPreparing = s.notifyPreparing
    form.notifyDeparted = s.notifyDeparted
    form.notifyDelivered = s.notifyDelivered
    form.notifyCancelled = s.notifyCancelled
    form.emailProvider = s.emailProvider || 'resend'
    form.emailFrom = s.emailFrom || 'RUBFresh <onboarding@resend.dev>'
    form.smtpHost = s.smtpHost || ''
    form.smtpPort = s.smtpPort || 587
    form.smtpUser = s.smtpUser || ''
    form.resendApiKey = ''
    form.smtpPass = ''
  },
  { immediate: true },
)

async function save() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const body: Record<string, unknown> = {
      emailEnabled: form.emailEnabled,
      smsEnabled: form.smsEnabled,
      pushEnabled: form.pushEnabled,
      inAppEnabled: form.inAppEnabled,
      notifyPlaced: form.notifyPlaced,
      notifyPreparing: form.notifyPreparing,
      notifyDeparted: form.notifyDeparted,
      notifyDelivered: form.notifyDelivered,
      notifyCancelled: form.notifyCancelled,
      emailProvider: form.emailProvider,
      emailFrom: form.emailFrom.trim(),
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort) || 587,
      smtpUser: form.smtpUser.trim(),
    }
    if (form.resendApiKey.trim()) body.resendApiKey = form.resendApiKey.trim()
    if (form.smtpPass.trim()) body.smtpPass = form.smtpPass.trim()
    await api.updateNotificationSettings(body)
    form.resendApiKey = ''
    form.smtpPass = ''
    await refreshSettings()
    success.value = 'Paramètres enregistrés'
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Erreur enregistrement'
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  testing.value = true
  error.value = ''
  success.value = ''
  try {
    await api.testNotificationEmail(testTo.value.trim())
    success.value = `Email de test envoyé à ${testTo.value.trim()}`
    await refreshLogs()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Échec envoi test'
  } finally {
    testing.value = false
  }
}

const channelLabel: Record<string, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push app',
  IN_APP: 'In-app',
}

const eventLabel: Record<string, string> = {
  ORDER_PLACED: 'Commande reçue',
  ORDER_PREPARING: 'Préparation',
  COURIER_DEPARTED: 'Départ livreur',
  ORDER_DELIVERED: 'Livrée',
  ORDER_CANCELLED: 'Annulée',
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Notifications</h1>
        <p class="mt-1 text-ink-muted">
          Email, SMS et push à chaque étape — prêt pour les apps Play Store / App Store
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-line px-3 py-2 text-sm"
        @click="refreshLogs()"
      >
        Rafraîchir journal
      </button>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
      {{ error }}
    </p>
    <p v-if="success" class="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {{ success }}
    </p>

    <section class="mb-8 rounded-2xl border border-line bg-surface p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-xl font-bold">Configuration email</h2>
          <p class="mt-1 text-sm text-ink-muted">
            Créez une clé sur
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noreferrer"
              class="text-brand underline"
            >resend.com</a>
            (gratuit). Sans clé, aucun mail n’est envoyé.
          </p>
        </div>
        <span
          class="rounded-full px-2.5 py-1 text-xs font-medium"
          :class="
            settings?.emailReady
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-brand-soft text-brand-dark'
          "
        >
          {{ settings?.emailReady ? `Prêt (${settings.resolvedEmailProvider})` : 'Non configuré' }}
        </span>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Fournisseur</span>
          <select
            v-model="form.emailProvider"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          >
            <option value="resend">Resend (recommandé)</option>
            <option value="smtp">SMTP</option>
            <option value="console">Console (dev uniquement)</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium">Expéditeur (From)</span>
          <input
            v-model="form.emailFrom"
            placeholder="RUBFresh &lt;onboarding@resend.dev&gt;"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label v-if="form.emailProvider === 'resend'" class="block text-sm sm:col-span-2">
          <span class="mb-1 block font-medium">
            Clé API Resend
            <span v-if="settings?.resendApiKeySet" class="text-emerald-700">(déjà enregistrée)</span>
          </span>
          <input
            v-model="form.resendApiKey"
            type="password"
            autocomplete="off"
            placeholder="re_xxxxxxxx — laisser vide pour ne pas changer"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <template v-if="form.emailProvider === 'smtp'">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">SMTP host</span>
            <input v-model="form.smtpHost" placeholder="smtp.gmail.com" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Port</span>
            <input v-model.number="form.smtpPort" type="number" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Utilisateur</span>
            <input v-model="form.smtpUser" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">
              Mot de passe
              <span v-if="settings?.smtpPassSet" class="text-emerald-700">(déjà enregistré)</span>
            </span>
            <input v-model="form.smtpPass" type="password" placeholder="Laisser vide pour ne pas changer" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
        </template>
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-2">
        <label class="block min-w-[220px] flex-1 text-sm">
          <span class="mb-1 block font-medium">Email de test</span>
          <input
            v-model="testTo"
            type="email"
            class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <button
          type="button"
          class="rounded-xl border border-line px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          :disabled="testing"
          @click="sendTest"
        >
          {{ testing ? 'Envoi…' : 'Envoyer un test' }}
        </button>
      </div>
    </section>

    <section class="mb-8 rounded-2xl border border-line bg-surface p-6">
      <h2 class="font-display text-xl font-bold">Canaux</h2>
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <label
          v-for="key in [
            ['emailEnabled', 'Email'],
            ['smsEnabled', 'SMS'],
            ['pushEnabled', 'Push mobile (Expo)'],
            ['inAppEnabled', 'Notifications in-app'],
          ] as const"
          :key="key[0]"
          class="flex items-center gap-2 text-sm"
        >
          <input v-model="form[key[0]]" type="checkbox" class="rounded border-line" />
          {{ key[1] }}
        </label>
      </div>

      <h3 class="mt-6 font-semibold">Étapes de commande</h3>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <label
          v-for="key in [
            ['notifyPlaced', 'Commande reçue'],
            ['notifyPreparing', 'En préparation'],
            ['notifyDeparted', 'Livreur parti (SMS GPS)'],
            ['notifyDelivered', 'Commande livrée'],
            ['notifyCancelled', 'Commande annulée'],
          ] as const"
          :key="key[0]"
          class="flex items-center gap-2 text-sm"
        >
          <input v-model="form[key[0]]" type="checkbox" class="rounded border-line" />
          {{ key[1] }}
        </label>
      </div>

      <button
        type="button"
        class="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </section>

    <section>
      <h2 class="mb-3 font-display text-xl font-bold">Journal récent</h2>
      <div class="space-y-2">
        <article
          v-for="n in logs"
          :key="n.id"
          class="rounded-2xl border border-line bg-surface px-4 py-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-semibold">
              {{ eventLabel[n.event] || n.event }}
              ·
              {{ channelLabel[n.channel] || n.channel }}
            </p>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                n.status === 'sent' || n.status === 'read'
                  ? 'bg-emerald-50 text-emerald-800'
                  : n.status === 'failed'
                    ? 'bg-brand-soft text-brand-dark'
                    : 'bg-canvas text-ink-muted'
              "
            >
              {{ n.status }}
            </span>
          </div>
          <p class="mt-1 text-sm text-ink-muted">{{ n.body }}</p>
          <p v-if="n.error" class="mt-1 text-xs text-brand-dark">{{ n.error }}</p>
          <p class="mt-1 text-xs text-ink-muted">
            {{ n.phone || n.email || '—' }}
            ·
            {{ new Date(n.createdAt).toLocaleString('fr-FR') }}
          </p>
        </article>
        <p v-if="!logs?.length" class="text-sm text-ink-muted">Aucune notification pour l’instant.</p>
      </div>
    </section>
  </div>
</template>
