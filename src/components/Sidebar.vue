<script setup lang="ts">
import { type ToolCategory } from '../config/tools'
import { Box, Star, ArrowRightLeft, Shield, FileText, Globe } from '@lucide/vue'
import { cn } from '../lib/utils'

const props = defineProps<{
  activeCategory: ToolCategory | 'All'
  categories: { id: ToolCategory | 'All'; name: string; icon: string }[]
  pluginName: string
}>()

const emit = defineEmits(['selectCategory'])

const categoryIcons: Record<string, any> = {
  'All': Box,
  'Favorites': Star,
  'Transform': ArrowRightLeft,
  'Security': Shield,
  'Text': FileText,
  'Network': Globe,
}
</script>

<template>
  <aside class="w-60 shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] max-md:w-[60px]">
    <div class="p-6 max-md:p-4">
      <div class="flex items-center gap-3 font-semibold text-lg text-[var(--color-foreground)]">
        <Box class="size-6" />
        <span class="max-md:hidden">{{ pluginName }}</span>
      </div>
    </div>

    <nav class="flex flex-col gap-1 px-2 pb-4">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left border-none',
          activeCategory === cat.id
            ? 'bg-[var(--color-secondary)] text-[var(--color-foreground)]'
            : 'bg-transparent text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]/50 hover:text-[var(--color-foreground)]'
        )"
        @click="emit('selectCategory', cat.id)"
      >
        <component :is="categoryIcons[cat.id]" class="size-5 shrink-0" />
        <span class="max-md:hidden">{{ cat.name }}</span>
      </button>
    </nav>
  </aside>
</template>
