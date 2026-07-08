<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { RadioGroupItem, RadioGroupIndicator } from 'reka-ui'
import { Circle } from '@lucide/vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  value: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const itemClasses = computed(() =>
  cn(
    'aspect-square h-4 w-4 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <div class="flex items-center gap-2">
    <RadioGroupItem :class="itemClasses" :value="value" :disabled="disabled">
      <RadioGroupIndicator class="flex items-center justify-center">
        <Circle class="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupIndicator>
    </RadioGroupItem>
    <slot />
  </div>
</template>
