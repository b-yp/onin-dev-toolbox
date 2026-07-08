<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <TabsRoot
    :class="cn('flex', props.orientation === 'vertical' ? 'flex-row' : 'flex-col', props.class)"
    :model-value="modelValue"
    :default-value="defaultValue"
    :orientation="orientation"
    @update:model-value="(v: string) => emit('update:modelValue', v)"
  >
    <slot />
  </TabsRoot>
</template>
