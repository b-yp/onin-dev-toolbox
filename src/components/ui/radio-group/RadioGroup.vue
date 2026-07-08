<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { RadioGroupRoot, RadioGroupItem, RadioGroupIndicator } from 'reka-ui'
import { Circle } from '@lucide/vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  orientation: 'vertical',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <RadioGroupRoot
    :class="cn('grid gap-2', props.class)"
    :model-value="modelValue"
    :default-value="defaultValue"
    :orientation="orientation"
    :disabled="disabled"
    @update:model-value="(v: string) => emit('update:modelValue', v)"
  >
    <slot />
  </RadioGroupRoot>
</template>
