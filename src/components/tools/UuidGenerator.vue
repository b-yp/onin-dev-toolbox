<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'onin-sdk';

const quantity = ref(1);
const useUppercase = ref(false);
const useHyphens = ref(true);
const results = ref<string[]>([]);

const generateUuid = () => {
  const newResults: string[] = [];
  for (let i = 0; i < quantity.value; i++) {
    let uuid = crypto.randomUUID();
    
    if (!useHyphens.value) {
      uuid = uuid.replace(/-/g, '');
    }
    
    if (useUppercase.value) {
      uuid = uuid.toUpperCase();
    }
    
    newResults.push(uuid);
  }
  results.value = newResults;
};

const handleCopyAll = () => {
  if (results.value.length === 0) return;
  const text = results.value.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    toast.success('已复制所有 UUID');
  });
};

const handleCopySingle = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('已复制到剪贴板');
  });
};

const handleClear = () => {
  results.value = [];
};

// Initial generation
onMounted(() => {
  generateUuid();
});
</script>

<template>
  <div class="uuid-generator">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="control-group">
          <label>数量:</label>
          <select v-model="quantity" class="select-input">
            <option :value="1">1</option>
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
        <div class="divider"></div>
        <label class="checkbox-label">
          <input type="checkbox" v-model="useUppercase"> 大写
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="useHyphens"> 连字符
        </label>
      </div>
      
      <div class="toolbar-right">
        <button @click="handleClear" class="action-btn ghost danger">清空</button>
        <button @click="handleCopyAll" class="action-btn accent">
          <span>📋</span> 复制全部
        </button>
        <button @click="generateUuid" class="action-btn primary">
          <span>🔄</span> 重新生成
        </button>
      </div>
    </div>

    <div class="main-layout">
      <div class="pane">
        <div class="pane-header">
          生成的 UUID
          <span class="count-tag">{{ results.length }} 个</span>
        </div>
        <div class="pane-content results-container">
          <div v-if="results.length > 0" class="uuid-list">
            <div v-for="(uuid, index) in results" :key="index" class="uuid-item">
              <code class="uuid-code">{{ uuid }}</code>
              <button @click="handleCopySingle(uuid)" class="copy-small-btn" title="复制">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          <div v-else class="empty-results">
            点击“重新生成”开始
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.uuid-generator {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.select-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 13px;
  outline: none;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label:hover {
  color: #fff;
}

.checkbox-label input {
  cursor: pointer;
}

.results-container {
  padding: 16px;
}

.uuid-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uuid-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.uuid-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.uuid-code {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 14px;
  color: #fff;
  letter-spacing: 0.02em;
}

.copy-small-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-small-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.count-tag {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-transform: none;
  letter-spacing: normal;
}

.empty-results {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
  opacity: 0.5;
}
</style>
