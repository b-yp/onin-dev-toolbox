<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
})

const classes = computed(() =>
  cn(
    'shrink-0 bg-[var(--color-border)]',
    props.orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
    props.class,
  ),
)
</script>

<template>
  <div :class="classes" :role="decorative ? undefined : 'separator'" :aria-orientation="decorative ? undefined : orientation" :aria-label="decorative ? undefined : label">
    <slot />
  </div>
</template>
