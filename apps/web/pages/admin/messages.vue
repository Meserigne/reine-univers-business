<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { data: messages, pending, refresh } = await useAsyncData('admin-messages', () =>
  api.messages(),
)

async function remove(id: string) {
  if (!confirm('Supprimer ce message ?')) return
  await api.deleteMessage(id)
  await refresh()
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Messages</h1>
        <p class="mt-1 text-ink-muted">Demandes reçues via le formulaire de contact</p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-canvas"
        @click="refresh()"
      >
        Actualiser
      </button>
    </div>

    <div v-if="pending && !messages" class="text-ink-muted">Chargement…</div>
    <p v-else-if="!messages?.length" class="text-ink-muted">Aucun message pour le moment.</p>

    <div v-else class="space-y-3">
      <article
        v-for="m in messages"
        :key="m.id"
        class="rounded-2xl border border-line bg-surface p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-semibold">{{ m.name }}</p>
            <p class="text-sm text-ink-muted">
              <span v-if="m.phone">{{ m.phone }}</span>
              <span v-if="m.phone && m.email"> · </span>
              <span v-if="m.email">{{ m.email }}</span>
              <span v-if="!m.phone && !m.email">Sans contact</span>
              · {{ formatDate(m.createdAt) }}
            </p>
          </div>
          <button
            type="button"
            class="text-sm font-medium text-ink-muted hover:text-brand"
            @click="remove(m.id)"
          >
            Supprimer
          </button>
        </div>
        <p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{{ m.message }}</p>
      </article>
    </div>
  </div>
</template>
