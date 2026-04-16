<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'onin-sdk';
import Editor from '../Editor.vue';

const input = ref('');
const output = ref('');
const error = ref<string | null>(null);
const mode = ref<'component' | 'uri'>('component');

const handleEncode = () => {
  if (!input.value.trim()) return;
  try {
    if (mode.value === 'component') {
      output.value = encodeURIComponent(input.value);
    } else {
      output.value = encodeURI(input.value);
    }
    error.value = null;
  } catch (e: any) {
    error.value = '编码失败: ' + e.message;
  }
};

const handleDecode = () => {
  if (!input.value.trim()) return;
  try {
    if (mode.value === 'component') {
      output.value = decodeURIComponent(input.value);
    } else {
      output.value = decodeURI(input.value);
    }
    error.value = null;
  } catch (e: any) {
    error.value = '解码失败: 请确保输入是有效的 URL 编码字符串';
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
</script>

<template>
  <div class="url-encoder">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="segmented-control">
          <button 
            :class="['seg-btn', { active: mode === 'component' }]" 
            @click="mode = 'component'"
            title="编码 URI 组件（包含 & ? = 等）"
          >URIComponent</button>
          <button 
            :class="['seg-btn', { active: mode === 'uri' }]" 
            @click="mode = 'uri'"
            title="编码完整 URI（保留 & ? = 等）"
          >URI</button>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
        <button @click="handleCopy" class="action-btn accent">
          <span>📋</span> 复制结果
        </button>
      </div>
    </div>

    <div class="main-layout">
      <!-- Input Pane -->
      <div class="pane">
        <div class="pane-header">
          输入内容
          <div class="pane-actions">
            <button @click="handleEncode" class="mini-btn primary">编码</button>
            <button @click="handleDecode" class="mini-btn">解码</button>
          </div>
        </div>
        
        <div class="pane-content">
          <Editor v-model="input" placeholder="输入待编码或解码的 URL 或文本..." />
        </div>
      </div>

      <!-- Swap button between panes -->
      <button @click="handleSwap" class="spacer-btn" title="交换输入输出">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
        </svg>
      </button>

      <!-- Output Pane -->
      <div class="pane">
        <div class="pane-header">处理结果</div>
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
.url-encoder {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
}
</style>
