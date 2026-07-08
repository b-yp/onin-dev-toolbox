<script setup lang="ts">
import { ref, computed } from 'vue';
import { toast } from 'onin-sdk';

const pattern = ref('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
const sampleText = ref('欢迎使用 Onin Dev Toolbox!\n如有疑问可以发送邮件至 support@onin.dev 或 contact_us@domain.com 进行反馈。');

// 正则 Flags 复选框状态
const flags = ref({
  g: true,
  i: true,
  m: true,
  s: false,
  u: false,
});

// 构建 flags 字符串
const flagString = computed(() => {
  return Object.entries(flags.value)
    .filter(([_, enabled]) => enabled)
    .map(([char]) => char)
    .join('');
});

// 正则校验及匹配状态
const regexError = ref<string | null>(null);

// 核心正则匹配列表计算
const matches = computed(() => {
  regexError.value = null;
  if (!pattern.value) {
    return [];
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern.value, flagString.value);
  } catch (err: any) {
    regexError.value = err.message;
    return [];
  }

  const results = [];
  const text = sampleText.value;
  let match;
  let safetyCounter = 0;
  const maxMatches = 500; // 设定合理上限，防止大文本大匹配引发的浏览器卡顿

  // 处理全局匹配
  if (regex.global) {
    while ((match = regex.exec(text)) !== null) {
      // 零宽匹配检测防御 (例如 pattern 是 ^、$ 或者是 a* 匹配空字符串)，防止 lastIndex 不增加导致无限死循环
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      results.push({
        index: match.index,
        length: match[0].length,
        value: match[0],
        groups: match.slice(1),
      });

      safetyCounter++;
      if (safetyCounter >= maxMatches) {
        break; // 触发安全硬断点
      }
    }
  } else {
    // 非全局匹配只匹配一次
    match = regex.exec(text);
    if (match) {
      results.push({
        index: match.index,
        length: match[0].length,
        value: match[0],
        groups: match.slice(1),
      });
    }
  }

  return results;
});

// HTML 字符转义，保证 v-html 渲染的 XSS 安全
const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\r?\n/g, '<br>');
};

// 实时高亮匹配结果文本
const highlightedText = computed(() => {
  const text = sampleText.value;
  const list = matches.value;
  if (list.length === 0) {
    return escapeHtml(text);
  }

  let result = '';
  let lastIndex = 0;

  for (const match of list) {
    // 零宽匹配跳过高亮，防止页面渲染无意义的空 span 导致布局混乱
    if (match.length === 0) {
      continue;
    }

    // 拼接未匹配的普通文本
    result += escapeHtml(text.slice(lastIndex, match.index));

    // 拼接带有半透明背景高亮的匹配片段
    const matchedSegment = text.slice(match.index, match.index + match.length);
    result += `<span class="bg-blue-500/25 text-blue-200 border-b border-blue-500/40 rounded-sm px-0.5 mx-px" title="Index: ${match.index}">${escapeHtml(matchedSegment)}</span>`;

    lastIndex = match.index + match.length;
  }

  // 拼接结尾剩余的文本
  result += escapeHtml(text.slice(lastIndex));
  return result;
});

// 清空所有输入
const handleClear = () => {
  pattern.value = '';
  sampleText.value = '';
};

// 复制指定的匹配项文本
const handleCopy = (text: string, index: number) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`已复制第 ${index + 1} 个匹配项`);
  });
};

// 复制当前正则表达式字面量
const handleCopyPattern = () => {
  if (!pattern.value) return;
  const fullRegexText = `/${pattern.value}/${flagString.value}`;
  navigator.clipboard.writeText(fullRegexText).then(() => {
    toast.success('已复制正则表达式字面量');
  });
};
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/5 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold text-white/50">正则表达式测试工具</span>
      </div>
      <div class="flex items-center gap-3">
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="flex-1 flex gap-3 min-h-0 items-stretch md:flex-row flex-col">
      <!-- 左侧：正则输入与测试文本 -->
      <div class="flex-1 flex flex-col gap-3 min-h-0">
        <!-- 1. 正则 Pattern 及修饰符配置区 -->
        <div class="flex flex-col gap-2.5 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-white/40 font-mono">/</span>
            <input 
              v-model="pattern" 
              type="text" 
              placeholder="请输入正则表达式模式..." 
              class="flex-1 bg-transparent border-0 border-b border-white/10 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <span class="text-xs font-semibold text-white/40 font-mono">/</span>
            <span class="text-xs text-blue-400 font-mono font-semibold">{{ flagString }}</span>
            <button 
              v-if="pattern"
              @click="handleCopyPattern"
              class="bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 text-[11px] rounded cursor-pointer transition-all hover:bg-blue-500 hover:border-blue-500 hover:text-white"
              title="复制当前正则表达式"
            >
              复制正则 📋
            </button>
          </div>

          <!-- 修饰符选择复选框组 -->
          <div class="flex flex-wrap gap-4 text-xs mt-1.5 select-none">
            <label class="flex items-center gap-1.5 cursor-pointer text-white/50 hover:text-white transition-colors">
              <input type="checkbox" v-model="flags.g" class="accent-blue-500" />
              <span class="font-mono">g (全局)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-white/50 hover:text-white transition-colors">
              <input type="checkbox" v-model="flags.i" class="accent-blue-500" />
              <span class="font-mono">i (大小写)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-white/50 hover:text-white transition-colors">
              <input type="checkbox" v-model="flags.m" class="accent-blue-500" />
              <span class="font-mono">m (多行)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-white/50 hover:text-white transition-colors">
              <input type="checkbox" v-model="flags.s" class="accent-blue-500" />
              <span class="font-mono">s (点匹配换行)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer text-white/50 hover:text-white transition-colors">
              <input type="checkbox" v-model="flags.u" class="accent-blue-500" />
              <span class="font-mono">u (Unicode)</span>
            </label>
          </div>
        </div>

        <!-- 2. 测试样本测试文本框 -->
        <div class="flex-1 flex flex-col bg-white/[0.015] rounded-xl border border-white/5 overflow-hidden min-h-0">
          <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex items-center">
            <span>测试文本 (Test Sample)</span>
          </div>
          <div class="flex-1 p-3">
            <textarea 
              v-model="sampleText" 
              placeholder="请在此输入需要用来测试匹配的测试文本内容..." 
              class="w-full h-full bg-transparent border-0 text-white/90 text-sm focus:outline-none resize-none font-mono leading-relaxed"
            ></textarea>
          </div>
        </div>

        <!-- 3. 高亮匹配实时预览区 -->
        <div class="h-[160px] flex flex-col bg-white/[0.01] rounded-xl border border-white/5 overflow-hidden">
          <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex items-center">
            <span>高亮预览 (Highlight Preview)</span>
          </div>
          <div class="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed text-white/80 select-text whitespace-pre-wrap break-all">
            <div v-html="highlightedText"></div>
          </div>
        </div>
      </div>

      <!-- 右侧：匹配结果列表 -->
      <div class="flex-1 flex flex-col bg-white/[0.015] rounded-xl border border-white/5 overflow-hidden">
        <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex justify-between items-center">
          <span>匹配结果 (Matches)</span>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
            共 {{ matches.length }} 处匹配
          </span>
        </div>

        <div class="flex-1 overflow-y-auto scroll-smooth">
          <!-- 正则错误显示 -->
          <div v-if="regexError" class="p-8 px-6 flex flex-col items-center justify-center text-red-400 text-center gap-3">
            <div class="text-3xl">⚠️</div>
            <div class="font-mono text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 max-w-[90%] break-all">
              {{ regexError }}
            </div>
          </div>

          <!-- 无匹配提示 -->
          <div v-else-if="matches.length === 0" class="h-full flex flex-col items-center justify-center text-white/50 opacity-50 gap-3">
            <div class="text-5xl">🔍</div>
            <p class="text-xs">暂无任何匹配结果</p>
          </div>

          <!-- 匹配项列表 -->
          <div v-else class="flex flex-col gap-3 p-4">
            <div 
              v-for="(match, index) in matches" 
              :key="index" 
              class="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 rounded-xl p-3.5 px-4 flex flex-col gap-2 transition-all hover:from-white/[0.04] hover:to-white/[0.015] hover:border-white/12 hover:shadow-lg"
            >
              <!-- 匹配项卡片头部 -->
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                    Match {{ index + 1 }}
                  </span>
                  <span class="text-[11px] font-mono text-white/40">
                    Index: {{ match.index }} - {{ match.index + match.length }}
                  </span>
                </div>
                <button 
                  @click="handleCopy(match.value, index)" 
                  class="bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 text-[11px] rounded cursor-pointer transition-all hover:bg-blue-500 hover:border-blue-500 hover:text-white"
                  title="复制匹配文本"
                >
                  复制 📋
                </button>
              </div>

              <!-- 匹配的值 -->
              <div class="font-mono text-[13.5px] text-white/95 break-all select-all leading-relaxed w-full bg-black/15 p-2 rounded border border-white/[0.02]">
                {{ match.value }}
              </div>

              <!-- 捕获组展示 (Capture Groups) -->
              <div v-if="match.groups && match.groups.length > 0" class="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2">
                <div 
                  v-for="(group, gIdx) in match.groups" 
                  :key="gIdx" 
                  class="flex text-xs font-mono"
                >
                  <span class="text-white/40 w-[80px] shrink-0">Group {{ gIdx + 1 }}:</span>
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
