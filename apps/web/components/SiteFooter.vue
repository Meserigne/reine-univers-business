<script setup lang="ts">
import { PhPhone, PhWhatsappLogo, PhEnvelopeSimple } from '@phosphor-icons/vue'

const props = defineProps<{
  brandName: string
  phone: string
  whatsapp: string
  email: string
}>()

const phoneDisplay = computed(() =>
  props.phone.replace('+221', '+221 ').replace(/(\d{2})(?=\d)/g, '$1 ').trim(),
)
</script>

<template>
  <footer id="contact" class="scroll-mt-20 border-t border-line bg-surface">
    <div class="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
      <div>
        <img src="/logo.png" :alt="brandName" class="h-24 w-24 object-contain" />
        <p class="mt-3 font-display text-xl font-bold tracking-tight text-ink">
          {{ brandName }}
        </p>
        <p class="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          Viande fraîche livrée chez vous : poulet, œufs, mouton, veau et porc.
          Qualité du jour, confiance et livraison rapide.
        </p>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Contact</p>
        <ul class="mt-4 space-y-3 text-sm">
          <li>
            <a :href="`tel:${phone}`" class="inline-flex items-center gap-2 font-medium text-ink hover:text-brand">
              <PhPhone :size="18" weight="fill" class="text-brand" />
              {{ phoneDisplay }}
            </a>
          </li>
          <li>
            <a
              :href="`https://wa.me/${whatsapp}`"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-2 font-medium text-ink hover:text-brand"
            >
              <PhWhatsappLogo :size="18" weight="fill" class="text-brand" />
              WhatsApp
            </a>
          </li>
          <li>
            <a
              :href="`mailto:${email}`"
              class="inline-flex items-center gap-2 font-medium text-ink hover:text-brand"
            >
              <PhEnvelopeSimple :size="18" weight="fill" class="text-brand" />
              {{ email }}
            </a>
          </li>
        </ul>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Navigation</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li><NuxtLink to="/" class="text-ink hover:text-brand">Accueil</NuxtLink></li>
          <li><a href="#catalogue" class="text-ink hover:text-brand">Catalogue</a></li>
          <li><a href="#livraison" class="text-ink hover:text-brand">Livraison</a></li>
          <li><a href="#fidelite" class="text-ink hover:text-brand">Fidélité</a></li>
          <li><NuxtLink to="/compte" class="text-ink hover:text-brand">Mon compte</NuxtLink></li>
          <li><a href="#contact" class="text-ink hover:text-brand">Contact</a></li>
          <li><NuxtLink to="/admin" class="text-ink-muted hover:text-brand">Admin</NuxtLink></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-line py-5 text-center text-xs text-ink-muted">
      © {{ new Date().getFullYear() }} {{ brandName }}. Viande fraîche. Tous droits réservés.
    </div>
  </footer>
</template>
