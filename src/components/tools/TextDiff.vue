<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { toast as oninToast } from 'onin-sdk';

// 兜底代理 toast，防止在非 Onin 运行时环境下抛出 Uncaught 异常
const toast = {
  success: (msg: string) => {
    try {
      oninToast.success(msg)?.catch?.((err: any) => console.log('Toast Success:', msg, err));
    } catch (e) {
      console.log('Toast Success:', msg);
    }
  },
  error: (msg: string) => {
    try {
      oninToast.error(msg)?.catch?.((err: any) => console.error('Toast Error:', msg, err));
    } catch (e) {
      console.error('Toast Error:', msg);
    }
  },
  info: (msg: string) => {
    try {
      oninToast.info(msg)?.catch?.((err: any) => console.log('Toast Info:', msg, err));
    } catch (e) {
      console.log('Toast Info:', msg);
    }
  }
};
import Editor from '../Editor.vue';
import { computeSplitDiff, computeInlineDiff } from '../../utils/diff';

// 示例数据
const ORIGINAL_SAMPLE = `// 这是一个示例原始代码
function greet(user) {
  console.log("Hello, " + user + "!");
  
  const items = [1, 2, 3];
  for (let i = 0; i < items.length; i++) {
    console.log(items[i]);
  }
}

greet("Onin User");`;

const MODIFIED_SAMPLE = `// 这是一个修改后的示例代码
function greet(user) {
  // 修改了输出格式，支持模板字符串
  console.log(\`Greetings, \${user}!\`);
  
  const items = [1, 2, 3, 4];
  items.forEach(item => {
    console.log(item);
  });
}

greet("Onin Developer");`;

// 基础文本状态
const originalText = ref(ORIGINAL_SAMPLE);
const modifiedText = ref(MODIFIED_SAMPLE);

// 用于计算 diff 的延迟文本状态 (Debounced)
const diffOriginal = ref(ORIGINAL_SAMPLE);
const diffModified = ref(MODIFIED_SAMPLE);

// 控制项
const viewMode = ref<'split' | 'inline'>('split');
const ignoreWhitespace = ref(false);
const isRealtime = ref(true);
const isEditing = ref(true); // 是否处于编辑模式（输入文本），反之则为“查看差异”模式

// 防抖定时器
let debounceTimer: any = null;

// 同步更新 diff 文本
const updateDiffTexts = (immediate = false) => {
  if (immediate) {
    diffOriginal.value = originalText.value;
    diffModified.value = modifiedText.value;
    return;
  }
  
  if (debounceTimer) clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(() => {
    diffOriginal.value = originalText.value;
    diffModified.value = modifiedText.value;
  }, 300);
};

// 监听文本变化并防抖
watch([originalText, modifiedText, ignoreWhitespace], () => {
  if (isRealtime.value) {
    updateDiffTexts();
  }
});

// 手动对比触发
const handleManualCompare = () => {
  updateDiffTexts(true);
  isEditing.value = false;
  toast.success('差异已重新计算');
};

const handleClear = () => {
  originalText.value = '';
  modifiedText.value = '';
  updateDiffTexts(true);
};

const handleSwap = () => {
  const temp = originalText.value;
  originalText.value = modifiedText.value;
  modifiedText.value = temp;
  updateDiffTexts(true);
};

const handleLoadSample = () => {
  originalText.value = ORIGINAL_SAMPLE;
  modifiedText.value = MODIFIED_SAMPLE;
  updateDiffTexts(true);
  toast.success('已载入示例数据');
};

// 同步滚动锁与引用
const leftScrollRef = ref<HTMLElement | null>(null);
const rightScrollRef = ref<HTMLElement | null>(null);

let isSyncingLeft = false;
let isSyncingRight = false;

const handleLeftScroll = () => {
  if (isSyncingRight) {
    isSyncingRight = false;
    return;
  }
  if (leftScrollRef.value && rightScrollRef.value) {
    isSyncingLeft = true;
    rightScrollRef.value.scrollTop = leftScrollRef.value.scrollTop;
    rightScrollRef.value.scrollLeft = leftScrollRef.value.scrollLeft;
  }
};

const handleRightScroll = () => {
  if (isSyncingLeft) {
    isSyncingLeft = false;
    return;
  }
  if (leftScrollRef.value && rightScrollRef.value) {
    isSyncingRight = true;
    leftScrollRef.value.scrollTop = rightScrollRef.value.scrollTop;
    leftScrollRef.value.scrollLeft = rightScrollRef.value.scrollLeft;
  }
};

// 清理定时器
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});

// 1. 双栏对比数据源 (Split View)
const splitDiffData = computed(() => {
  return computeSplitDiff(diffOriginal.value, diffModified.value, {
    ignoreWhitespace: ignoreWhitespace.value
  });
});

// 2. 单栏混合对比数据源 (Inline View)
const inlineDiffData = computed(() => {
  return computeInlineDiff(diffOriginal.value, diffModified.value, {
    ignoreWhitespace: ignoreWhitespace.value
  });
});

// 计算变更摘要统计
const diffSummary = computed(() => {
  const rows = inlineDiffData.value;
  let added = 0;
  let removed = 0;
  rows.forEach(r => {
    if (r.type === 'added') added++;
    if (r.type === 'removed') removed++;
  });
  return { added, removed };
});
</script>

<template>
  <div class="text-diff-container">
    <!-- 头部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 模式切换：编辑还是直接看差异 -->
        <div class="segmented-control">
          <button 
            :class="['seg-btn', { active: isEditing }]" 
            @click="isEditing = true"
          >
            ✏️ 输入对比
          </button>
          <button 
            :class="['seg-btn', { active: !isEditing }]" 
            @click="isEditing = false"
          >
            🔍 查看差异
          </button>
        </div>
        
        <div class="divider"></div>
        
    <!-- 差异展现模式 -->
        <div v-if="!isEditing" class="flex bg-white/[0.05] p-0.5 rounded-lg">
          <button 
            :class="['px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all', viewMode === 'split' ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-white']" 
            @click="viewMode = 'split'"
          >
            双栏对比 (Split)
          </button>
          <button 
            :class="['px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all', viewMode === 'inline' ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-white']" 
            @click="viewMode = 'inline'"
          >
            单栏混合 (Inline)
          </button>
        </div>
        
        <div v-if="!isEditing" class="w-px h-5 bg-white/10"></div>
        
        <!-- 配置参数 -->
        <label class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
          <input type="checkbox" v-model="ignoreWhitespace" class="accent-[var(--accent-color)]" />
          <span>忽略空白</span>
        </label>
        
        <label class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
          <input type="checkbox" v-model="isRealtime" class="accent-[var(--accent-color)]" />
          <span>实时对比</span>
        </label>
      </div>
      
      <div class="toolbar-right">
        <button v-if="!isRealtime" @click="handleManualCompare" class="px-2.5 py-1 bg-[var(--accent-color)] text-xs rounded-md border-none font-medium text-white hover:opacity-90 cursor-pointer">
          🚀 立即比对
        </button>
        <button @click="handleLoadSample" class="bg-white/[0.05] border border-white/[0.1] text-white px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/[0.1]">载入示例</button>
        <button @click="handleSwap" class="bg-white/[0.05] border border-white/[0.1] text-white px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/[0.1]" title="交换左右输入">交换</button>
        <button @click="handleClear" class="bg-white/[0.05] border border-white/[0.1] px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20">清空</button>
      </div>
    </div>

    <!-- 差异摘要统计栏 -->
    <div v-if="!isEditing" class="flex items-center gap-4 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-xs text-[var(--text-secondary)]">
      <span>变更摘要：</span>
      <span class="flex items-center gap-1 font-medium text-emerald-400">
        <span class="font-bold text-sm">+</span> {{ diffSummary.added }} 行新增
      </span>
      <span class="flex items-center gap-1 font-medium text-red-400">
        <span class="font-bold text-sm">-</span> {{ diffSummary.removed }} 行删除
      </span>
    </div>

    <!-- 主工作区 -->
    <div class="main-layout flex-1 overflow-hidden relative">
      
      <!-- 1. 编辑模式 (输入文本) -->
      <div v-show="isEditing" class="flex w-full h-full gap-3 md:flex-row flex-col">
        <div class="pane">
          <div class="pane-header">
            <span>原始文本 (Original)</span>
            <span class="text-xs text-slate-500">Left Side</span>
          </div>
          <div class="pane-content">
            <Editor v-model="originalText" placeholder="在此粘贴或输入源文本（Original）..." />
          </div>
        </div>
        
        <button @click="handleSwap" class="spacer-btn" title="交换文本">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
          </svg>
        </button>

        <div class="pane">
          <div class="pane-header">
            <span>修改后文本 (Modified)</span>
            <span class="text-xs text-slate-500">Right Side</span>
          </div>
          <div class="pane-content">
            <Editor v-model="modifiedText" placeholder="在此粘贴或输入修改后的文本（Modified）..." />
          </div>
        </div>
      </div>

      <!-- 2. 差异查看模式 -->
      <div v-show="!isEditing" class="flex w-full h-full bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-hidden">
        
        <!-- 双栏模式 (Split View) -->
        <div v-if="viewMode === 'split'" class="flex w-full h-full overflow-hidden">
          <!-- 左侧：删除 -->
          <div class="flex-1 flex flex-col h-full overflow-hidden first:border-r border-white/[0.05]">
            <div class="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider">原始文本 (Original)</div>
            <div 
              class="flex-1 overflow-auto bg-[#0d0d0d]" 
              ref="leftScrollRef" 
              @scroll="handleLeftScroll"
            >
              <div class="flex flex-col min-w-max w-full font-mono text-[13px] leading-5 py-2 select-text">
                <div 
                  v-for="(row, idx) in splitDiffData.leftRows" 
                  :key="'left-' + idx" 
                  :class="[
                    'flex w-full items-stretch min-h-[20px] hover:bg-white/[0.02]',
                    row.type === 'removed' ? 'bg-red-500/12' : (row.type === 'empty' ? 'bg-white/[0.005] diff-empty-stripe' : '')
                  ]"
                >
                  <div :class="[
                    'w-12 min-w-[48px] text-right pr-3 text-white/20 select-none border-r border-white/[0.05] flex items-center justify-end',
                    row.type === 'removed' ? 'bg-red-500/8 text-red-500/40' : (row.type === 'empty' ? 'bg-transparent border-r-white/[0.02]' : 'bg-white/[0.01]')
                  ]">{{ row.lineNum ?? '' }}</div>
                  <div :class="[
                    'w-6 min-w-[24px] flex items-center justify-center font-bold select-none',
                    row.type === 'removed' ? 'text-red-500' : ''
                  ]">{{ row.type === 'removed' ? '-' : '' }}</div>
                  <div class="flex-1 pl-2 pr-4 whitespace-pre flex items-center text-slate-200">
                    <template v-if="row.inlineDiffs && row.inlineDiffs.length">
                      <span 
                        v-for="(chunk, cIdx) in row.inlineDiffs" 
                        :key="cIdx" 
                        :class="[
                          chunk.type === 'removed' ? 'bg-red-500/35 rounded-[2px] line-through' : ''
                        ]"
                      >{{ chunk.text }}</span>
                    </template>
                    <template v-else>{{ row.text }}</template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：新增 -->
          <div class="flex-1 flex flex-col h-full overflow-hidden">
            <div class="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider">修改后文本 (Modified)</div>
            <div 
              class="flex-1 overflow-auto bg-[#0d0d0d]" 
              ref="rightScrollRef" 
              @scroll="handleRightScroll"
            >
              <div class="flex flex-col min-w-max w-full font-mono text-[13px] leading-5 py-2 select-text">
                <div 
                  v-for="(row, idx) in splitDiffData.rightRows" 
                  :key="'right-' + idx" 
                  :class="[
                    'flex w-full items-stretch min-h-[20px] hover:bg-white/[0.02]',
                    row.type === 'added' ? 'bg-emerald-500/12' : (row.type === 'empty' ? 'bg-white/[0.005] diff-empty-stripe' : '')
                  ]"
                >
                  <div :class="[
                    'w-12 min-w-[48px] text-right pr-3 text-white/20 select-none border-r border-white/[0.05] flex items-center justify-end',
                    row.type === 'added' ? 'bg-emerald-500/8 text-emerald-500/40' : (row.type === 'empty' ? 'bg-transparent border-r-white/[0.02]' : 'bg-white/[0.01]')
                  ]">{{ row.lineNum ?? '' }}</div>
                  <div :class="[
                    'w-6 min-w-[24px] flex items-center justify-center font-bold select-none',
                    row.type === 'added' ? 'text-emerald-500' : ''
                  ]">{{ row.type === 'added' ? '+' : '' }}</div>
                  <div class="flex-1 pl-2 pr-4 whitespace-pre flex items-center text-slate-200">
                    <template v-if="row.inlineDiffs && row.inlineDiffs.length">
                      <span 
                        v-for="(chunk, cIdx) in row.inlineDiffs" 
                        :key="cIdx" 
                        :class="[
                          chunk.type === 'added' ? 'bg-emerald-500/35 rounded-[2px]' : ''
                        ]"
                      >{{ chunk.text }}</span>
                    </template>
                    <template v-else>{{ row.text }}</template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 单栏模式 (Inline View) -->
        <div v-else class="w-full h-full flex flex-col">
          <div class="flex-1 overflow-auto bg-[#0d0d0d]">
            <div class="flex flex-col min-w-max w-full font-mono text-[13px] leading-5 py-2 select-text">
              <div 
                v-for="(row, idx) in inlineDiffData" 
                :key="'inline-' + idx" 
                :class="[
                  'flex w-full items-stretch min-h-[20px] hover:bg-white/[0.02]',
                  row.type === 'added' ? 'bg-emerald-500/12 border-l-3 border-emerald-500' : (row.type === 'removed' ? 'bg-red-500/12 border-l-3 border-red-500' : '')
                ]"
              >
                <div :class="[
                  'w-10 min-w-[40px] text-right pr-3 text-white/20 select-none border-r border-white/[0.05] flex items-center justify-end',
                  row.type === 'added' ? 'bg-emerald-500/8 text-emerald-500/40' : (row.type === 'removed' ? 'bg-red-500/8 text-red-500/40' : 'bg-white/[0.01]')
                ]">{{ row.leftLineNum ?? '' }}</div>
                <div :class="[
                  'w-10 min-w-[40px] text-right pr-3 text-white/20 select-none border-r border-white/[0.05] flex items-center justify-end',
                  row.type === 'added' ? 'bg-emerald-500/8 text-emerald-500/40' : (row.type === 'removed' ? 'bg-red-500/8 text-red-500/40' : 'bg-white/[0.01]')
                ]">{{ row.rightLineNum ?? '' }}</div>
                <div :class="[
                  'w-6 min-w-[24px] flex items-center justify-center font-bold select-none',
                  row.type === 'added' ? 'text-emerald-500' : (row.type === 'removed' ? 'text-red-500' : '')
                ]">
                  {{ row.type === 'added' ? '+' : (row.type === 'removed' ? '-' : '') }}
                </div>
                <div class="flex-1 pl-2 pr-4 whitespace-pre flex items-center text-slate-200">
                  <template v-if="row.inlineDiffs && row.inlineDiffs.length">
                    <span 
                      v-for="(chunk, cIdx) in row.inlineDiffs" 
                      :key="cIdx" 
                      :class="[
                        chunk.type === 'added' ? 'bg-emerald-500/35 rounded-[2px]' : (chunk.type === 'removed' ? 'bg-red-500/35 rounded-[2px] line-through' : '')
                      ]"
                    >{{ chunk.text }}</span>
                  </template>
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

<style scoped>
.diff-empty-stripe {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.01) 0px,
    rgba(255, 255, 255, 0.01) 2px,
    transparent 2px,
    transparent 8px
  );
}

/* 确保滚动条在暗色模式下的美观 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
