<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsContent } from 'reka-ui'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  value: string
}

const props = defineProps<Props>()

const classes = computed(() =>
  cn(
    'mt-2 ring-offset-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
    props.class,
  ),
)
</script>

<template>
  <TabsContent :class="classes" :value="value">
    <slot />
  </TabsContent>
</template>
