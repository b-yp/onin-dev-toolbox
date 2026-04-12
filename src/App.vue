<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storage } from 'onin-sdk';
import { TOOLS, CATEGORIES, type ToolCategory, type Tool } from './config/tools';
import Sidebar from './components/Sidebar.vue';
import SearchBar from './components/SearchBar.vue';
import ToolCard from './components/ToolCard.vue';
import ToolRenderer from './components/ToolRenderer.vue';

const props = defineProps<{
  pluginName: string;
  pluginId: string;
}>();

// State
const activeCategory = ref<ToolCategory | 'All'>('All');
const searchQuery = ref('');
const favorites = ref<Set<string>>(new Set());
const currentToolId = ref<string | null>(null);

// Load favorites from Onin Storage
const loadFavorites = async () => {
  try {
    const storedFavs = await storage.getItem<string[]>('user_favorites');
    if (storedFavs) {
      favorites.value = new Set(storedFavs);
    }
  } catch (err) {
    console.error('Failed to load favorites', err);
  }
};

// Save favorites to Onin Storage
const saveFavorites = async () => {
  try {
    await storage.setItem('user_favorites', Array.from(favorites.value));
  } catch (err) {
    console.error('Failed to save favorites', err);
  }
};

onMounted(() => {
  loadFavorites();
});

// Logic
const toggleFavorite = (id: string) => {
  if (favorites.value.has(id)) {
    favorites.value.delete(id);
  } else {
    favorites.value.add(id);
  }
  saveFavorites();
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const selectCategory = (id: ToolCategory | 'All') => {
  activeCategory.value = id;
};

const filteredTools = computed(() => {
  let result = TOOLS;

  // 1. Category Filter
  if (activeCategory.value === 'Favorites') {
    result = result.filter(t => favorites.value.has(t.id));
  } else if (activeCategory.value !== 'All') {
    result = result.filter(t => t.category === activeCategory.value);
  }

  // 2. Search Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  }

  return result;
});

const handleClickTool = (id: string) => {
  currentToolId.value = id;
};

const handleBack = () => {
  currentToolId.value = null;
};
</script>

<template>
  <div class="app-container">
    <Sidebar
      v-if="!currentToolId"
      :active-category="activeCategory"
      :categories="CATEGORIES"
      :plugin-name="props.pluginName"
      @select-category="selectCategory"
    />
    
    <main class="main-content">
      <template v-if="!currentToolId">
        <SearchBar @search="handleSearch" />
        
        <div class="content-body">
          <header class="content-header">
            <h2>{{ CATEGORIES.find(c => c.id === activeCategory)?.name }}</h2>
            <p class="count-badge">{{ filteredTools.length }} 个工具</p>
          </header>

          <div v-if="filteredTools.length > 0" class="tool-grid">
            <ToolCard
              v-for="tool in filteredTools"
              :key="tool.id"
              :tool="tool"
              :is-favorite="favorites.has(tool.id)"
              @toggle-favorite="toggleFavorite"
              @click-tool="handleClickTool"
            />
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>没有找到相关工具</p>
            <button v-if="activeCategory !== 'All'" @click="activeCategory = 'All'" class="reset-btn">
              查看所有工具
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <ToolRenderer 
          :tool-id="currentToolId" 
          @back="handleBack" 
        />
      </template>
    </main>
  </div>
</template>

<style>
:root {
  --bg-color: #0d0d0d;
  --accent-color: #3b82f6;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.5);
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}

#app {
  height: 100vh;
}
</style>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background: 
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 40%),
    radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.05), transparent 40%);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.count-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding-bottom: 40px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.reset-btn {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Scrollbar styling */
.content-body::-webkit-scrollbar {
  width: 6px;
}

.content-body::-webkit-scrollbar-track {
  background: transparent;
}

.content-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.content-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
