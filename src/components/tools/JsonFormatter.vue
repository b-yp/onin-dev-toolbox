<script setup lang="ts">
import { ref, computed } from 'vue';
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
    alert('已复制到剪贴板');
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

    <div class="editor-container">
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
  gap: 8px;
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
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

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.primary {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.action-btn.primary:hover {
  background: rgba(59, 130, 246, 0.2);
}

.action-btn.accent {
  background: var(--accent-color);
  border: none;
  font-weight: 500;
}

.action-btn.ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
}

.action-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.action-btn.danger:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
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

.editor-container {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
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
}

.editor-view-container {
  flex: 1;
  overflow: hidden;
}

.error-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #ef4444;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-msg {
  font-size: 13px;
  text-align: center;
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
/* Scrollbar styling */
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
