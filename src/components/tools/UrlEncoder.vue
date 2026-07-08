<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser, ArrowRightLeft, ArrowRight, ArrowLeft } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import { encodeUrl, decodeUrl } from '../../utils/url'

const input = ref('')
const output = ref('')
const error = ref<string | null>(null)
const mode = ref<'component' | 'uri'>('component')

const handleEncode = () => {
  if (!input.value.trim()) return
  try { output.value = encodeUrl(input.value, mode.value); error.value = null }
  catch (e: any) { error.value = '编码失败: ' + e.message }
}

const handleDecode = () => {
  if (!input.value.trim()) return
  try { output.value = decodeUrl(input.value, mode.value); error.value = null }
  catch (e: any) { error.value = '解码失败: 请确保输入是有效的 URL 编码字符串' }
}

const handleClear = () => { input.value = ''; output.value = ''; error.value = null }

const handleCopy = () => {
  if (!output.value) return
  navigator.clipboard.writeText(output.value).then(() => toast.success('已复制到剪贴板'))
}

const handleSwap = () => { const temp = input.value; input.value = output.value; output.value = temp }
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <div class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" :class="mode === 'component'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="mode = 'component'" title="编码 URI 组件（包含 & ? = 等）">URIComponent</Button>
          <Button variant="ghost" size="sm" :class="mode === 'uri'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="mode = 'uri'" title="编码完整 URI（保留 & ? = 等）">URI</Button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear"><Eraser class="size-3.5" />清空</Button>
        <Button variant="default" size="sm" @click="handleCopy"><Copy class="size-3.5" />复制结果</Button>
      </div>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between">
          <span>输入内容</span>
          <div class="flex gap-1">
            <Button variant="default" size="sm" class="h-6 text-[11px]" @click="handleEncode"><ArrowRight class="size-3" /> 编码</Button>
            <Button variant="outline" size="sm" class="h-6 text-[11px]" @click="handleDecode"><ArrowLeft class="size-3" /> 解码</Button>
          </div>
        </div>
        <div class="flex-1 overflow-hidden">
          <Editor v-model="input" placeholder="输入待编码或解码的 URL 或文本..." />
        </div>
      </div>

      <Button variant="outline" size="icon" class="self-center shrink-0 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:rotate-180 transition-all duration-300 max-md:rotate-90" @click="handleSwap" title="交换输入输出">
        <ArrowRightLeft class="size-5" />
      </Button>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">处理结果</div>
        <div class="flex-1 overflow-hidden">
          <Editor v-if="!error" v-model="output" readonly />
          <div v-else class="h-full flex items-center justify-center text-red-500 text-sm p-5 text-center">{{ error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
