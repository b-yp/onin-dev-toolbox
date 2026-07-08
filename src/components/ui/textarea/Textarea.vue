<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
})

const emit = defineEmits(['update:modelValue'])

const classes = computed(() =>
  cn(
    'flex min-h-[80px] w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 text-[var(--color-foreground)]',
    props.class,
  ),
)

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <textarea :class="classes" :value="modelValue" @input="onInput" />
</template>
