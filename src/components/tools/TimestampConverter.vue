<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser, Sparkles } from '@lucide/vue'
import Button from '../ui/button/Button.vue'
import Input from '../ui/input/Input.vue'
import Separator from '../ui/separator/Separator.vue'
import { formatDate, timestampToDate, dateToTimestamp } from '../../utils/datetime'

const currentTime = ref(new Date())
let timer: any = null

onMounted(() => { timer = setInterval(() => { currentTime.value = new Date() }, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

const tsInput = ref('')
const tsUnit = ref<'s' | 'ms'>('s')
const tsResult = ref('')

const convertTsToDate = () => {
  if (!tsInput.value) return
  try { tsResult.value = timestampToDate(tsInput.value, tsUnit.value) }
  catch { tsResult.value = '转换失败: 无效的时间戳' }
}

const dtInput = ref('')
const dtResultS = ref('')
const dtResultMs = ref('')

const convertDateToTs = () => {
  if (!dtInput.value) return
  try {
    const res = dateToTimestamp(dtInput.value)
    dtResultS.value = res.s
    dtResultMs.value = res.ms
  } catch { dtResultS.value = '转换失败'; dtResultMs.value = '转换失败' }
}

const handleNow = () => {
  const now = new Date()
  dtInput.value = formatDate(now)
  convertDateToTs()
  tsInput.value = Math.floor(now.getTime() / 1000).toString()
  tsUnit.value = 's'
  convertTsToDate()
}

const handleCopy = (text: string) => {
  if (!text || text.includes('失败')) return
  navigator.clipboard.writeText(text).then(() => toast.success('已复制到剪贴板'))
}

const handleClear = () => {
  tsInput.value = ''; tsResult.value = ''; dtInput.value = ''; dtResultS.value = ''; dtResultMs.value = ''
}

watch(tsInput, convertTsToDate)
watch(tsUnit, convertTsToDate)
watch(dtInput, convertDateToTs)
onMounted(() => { handleNow() })
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border overflow-y-auto">
    <div class="flex items-center gap-6 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-md">
      <div class="flex items-center justify-center size-16 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border)] text-3xl shrink-0">🕒</div>
      <div class="flex-1">
        <div class="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">当前本地时间 (Live)</div>
        <div class="text-2xl font-bold font-mono text-[var(--color-foreground)] tracking-tight">{{ formatDate(currentTime) }}</div>
      </div>
      <div class="pl-6 border-l border-[var(--color-border)]">
        <div class="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Unix 时间戳</div>
        <div class="flex items-center gap-3">
          <code class="text-lg font-mono text-[var(--color-primary)] font-semibold">{{ Math.floor(currentTime.getTime() / 1000) }}</code>
          <Button variant="ghost" size="icon-sm" @click="handleCopy(Math.floor(currentTime.getTime() / 1000).toString())" title="复制"><Copy class="size-3.5" /></Button>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="handleNow">
          <Sparkles class="size-3.5" />
          现在
        </Button>
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear">
          <Eraser class="size-3.5" />
          清空
        </Button>
      </div>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between">
          <span>时间戳 ➔ 日期</span>
          <div class="flex bg-[var(--color-muted)] p-0.5 rounded-md">
            <Button variant="ghost" size="sm" :class="tsUnit === 's'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="tsUnit = 's'">秒 (s)</Button>
            <Button variant="ghost" size="sm" :class="tsUnit === 'ms'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="tsUnit = 'ms'">毫秒 (ms)</Button>
          </div>
        </div>
        <div class="p-5 flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs text-[var(--color-muted-foreground)] font-medium">Unix 时间戳</label>
            <Input v-model="tsInput" placeholder="请输入时间戳，例如: 1713196800" class="font-mono" />
          </div>
          <div class="text-center text-[var(--color-muted-foreground)] opacity-30">↓</div>
          <div class="flex flex-col gap-2">
            <label class="text-xs text-[var(--color-muted-foreground)] font-medium">转换结果 (本地时间)</label>
            <div class="relative flex">
              <Input :model-value="tsResult" readonly class="font-mono pr-16" />
              <Button v-if="tsResult && !tsResult.includes('失败')" variant="ghost" size="sm" class="absolute right-1 top-1/2 -translate-y-1/2 h-7" @click="handleCopy(tsResult)"><Copy class="size-3" /> 复制</Button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">
          <span>日期 ➔ 时间戳</span>
        </div>
        <div class="p-5 flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs text-[var(--color-muted-foreground)] font-medium">日期字符串</label>
            <Input v-model="dtInput" placeholder="例如: 2024-04-16 00:00:00" class="font-mono" />
          </div>
          <div class="text-center text-[var(--color-muted-foreground)] opacity-30">↓</div>
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-2">
              <label class="text-xs text-[var(--color-muted-foreground)] font-medium">时间戳 (秒)</label>
              <div class="relative flex">
                <Input :model-value="dtResultS" readonly class="font-mono pr-16" />
                <Button v-if="dtResultS && !dtResultS.includes('失败')" variant="ghost" size="sm" class="absolute right-1 top-1/2 -translate-y-1/2 h-7" @click="handleCopy(dtResultS)">复制</Button>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs text-[var(--color-muted-foreground)] font-medium">时间戳 (毫秒)</label>
              <div class="relative flex">
                <Input :model-value="dtResultMs" readonly class="font-mono pr-16" />
                <Button v-if="dtResultMs && !dtResultMs.includes('失败')" variant="ghost" size="sm" class="absolute right-1 top-1/2 -translate-y-1/2 h-7" @click="handleCopy(dtResultMs)">复制</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
