<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { TOOLS } from '../config/tools';

const props = defineProps<{
  toolId: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const tool = computed(() => TOOLS.find(t => t.id === props.toolId));

// Dynamic component mapping
const ToolComponent = computed(() => {
  switch (props.toolId) {
    case 'json-format':
      return defineAsyncComponent(() => import('./tools/JsonFormatter.vue'));
    case 'base64':
      return defineAsyncComponent(() => import('./tools/Base64Converter.vue'));
    case 'timestamp':
      return defineAsyncComponent(() => import('./tools/TimestampConverter.vue'));
    case 'url-encode':
      return defineAsyncComponent(() => import('./tools/UrlEncoder.vue'));
    // Add more tools here as they are implemented
    default:
      return null;
  }
});
</script>

<template>
  <div class="tool-renderer">
    <header class="tool-header">
      <div class="header-left">
        <button @click="emit('back')" class="back-btn" title="返回列表">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="tool-info">
          <h1>{{ tool?.name }}</h1>
          <span class="tool-category">{{ tool?.category }}</span>
        </div>
      </div>
      
      <div class="header-actions">
        <!-- Optional global tool actions -->
      </div>
    </header>

    <div class="tool-viewport">
      <component :is="ToolComponent" v-if="ToolComponent" />
      <div v-else class="not-implemented">
        <div class="emoji">🛠️</div>
        <h3>工具开发中</h3>
        <p>工具 "{{ tool?.name }}" 正在快马加鞭开发中，敬请期待！</p>
        <button @click="emit('back')" class="back-btn-large">返回工具列表</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-renderer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-color);
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(13, 13, 13, 0.8);
  backdrop-filter: blur(20px);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(-2px);
}

.tool-info h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.tool-category {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.not-implemented {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  text-align: center;
  padding: 40px;
}

.emoji {
  font-size: 64px;
  margin-bottom: 24px;
}

.back-btn-large {
  margin-top: 24px;
  background: var(--accent-color);
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.back-btn-large:hover {
  opacity: 0.9;
}
</style>
