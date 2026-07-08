<script setup lang="ts">
import { type Tool } from '../config/tools'
import { Star } from '@lucide/vue'
import { cn } from '../lib/utils'

const props = defineProps<{
  tool: Tool
  isFavorite: boolean
}>()

const emit = defineEmits(['toggleFavorite', 'clickTool'])
</script>

<template>
  <div
    class="group flex flex-col gap-3 p-4 rounded-xl cursor-pointer border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-sm transition-all duration-200 hover:bg-[var(--color-secondary)] hover:border-white/15 hover:-translate-y-0.5 hover:shadow-lg"
    @click="emit('clickTool', tool.id)"
  >
    <div class="flex justify-between items-start">
      <div class="flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-sm font-bold text-white">
        {{ tool.icon }}
      </div>
      <button
        :class="cn(
          'p-1 rounded transition-colors cursor-pointer border-none',
          isFavorite ? 'text-amber-400' : 'text-white/20 hover:text-amber-400/60'
        )"
        @click.stop="emit('toggleFavorite', tool.id)"
      >
        <Star :class="cn('size-5', isFavorite && 'fill-current')" />
      </button>
    </div>

    <div>
      <h3 class="text-[15px] font-semibold text-[var(--color-foreground)]">{{ tool.name }}</h3>
      <p class="text-xs text-[var(--color-muted-foreground)] leading-relaxed line-clamp-2 mt-1">
        {{ tool.description }}
      </p>
    </div>
  </div>
</template>
