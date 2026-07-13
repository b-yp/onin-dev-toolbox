<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storage } from 'onin-sdk'
import Toaster from './components/ui/toast/Toaster.vue'
import { TOOLS, CATEGORIES, type ToolCategory, type Tool } from './config/tools'
import Sidebar from './components/Sidebar.vue'
import SearchBar from './components/SearchBar.vue'
import ToolCard from './components/ToolCard.vue'
import ToolRenderer from './components/ToolRenderer.vue'
import Button from './components/ui/button/Button.vue'
import FeedbackModal from './components/FeedbackModal.vue'
import { ArrowLeft } from '@lucide/vue'

const isWebMode = typeof window !== 'undefined' && !(window as any).__TAURI__

const props = defineProps<{
  pluginName: string
  pluginId: string
}>()

const activeCategory = ref<ToolCategory | 'All'>('All')
const searchQuery = ref('')
const favorites = ref<Set<string>>(new Set())
const currentToolId = ref<string | null>(null)
const isFeedbackOpen = ref(false)

const loadFavorites = async () => {
  try {
    const storedFavs = await storage.getItem<string[]>('user_favorites')
    if (storedFavs) {
      favorites.value = new Set(storedFavs)
    }
  } catch (err) {
    console.error('Failed to load favorites', err)
  }
}

const saveFavorites = async () => {
  try {
    await storage.setItem('user_favorites', Array.from(favorites.value))
  } catch (err) {
    console.error('Failed to save favorites', err)
  }
}

onMounted(() => {
  loadFavorites()
})

const toggleFavorite = (id: string) => {
  if (favorites.value.has(id)) {
    favorites.value.delete(id)
  } else {
    favorites.value.add(id)
  }
  saveFavorites()
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const selectCategory = (id: ToolCategory | 'All') => {
  activeCategory.value = id
}

const filteredTools = computed(() => {
  let result = TOOLS

  if (activeCategory.value === 'Favorites') {
    result = result.filter(t => favorites.value.has(t.id))
  } else if (activeCategory.value !== 'All') {
    result = result.filter(t => t.category === activeCategory.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    )
  }

  return result
})

const handleClickTool = (id: string) => {
  currentToolId.value = id
}

const handleBack = () => {
  currentToolId.value = null
}
</script>

<template>
  <div class="flex h-screen bg-[var(--color-background)]">
    <Sidebar
      v-if="!currentToolId"
      :active-category="activeCategory"
      :categories="CATEGORIES"
      :plugin-name="props.pluginName"
      @select-category="selectCategory"
      @click-feedback="isFeedbackOpen = true"
    />

    <main class="flex-1 flex flex-col overflow-hidden">
      <template v-if="!currentToolId">
        <SearchBar @search="handleSearch" />

        <div class="flex-1 p-6 overflow-y-auto scroll-smooth">
          <header class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold tracking-tight">{{ CATEGORIES.find(c => c.id === activeCategory)?.name }}</h2>
            <span class="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
              {{ filteredTools.length }} 个工具
            </span>
          </header>

          <div v-if="filteredTools.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 pb-10">
            <ToolCard
              v-for="tool in filteredTools"
              :key="tool.id"
              :tool="tool"
              :is-favorite="favorites.has(tool.id)"
              @toggle-favorite="toggleFavorite"
              @click-tool="handleClickTool"
            />
          </div>

          <div v-else class="flex flex-col items-center justify-center py-20 text-[var(--color-muted-foreground)]">
            <span class="text-5xl opacity-50 mb-4">🔍</span>
            <p class="mb-4">没有找到相关工具</p>
            <Button v-if="activeCategory !== 'All'" variant="outline" @click="activeCategory = 'All'">
              <ArrowLeft class="size-4" /> 查看所有工具
            </Button>
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
    <Toaster v-if="isWebMode" />
    <FeedbackModal :show="isFeedbackOpen" @close="isFeedbackOpen = false" />
  </div>
</template>
