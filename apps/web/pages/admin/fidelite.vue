<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { data: accounts, pending, refresh } = await useAsyncData('admin-loyalty', () =>
  api.loyalty(),
)

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Fidélité</h1>
        <p class="mt-1 text-ink-muted">Comptes et points des clients</p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-canvas"
        @click="refresh()"
      >
        Actualiser
      </button>
    </div>

    <div v-if="pending && !accounts" class="text-ink-muted">Chargement…</div>
    <p v-else-if="!accounts?.length" class="text-ink-muted">Aucun compte fidélité.</p>

    <div v-else class="overflow-hidden rounded-2xl border border-line bg-surface">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-line bg-canvas text-ink-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Téléphone</th>
            <th class="px-4 py-3 font-medium">Points</th>
            <th class="px-4 py-3 font-medium">Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="a in accounts"
            :key="a.id"
            class="border-b border-line last:border-0"
          >
            <td class="px-4 py-3 font-medium">{{ a.phone }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
                {{ a.points }} pts
              </span>
            </td>
            <td class="px-4 py-3 text-ink-muted">{{ formatDate(a.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
