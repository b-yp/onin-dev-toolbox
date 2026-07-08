<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectRoot, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem, SelectItemText, SelectItemIndicator, SelectPortal, SelectScrollUpButton, SelectScrollDownButton, SelectViewport } from 'reka-ui'
import { Check, ChevronDown, ChevronUp } from '@lucide/vue'
import { cn } from '../../../lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const triggerClasses = computed(() =>
  cn(
    'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-[var(--color-background)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 text-[var(--color-foreground)]',
    props.class,
  ),
)

const contentClasses = computed(() =>
  cn(
    'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-popover)] text-[var(--color-popover-foreground)] shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  ),
)
</script>

<template>
  <SelectRoot :model-value="modelValue" @update:model-value="(v: string) => emit('update:modelValue', v)" :disabled="disabled">
    <SelectTrigger :class="triggerClasses">
      <SelectValue :placeholder="placeholder" />
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent :class="contentClasses">
        <SelectScrollUpButton class="flex items-center justify-center py-1">
          <ChevronUp class="h-4 w-4" />
        </SelectScrollUpButton>
        <SelectViewport class="p-1">
          <SelectGroup>
            <slot />
          </SelectGroup>
        </SelectViewport>
        <SelectScrollDownButton class="flex items-center justify-center py-1">
          <ChevronDown class="h-4 w-4" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
