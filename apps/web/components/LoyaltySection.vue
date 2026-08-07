<script setup lang="ts">
import { PhStar } from '@phosphor-icons/vue'

defineProps<{
  eyebrow: string
  title: string
  text: string
}>()
</script>

<template>
  <section id="fidelite" class="scroll-mt-20 border-b border-line bg-surface py-16 sm:py-20">
    <div class="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8">
      <PhStar :size="40" weight="duotone" class="shrink-0 text-brand" />
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{{ eyebrow }}</p>
        <h2 class="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {{ title }}
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          {{ text }}
        </p>
      </div>
    </div>
  </section>
</template>
