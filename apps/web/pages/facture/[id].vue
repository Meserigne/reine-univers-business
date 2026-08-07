<script setup lang="ts">
import { formatPrice } from '~/types/catalog'

definePageMeta({ layout: false })

const route = useRoute()
const orderId = computed(() => String(route.params.id || ''))
const config = useRuntimeConfig()

type Invoice = {
  id: string
  invoiceNumber: string | null
  issuedAt: string
  status: string
  customer: { name: string; phone: string; address: string }
  note: string | null
  courierName: string | null
  lines: {
    id: string
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
  subtotal: number
  deliveryFee: number
  total: number
  pointsRedeemed?: number
  pointsDiscount?: number
  amountDue?: number
  paymentMethod?: string
  company: { name: string; phone: string; email: string; whatsapp: string }
}

const { data: invoice, error, pending } = await useAsyncData(
  `invoice-${orderId.value}`,
  () =>
    $fetch<Invoice>(`${config.public.apiUrl}/orders/${orderId.value}/invoice`),
)

useHead({
  title: computed(
    () =>
      `Facture ${invoice.value?.invoiceNumber || ''} — Reine Univers Business`,
  ),
})

const statusLabel: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function printInvoice() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-canvas print:bg-white">
    <div class="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <NuxtLink to="/admin/factures" class="text-sm font-medium text-ink-muted hover:text-brand">
          ← Factures
        </NuxtLink>
        <div class="flex gap-2">
          <NuxtLink
            :to="`/suivi/${orderId}`"
            class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium"
          >
            Suivi livraison
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
            @click="printInvoice"
          >
            Imprimer / PDF
          </button>
        </div>
      </div>

      <div v-if="pending" class="text-ink-muted">Chargement de la facture…</div>
      <div v-else-if="error || !invoice" class="rounded-2xl bg-brand-soft p-6 text-brand-dark">
        Facture introuvable.
      </div>

      <article
        v-else
        class="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-10 print:rounded-none print:border-0 print:shadow-none"
      >
        <header class="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div class="flex items-center gap-4">
            <img src="/logo.png" alt="" class="h-16 w-16 object-contain" />
            <div>
              <p class="font-display text-xl font-bold">{{ invoice.company.name }}</p>
              <p class="text-sm text-ink-muted">Viande fraîche — Livraison</p>
              <p v-if="invoice.company.phone" class="mt-1 text-sm">{{ invoice.company.phone }}</p>
              <p v-if="invoice.company.email" class="text-sm">{{ invoice.company.email }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Facture</p>
            <p class="mt-1 font-mono text-lg font-bold">
              {{ invoice.invoiceNumber || invoice.id.slice(-8).toUpperCase() }}
            </p>
            <p class="mt-2 text-sm text-ink-muted">{{ formatDate(invoice.issuedAt) }}</p>
            <p class="mt-1 text-sm">
              Statut :
              <span class="font-semibold">{{ statusLabel[invoice.status] || invoice.status }}</span>
            </p>
          </div>
        </header>

        <section class="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Facturé à</p>
            <p class="mt-2 font-display text-lg font-bold">{{ invoice.customer.name }}</p>
            <p class="text-sm">{{ invoice.customer.phone }}</p>
            <p class="mt-1 text-sm leading-relaxed text-ink-muted">{{ invoice.customer.address }}</p>
          </div>
          <div v-if="invoice.courierName">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Livreur</p>
            <p class="mt-2 font-semibold">{{ invoice.courierName }}</p>
          </div>
        </section>

        <table class="mt-8 w-full text-left text-sm">
          <thead>
            <tr class="border-b border-line text-ink-muted">
              <th class="pb-3 font-medium">Article</th>
              <th class="pb-3 font-medium text-center">Qté</th>
              <th class="pb-3 font-medium text-right">Prix unit.</th>
              <th class="pb-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in invoice.lines" :key="line.id" class="border-b border-line">
              <td class="py-3 font-medium">{{ line.productName }}</td>
              <td class="py-3 text-center">{{ line.quantity }}</td>
              <td class="py-3 text-right">{{ formatPrice(line.unitPrice) }}</td>
              <td class="py-3 text-right font-semibold">{{ formatPrice(line.lineTotal) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-6 flex justify-end">
          <div class="w-full max-w-xs space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-ink-muted">Sous-total</span>
              <span>{{ formatPrice(invoice.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">Livraison</span>
              <span>{{ invoice.deliveryFee ? formatPrice(invoice.deliveryFee) : 'Offerte' }}</span>
            </div>
            <div
              v-if="(invoice.pointsDiscount || 0) > 0"
              class="flex justify-between text-emerald-700"
            >
              <span>Points fidélité (−{{ invoice.pointsRedeemed }} pt)</span>
              <span>−{{ formatPrice(invoice.pointsDiscount || 0) }}</span>
            </div>
            <div class="flex justify-between border-t border-line pt-3 font-display text-lg font-bold">
              <span>Total TTC</span>
              <span class="text-brand">{{ formatPrice(invoice.total) }}</span>
            </div>
            <div
              v-if="invoice.amountDue != null && invoice.amountDue !== invoice.total"
              class="flex justify-between font-semibold text-ink"
            >
              <span>À payer à la livraison</span>
              <span>{{ formatPrice(invoice.amountDue) }}</span>
            </div>
            <p
              v-if="invoice.paymentMethod === 'points'"
              class="pt-1 text-right text-xs text-emerald-700"
            >
              Payé intégralement avec les points
            </p>
          </div>
        </div>

        <p v-if="invoice.note" class="mt-6 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-muted">
          Note : {{ invoice.note }}
        </p>

        <footer class="mt-10 border-t border-line pt-4 text-center text-xs text-ink-muted">
          Merci pour votre commande — {{ invoice.company.name }}
        </footer>
      </article>
    </div>
  </div>
</template>

<style>
@media print {
  body {
    background: white !important;
  }
}
</style>
