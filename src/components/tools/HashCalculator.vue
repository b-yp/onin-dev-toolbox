<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser } from '@lucide/vue'
import CryptoJS from 'crypto-js'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import Badge from '../ui/badge/Badge.vue'

const input = ref('')
const mode = ref<'text' | 'file'>('text')
const isUppercase = ref(false)
const selectedFile = ref<File | null>(null)
const fileProgress = ref(0)
const isCalculating = ref(false)

const hashResults = ref({ md5: '', sha1: '', sha256: '', sha512: '' })

const handleClear = () => {
  input.value = ''; selectedFile.value = null; fileProgress.value = 0; isCalculating.value = false
  hashResults.value = { md5: '', sha1: '', sha256: '', sha512: '' }
}

const formatHash = (val: string) => val ? (isUppercase.value ? val.toUpperCase() : val.toLowerCase()) : ''

const handleCopy = (val: string, label: string) => {
  if (!val) return
  navigator.clipboard.writeText(formatHash(val)).then(() => toast.success(`已复制 ${label} 到剪贴板`))
}

const calculateTextHash = (text: string) => {
  if (!text) { hashResults.value = { md5: '', sha1: '', sha256: '', sha512: '' }; return }
  try {
    hashResults.value = {
      md5: CryptoJS.MD5(text).toString(),
      sha1: CryptoJS.SHA1(text).toString(),
      sha256: CryptoJS.SHA256(text).toString(),
      sha512: CryptoJS.SHA512(text).toString(),
    }
  } catch (e: any) { toast.error('计算哈希失败: ' + e.message) }
}

watch(input, (newVal) => { if (mode.value === 'text') calculateTextHash(newVal) })

const calculateFileHashChunks = (file: File) => {
  isCalculating.value = true; fileProgress.value = 0
  const algos = {
    md5: CryptoJS.algo.MD5.create(), sha1: CryptoJS.algo.SHA1.create(),
    sha256: CryptoJS.algo.SHA256.create(), sha512: CryptoJS.algo.SHA512.create(),
  }
  const chunkSize = 2 * 1024 * 1024
  const reader = new FileReader()
  let offset = 0

  reader.onload = (e) => {
    if (e.target?.error) { toast.error('读取文件出错'); isCalculating.value = false; return }
    const arrayBuffer = e.target?.result as ArrayBuffer
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any)
    Object.values(algos).forEach(a => a.update(wordArray))
    offset += arrayBuffer.byteLength
    fileProgress.value = Math.min(100, Math.round((offset / file.size) * 100))
    offset < file.size ? readNextChunk() : (hashResults.value = { md5: algos.md5.finalize().toString(), sha1: algos.sha1.finalize().toString(), sha256: algos.sha256.finalize().toString(), sha512: algos.sha512.finalize().toString() }, isCalculating.value = false, toast.success('文件哈希计算完成'))
  }
  reader.onerror = () => { toast.error('文件读取失败'); isCalculating.value = false }
  const readNextChunk = () => { const slice = file.slice(offset, offset + chunkSize); reader.readAsArrayBuffer(slice) }
  readNextChunk()
}

const handleFileChange = (e: Event) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) processFile(file) }
const handleDrop = (e: DragEvent) => { e.preventDefault(); const file = e.dataTransfer?.files[0]; if (file) processFile(file) }
const processFile = (file: File) => { selectedFile.value = file; calculateFileHashChunks(file) }

watch(mode, () => handleClear())

const algos = computed(() => [
  { id: 'md5' as const, name: 'MD5', value: hashResults.value.md5 },
  { id: 'sha1' as const, name: 'SHA-1', value: hashResults.value.sha1 },
  { id: 'sha256' as const, name: 'SHA-256', value: hashResults.value.sha256 },
  { id: 'sha512' as const, name: 'SHA-512', value: hashResults.value.sha512 },
])

const badgeColors: Record<string, string> = {
  md5: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  sha1: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  sha256: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  sha512: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
}
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <div class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" :class="mode === 'text'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="mode = 'text'" :disabled="isCalculating">文本模式</Button>
          <Button variant="ghost" size="sm" :class="mode === 'file'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="mode = 'file'" :disabled="isCalculating">文件模式</Button>
        </div>
        <div class="w-px h-5 bg-[var(--color-border)]" />
        <label class="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] cursor-pointer select-none">
          <Checkbox v-model="isUppercase" />
          <span>大写字母</span>
        </label>
      </div>
      <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear" :disabled="isCalculating"><Eraser class="size-3.5" /> 清空</Button>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">
          <span>{{ mode === 'text' ? '输入文本' : '选择文件' }}</span>
        </div>
        <div class="flex-1 overflow-hidden">
          <template v-if="mode === 'text'">
            <Editor v-model="input" placeholder="请输入待计算哈希的文本内容..." />
          </template>
          <template v-else>
            <div class="h-[calc(100%-32px)] border-2 border-dashed border-[var(--color-border)] m-4 rounded-xl flex flex-col items-center justify-center text-[var(--color-muted-foreground)] transition-all hover:bg-white/[0.03] hover:border-blue-500 hover:text-white cursor-pointer" @dragover.prevent @drop="handleDrop" @click="!isCalculating && ($refs.fileInput as HTMLInputElement).click()" :class="{ 'cursor-not-allowed opacity-70': isCalculating }">
              <input type="file" ref="fileInput" style="display:none" @change="handleFileChange" :disabled="isCalculating" />
              <span class="text-5xl mb-3 opacity-60">🛡️</span>
              <template v-if="!selectedFile">
                <p>点击或拖拽文件到此处</p>
                <span class="text-[11px] text-[var(--color-muted-foreground)]/30 mt-1.5">支持任意格式文件，超大文件自动分块计算</span>
              </template>
              <template v-else>
                <div class="text-center w-[80%]">
                  <p class="text-blue-400 font-medium font-mono break-all mb-1">{{ selectedFile.name }}</p>
                  <p class="text-xs text-[var(--color-muted-foreground)] mb-4">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
                  <div v-if="isCalculating" class="relative w-full h-5 bg-[var(--color-muted)] rounded-full overflow-hidden border border-[var(--color-border)]">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-100 ease-out" :style="{ width: `${fileProgress}%` }" />
                    <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-white drop-shadow-sm">正在计算: {{ fileProgress }}%</span>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">计算结果</div>
        <div class="flex-1 overflow-y-auto p-4">
          <div class="flex flex-col gap-3">
            <div v-for="algo in algos" :key="algo.id" class="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3 flex flex-col gap-2 transition-all hover:border-white/15 hover:shadow-lg">
              <div class="flex items-center justify-between">
                <Badge variant="secondary" :class="badgeColors[algo.id] + ' text-[11px]'">{{ algo.name }}</Badge>
                <Button v-if="algo.value" variant="ghost" size="sm" class="h-6 text-[11px]" @click="handleCopy(algo.value, algo.name)"><Copy class="size-3" /> 复制</Button>
              </div>
              <div class="min-h-[24px] flex items-center">
                <div v-if="algo.value" class="font-mono text-[13.5px] text-[var(--color-foreground)]/95 break-all select-all">{{ formatHash(algo.value) }}</div>
                <div v-else class="text-[var(--color-muted-foreground)] text-xs italic">等待输入数据...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
