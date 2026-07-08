<script setup lang="ts">
import { ref, computed } from 'vue';
import { toast } from 'onin-sdk';
import Editor from '../Editor.vue';
import {
  tokenize,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toTitleCase
} from '../../utils/case';

const input = ref('');

const handleClear = () => {
  input.value = '';
};

const handleCopy = (text: string, label: string) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`已复制 ${label} 到剪贴板`);
  });
};

// 风格列表定义 (平等渲染)
const cases = computed(() => {
  const words = tokenize(input.value);
  const text = input.value;

  return [
    { id: 'camel', name: 'camelCase (小驼峰)', value: text ? toCamelCase(words) : '' },
    { id: 'pascal', name: 'PascalCase (大驼峰)', value: text ? toPascalCase(words) : '' },
    { id: 'snake', name: 'snake_case (蛇形命名)', value: text ? toSnakeCase(words) : '' },
    { id: 'kebab', name: 'kebab-case (中划线命名)', value: text ? toKebabCase(words) : '' },
    { id: 'constant', name: 'CONSTANT_CASE (常量)', value: text ? toConstantCase(words) : '' },
    { id: 'title', name: 'Title Case (首字母大写)', value: text ? toTitleCase(words) : '' },
    { id: 'upper', name: 'UPPERCASE (纯大写)', value: text ? text.toUpperCase() : '' },
    { id: 'lower', name: 'lowercase (纯小写)', value: text ? text.toLowerCase() : '' },
  ];
});

// 获取各样式 Badge 的 Tailwind 配色 Class，替换原有 !important Scoped CSS
const getBadgeClass = (id: string) => {
  switch (id) {
    case 'camel': return 'bg-blue-500/10 text-blue-300 border-blue-500/25';
    case 'pascal': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
    case 'snake': return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
    case 'kebab': return 'bg-rose-500/10 text-rose-300 border-rose-500/25';
    case 'constant': return 'bg-violet-500/10 text-violet-300 border-violet-500/25';
    case 'title': return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25';
    case 'upper': return 'bg-pink-500/10 text-pink-300 border-pink-500/25';
    case 'lower': return 'bg-slate-500/10 text-slate-300 border-slate-500/25';
    default: return 'bg-white/10 text-white/80 border-white/20';
  }
};
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/5 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-white/50">文本大小写与命名风格转换</span>
      </div>
      <div class="flex items-center gap-3">
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="flex-1 flex gap-3 min-h-0 items-stretch md:flex-row flex-col">
      <!-- 输入面板 -->
      <div class="flex-1 flex flex-col bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
        <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex items-center">
          <span>输入文本</span>
        </div>
        <div class="flex-1 overflow-hidden">
          <Editor v-model="input" placeholder="请在此处输入需要转换命名格式的词语或段落文本..." />
        </div>
      </div>

      <!-- 输出面板 -->
      <div class="flex-1 flex flex-col bg-white/[0.015] rounded-xl border border-white/5 overflow-hidden">
        <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex items-center">
          <span>转换结果</span>
        </div>

        <div class="flex-1 overflow-y-auto p-4 box-border scroll-smooth">
          <div class="flex flex-col gap-3">
            <div 
              v-for="item in cases" 
              :key="item.id" 
              class="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 rounded-xl p-3 px-4 flex flex-col gap-2 transition-all hover:from-white/[0.04] hover:to-white/[0.015] hover:border-white/12 hover:shadow-lg"
            >
              <div class="flex justify-between items-center">
                <span :class="['text-[11px] font-bold px-2 py-0.5 rounded border tracking-wider', getBadgeClass(item.id)]">
                  {{ item.name }}
                </span>
                <button 
                  v-if="item.value" 
                  @click="handleCopy(item.value, item.name)" 
                  class="bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 text-[11px] rounded cursor-pointer transition-all hover:bg-blue-500 hover:border-blue-500 hover:text-white"
                  title="复制此格式"
                >
                  复制 📋
                </button>
              </div>
              
              <div class="flex items-center min-h-[24px]">
                <div class="font-mono text-[13.5px] text-white/95 break-all select-all leading-relaxed w-full">
                  <template v-if="item.value">
                    {{ item.value }}
                  </template>
                  <template v-else>
                    <span class="text-white/20 text-xs italic">等待输入数据...</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
