<script setup lang="ts">
import { ref, computed } from 'vue';
import { toast } from 'onin-sdk';
import Editor from '../Editor.vue';

const input = ref('');
const error = ref<string | null>(null);
const indent = ref(2);

const formattedOutput = computed(() => {
  if (!input.value.trim()) return '';
  try {
    const parsed = JSON.parse(input.value);
    error.value = null;
    return JSON.stringify(parsed, null, indent.value);
  } catch (e: any) {
    error.value = e.message;
    return '';
  }
});

const handleFormat = () => {
  if (!input.value.trim()) return;
  try {
    const parsed = JSON.parse(input.value);
    input.value = JSON.stringify(parsed, null, indent.value);
    error.value = null;
  } catch (e: any) {
    error.value = e.message;
  }
};

const handleMinify = () => {
  if (!input.value.trim()) return;
  try {
    const parsed = JSON.parse(input.value);
    input.value = JSON.stringify(parsed);
    error.value = null;
  } catch (e: any) {
    error.value = e.message;
  }
};

const handleClear = () => {
  input.value = '';
  error.value = null;
};

const handleCopy = () => {
  const textToCopy = formattedOutput.value || input.value;
  if (!textToCopy) return;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    toast.success('已复制到剪贴板');
  });
};

const handleSample = () => {
  const sample = {
    name: "Onin Dev Toolbox",
    version: "1.0.0",
    description: "A premium set of developer tools.",
    features: [
      { id: 1, name: "JSON Formatter", status: "Done" },
      { id: 2, name: "Base64 & More", status: "Coming Soon" }
    ],
    settings: {
      theme: "dark",
      folding: true,
      lineNumbers: true
    }
  };
  input.value = JSON.stringify(sample, null, 2);
};
</script>

<template>
  <div class="json-formatter">
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="handleFormat" class="action-btn primary" title="美化并修正输入框内容">
          <span>✨</span> 格式化
        </button>
        <button @click="handleMinify" class="action-btn">
          <span>📦</span> 压缩
        </button>
        <div class="divider"></div>
        <select v-model="indent" class="select-input">
          <option :value="2">2 空格</option>
          <option :value="4">4 空格</option>
          <option :value="0">Tab</option>
        </select>
      </div>
      
      <div class="toolbar-right">
        <button @click="handleSample" class="action-btn ghost">插入示例</button>
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
        <button @click="handleCopy" class="action-btn accent">
          <span>📋</span> 复制
        </button>
      </div>
    </div>

    <div class="main-layout">
      <div class="pane">
        <div class="pane-header">输入 / 编辑</div>
        <div class="editor-view-container">
          <Editor v-model="input" placeholder="请在此处粘贴或输入 JSON..." />
        </div>
      </div>

      <div class="pane">
        <div class="pane-header">预览 / 折叠</div>
        <div class="editor-view-container">
          <Editor v-if="formattedOutput" :model-value="formattedOutput" readonly />
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <div class="error-msg">解析错误: {{ error }}</div>
          </div>
          <div v-else class="empty-output">
            等待输入...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.json-formatter {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
}

.select-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
}

.editor-view-container {
  flex: 1;
  overflow: hidden;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.empty-output {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-style: italic;
  font-size: 14px;
}
</style>
