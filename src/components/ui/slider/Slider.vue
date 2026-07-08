<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SliderRoot, SliderRange, SliderThumb, SliderTrack } from 'reka-ui'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [0],
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()
</script>

<template>
  <SliderRoot
    :class="cn('relative flex w-full touch-none select-none items-center', props.class)"
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    @update:model-value="(v: number[]) => emit('update:modelValue', v)"
  >
    <SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--color-secondary)]">
      <SliderRange class="absolute h-full bg-[var(--color-primary)]" />
    </SliderTrack>
    <SliderThumb class="block h-4 w-4 rounded-full border border-[var(--color-primary)] bg-[var(--color-background)] shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderRoot>
</template>
