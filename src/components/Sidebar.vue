<script setup lang="ts">
import { type ToolCategory } from '../config/tools';

const props = defineProps<{
  activeCategory: ToolCategory | 'All';
  categories: { id: ToolCategory | 'All'; name: string; icon: string }[];
  pluginName: string;
}>();

const emit = defineEmits(['selectCategory']);
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <span>{{ pluginName }}</span>
      </div>
    </div>
    <nav class="nav">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="nav-item"
        :class="{ active: activeCategory === cat.id }"
        @click="emit('selectCategory', cat.id)"
      >
        <span class="icon">{{ cat.icon }}</span>
        <span class="label">{{ cat.name }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 18px;
  color: #fff;
}

.nav {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 500;
}

.icon {
  font-size: 18px;
  width: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  .label, .logo span {
    display: none;
  }
  .sidebar-header {
    padding: 16px;
  }
}
</style>
