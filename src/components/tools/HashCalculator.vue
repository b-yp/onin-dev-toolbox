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

</script>

<template>
  <div class="hash-calculator">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="segmented-control">
          <button 
            :class="['seg-btn', { active: mode === 'text' }]" 
            @click="mode = 'text'"
            :disabled="isCalculating"
          >文本模式</button>
          <button 
            :class="['seg-btn', { active: mode === 'file' }]" 
            @click="mode = 'file'"
            :disabled="isCalculating"
          >文件模式</button>
        </div>
        
        <div class="divider"></div>
        
        <label class="toggle-label">
          <input type="checkbox" v-model="isUppercase" />
          <span>大写字母</span>
        </label>
      </div>
      
      <div class="toolbar-right">
        <button @click="handleClear" class="action-btn ghost danger" :disabled="isCalculating">清空</button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="main-layout" :class="{ 'file-mode': mode === 'file' }">
      <!-- 输入面板 -->
      <div class="pane">
        <div class="pane-header">
          <span>{{ mode === 'text' ? '输入文本' : '选择文件' }}</span>
        </div>
        
        <div class="pane-content">
          <!-- 文本输入 -->
          <template v-if="mode === 'text'">
            <Editor v-model="input" placeholder="请输入待计算哈希的文本内容..." />
          </template>
          
          <!-- 文件选择/拖拽 -->
          <template v-else>
            <div 
              class="drop-zone" 
              @dragover.prevent 
              @drop="handleDrop"
              @click="!isCalculating && ($refs.fileInput as HTMLInputElement).click()"
              :class="{ 'disabled': isCalculating }"
            >
              <input 
                type="file" 
                ref="fileInput" 
                style="display: none" 
                @change="handleFileChange" 
                :disabled="isCalculating"
              />
              <div class="drop-icon">🛡️</div>
              
              <template v-if="!selectedFile">
                <p>点击或拖拽文件到此处</p>
                <span class="file-tip">支持任意格式文件，超大文件自动分块计算</span>
              </template>
              <template v-else>
                <div class="file-info-box">
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <p class="file-size">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
                  
                  <!-- 进度条 -->
                  <div class="progress-container" v-if="isCalculating">
                    <div class="progress-bar" :style="{ width: `${fileProgress}%` }"></div>
                    <span class="progress-text">正在计算: {{ fileProgress }}%</span>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <!-- 输出面板 -->
      <div class="pane result-pane">
        <div class="pane-header">
          <span>计算结果</span>
        </div>
        
        <div class="pane-content results-container">
          <div class="hash-cards-list">
            <div 
              v-for="algo in algos" 
              :key="algo.id" 
              class="hash-card"
            >
              <div class="card-header-row">
                <span :class="['algo-badge', `${algo.id}-badge`]">{{ algo.name }}</span>
                <button 
                  v-if="algo.value" 
                  @click="handleCopy(algo.value, algo.name)" 
                  class="copy-card-btn"
                  title="复制哈希值"
                >
                  复制 📋
                </button>
              </div>
              
              <div class="card-body-row">
                <div class="hash-value-display">
                  <template v-if="algo.value">
                    {{ formatHash(algo.value) }}
                  </template>
                  <template v-else>
                    <span class="placeholder-text">等待输入数据...</span>
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

<style scoped>
.hash-calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.toggle-label input {
  accent-color: var(--accent-color);
}

/* 文件拖拽区 */
.drop-zone {
  height: calc(100% - 32px);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  margin: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.01);
}

.drop-zone:not(.disabled):hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--accent-color);
  color: #fff;
}

.drop-zone.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.drop-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.file-tip {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 6px;
}

.file-info-box {
  text-align: center;
  width: 80%;
}

.file-name {
  color: #60a5fa;
  font-weight: 500;
  font-family: monospace;
  word-break: break-all;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 16px;
}

/* 进度条样式 */
.progress-container {
  position: relative;
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.1s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 输出界面 */
.result-pane {
  background: rgba(255, 255, 255, 0.015);
}

.results-container {
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  height: calc(100% - 32px);
}

.hash-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 统一的哈希值卡片 */
.hash-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
}

.hash-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.algo-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

/* 个性化算法标签颜色 */
.md5-badge {
  background: rgba(59, 130, 246, 0.12) !important;
  color: #93c5fd !important;
  border: 1px solid rgba(59, 130, 246, 0.25) !important;
}

.sha1-badge {
  background: rgba(16, 185, 129, 0.12) !important;
  color: #34d399 !important;
  border: 1px solid rgba(16, 185, 129, 0.25) !important;
}

.sha256-badge {
  background: rgba(245, 158, 11, 0.12) !important;
  color: #fbbf24 !important;
  border: 1px solid rgba(245, 158, 11, 0.25) !important;
}

.sha512-badge {
  background: rgba(139, 92, 246, 0.12) !important;
  color: #a78bfa !important;
  border: 1px solid rgba(139, 92, 246, 0.25) !important;
}

.copy-card-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-card-btn:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #fff;
}

.card-body-row {
  display: flex;
  align-items: center;
  min-height: 24px;
}

.hash-value-display {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.95);
  word-break: break-all;
  user-select: all;
  line-height: 1.45;
  width: 100%;
}

.placeholder-text {
  color: rgba(255, 255, 255, 0.2);
  font-size: 13px;
  font-style: italic;
}
</style>
