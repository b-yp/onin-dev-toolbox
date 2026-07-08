<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsList } from 'reka-ui'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const classes = computed(() =>
  cn(
    'inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-muted)] p-1 text-[var(--color-muted-foreground)]',
    props.class,
  ),
)
</script>

<template>
  <TabsList :class="classes">
    <slot />
  </TabsList>
</template>
