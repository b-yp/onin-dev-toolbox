<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow',
        secondary: 'border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
        outline: 'text-[var(--color-foreground)]',
        destructive: 'border-transparent bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] shadow',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface Props {
  variant?: VariantProps<typeof badgeVariants>['variant']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
