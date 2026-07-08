<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const classes = computed(() =>
  cn('rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)] shadow', props.class),
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
