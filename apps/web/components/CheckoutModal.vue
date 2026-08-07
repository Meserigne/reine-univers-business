<script setup lang="ts">
import { PhX, PhStar } from '@phosphor-icons/vue'
import { formatPrice } from '~/types/catalog'
import type { OrderTracking } from '~/types/tracking'
import {
  POINT_VALUE_FCFA,
  discountFromPoints,
  maxRedeemable,
} from '~/utils/loyalty'

const { checkoutOpen, closeCheckout, items, total, clearCart } = useCart()
const { createOrder, getLoyalty } = useApi()
const { customer, isLoggedIn, ensureSession, refreshMe } = useAuth()

const submitted = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const tracking = ref<OrderTracking | null>(null)
const form = reactive({
  name: '',
  phone: '',
  address: '',
  note: '',
})
const destLat = ref<number | null>(null)
const destLng = ref<number | null>(null)

const availablePoints = ref(0)
const usePoints = ref(false)
const pointsToUse = ref(0)
const paymentChoice = ref<'cash' | 'points'>('cash')

const estimatedDeliveryFee = 1000 // indicative; real fee computed server-side by zone
const estimatedGross = computed(() => total.value + estimatedDeliveryFee)

const maxPoints = computed(() =>
  maxRedeemable(availablePoints.value, estimatedGross.value),
)

const effectivePoints = computed(() => {
  if (paymentChoice.value === 'cash' || !usePoints.value) return 0
  return Math.min(pointsToUse.value, maxPoints.value)
})

const pointsDiscount = computed(() => discountFromPoints(effectivePoints.value))
const amountDueEstimate = computed(() =>
  Math.max(0, estimatedGross.value - pointsDiscount.value),
)

async function loadLoyalty(phone: string) {
  const p = phone.replace(/\s+/g, '').trim()
  if (p.length < 8) {
    availablePoints.value = 0
    return
  }
  try {
    const res = await getLoyalty(p)
    availablePoints.value = res.points ?? 0
    if (isLoggedIn.value && customer.value?.points != null) {
      availablePoints.value = Math.max(availablePoints.value, customer.value.points)
    }
  } catch {
    availablePoints.value = customer.value?.points ?? 0
  }
}

watch(checkoutOpen, async (open) => {
  if (!open) return
  await ensureSession()
  if (isLoggedIn.value && customer.value) {
    form.name = customer.value.name
    form.phone = customer.value.phone
    form.address = customer.value.address || form.address
    availablePoints.value = customer.value.points ?? 0
  }
  await loadLoyalty(form.phone)
  paymentChoice.value = 'cash'
  usePoints.value = false
  pointsToUse.value = 0
})

watch(
  () => form.phone,
  (phone) => {
    void loadLoyalty(phone)
  },
)

watch(paymentChoice, (choice) => {
  if (choice === 'points') {
    usePoints.value = true
    pointsToUse.value = maxPoints.value
  } else {
    usePoints.value = false
    pointsToUse.value = 0
  }
})

watch(maxPoints, (max) => {
  if (usePoints.value && pointsToUse.value > max) {
    pointsToUse.value = max
  }
})

async function handleSubmit() {
  errorMsg.value = ''
  submitting.value = true
  try {
    tracking.value = await createOrder({
      customerName: form.name,
      phone: form.phone,
      address: form.address,
      note: form.note || undefined,
      destLat: destLat.value ?? undefined,
      destLng: destLng.value ?? undefined,
      pointsToUse: effectivePoints.value || undefined,
      items: items.value.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    })
    submitted.value = true
    clearCart()
    if (isLoggedIn.value) await refreshMe()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    errorMsg.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Impossible d’envoyer la commande. Réessayez.'
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  closeCheckout()
  setTimeout(() => {
    submitted.value = false
    errorMsg.value = ''
    tracking.value = null
    destLat.value = null
    destLng.value = null
    usePoints.value = false
    pointsToUse.value = 0
    paymentChoice.value = 'cash'
  }, 300)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="checkoutOpen" class="fixed inset-0 z-[80]">
      <button
        type="button"
        class="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        aria-label="Fermer"
        @click="handleClose"
      />
      <div
        class="absolute inset-x-4 top-[4vh] z-[90] mx-auto max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl sm:inset-x-auto sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <div class="mb-6 flex items-start justify-between">
          <div>
            <h2 class="font-display text-2xl font-bold tracking-tight">
              {{ submitted ? 'Suivi de livraison' : 'Finaliser' }}
            </h2>
            <p v-if="!submitted" class="mt-1 text-sm text-ink-muted">
              Articles : {{ formatPrice(total) }}
            </p>
          </div>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-canvas"
            aria-label="Fermer"
            @click="handleClose"
          >
            <PhX :size="20" weight="bold" />
          </button>
        </div>

        <div v-if="submitted && tracking">
          <p
            v-if="(tracking.pointsRedeemed || 0) > 0"
            class="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {{ tracking.pointsRedeemed }} pt utilisés (−{{ formatPrice(tracking.pointsDiscount || 0) }}).
            À payer :
            <strong>{{ formatPrice(tracking.amountDue ?? tracking.total) }}</strong>
          </p>
          <DeliveryTracker :order-id="tracking.id" :initial="tracking" compact />
          <div class="mt-6 flex flex-col gap-2">
            <NuxtLink
              :to="`/suivi/${tracking.id}`"
              class="block w-full rounded-full bg-brand py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white"
              @click="handleClose"
            >
              Ouvrir le suivi en plein écran
            </NuxtLink>
            <button
              type="button"
              class="w-full rounded-full border border-line py-3 text-sm font-semibold"
              @click="handleClose"
            >
              Fermer
            </button>
          </div>
        </div>

        <form v-else class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-1 block text-sm font-medium">Nom complet</label>
            <input
              v-model="form.name"
              required
              minlength="2"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Téléphone</label>
            <input
              v-model="form.phone"
              required
              minlength="8"
              type="tel"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Adresse de livraison</label>
            <textarea
              v-model="form.address"
              required
              minlength="5"
              rows="2"
              placeholder="Quartier à Dakar, rue, repère…"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
            />
            <ClientOnly>
              <AddressMapPicker
                v-model:address="form.address"
                v-model:dest-lat="destLat"
                v-model:dest-lng="destLng"
                class="mt-3"
              />
            </ClientOnly>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Note (optionnel)</label>
            <textarea
              v-model="form.note"
              rows="2"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-brand"
            />
          </div>

          <!-- Payment / loyalty -->
          <div class="rounded-2xl border border-line bg-canvas p-4 space-y-3">
            <div class="flex items-center gap-2">
              <PhStar :size="18" weight="fill" class="text-brand" />
              <p class="text-sm font-semibold">Paiement</p>
            </div>

            <p class="text-xs text-ink-muted">
              Solde :
              <strong class="text-ink">{{ availablePoints }} pt</strong>
              ({{ formatPrice(availablePoints * POINT_VALUE_FCFA) }})
              · 1 pt = {{ formatPrice(POINT_VALUE_FCFA) }}
            </p>

            <div class="space-y-2">
              <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface px-3 py-3">
                <input v-model="paymentChoice" type="radio" value="cash" class="mt-1" />
                <span>
                  <span class="block text-sm font-semibold">Payer à la livraison</span>
                  <span class="text-xs text-ink-muted">Espèces / Wave / Orange Money chez vous</span>
                </span>
              </label>

              <label
                class="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface px-3 py-3"
                :class="maxPoints < 1 ? 'opacity-50' : ''"
              >
                <input
                  v-model="paymentChoice"
                  type="radio"
                  value="points"
                  class="mt-1"
                  :disabled="maxPoints < 1"
                />
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-semibold">Utiliser mes points</span>
                  <span class="text-xs text-ink-muted">
                    {{
                      maxPoints < 1
                        ? 'Pas assez de points pour cette commande'
                        : `Jusqu’à ${maxPoints} pt (−${formatPrice(discountFromPoints(maxPoints))})`
                    }}
                  </span>
                  <div v-if="paymentChoice === 'points' && maxPoints > 0" class="mt-3">
                    <label class="block text-xs font-medium text-ink-muted">
                      Points à utiliser : {{ pointsToUse }}
                    </label>
                    <input
                      v-model.number="pointsToUse"
                      type="range"
                      min="0"
                      :max="maxPoints"
                      step="1"
                      class="mt-1 w-full accent-[var(--color-brand,#b91c1c)]"
                    />
                  </div>
                </span>
              </label>
            </div>

            <div class="space-y-1 border-t border-line pt-3 text-sm">
              <div class="flex justify-between text-ink-muted">
                <span>Articles</span>
                <span>{{ formatPrice(total) }}</span>
              </div>
              <div class="flex justify-between text-ink-muted">
                <span>Livraison (estim.)</span>
                <span>~{{ formatPrice(estimatedDeliveryFee) }}</span>
              </div>
              <div
                v-if="pointsDiscount > 0"
                class="flex justify-between text-emerald-700"
              >
                <span>Points (−{{ effectivePoints }} pt)</span>
                <span>−{{ formatPrice(pointsDiscount) }}</span>
              </div>
              <div class="flex justify-between font-display text-base font-bold">
                <span>À payer à la livraison</span>
                <span class="text-brand">≈ {{ formatPrice(amountDueEstimate) }}</span>
              </div>
              <p class="text-[11px] text-ink-muted">
                Le frais de zone exact est calculé à la confirmation.
              </p>
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-brand">{{ errorMsg }}</p>
          <button
            type="submit"
            :disabled="submitting || items.length === 0"
            class="w-full rounded-full bg-brand py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
          >
            {{ submitting ? 'Calcul de la livraison…' : 'Confirmer la commande' }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>
