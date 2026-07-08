<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectItem, SelectItemText, SelectItemIndicator } from 'reka-ui'
import { Check } from '@lucide/vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  value: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const classes = computed(() =>
  cn(
    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-[var(--color-secondary)] focus:text-[var(--color-foreground)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-[var(--color-foreground)]',
    props.class,
  ),
)
</script>

<template>
  <SelectItem :class="classes" :value="value" :disabled="disabled">
    <span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
