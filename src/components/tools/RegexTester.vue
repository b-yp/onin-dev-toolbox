<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser } from '@lucide/vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'
import Badge from '../ui/badge/Badge.vue'

const pattern = ref('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}')
const sampleText = ref('欢迎使用 Onin Dev Toolbox!\n如有疑问可以发送邮件至 support@onin.dev 或 contact_us@domain.com 进行反馈。')

const flags = ref({ g: true, i: true, m: true, s: false, u: false })
const flagString = computed(() => Object.entries(flags.value).filter(([, e]) => e).map(([c]) => c).join(''))
const regexError = ref<string | null>(null)

const matches = computed(() => {
  regexError.value = null
  if (!pattern.value) return []
  let regex: RegExp
  try { regex = new RegExp(pattern.value, flagString.value) } catch (err: any) { regexError.value = err.message; return [] }
  const results: { index: number; length: number; value: string; groups: string[] }[] = []
  const text = sampleText.value
  let match; let safetyCounter = 0; const maxMatches = 500
  if (regex.global) {
    while ((match = regex.exec(text)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++
      results.push({ index: match.index, length: match[0].length, value: match[0], groups: match.slice(1) })
      if (++safetyCounter >= maxMatches) break
    }
  } else {
    match = regex.exec(text)
    if (match) results.push({ index: match.index, length: match[0].length, value: match[0], groups: match.slice(1) })
  }
  return results
})

const escapeHtml = (unsafe: string) => unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\r?\n/g, '<br>')

const highlightedText = computed(() => {
  const text = sampleText.value
  const list = matches.value
  if (list.length === 0) return escapeHtml(text)
  let result = ''; let lastIndex = 0
  for (const match of list) {
    if (match.length === 0) continue
    result += escapeHtml(text.slice(lastIndex, match.index))
    const segment = text.slice(match.index, match.index + match.length)
    result += `<span class="bg-blue-500/25 text-blue-200 border-b border-blue-500/40 rounded-sm px-0.5 mx-px" title="Index: ${match.index}">${escapeHtml(segment)}</span>`
    lastIndex = match.index + match.length
  }
  result += escapeHtml(text.slice(lastIndex))
  return result
})

const handleClear = () => { pattern.value = ''; sampleText.value = '' }
const handleCopy = (text: string, index: number) => { if (!text) return; navigator.clipboard.writeText(text).then(() => toast.success(`已复制第 ${index + 1} 个匹配项`)) }
const handleCopyPattern = () => { if (!pattern.value) return; navigator.clipboard.writeText(`/${pattern.value}/${flagString.value}`).then(() => toast.success('已复制正则表达式字面量')) }
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <span class="text-xs font-semibold text-[var(--color-muted-foreground)]">正则表达式测试工具</span>
      <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear"><Eraser class="size-3.5" /> 清空</Button>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col gap-3 min-h-0">
        <div class="flex flex-col gap-2.5 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-[var(--color-muted-foreground)] font-mono">/</span>
            <input v-model="pattern" type="text" placeholder="请输入正则表达式模式..." class="flex-1 bg-transparent border-0 border-b border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] font-mono" />
            <span class="text-xs font-semibold text-[var(--color-muted-foreground)] font-mono">/</span>
            <span class="text-xs text-blue-400 font-mono font-semibold">{{ flagString }}</span>
            <Button v-if="pattern" variant="ghost" size="sm" class="h-6 text-[11px]" @click="handleCopyPattern"><Copy class="size-3" /> 复制正则</Button>
          </div>
          <div class="flex flex-wrap gap-4 text-xs select-none">
            <label class="flex items-center gap-1.5 cursor-pointer text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"><Checkbox v-model="flags.g" /> <span class="font-mono">g (全局)</span></label>
            <label class="flex items-center gap-1.5 cursor-pointer text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"><Checkbox v-model="flags.i" /> <span class="font-mono">i (大小写)</span></label>
            <label class="flex items-center gap-1.5 cursor-pointer text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"><Checkbox v-model="flags.m" /> <span class="font-mono">m (多行)</span></label>
            <label class="flex items-center gap-1.5 cursor-pointer text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"><Checkbox v-model="flags.s" /> <span class="font-mono">s (点匹配换行)</span></label>
            <label class="flex items-center gap-1.5 cursor-pointer text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"><Checkbox v-model="flags.u" /> <span class="font-mono">u (Unicode)</span></label>
          </div>
        </div>

        <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden min-h-0">
          <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">测试文本</div>
          <div class="flex-1 p-3"><textarea v-model="sampleText" placeholder="请在此输入需要用来测试匹配的测试文本内容..." class="w-full h-full bg-transparent border-0 text-[var(--color-foreground)]/90 text-sm focus:outline-none resize-none font-mono leading-relaxed"></textarea></div>
        </div>

        <div class="h-40 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">高亮预览</div>
          <div class="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed text-[var(--color-foreground)]/80 select-text whitespace-pre-wrap break-all"><div v-html="highlightedText"></div></div>
        </div>
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between">
          <span>匹配结果</span>
          <Badge variant="secondary" class="text-[11px] text-blue-300 bg-blue-500/15 border-blue-500/20">共 {{ matches.length }} 处匹配</Badge>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="regexError" class="p-8 flex flex-col items-center justify-center text-red-400 text-center gap-3"><span class="text-3xl">⚠️</span><div class="font-mono text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 max-w-[90%] break-all">{{ regexError }}</div></div>
          <div v-else-if="matches.length === 0" class="h-full flex flex-col items-center justify-center text-[var(--color-muted-foreground)] opacity-50 gap-3"><span class="text-5xl">🔍</span><p class="text-xs">暂无匹配结果</p></div>
          <div v-else class="flex flex-col gap-3 p-4">
            <div v-for="(match, index) in matches" :key="index" class="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3.5 flex flex-col gap-2 transition-all hover:border-white/15 hover:shadow-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Badge variant="secondary" class="text-[11px] text-blue-300 bg-blue-500/15 border-blue-500/20">Match {{ index + 1 }}</Badge>
                  <span class="text-[11px] font-mono text-[var(--color-muted-foreground)]">Index: {{ match.index }} - {{ match.index + match.length }}</span>
                </div>
                <Button variant="ghost" size="sm" class="h-6 text-[11px]" @click="handleCopy(match.value, index)"><Copy class="size-3" /> 复制</Button>
              </div>
              <div class="font-mono text-[13.5px] text-[var(--color-foreground)]/95 break-all select-all p-2 rounded border border-[var(--color-border)] bg-black/15">{{ match.value }}</div>
              <div v-if="match.groups && match.groups.length > 0" class="flex flex-col gap-1.5 mt-1 pt-2 border-t border-[var(--color-border)]">
                <div v-for="(group, gIdx) in match.groups" :key="gIdx" class="flex text-xs font-mono">
                  <span class="text-[var(--color-muted-foreground)] w-20 shrink-0">Group {{ gIdx + 1 }}:</span>
                  <span class="text-emerald-400 break-all select-all">{{ group !== undefined ? group : 'undefined' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
