<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Minus, Maximize, Eraser, Sparkles, FileText } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Select from '../ui/select/Select.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import Separator from '../ui/separator/Separator.vue'

const input = ref('')
const error = ref<string | null>(null)
const indent = ref('2')

const formattedOutput = computed(() => {
  if (!input.value.trim()) return ''
  try {
    const parsed = JSON.parse(input.value)
    error.value = null
    return JSON.stringify(parsed, null, Number(indent.value))
  } catch (e: any) {
    error.value = e.message
    return ''
  }
})

const handleFormat = () => {
  if (!input.value.trim()) return
  try {
    const parsed = JSON.parse(input.value)
    input.value = JSON.stringify(parsed, null, Number(indent.value))
    error.value = null
  } catch (e: any) {
    error.value = e.message
  }
}

const handleMinify = () => {
  if (!input.value.trim()) return
  try {
    const parsed = JSON.parse(input.value)
    input.value = JSON.stringify(parsed)
    error.value = null
  } catch (e: any) {
    error.value = e.message
  }
}

const handleClear = () => {
  input.value = ''
  error.value = null
}

const handleCopy = () => {
  const textToCopy = formattedOutput.value || input.value
  if (!textToCopy) return
  navigator.clipboard.writeText(textToCopy).then(() => {
    toast.success('已复制到剪贴板')
  })
}

const handleSample = () => {
  const sample = {
    name: "Onin Dev Toolbox",
    version: "1.0.0",
    description: "A premium set of developer tools.",
    features: [
      { id: 1, name: "JSON Formatter", status: "Done" },
      { id: 2, name: "Base64 & More", status: "Coming Soon" }
    ],
    settings: {
      theme: "dark",
      folding: true,
      lineNumbers: true
    }
  }
  input.value = JSON.stringify(sample, null, 2)
}
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <Button variant="default" size="sm" @click="handleFormat">
          <Sparkles class="size-3.5" />
          格式化
        </Button>
        <Button variant="outline" size="sm" @click="handleMinify">
          <Minus class="size-3.5" />
          压缩
        </Button>
        <Separator orientation="vertical" class="h-5" />
        <Select v-model="indent" placeholder="缩进">
          <SelectItem value="2">2 空格</SelectItem>
          <SelectItem value="4">4 空格</SelectItem>
          <SelectItem value="0">Tab</SelectItem>
        </Select>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="handleSample">
          <FileText class="size-3.5" />
          插入示例
        </Button>
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear">
          <Eraser class="size-3.5" />
          清空
        </Button>
        <Button variant="default" size="sm" @click="handleCopy">
          <Copy class="size-3.5" />
          复制
        </Button>
      </div>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">
          输入 / 编辑
        </div>
        <div class="flex-1 overflow-hidden">
          <Editor v-model="input" placeholder="请在此处粘贴或输入 JSON..." />
        </div>
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">
          预览 / 折叠
        </div>
        <div class="flex-1 overflow-hidden">
          <Editor v-if="formattedOutput" :model-value="formattedOutput" readonly />
          <div v-else-if="error" class="h-full flex flex-col items-center justify-center p-5 text-red-500 gap-3">
            <span class="text-2xl">⚠️</span>
            <p class="text-sm text-center">解析错误: {{ error }}</p>
          </div>
          <div v-else class="h-full flex items-center justify-center text-[var(--color-muted-foreground)] italic text-sm">
            等待输入...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
