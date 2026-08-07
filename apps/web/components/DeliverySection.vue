<script setup lang="ts">
import { PhMotorcycle, PhClock, PhMapPin } from '@phosphor-icons/vue'

const props = defineProps<{
  eyebrow: string
  title: string
  text: string
  points: { id: string; title: string; text: string }[]
}>()

const icons = {
  fast: PhMotorcycle,
  hours: PhClock,
  zones: PhMapPin,
} as const

function iconFor(id: string) {
  return icons[id as keyof typeof icons] ?? PhMotorcycle
}
</script>

<template>
  <section id="livraison" class="scroll-mt-20 bg-ink py-20 text-white sm:py-28">
    <div class="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{{ eyebrow }}</p>
      <h2 class="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {{ title }}
      </h2>
      <p class="mt-4 max-w-lg text-base text-white/65">{{ text }}</p>

      <div class="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div
          v-for="point in points"
          :key="point.id"
          class="border-t border-white/15 pt-6"
        >
          <component :is="iconFor(point.id)" :size="28" weight="duotone" class="text-brand" />
          <h3 class="mt-4 font-display text-xl font-semibold">{{ point.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-white/60">{{ point.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
