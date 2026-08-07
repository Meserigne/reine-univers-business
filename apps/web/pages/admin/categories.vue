<script setup lang="ts">
import type { AdminCategory } from '~/composables/useAdminApi'

definePageMeta({ layout: 'admin' })

const api = useAdminApi()
const { data: categories, pending, refresh } = await useAsyncData('admin-categories', () =>
  api.categories(),
)

const showForm = ref(false)
const editing = ref<AdminCategory | null>(null)
const error = ref('')
const saving = ref(false)

const form = reactive({
  id: '',
  label: '',
  description: '',
  image: '',
  sortOrder: 0,
  active: true,
})

function openCreate() {
  editing.value = null
  Object.assign(form, {
    id: '',
    label: '',
    description: '',
    image: '',
    sortOrder: (categories.value?.length ?? 0) + 1,
    active: true,
  })
  error.value = ''
  showForm.value = true
}

function openEdit(cat: AdminCategory) {
  editing.value = cat
  Object.assign(form, {
    id: cat.id,
    label: cat.label,
    description: cat.description ?? '',
    image: cat.image ?? '',
    sortOrder: cat.sortOrder,
    active: cat.active,
  })
  error.value = ''
  showForm.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await api.updateCategory(editing.value.id, {
        label: form.label,
        description: form.description || undefined,
        image: form.image || undefined,
        sortOrder: Number(form.sortOrder),
        active: form.active,
      })
    } else {
      await api.createCategory({
        id: form.id,
        label: form.label,
        description: form.description || undefined,
        image: form.image || undefined,
        sortOrder: Number(form.sortOrder),
        active: form.active,
      })
    }
    showForm.value = false
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de l’enregistrement'
  } finally {
    saving.value = false
  }
}

async function remove(cat: AdminCategory) {
  if (!confirm(`Supprimer la catégorie « ${cat.label} » ?`)) return
  error.value = ''
  try {
    await api.deleteCategory(cat.id)
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || 'Suppression impossible'
  }
}

async function toggleActive(cat: AdminCategory) {
  await api.updateCategory(cat.id, { active: !cat.active })
  await refresh()
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight">Catégories</h1>
        <p class="mt-1 text-ink-muted">Gérez les familles de produits du catalogue</p>
      </div>
      <button
        type="button"
        class="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        @click="openCreate"
      >
        + Nouvelle catégorie
      </button>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
      {{ error }}
    </p>

    <div v-if="pending && !categories" class="text-ink-muted">Chargement…</div>

    <div v-else class="overflow-hidden rounded-2xl border border-line bg-surface">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-line bg-canvas text-ink-muted">
          <tr>
            <th class="px-4 py-3 font-medium">ID</th>
            <th class="px-4 py-3 font-medium">Libellé</th>
            <th class="px-4 py-3 font-medium">Ordre</th>
            <th class="px-4 py-3 font-medium">Produits</th>
            <th class="px-4 py-3 font-medium">Statut</th>
            <th class="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cat in categories"
            :key="cat.id"
            class="border-b border-line last:border-0"
          >
            <td class="px-4 py-3 font-mono text-xs">{{ cat.id }}</td>
            <td class="px-4 py-3">
              <p class="font-semibold">{{ cat.label }}</p>
              <p v-if="cat.description" class="text-xs text-ink-muted">{{ cat.description }}</p>
            </td>
            <td class="px-4 py-3">{{ cat.sortOrder }}</td>
            <td class="px-4 py-3">{{ cat._count?.products ?? 0 }}</td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="rounded-full px-2.5 py-1 text-xs font-medium"
                :class="cat.active ? 'bg-emerald-50 text-emerald-700' : 'bg-canvas text-ink-muted'"
                @click="toggleActive(cat)"
              >
                {{ cat.active ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="px-4 py-3 text-right">
              <button type="button" class="mr-2 text-sm font-medium text-brand hover:underline" @click="openEdit(cat)">
                Modifier
              </button>
              <button type="button" class="text-sm font-medium text-ink-muted hover:text-brand" @click="remove(cat)">
                Supprimer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" class="absolute inset-0 bg-ink/40" aria-label="Fermer" @click="showForm = false" />
      <form
        class="relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl"
        @submit.prevent="save"
      >
        <h2 class="font-display text-xl font-bold">
          {{ editing ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}
        </h2>
        <div class="mt-5 grid gap-4">
          <label v-if="!editing" class="block text-sm">
            <span class="mb-1 block font-medium">Identifiant (slug)</span>
            <input
              v-model="form.id"
              required
              placeholder="ex: poulet"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Libellé</span>
            <input
              v-model="form.label"
              required
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Description</span>
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Image (URL ou chemin)</span>
            <input
              v-model="form.image"
              placeholder="/products/…"
              class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label class="block text-sm">
              <span class="mb-1 block font-medium">Ordre</span>
              <input
                v-model.number="form.sortOrder"
                type="number"
                class="w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
              />
            </label>
            <label class="flex items-end gap-2 pb-2 text-sm">
              <input v-model="form.active" type="checkbox" class="size-4 accent-brand" />
              <span class="font-medium">Active</span>
            </label>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-xl border border-line px-4 py-2 text-sm font-medium"
            @click="showForm = false"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
