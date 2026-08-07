<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const error = ref('')
const saving = ref(false)

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
})

watch(
  settings,
  (s) => {
    if (!s) return
    Object.assign(form, s)
  },
  { immediate: true },
)

async function save() {
  saving.value = true
  error.value = ''
  try {
    await api.updateNotificationSettings({ ...form })
    await refreshSettings()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Erreur enregistrement'
  } finally {
    saving.value = false
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

    <section class="mb-8 rounded-2xl border border-line bg-surface p-6">
      <h2 class="font-display text-xl font-bold">Canaux</h2>
      <p class="mt-1 text-sm text-ink-muted">
        Sans clés API, le mode <code>console</code> journalise (dev). Configurez Resend / Twilio / Expo dans l’API.
      </p>
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
