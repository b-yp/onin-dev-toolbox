<script setup lang="ts">
import { type Tool } from '../config/tools';

const props = defineProps<{
  tool: Tool;
  isFavorite: boolean;
}>();

const emit = defineEmits(['toggleFavorite', 'clickTool']);
</script>

<template>
  <div class="tool-card" @click="emit('clickTool', tool.id)">
    <div class="card-header">
      <div class="tool-icon-wrapper">
        <span class="tool-icon">{{ tool.icon }}</span>
      </div>
      <button
        class="favorite-btn"
        :class="{ active: isFavorite }"
        @click.stop="emit('toggleFavorite', tool.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
    </div>
    <div class="card-body">
      <h3 class="tool-title">{{ tool.name }}</h3>
      <p class="tool-desc">{{ tool.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.tool-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  backdrop-filter: blur(10px);
}

.tool-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tool-icon-wrapper {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.favorite-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.favorite-btn svg {
  width: 20px;
  height: 20px;
}

.favorite-btn:hover {
  color: rgba(255, 255, 255, 0.6);
}

.favorite-btn.active {
  color: #fbbf24;
  fill: #fbbf24;
}

.tool-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.tool-desc {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
