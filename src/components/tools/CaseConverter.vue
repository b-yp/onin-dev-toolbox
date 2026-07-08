<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'onin-sdk'
import { Copy, Eraser } from '@lucide/vue'
import Editor from '../Editor.vue'
import Button from '../ui/button/Button.vue'
import Badge from '../ui/badge/Badge.vue'
import { tokenize, toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toConstantCase, toTitleCase } from '../../utils/case'

const input = ref('')

const handleClear = () => { input.value = '' }

const handleCopy = (text: string, label: string) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => toast.success(`已复制 ${label} 到剪贴板`))
}

const cases = computed(() => {
  const words = tokenize(input.value)
  const text = input.value
  return [
    { id: 'camel', name: 'camelCase', value: text ? toCamelCase(words) : '' },
    { id: 'pascal', name: 'PascalCase', value: text ? toPascalCase(words) : '' },
    { id: 'snake', name: 'snake_case', value: text ? toSnakeCase(words) : '' },
    { id: 'kebab', name: 'kebab-case', value: text ? toKebabCase(words) : '' },
    { id: 'constant', name: 'CONSTANT_CASE', value: text ? toConstantCase(words) : '' },
    { id: 'title', name: 'Title Case', value: text ? toTitleCase(words) : '' },
    { id: 'upper', name: 'UPPERCASE', value: text ? text.toUpperCase() : '' },
    { id: 'lower', name: 'lowercase', value: text ? text.toLowerCase() : '' },
  ]
})

const badgeColors: Record<string, string> = {
  camel: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  pascal: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  snake: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  kebab: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  constant: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  title: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
  upper: 'bg-pink-500/10 text-pink-300 border-pink-500/25',
  lower: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
}
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <div class="flex items-center justify-between bg-[var(--color-card)] p-2 px-4 rounded-xl border border-[var(--color-border)]">
      <span class="text-sm font-semibold text-[var(--color-muted-foreground)]">文本大小写与命名风格转换</span>
      <Button variant="ghost" size="sm" class="hover:text-red-400" @click="handleClear"><Eraser class="size-3.5" /> 清空</Button>
    </div>

    <div class="flex-1 flex gap-3 min-h-0 items-stretch max-md:flex-col">
      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">输入文本</div>
        <div class="flex-1 overflow-hidden">
          <Editor v-model="input" placeholder="请在此处输入需要转换命名格式的词语或段落文本..." />
        </div>
      </div>

      <div class="flex-1 flex flex-col bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div class="px-4 py-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)] uppercase tracking-wider h-9 flex items-center">转换结果</div>
        <div class="flex-1 overflow-y-auto p-4">
          <div class="flex flex-col gap-3">
            <div v-for="item in cases" :key="item.id" class="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3 flex flex-col gap-2 transition-all hover:border-white/15 hover:shadow-lg">
              <div class="flex items-center justify-between">
                <Badge variant="secondary" :class="badgeColors[item.id] + ' text-[11px]'">{{ item.name }}</Badge>
                <Button v-if="item.value" variant="ghost" size="sm" class="h-6 text-[11px]" @click="handleCopy(item.value, item.name)"><Copy class="size-3" /> 复制</Button>
              </div>
              <div class="min-h-[24px] flex items-center">
                <div v-if="item.value" class="font-mono text-[13.5px] text-[var(--color-foreground)]/95 break-all select-all">{{ item.value }}</div>
                <div v-else class="text-[var(--color-muted-foreground)] text-xs italic">等待输入数据...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
