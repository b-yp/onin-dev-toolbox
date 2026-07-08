<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsTrigger } from 'reka-ui'
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
    'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-[var(--color-background)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-[var(--color-foreground)] data-[state=active]:shadow cursor-pointer',
    props.class,
  ),
)
</script>

<template>
  <TabsTrigger :class="classes" :value="value" :disabled="disabled">
    <slot />
  </TabsTrigger>
</template>
