<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { toast } from 'onin-sdk';

// --- Current Time State ---
const currentTime = ref(new Date());
let timer: any = null;

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// --- Timestamp to Date Logic ---
const tsInput = ref('');
const tsUnit = ref<'s' | 'ms'>('s');
const tsResult = ref('');

const convertTsToDate = () => {
  if (!tsInput.value) return;
  try {
    const val = parseInt(tsInput.value);
    if (isNaN(val)) throw new Error('无效数字');
    
    const date = tsUnit.value === 's' ? new Date(val * 1000) : new Date(val);
    tsResult.value = formatDate(date);
  } catch (e) {
    tsResult.value = '转换失败: 无效的时间戳';
  }
};

// --- Date to Timestamp Logic ---
const dtInput = ref('');
const dtResultS = ref('');
const dtResultMs = ref('');

const convertDateToTs = () => {
  if (!dtInput.value) return;
  try {
    const date = new Date(dtInput.value);
    if (isNaN(date.getTime())) throw new Error('无效日期');
    
    dtResultS.value = Math.floor(date.getTime() / 1000).toString();
    dtResultMs.value = date.getTime().toString();
  } catch (e) {
    dtResultS.value = '转换失败';
    dtResultMs.value = '转换失败';
  }
};

// --- Helper Functions ---
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const handleNow = () => {
  const now = new Date();
  dtInput.value = formatDate(now);
  convertDateToTs();
  
  // Also fill timestamp input for convenience
  tsInput.value = Math.floor(now.getTime() / 1000).toString();
  tsUnit.value = 's';
  convertTsToDate();
};

const handleCopy = (text: string) => {
  if (!text || text.includes('失败')) return;
  navigator.clipboard.writeText(text).then(() => {
    toast.success('已复制到剪贴板');
  });
};

const handleClear = () => {
  tsInput.value = '';
  tsResult.value = '';
  dtInput.value = '';
  dtResultS.value = '';
  dtResultMs.value = '';
};

// Auto conversion when inputs change
watch(tsInput, convertTsToDate);
watch(tsUnit, convertTsToDate);
watch(dtInput, convertDateToTs);

// Initialize with current time
onMounted(() => {
  handleNow();
});
</script>

<template>
  <div class="timestamp-converter">
    <!-- Current Time Dashboard -->
    <div class="dashboard-card">
      <div class="clock-icon">🕒</div>
      <div class="clock-main">
        <div class="live-label">当前本地时间 (Live)</div>
        <div class="live-time">{{ formatDate(currentTime) }}</div>
      </div>
      <div class="clock-side">
        <div class="live-label">Unix 时间戳</div>
        <div class="live-ts-row">
          <code class="live-ts">{{ Math.floor(currentTime.getTime() / 1000) }}</code>
          <button @click="handleCopy(Math.floor(currentTime.getTime() / 1000).toString())" class="mini-icon-btn" title="复制当前时间戳">
            📋
          </button>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="handleNow" class="action-btn">
          <span>✨</span> 现在
        </button>
        <button @click="handleClear" class="action-btn ghost danger">
          清空
        </button>
      </div>
    </div>

    <div class="main-layout">
      <!-- Timestamp to Date -->
      <div class="pane">
        <div class="pane-header">
          <span>时间戳 ➔ 日期</span>
          <div class="unit-selector">
            <button 
              :class="['unit-btn', { active: tsUnit === 's' }]" 
              @click="tsUnit = 's'"
            >秒 (s)</button>
            <button 
              :class="['unit-btn', { active: tsUnit === 'ms' }]" 
              @click="tsUnit = 'ms'"
            >毫秒 (ms)</button>
          </div>
        </div>
        <div class="pane-content">
          <div class="input-group">
            <label>Unix 时间戳</label>
            <input 
              v-model="tsInput" 
              type="text" 
              placeholder="请输入时间戳，例如: 1713196800"
              class="custom-input"
            />
          </div>
          <div class="arrow-down">↓</div>
          <div class="input-group">
            <label>转换结果 (本地时间)</label>
            <div class="result-display">
              <input 
                :value="tsResult" 
                readonly 
                class="custom-input readonly"
              />
              <button v-if="tsResult && !tsResult.includes('失败')" @click="handleCopy(tsResult)" class="copy-suffix">复制</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Date to Timestamp -->
      <div class="pane">
        <div class="pane-header">
          <span>日期 ➔ 时间戳</span>
        </div>
        <div class="pane-content">
          <div class="input-group">
            <label>日期字符串</label>
            <input 
              v-model="dtInput" 
              type="text" 
              placeholder="例如: 2024-04-16 00:00:00"
              class="custom-input"
            />
          </div>
          <div class="arrow-down">↓</div>
          <div class="results-stack">
            <div class="input-group">
              <label>时间戳 (秒)</label>
              <div class="result-display">
                <input :value="dtResultS" readonly class="custom-input readonly" />
                <button v-if="dtResultS && !dtResultS.includes('失败')" @click="handleCopy(dtResultS)" class="copy-suffix">复制</button>
              </div>
            </div>
            <div class="input-group" style="margin-top: 12px;">
              <label>时间戳 (毫秒)</label>
              <div class="result-display">
                <input :value="dtResultMs" readonly class="custom-input readonly" />
                <button v-if="dtResultMs && !dtResultMs.includes('失败')" @click="handleCopy(dtResultMs)" class="copy-suffix">复制</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timestamp-converter {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
  overflow-y: auto;
}

/* Dashboard Card */
.dashboard-card {
  background: linear-gradient(135deg, rgba(63, 94, 251, 0.1) 0%, rgba(252, 70, 107, 0.1) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  backdrop-filter: blur(10px);
}

.clock-icon {
  font-size: 32px;
  background: rgba(255, 255, 255, 0.05);
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.clock-main {
  flex: 1;
}

.live-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.live-time {
  font-size: 24px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: #fff;
  letter-spacing: -0.02em;
}

.clock-side {
  padding-left: 24px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.live-ts-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-ts {
  font-size: 18px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-color);
  font-weight: 600;
}

.mini-icon-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.mini-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.unit-selector {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px;
  border-radius: 6px;
}

.unit-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.unit-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.pane-content {
  padding: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.custom-input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.custom-input:focus {
  border-color: var(--accent-color);
  background: rgba(0, 0, 0, 0.3);
}

.custom-input.readonly {
  background: rgba(255, 255, 255, 0.02);
  cursor: default;
}

.result-display {
  position: relative;
  display: flex;
}

.result-display .custom-input {
  flex: 1;
  padding-right: 60px;
}

.copy-suffix {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-suffix:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.arrow-down {
  text-align: center;
  padding: 12px 0;
  color: rgba(255, 255, 255, 0.2);
  font-size: 20px;
}
</style>
