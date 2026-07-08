<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { toast as oninToast } from 'onin-sdk';
import { convertYamlToJson, convertJsonToYaml } from '../../utils/yamlConverter';
import Editor from '../Editor.vue';

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

// 常见 YAML 示例数据
const SAMPLE_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: production
        resources:
          limits:
            cpu: 500m
            memory: 512Mi`;

// 状态定义
const yamlText = ref('');
const jsonText = ref('');

const yamlIndent = ref<2 | 4>(2);
const jsonIndent = ref<2 | 4 | 0>(2); // 0 代表压缩在一行
const autoSync = ref(true); // 是否实时联动更新

const yamlError = ref('');
const jsonError = ref('');

let activeDirection: 'yaml2json' | 'json2yaml' | null = null;
let debounceTimer: any = null;

// YAML 转 JSON
const performYamlToJson = () => {
  yamlError.value = '';
  if (!yamlText.value.trim()) {
    jsonText.value = '';
    return;
  }
  try {
    jsonText.value = convertYamlToJson(yamlText.value, jsonIndent.value);
  } catch (err: any) {
    yamlError.value = err.message || 'YAML 解析错误';
  }
};

// JSON 转 YAML
const performJsonToYaml = () => {
  jsonError.value = '';
  if (!jsonText.value.trim()) {
    yamlText.value = '';
    return;
  }
  try {
    yamlText.value = convertJsonToYaml(jsonText.value, yamlIndent.value);
  } catch (err: any) {
    jsonError.value = err.message || 'JSON 解析错误';
  }
};

// 防抖自动更新机制
const triggerAutoSync = (direction: 'yaml2json' | 'json2yaml') => {
  if (!autoSync.value) return;
  activeDirection = direction;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (activeDirection === 'yaml2json') {
      performYamlToJson();
    } else if (activeDirection === 'json2yaml') {
      performJsonToYaml();
    }
    activeDirection = null;
  }, 350); // 350ms 防抖打字延时
};

// 监听输入
watch(yamlText, () => {
  // 如果是由于 JSON 反向生成 YAML 触发的变化，则忽略，防止回环
  if (activeDirection === 'json2yaml') return;
  triggerAutoSync('yaml2json');
});

watch(jsonText, () => {
  // 如果是由于 YAML 正向生成 JSON 触发的变化，则忽略
  if (activeDirection === 'yaml2json') return;
  triggerAutoSync('json2yaml');
});

// 监听缩进参数改变实时触发重新渲染
watch([yamlIndent, jsonIndent], () => {
  // 如果当前聚焦或者是有内容，重新执行一次当前有值的转换
  if (yamlText.value && !yamlError.value) {
    performYamlToJson();
  } else if (jsonText.value && !jsonError.value) {
    performJsonToYaml();
  }
});

// 快捷操作
const loadSample = () => {
  activeDirection = 'yaml2json'; // 阻止回环
  yamlText.value = SAMPLE_YAML;
  performYamlToJson();
  activeDirection = null;
  toast.success('已载入 K8s Deployment 示例配置');
};

const handleCopy = (type: 'yaml' | 'json') => {
  const content = type === 'yaml' ? yamlText.value : jsonText.value;
  if (!content) return;
  navigator.clipboard.writeText(content).then(() => {
    toast.success(`已复制 ${type.toUpperCase()} 到剪贴板`);
  });
};

const handleClear = (type: 'yaml' | 'json' | 'all') => {
  if (type === 'yaml' || type === 'all') {
    yamlText.value = '';
    yamlError.value = '';
  }
  if (type === 'json' || type === 'all') {
    jsonText.value = '';
    jsonError.value = '';
  }
  toast.success('内容已清空');
};

onMounted(() => {
  loadSample();
});
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border bg-[var(--bg-color)]">
    
    <!-- 顶部菜单/工具栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2.5 px-4 rounded-xl border border-white/[0.05] backdrop-blur-md shrink-0 flex-wrap gap-2">
      <div class="flex items-center gap-4 flex-wrap text-xs">
        
        <!-- 自动同步开关 -->
        <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
          <input type="checkbox" v-model="autoSync" class="accent-[var(--accent-color)] rounded" />
          <span class="font-medium">实时自动联动</span>
        </label>
        <div class="w-px h-4 bg-white/10 hidden sm:block"></div>

        <!-- YAML 缩进配置 -->
        <div class="flex items-center gap-2 text-slate-400">
          <span>YAML 缩进:</span>
          <select 
            v-model.number="yamlIndent"
            class="bg-zinc-950 border border-white/10 rounded px-1.5 py-1 text-slate-200 cursor-pointer outline-none focus:border-[var(--accent-color)]"
          >
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
          </select>
        </div>
        <div class="w-px h-4 bg-white/10 hidden sm:block"></div>

        <!-- JSON 缩进配置 -->
        <div class="flex items-center gap-2 text-slate-400">
          <span>JSON 缩进:</span>
          <select 
            v-model.number="jsonIndent"
            class="bg-zinc-950 border border-white/10 rounded px-1.5 py-1 text-slate-200 cursor-pointer outline-none focus:border-[var(--accent-color)]"
          >
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
            <option :value="0">压缩一行</option>
          </select>
        </div>
      </div>
      
      <div class="flex gap-2">
        <button 
          @click="loadSample"
          class="bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/10 transition-all"
        >
          💡 载入示例
        </button>
        <button 
          @click="handleClear('all')"
          class="bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/10 transition-all"
        >
          🗑️ 全部清空
        </button>
      </div>
    </div>

    <!-- 主工作区：双栏布局 -->
    <div class="flex-1 flex gap-3 flex-col md:flex-row min-h-0 relative">
      
      <!-- 1. 左侧 YAML 栏 -->
      <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden min-h-0">
        <div class="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] flex justify-between items-center shrink-0">
          <span class="tracking-wide">YAML 配置文件</span>
          <div class="flex gap-1.5">
            <button 
              @click="handleCopy('yaml')"
              :disabled="!yamlText"
              class="px-2 py-0.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer transition-all"
            >
              复制
            </button>
            <button 
              @click="handleClear('yaml')"
              :disabled="!yamlText"
              class="px-2 py-0.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer transition-all"
            >
              清空
            </button>
          </div>
        </div>
        
        <!-- YAML 编辑区 -->
        <div class="flex-1 min-h-0 relative flex flex-col">
          <Editor 
            v-model="yamlText" 
            language="yaml" 
            placeholder="在此处输入或粘贴 YAML 配置..."
          />
          
          <!-- YAML 错误面板 -->
          <div 
            v-show="yamlError" 
            class="bg-red-500/10 border-t border-red-500/20 text-red-400 text-[11px] p-3 font-mono shrink-0 flex items-start gap-2 max-h-20 overflow-y-auto"
          >
            <span class="text-sm select-none">⚠️</span>
            <div class="flex-1 leading-normal break-all">{{ yamlError }}</div>
          </div>
        </div>
      </div>

      <!-- 中间控制箭头组 (非自动模式下的手动触发按钮) -->
      <div v-show="!autoSync" class="flex md:flex-col justify-center items-center gap-2 py-1 md:py-0 shrink-0 select-none">
        <button 
          @click="performYamlToJson"
          class="bg-zinc-900 border border-white/10 hover:border-[var(--accent-color)] text-slate-300 hover:text-white size-10 rounded-full cursor-pointer flex items-center justify-center transition-all text-sm font-bold shadow-lg"
          title="YAML ➔ JSON 手动转换"
        >
          ➔
        </button>
        <button 
          @click="performJsonToYaml"
          class="bg-zinc-900 border border-white/10 hover:border-[var(--accent-color)] text-slate-300 hover:text-white size-10 rounded-full cursor-pointer flex items-center justify-center transition-all text-sm font-bold shadow-lg md:rotate-0 rotate-90"
          title="JSON ➔ YAML 手动转换"
        >
          ←
        </button>
      </div>

      <!-- 2. 右侧 JSON 栏 -->
      <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden min-h-0">
        <div class="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] flex justify-between items-center shrink-0">
          <span class="tracking-wide">JSON 配置文件</span>
          <div class="flex gap-1.5">
            <button 
              @click="handleCopy('json')"
              :disabled="!jsonText"
              class="px-2 py-0.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer transition-all"
            >
              复制
            </button>
            <button 
              @click="handleClear('json')"
              :disabled="!jsonText"
              class="px-2 py-0.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer transition-all"
            >
              清空
            </button>
          </div>
        </div>
        
        <!-- JSON 编辑区 -->
        <div class="flex-1 min-h-0 relative flex flex-col">
          <Editor 
            v-model="jsonText" 
            language="json" 
            placeholder="在此处输入或粘贴 JSON 配置..."
          />
          
          <!-- JSON 错误面板 -->
          <div 
            v-show="jsonError" 
            class="bg-red-500/10 border-t border-red-500/20 text-red-400 text-[11px] p-3 font-mono shrink-0 flex items-start gap-2 max-h-20 overflow-y-auto"
          >
            <span class="text-sm select-none">⚠️</span>
            <div class="flex-1 leading-normal break-all">{{ jsonError }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 滚动条在暗色模式下的美观 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
