<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { data: content, pending, refresh } = await useAsyncData('admin-content', () =>
  api.content(),
)

const form = reactive({
  brandName: '',
  heroTitle: '',
  heroSubtitle: '',
  ctaLabel: '',
  deliveryEyebrow: '',
  deliveryTitle: '',
  deliveryText: '',
  deliveryFast: '',
  deliveryHours: '',
  deliveryZones: '',
  loyaltyEyebrow: '',
  loyaltyTitle: '',
  loyaltyText: '',
  phone: '',
  whatsapp: '',
  email: '',
})

watch(
  content,
  (c) => {
    if (!c) return
    Object.assign(form, {
      brandName: c.brandName,
      heroTitle: c.heroTitle,
      heroSubtitle: c.heroSubtitle,
      ctaLabel: c.ctaLabel,
      deliveryEyebrow: c.deliveryEyebrow,
      deliveryTitle: c.deliveryTitle,
      deliveryText: c.deliveryText,
      deliveryFast: c.deliveryFast,
      deliveryHours: c.deliveryHours,
      deliveryZones: c.deliveryZones,
      loyaltyEyebrow: c.loyaltyEyebrow,
      loyaltyTitle: c.loyaltyTitle,
      loyaltyText: c.loyaltyText,
      phone: c.phone,
      whatsapp: c.whatsapp,
      email: c.email,
    })
  },
  { immediate: true },
)

const saving = ref(false)
const message = ref('')
const error = ref('')

async function save() {
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    await api.updateContent({ ...form })
    await refresh()
    message.value = 'Contenu enregistré'
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-3xl font-bold tracking-tight">Contenu du site</h1>
      <p class="mt-1 text-ink-muted">Textes de l’accueil, livraison, fidélité et contact</p>
    </div>

    <div v-if="pending && !content" class="text-ink-muted">Chargement…</div>

    <form v-else class="max-w-3xl space-y-8" @submit.prevent="save">
      <section class="rounded-2xl border border-line bg-surface p-6">
        <h2 class="font-display text-lg font-bold">Marque & héros</h2>
        <div class="mt-4 grid gap-4">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Nom de la marque</span>
            <input v-model="form.brandName" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Titre héros</span>
            <input v-model="form.heroTitle" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Sous-titre</span>
            <textarea v-model="form.heroSubtitle" rows="2" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Libellé du bouton</span>
            <input v-model="form.ctaLabel" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-6">
        <h2 class="font-display text-lg font-bold">Livraison</h2>
        <div class="mt-4 grid gap-4">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Sur-titre</span>
            <input v-model="form.deliveryEyebrow" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Titre</span>
            <input v-model="form.deliveryTitle" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Texte</span>
            <textarea v-model="form.deliveryText" rows="2" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Livraison rapide</span>
            <input v-model="form.deliveryFast" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Horaires</span>
            <input v-model="form.deliveryHours" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Zones</span>
            <input v-model="form.deliveryZones" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-6">
        <h2 class="font-display text-lg font-bold">Fidélité</h2>
        <div class="mt-4 grid gap-4">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Sur-titre</span>
            <input v-model="form.loyaltyEyebrow" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Titre</span>
            <input v-model="form.loyaltyTitle" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Texte</span>
            <textarea v-model="form.loyaltyText" rows="3" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-surface p-6">
        <h2 class="font-display text-lg font-bold">Contact</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Téléphone</span>
            <input v-model="form.phone" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">WhatsApp</span>
            <input v-model="form.whatsapp" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Email</span>
            <input v-model="form.email" type="email" class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand" />
          </label>
        </div>
      </section>

      <p v-if="message" class="text-sm font-medium text-emerald-700">{{ message }}</p>
      <p v-if="error" class="text-sm text-brand-dark">{{ error }}</p>

      <button
        type="submit"
        :disabled="saving"
        class="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {{ saving ? 'Enregistrement…' : 'Enregistrer le contenu' }}
      </button>
    </form>
  </div>
</template>
