<script setup lang="ts">
import { type HTMLAttributes, computed, ref } from 'vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
})

const emit = defineEmits(['update:modelValue'])

const inputEl = ref<HTMLInputElement | null>(null)

const classes = computed(() =>
  cn(
    'flex h-9 w-full rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 text-[var(--color-foreground)]',
    props.class,
  ),
)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const focus = () => inputEl.value?.focus()

defineExpose({ focus })
</script>

<template>
  <input ref="inputEl" :class="classes" :value="modelValue" @input="onInput" />
</template>
