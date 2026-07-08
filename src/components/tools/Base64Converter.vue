<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser, ArrowRightLeft, FileText, File, ArrowRight, ArrowLeft } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Switch from '../ui/switch/Switch.vue'
import Separator from '../ui/separator/Separator.vue'
import { encodeBase64, decodeBase64 } from '../../utils/base64'

const input = ref('')
const output = ref('')
const error = ref<string | null>(null)
const isUrlSafe = ref(false)
const mode = ref<'text' | 'file'>('text')

const handleEncode = () => {
  if (!input.value.trim()) return
  try {
    output.value = encodeBase64(input.value, isUrlSafe.value)
    error.value = null
  } catch (e: any) {
    error.value = '编码失败: ' + e.message
  }
}

const handleDecode = () => {
  if (!input.value.trim()) return
  try {
    output.value = decodeBase64(input.value, isUrlSafe.value)
    error.value = null
  } catch (e: any) {
    error.value = '解码失败: 请确保输入是有效的 Base64 字符串'
  }
}

const handleClear = () => {
  input.value = ''
  output.value = ''
  error.value = null
}

const handleCopy = () => {
  if (!output.value) return
  navigator.clipboard.writeText(output.value).then(() => {
    toast.success('已复制到剪贴板')
  })
}

const handleSwap = () => {
  const temp = input.value
  input.value = output.value
  output.value = temp
}

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

const processFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    output.value = e.target?.result as string
    input.value = `File: ${file.name} (${file.size} bytes)`
    error.value = null
  }
  reader.onerror = () => { error.value = '文件读取失败' }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <div class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" :class="mode === 'text' ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="mode = 'text'">文本</Button>
          <Button variant="ghost" size="sm" :class="mode === 'file' ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="mode = 'file'">文件</Button>
        </div>

        <Separator orientation="vertical" class="h-5" />

        <label class="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] cursor-pointer select-none">
          <Switch v-model="isUrlSafe" />
          <span>URL Safe</span>
        </label>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear">
          <Eraser class="size-3.5" />
          清空
        </Button>
        <Button variant="default" size="sm" @click="handleCopy">
          <Copy class="size-3.5" />
          复制结果
        </Button>
      </div>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between">
          <span>{{ mode === 'text' ? '输入内容' : '待转换文件' }}</span>
          <div v-if="mode === 'text'" class="flex gap-1">
            <Button variant="default" size="sm" class="h-6 text-[11px]" @click="handleEncode"><ArrowRight class="size-3" /> 编码</Button>
            <Button variant="outline" size="sm" class="h-6 text-[11px]" @click="handleDecode"><ArrowLeft class="size-3" /> 解码</Button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <template v-if="mode === 'text'">
            <Editor v-model="input" placeholder="输入待编码或解码的内容..." />
          </template>
          <template v-else>
            <div
              class="h-[calc(100%-32px)] border-2 border-dashed border-[var(--color-border)] m-4 rounded-xl flex flex-col items-center justify-center text-[var(--color-muted-foreground)] transition-all hover:bg-white/[0.03] hover:border-blue-500 hover:text-white cursor-pointer"
              @dragover.prevent
              @drop="handleDrop"
              @click="($refs.fileInput as HTMLInputElement)?.click()"
            >
              <input type="file" ref="fileInput" style="display:none" @change="handleFileChange" />
              <span class="text-5xl mb-3 opacity-60">📁</span>
              <p v-if="!input.includes('File:')">点击或拖拽文件到此处</p>
              <p v-else class="text-blue-400 font-mono">{{ input }}</p>
            </div>
          </template>
        </div>
      </div>

      <Button
        v-if="mode === 'text'"
        variant="outline" size="icon"
        class="self-center shrink-0 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:rotate-180 transition-all duration-300 max-md:rotate-90 max-md:hover:rotate-270"
        @click="handleSwap" title="交换输入输出"
      >
        <ArrowRightLeft class="size-5" />
      </Button>
      <div v-else class="self-center shrink-0 text-[var(--color-muted-foreground)]">
        <ArrowRightLeft class="size-6 opacity-30" />
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">
          结果 (Base64)
        </div>
        <div class="flex-1 overflow-hidden">
          <Editor v-if="!error" v-model="output" readonly />
          <div v-else class="h-full flex items-center justify-center text-red-500 text-sm p-5 text-center">{{ error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
