<script setup lang="ts">
import { ref, watch } from 'vue';
import { toast } from 'onin-sdk';
import Editor from '../Editor.vue';

const input = ref('');
const output = ref('');
const error = ref<string | null>(null);
const isUrlSafe = ref(false);
const mode = ref<'text' | 'file'>('text');

// Logic for Text Conversion
const handleEncode = () => {
  if (!input.value.trim()) return;
  try {
    const uint8 = new TextEncoder().encode(input.value);
    let b64 = btoa(String.fromCharCode(...uint8));
    if (isUrlSafe.value) {
      b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    output.value = b64;
    error.value = null;
  } catch (e: any) {
    error.value = '编码失败: ' + e.message;
  }
};

const handleDecode = () => {
  if (!input.value.trim()) return;
  try {
    let b64 = input.value;
    if (isUrlSafe.value) {
      b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
    }
    const binStr = atob(b64);
    const uint8 = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      uint8[i] = binStr.charCodeAt(i);
    }
    output.value = new TextDecoder().decode(uint8);
    error.value = null;
  } catch (e: any) {
    error.value = '解码失败: 请确保输入是有效的 Base64 字符串';
  }
};

const handleClear = () => {
  input.value = '';
  output.value = '';
  error.value = null;
};

const handleCopy = () => {
  if (!output.value) return;
  navigator.clipboard.writeText(output.value).then(() => {
    toast.success('已复制到剪贴板');
  });
};

const handleSwap = () => {
  const temp = input.value;
  input.value = output.value;
  output.value = temp;
};

// Logic for File Conversion
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
  const reader = new FileReader();
  reader.onload = (e) => {
    output.value = e.target?.result as string;
    input.value = `File: ${file.name} (${file.size} bytes)`;
    error.value = null;
  };
  reader.onerror = () => {
    error.value = '文件读取失败';
  };
  reader.readAsDataURL(file);
};

watch(isUrlSafe, () => {
  // Re-encode/decode if url safe toggle changes
  if (input.value && output.value) {
    // Basic heuristic: if output looks like b64, re-encode? 
    // Actually better to let user manually click.
  }
});
</script>

<template>
  <div class="base64-converter">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="segmented-control">
          <button 
            :class="['seg-btn', { active: mode === 'text' }]" 
            @click="mode = 'text'"
          >文本</button>
          <button 
            :class="['seg-btn', { active: mode === 'file' }]" 
            @click="mode = 'file'"
          >文件</button>
        </div>
        
        <div class="divider"></div>
        
        <label class="checkbox-label">
          <input type="checkbox" v-model="isUrlSafe" />
          <span>URL Safe</span>
        </label>
      </div>
      
      <div class="toolbar-right">
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
        <button @click="handleCopy" class="action-btn accent">
          <span>📋</span> 复制结果
        </button>
      </div>
    </div>

    <div class="main-layout" :class="{ 'file-mode': mode === 'file' }">
      <!-- Input Pane -->
      <div class="pane">
        <div class="pane-header">
          {{ mode === 'text' ? '输入内容' : '待转换文件' }}
          <div class="pane-actions" v-if="mode === 'text'">
            <button @click="handleEncode" class="mini-btn primary">编码</button>
            <button @click="handleDecode" class="mini-btn">解码</button>
          </div>
        </div>
        
        <div class="pane-content">
          <template v-if="mode === 'text'">
            <Editor v-model="input" placeholder="输入待编码或解码的内容..." />
          </template>
          
          <template v-else>
            <div 
              class="drop-zone" 
              @dragover.prevent 
              @drop="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input 
                type="file" 
                ref="fileInput" 
                style="display: none" 
                @change="handleFileChange" 
              />
              <div class="drop-icon">📁</div>
              <p v-if="!input.includes('File:')">点击或拖拽文件到此处</p>
              <p v-else class="file-info">{{ input }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Swap button between panes -->
      <button 
        v-if="mode === 'text'"
        @click="handleSwap" 
        class="spacer-btn" 
        title="交换输入输出"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
        </svg>
      </button>

      <!-- Static spacer for file mode -->
      <div v-else class="spacer-arrow static">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      <!-- Output Pane -->
      <div class="pane">
        <div class="pane-header">结果 (Base64)</div>
        <div class="pane-content">
          <Editor v-if="!error" v-model="output" readonly />
          <div v-else class="error-state">
            <div class="error-msg">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.base64-converter {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.segmented-control {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px;
  border-radius: 8px;
}

.seg-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.seg-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-label input {
  accent-color: var(--accent-color);
}

.action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn.accent {
  background: var(--accent-color);
  border: none;
}

.action-btn.ghost {
  background: transparent;
  border-color: transparent;
}

.action-btn.danger:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.main-layout {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
  align-items: stretch;
}

.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.pane-header {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
}

.pane-actions {
  display: flex;
  gap: 8px;
}

.mini-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #fff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.mini-btn.primary {
  background: var(--accent-color);
}

.pane-content {
  flex: 1;
  overflow: hidden;
}

.spacer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  align-self: center;
  z-index: 5;
}

.spacer-btn:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #fff;
  transform: scale(1.1) rotate(180deg);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
}

.spacer-btn:active {
  transform: scale(0.95) rotate(180deg);
}

.spacer-arrow {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.15);
}

.drop-zone {
  height: 100%;
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
}

.drop-zone:hover {
  background: rgba(255, 255, 255, 0.02);
  border-color: var(--accent-color);
  color: #fff;
}

.drop-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.file-info {
  color: #60a5fa;
  font-family: monospace;
}

.error-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #ef4444;
  font-size: 13px;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  .spacer-btn {
    justify-content: center;
    transform: rotate(90deg);
  }
  .spacer-btn:hover {
    transform: scale(1.1) rotate(270deg);
  }
  .spacer-arrow {
    justify-content: center;
    transform: rotate(90deg);
  }
}
</style>
