<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { toast } from 'onin-sdk';
import CryptoJS from 'crypto-js';
import Editor from '../Editor.vue';

// 接收 toolId，比如 'hash-calculator'
const props = withDefaults(defineProps<{
  toolId?: string;
}>(), {
  toolId: 'hash-calculator'
});

const input = ref('');
const mode = ref<'text' | 'file'>('text');
const isUppercase = ref(false);

// 文件状态
const selectedFile = ref<File | null>(null);
const fileProgress = ref(0);
const isCalculating = ref(false);

// 各算法计算出的哈希结果
const hashResults = ref({
  md5: '',
  sha1: '',
  sha256: '',
  sha512: '',
});

// 重置状态
const handleClear = () => {
  input.value = '';
  selectedFile.value = null;
  fileProgress.value = 0;
  isCalculating.value = false;
  hashResults.value = {
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  };
};

// 格式化输出哈希值（考虑大小写）
const formatHash = (val: string) => {
  if (!val) return '';
  return isUppercase.value ? val.toUpperCase() : val.toLowerCase();
};

// 复制单个哈希值
const handleCopy = (val: string, label: string) => {
  if (!val) return;
  navigator.clipboard.writeText(formatHash(val)).then(() => {
    toast.success(`已复制 ${label} 到剪贴板`);
  });
};

// 计算文本哈希
const calculateTextHash = (text: string) => {
  if (!text) {
    hashResults.value = { md5: '', sha1: '', sha256: '', sha512: '' };
    return;
  }
  try {
    hashResults.value = {
      md5: CryptoJS.MD5(text).toString(),
      sha1: CryptoJS.SHA1(text).toString(),
      sha256: CryptoJS.SHA256(text).toString(),
      sha512: CryptoJS.SHA512(text).toString(),
    };
  } catch (e: any) {
    toast.error('计算哈希失败: ' + e.message);
  }
};

// 监听文本输入，实时计算
watch(input, (newVal) => {
  if (mode.value === 'text') {
    calculateTextHash(newVal);
  }
});

// 分块计算大文件哈希，避免内存溢出并支持进度条
const calculateFileHashChunks = (file: File) => {
  isCalculating.value = true;
  fileProgress.value = 0;

  const algos = {
    md5: CryptoJS.algo.MD5.create(),
    sha1: CryptoJS.algo.SHA1.create(),
    sha256: CryptoJS.algo.SHA256.create(),
    sha512: CryptoJS.algo.SHA512.create(),
  };

  const chunkSize = 2 * 1024 * 1024; // 2MB
  const reader = new FileReader();
  let offset = 0;

  reader.onload = (e) => {
    if (e.target?.error) {
      toast.error('读取文件出错');
      isCalculating.value = false;
      return;
    }

    const arrayBuffer = e.target?.result as ArrayBuffer;
    // 将 ArrayBuffer 转换为 CryptoJS WordArray
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);

    // 更新各个算法的计算状态
    algos.md5.update(wordArray);
    algos.sha1.update(wordArray);
    algos.sha256.update(wordArray);
    algos.sha512.update(wordArray);

    offset += arrayBuffer.byteLength;
    fileProgress.value = Math.min(100, Math.round((offset / file.size) * 100));

    if (offset < file.size) {
      readNextChunk();
    } else {
      // 结束并输出哈希值
      hashResults.value = {
        md5: algos.md5.finalize().toString(),
        sha1: algos.sha1.finalize().toString(),
        sha256: algos.sha256.finalize().toString(),
        sha512: algos.sha512.finalize().toString(),
      };
      isCalculating.value = false;
      toast.success('文件哈希计算完成');
    }
  };

  reader.onerror = () => {
    toast.error('文件读取失败');
    isCalculating.value = false;
  };

  const readNextChunk = () => {
    const slice = file.slice(offset, offset + chunkSize);
    reader.readAsArrayBuffer(slice);
  };

  readNextChunk();
};

// 拖拽与选择文件处理
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file: File) => {
  selectedFile.value = file;
  calculateFileHashChunks(file);
};

// 监听模式切换
watch(mode, (newMode) => {
  handleClear();
});

// 所有支持的算法列表（平等展示）
const algos = computed(() => [
  { id: 'md5' as const, name: 'MD5', value: hashResults.value.md5 },
  { id: 'sha1' as const, name: 'SHA-1', value: hashResults.value.sha1 },
  { id: 'sha256' as const, name: 'SHA-256', value: hashResults.value.sha256 },
  { id: 'sha512' as const, name: 'SHA-512', value: hashResults.value.sha512 },
]);

const getBadgeClass = (id: string) => {
  switch (id) {
    case 'md5': return 'bg-blue-500/10 text-blue-300 border-blue-500/25';
    case 'sha1': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
    case 'sha256': return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
    case 'sha512': return 'bg-violet-500/10 text-violet-300 border-violet-500/25';
    default: return 'bg-white/10 text-white/80 border-white/20';
  }
};

</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 box-border">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/5 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <div class="flex bg-white/5 p-[3px] rounded-lg">
          <button 
            :class="['bg-transparent border-none text-white/50 px-3 py-1 rounded-md text-xs cursor-pointer transition-all hover:text-white', { 'bg-white/10 text-white shadow-sm': mode === 'text' }]" 
            @click="mode = 'text'"
            :disabled="isCalculating"
          >文本模式</button>
          <button 
            :class="['bg-transparent border-none text-white/50 px-3 py-1 rounded-md text-xs cursor-pointer transition-all hover:text-white', { 'bg-white/10 text-white shadow-sm': mode === 'file' }]" 
            @click="mode = 'file'"
            :disabled="isCalculating"
          >文件模式</button>
        </div>
        
        <div class="w-[1px] h-5 bg-white/10"></div>
        
        <label class="flex items-center gap-2 text-xs text-white/50 cursor-pointer user-select-none">
          <input type="checkbox" v-model="isUppercase" class="accent-blue-500" />
          <span>大写字母</span>
        </label>
      </div>
      
      <div class="flex items-center gap-3">
        <button @click="handleClear" class="action-btn ghost danger" :disabled="isCalculating">清空</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="flex-1 flex gap-3 min-h-0 items-stretch md:flex-row flex-col">
      <!-- 输入面板 -->
      <div class="flex-1 flex flex-col bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
        <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex items-center">
          <span>{{ mode === 'text' ? '输入文本' : '选择文件' }}</span>
        </div>
        
        <div class="flex-1 overflow-hidden">
          <!-- 文本输入 -->
          <template v-if="mode === 'text'">
            <Editor v-model="input" placeholder="请输入待计算哈希的文本内容..." />
          </template>
          
          <!-- 文件选择/拖拽 -->
          <template v-else>
            <div 
              class="h-[calc(100%-32px)] border-2 border-dashed border-white/10 m-4 rounded-xl flex flex-col items-center justify-center text-white/50 transition-all hover:bg-white/[0.03] hover:border-blue-500 hover:text-white"
              @dragover.prevent 
              @drop="handleDrop"
              @click="!isCalculating && ($refs.fileInput as HTMLInputElement).click()"
              :class="{ 'cursor-not-allowed opacity-70': isCalculating, 'cursor-pointer': !isCalculating }"
            >
              <input 
                type="file" 
                ref="fileInput" 
                style="display: none" 
                @change="handleFileChange" 
                :disabled="isCalculating"
              />
              <div class="text-5xl mb-3 opacity-60">🛡️</div>
              
              <template v-if="!selectedFile">
                <p>点击或拖拽文件到此处</p>
                <span class="text-[11px] text-white/30 mt-1.5">支持任意格式文件，超大文件自动分块计算</span>
              </template>
              <template v-else>
                <div class="text-center w-[80%]">
                  <p class="text-blue-400 font-medium font-mono break-all mb-1">{{ selectedFile.name }}</p>
                  <p class="text-xs text-white/40 mb-4">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
                  
                  <!-- 进度条 -->
                  <div class="relative w-full h-5 bg-white/5 rounded-full overflow-hidden border border-white/10" v-if="isCalculating">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-100 ease-out" :style="{ width: `${fileProgress}%` }"></div>
                    <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      正在计算: {{ fileProgress }}%
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <!-- 输出面板 -->
      <div class="flex-1 flex flex-col bg-white/[0.015] rounded-xl border border-white/5 overflow-hidden">
        <div class="px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/5 uppercase tracking-wider h-9 flex items-center">
          <span>计算结果</span>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 box-border scroll-smooth">
          <div class="flex flex-col gap-3">
            <div 
              v-for="algo in algos" 
              :key="algo.id" 
              class="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 rounded-xl p-3 px-4 flex flex-col gap-2 transition-all hover:from-white/[0.04] hover:to-white/[0.015] hover:border-white/12 hover:shadow-lg"
            >
              <div class="flex justify-between items-center">
                <span :class="['text-[11px] font-bold px-2 py-0.5 rounded border tracking-wider', getBadgeClass(algo.id)]">
                  {{ algo.name }}
                </span>
                <button 
                  v-if="algo.value" 
                  @click="handleCopy(algo.value, algo.name)" 
                  class="bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 text-[11px] rounded cursor-pointer transition-all hover:bg-blue-500 hover:border-blue-500 hover:text-white"
                  title="复制哈希值"
                >
                  复制 📋
                </button>
              </div>
              
              <div class="flex items-center min-h-[24px]">
                <div class="font-mono text-[13.5px] text-white/95 break-all select-all leading-relaxed w-full">
                  <template v-if="algo.value">
                    {{ formatHash(algo.value) }}
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
