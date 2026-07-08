<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { toast as oninToast } from 'onin-sdk'
import { ArrowRightLeft, Eraser, FileText, Sparkles } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Checkbox from '../ui/checkbox/Checkbox.vue'

const toast = {
  success: (msg: string) => { try { oninToast.success(msg)?.catch?.(() => {}) } catch {} },
  error: (msg: string) => { try { oninToast.error(msg)?.catch?.(() => {}) } catch {} },
  info: (msg: string) => { try { oninToast.info(msg)?.catch?.(() => {}) } catch {} },
}
import { computeSplitDiff, computeInlineDiff } from '../../utils/diff'

const ORIGINAL_SAMPLE = `function greet(user) {\n  console.log("Hello, " + user + "!");\n  const items = [1, 2, 3];\n  for (let i = 0; i < items.length; i++) {\n    console.log(items[i]);\n  }\n}\n\ngreet("Onin User");`
const MODIFIED_SAMPLE = `function greet(user) {\n  console.log(\`Greetings, \${user}!\`);\n  const items = [1, 2, 3, 4];\n  items.forEach(item => {\n    console.log(item);\n  });\n}\n\ngreet("Onin Developer");`

const originalText = ref(ORIGINAL_SAMPLE)
const modifiedText = ref(MODIFIED_SAMPLE)
const diffOriginal = ref(ORIGINAL_SAMPLE)
const diffModified = ref(MODIFIED_SAMPLE)
const viewMode = ref<'split' | 'inline'>('split')
const ignoreWhitespace = ref(false)
const isRealtime = ref(true)
const isEditing = ref(true)
let debounceTimer: any = null

const updateDiffTexts = (immediate = false) => {
  if (immediate) { diffOriginal.value = originalText.value; diffModified.value = modifiedText.value; return }
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { diffOriginal.value = originalText.value; diffModified.value = modifiedText.value }, 300)
}

watch([originalText, modifiedText, ignoreWhitespace], () => { if (isRealtime.value) updateDiffTexts() })

const handleManualCompare = () => { updateDiffTexts(true); isEditing.value = false; toast.success('差异已重新计算') }
const handleClear = () => { originalText.value = ''; modifiedText.value = ''; updateDiffTexts(true) }
const handleSwap = () => { const t = originalText.value; originalText.value = modifiedText.value; modifiedText.value = t; updateDiffTexts(true) }
const handleLoadSample = () => { originalText.value = ORIGINAL_SAMPLE; modifiedText.value = MODIFIED_SAMPLE; updateDiffTexts(true); toast.success('已载入示例数据') }

const leftScrollRef = ref<HTMLElement | null>(null)
const rightScrollRef = ref<HTMLElement | null>(null)
let isSyncingLeft = false, isSyncingRight = false

const handleLeftScroll = () => {
  if (isSyncingRight) { isSyncingRight = false; return }
  if (leftScrollRef.value && rightScrollRef.value) { isSyncingLeft = true; rightScrollRef.value.scrollTop = leftScrollRef.value.scrollTop; rightScrollRef.value.scrollLeft = leftScrollRef.value.scrollLeft }
}
const handleRightScroll = () => {
  if (isSyncingLeft) { isSyncingLeft = false; return }
  if (leftScrollRef.value && rightScrollRef.value) { isSyncingRight = true; leftScrollRef.value.scrollTop = rightScrollRef.value.scrollTop; leftScrollRef.value.scrollLeft = rightScrollRef.value.scrollLeft }
}

onBeforeUnmount(() => { if (debounceTimer) clearTimeout(debounceTimer) })

const splitDiffData = computed(() => computeSplitDiff(diffOriginal.value, diffModified.value, { ignoreWhitespace: ignoreWhitespace.value }))
const inlineDiffData = computed(() => computeInlineDiff(diffOriginal.value, diffModified.value, { ignoreWhitespace: ignoreWhitespace.value }))

const diffSummary = computed(() => {
  const rows = inlineDiffData.value; let added = 0, removed = 0
  rows.forEach(r => { if (r.type === 'added') added++; if (r.type === 'removed') removed++ })
  return { added, removed }
})
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <div class="flex items-center gap-3">
        <div class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" :class="isEditing  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="isEditing = true">输入对比</Button>
          <Button variant="ghost" size="sm" :class="!isEditing  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="isEditing = false">查看差异</Button>
        </div>
        <div class="w-px h-5 bg-[var(--color-border)]" />
        <div v-if="!isEditing" class="flex bg-[var(--color-muted)] p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" :class="viewMode === 'split'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="viewMode = 'split'">双栏对比</Button>
          <Button variant="ghost" size="sm" :class="viewMode === 'inline'  ? 'bg-[var(--color-background)] shadow-sm' : ''" @click="viewMode = 'inline'">单栏混合</Button>
        </div>
        <div v-if="!isEditing" class="w-px h-5 bg-[var(--color-border)]" />
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] cursor-pointer select-none"><Checkbox v-model="ignoreWhitespace" /> 忽略空白</label>
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] cursor-pointer select-none"><Checkbox v-model="isRealtime" /> 实时对比</label>
      </div>
      <div class="flex items-center gap-2">
        <Button v-if="!isRealtime" variant="default" size="sm" @click="handleManualCompare"><Sparkles class="size-3.5" /> 立即比对</Button>
        <Button variant="outline" size="sm" @click="handleLoadSample"><FileText class="size-3.5" /> 载入示例</Button>
        <Button variant="outline" size="sm" @click="handleSwap"><ArrowRightLeft class="size-3.5" /></Button>
        <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear"><Eraser class="size-3.5" /> 清空</Button>
      </div>
    </div>

    <div v-if="!isEditing" class="flex items-center gap-4 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-xs text-[var(--color-muted-foreground)]">
      <span>变更摘要：</span>
      <span class="font-medium text-emerald-400">+ {{ diffSummary.added }} 行新增</span>
      <span class="font-medium text-red-400">- {{ diffSummary.removed }} 行删除</span>
    </div>

    <div class="flex-1 overflow-hidden relative">
      <div v-show="isEditing" class="flex w-full h-full gap-3 max-md:flex-col">
        <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between"><span>原始文本 (Original)</span></div>
          <div class="flex-1 overflow-hidden"><Editor v-model="originalText" placeholder="在此粘贴或输入源文本..." /></div>
        </div>
        <Button variant="outline" size="icon" class="self-center shrink-0" @click="handleSwap" title="交换"><ArrowRightLeft class="size-5" /></Button>
        <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center justify-between"><span>修改后文本 (Modified)</span></div>
          <div class="flex-1 overflow-hidden"><Editor v-model="modifiedText" placeholder="在此粘贴或输入修改后的文本..." /></div>
        </div>
      </div>

      <div v-show="!isEditing" class="flex w-full h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div v-if="viewMode === 'split'" class="flex w-full h-full overflow-hidden">
          <div class="flex-1 flex flex-col h-full overflow-hidden border-r border-[var(--color-border)]">
            <div class="px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider">原始文本</div>
            <div class="flex-1 overflow-auto bg-[var(--color-background)]" ref="leftScrollRef" @scroll="handleLeftScroll">
              <div class="flex flex-col min-w-max w-full font-mono text-[13px] leading-5 py-2 select-text">
                <div v-for="(row, idx) in splitDiffData.leftRows" :key="'l-'+idx" :class="['flex w-full items-stretch min-h-[20px] hover:bg-white/[0.02]', row.type === 'removed' ? 'bg-red-500/12' : (row.type === 'empty' ? 'bg-white/[0.005]' : '')]">
                  <div :class="['w-12 pr-3 text-right text-white/20 select-none border-r border-[var(--color-border)] flex items-center justify-end', row.type === 'removed' ? 'bg-red-500/8 text-red-500/40' : 'bg-white/[0.01]']">{{ row.lineNum ?? '' }}</div>
                  <div :class="['w-6 flex items-center justify-center font-bold select-none', row.type === 'removed' ? 'text-red-500' : '']">{{ row.type === 'removed' ? '-' : '' }}</div>
                  <div class="flex-1 pl-2 pr-4 whitespace-pre flex items-center text-slate-200">
                    <template v-if="row.inlineDiffs?.length"><span v-for="(chunk, ci) in row.inlineDiffs" :key="ci" :class="['', chunk.type === 'removed' ? 'bg-red-500/35 rounded-[2px] line-through' : '']">{{ chunk.text }}</span></template>
                    <template v-else>{{ row.text }}</template>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 flex flex-col h-full overflow-hidden">
            <div class="px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider">修改后文本</div>
            <div class="flex-1 overflow-auto bg-[var(--color-background)]" ref="rightScrollRef" @scroll="handleRightScroll">
              <div class="flex flex-col min-w-max w-full font-mono text-[13px] leading-5 py-2 select-text">
                <div v-for="(row, idx) in splitDiffData.rightRows" :key="'r-'+idx" :class="['flex w-full items-stretch min-h-[20px] hover:bg-white/[0.02]', row.type === 'added' ? 'bg-emerald-500/12' : (row.type === 'empty' ? 'bg-white/[0.005]' : '')]">
                  <div :class="['w-12 pr-3 text-right text-white/20 select-none border-r border-[var(--color-border)] flex items-center justify-end', row.type === 'added' ? 'bg-emerald-500/8 text-emerald-500/40' : 'bg-white/[0.01]']">{{ row.lineNum ?? '' }}</div>
                  <div :class="['w-6 flex items-center justify-center font-bold select-none', row.type === 'added' ? 'text-emerald-500' : '']">{{ row.type === 'added' ? '+' : '' }}</div>
                  <div class="flex-1 pl-2 pr-4 whitespace-pre flex items-center text-slate-200">
                    <template v-if="row.inlineDiffs?.length"><span v-for="(chunk, ci) in row.inlineDiffs" :key="ci" :class="['', chunk.type === 'added' ? 'bg-emerald-500/35 rounded-[2px]' : '']">{{ chunk.text }}</span></template>
                    <template v-else>{{ row.text }}</template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="w-full h-full flex flex-col">
          <div class="flex-1 overflow-auto bg-[var(--color-background)]">
            <div class="flex flex-col min-w-max w-full font-mono text-[13px] leading-5 py-2 select-text">
              <div v-for="(row, idx) in inlineDiffData" :key="'i-'+idx" :class="['flex w-full items-stretch min-h-[20px] hover:bg-white/[0.02]', row.type === 'added' ? 'bg-emerald-500/12 border-l-3 border-emerald-500' : (row.type === 'removed' ? 'bg-red-500/12 border-l-3 border-red-500' : '')]">
                <div :class="['w-10 pr-3 text-right text-white/20 select-none border-r border-[var(--color-border)] flex items-center justify-end', row.type === 'added' ? 'bg-emerald-500/8 text-emerald-500/40' : (row.type === 'removed' ? 'bg-red-500/8 text-red-500/40' : 'bg-white/[0.01]')]">{{ row.leftLineNum ?? '' }}</div>
                <div :class="['w-10 pr-3 text-right text-white/20 select-none border-r border-[var(--color-border)] flex items-center justify-end', row.type === 'added' ? 'bg-emerald-500/8 text-emerald-500/40' : (row.type === 'removed' ? 'bg-red-500/8 text-red-500/40' : 'bg-white/[0.01]')]">{{ row.rightLineNum ?? '' }}</div>
                <div :class="['w-6 flex items-center justify-center font-bold select-none', row.type === 'added' ? 'text-emerald-500' : (row.type === 'removed' ? 'text-red-500' : '')]">{{ row.type === 'added' ? '+' : (row.type === 'removed' ? '-' : '') }}</div>
                <div class="flex-1 pl-2 pr-4 whitespace-pre flex items-center text-slate-200">
                  <template v-if="row.inlineDiffs?.length"><span v-for="(chunk, ci) in row.inlineDiffs" :key="ci" :class="['', chunk.type === 'added' ? 'bg-emerald-500/35 rounded-[2px]' : (chunk.type === 'removed' ? 'bg-red-500/35 rounded-[2px] line-through' : '')]">{{ chunk.text }}</span></template>
                  <template v-else>{{ row.text }}</template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
