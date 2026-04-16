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
}
</style>
