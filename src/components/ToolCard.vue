<script setup lang="ts">
import { type Tool } from '../config/tools';

const props = defineProps<{
  tool: Tool;
  isFavorite: boolean;
}>();

const emit = defineEmits(['toggleFavorite', 'clickTool']);
</script>

<template>
  <div 
    class="group flex flex-col gap-3 p-4 rounded-2xl cursor-pointer bg-white/5 border border-white/8 backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl"
    @click="emit('clickTool', tool.id)"
  >
    <div class="flex justify-between items-start">
      <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 font-bold text-sm text-white">
        <span class="tool-icon">{{ tool.icon }}</span>
      </div>
      <button
        class="p-1 transition-colors duration-200"
        :class="isFavorite ? 'text-amber-400 fill-amber-400' : 'text-white/20 hover:text-white/60'"
        @click.stop="emit('toggleFavorite', tool.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
    </div>
    <div class="flex flex-col">
      <h3 class="m-0 text-[15px] font-semibold text-white">{{ tool.name }}</h3>
      <p class="m-0 text-xs text-white/50 leading-relaxed line-clamp-2">
        {{ tool.description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* 保持 line-clamp 的兼容性，虽然 tailwind 4 内置，但如果环境特殊可能需要 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
