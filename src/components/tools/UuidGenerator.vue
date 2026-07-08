<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser, RefreshCw } from '@lucide/vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import Select from '../ui/select/Select.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import Separator from '../ui/separator/Separator.vue'

const quantity = ref(1)
const useUppercase = ref(false)
const useHyphens = ref(true)
const results = ref<string[]>([])

const generateUuid = () => {
  const newResults: string[] = []
  for (let i = 0; i < quantity.value; i++) {
    let uuid = crypto.randomUUID()
    if (!useHyphens.value) uuid = uuid.replace(/-/g, '')
    if (useUppercase.value) uuid = uuid.toUpperCase()
    newResults.push(uuid)
  }
  results.value = newResults
}

const handleCopyAll = () => {
  if (results.value.length === 0) return
  navigator.clipboard.writeText(results.value.join('\n')).then(() => toast.success('已复制所有 UUID'))
}

const handleCopySingle = (text: string) => {
  navigator.clipboard.writeText(text).then(() => toast.success('已复制到剪贴板'))
}

const handleClear = () => { results.value = [] }

onMounted(() => { generateUuid() })
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span>数量:</span>
          <Select v-model="(quantity as any)" placeholder="1" class="w-20">
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </Select>
        </div>
        <Separator orientation="vertical" class="h-5" />
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] cursor-pointer select-none">
          <Checkbox v-model="useUppercase" /> 大写
        </label>
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] cursor-pointer select-none">
          <Checkbox v-model="useHyphens" /> 连字符
        </label>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear"><Eraser class="size-3.5" /> 清空</Button>
        <Button variant="default" size="sm" @click="handleCopyAll"><Copy class="size-3.5" /> 复制全部</Button>
        <Button variant="secondary" size="sm" @click="generateUuid"><RefreshCw class="size-3.5" /> 重新生成</Button>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between">
        <span>生成的 UUID</span>
        <span class="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]">{{ results.length }} 个</span>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="results.length > 0" class="flex flex-col gap-2">
          <div v-for="(uuid, index) in results" :key="index" class="flex items-center justify-between px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-secondary)]/50 transition-colors group">
            <code class="font-mono text-sm text-[var(--color-foreground)] tracking-wide">{{ uuid }}</code>
            <Button variant="ghost" size="icon-sm" class="opacity-40 group-hover:opacity-100" @click="handleCopySingle(uuid)" title="复制">
              <Copy class="size-3.5" />
            </Button>
          </div>
        </div>
        <div v-else class="h-full flex items-center justify-center text-[var(--color-muted-foreground)] text-sm opacity-50">
          点击"重新生成"开始
        </div>
      </div>
    </div>
  </div>
</template>
