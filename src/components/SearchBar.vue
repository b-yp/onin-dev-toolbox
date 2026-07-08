<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Search } from '@lucide/vue'
import Input from './ui/input/Input.vue'

const searchQuery = ref('')
const emit = defineEmits(['search'])

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const inputRef = ref<InstanceType<typeof Input> | null>(null)

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-card)]/50">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted-foreground)]" />
      <Input
        ref="inputRef"
        v-model="searchQuery"
        class="pl-10"
        placeholder="搜索工具... (Cmd+K)"
        @input="handleSearch"
      />
    </div>
  </div>
</template>
