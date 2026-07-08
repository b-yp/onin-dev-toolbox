<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  for?: string
}

defineProps<Props>()

const classes = computed(() =>
  cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--color-foreground)]',
  ),
)
</script>

<template>
  <label :class="classes" :for="for">
    <slot />
  </label>
</template>
