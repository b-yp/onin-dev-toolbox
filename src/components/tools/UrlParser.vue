<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { toast as oninToast } from 'onin-sdk';
import { parseUrlString, reconstructUrlString, type ParsedUrlStructure, type QueryParamItem } from '../../utils/urlParser';

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

// 示例模板数据
const SAMPLE_URLS = [
  { name: 'Google 复杂查询', value: 'https://www.google.com/search?q=vue3+reactive+ref&oq=vue3+reactive&sourceid=chrome&ie=UTF-8#readme' },
  { name: 'API 本地测试', value: 'http://localhost:8080/api/v1/users/details?id=99283&status=active&expand=profile,roles' },
  { name: '相对路径片段', value: '/products/list?category=electronics&sort=price_desc&limit=20#top' }
];

const rawUrl = ref('');
const parsedStructure = ref<ParsedUrlStructure>({
  protocol: 'https:',
  hostname: '',
  port: '',
  pathname: '/',
  hash: '',
  params: [],
  isRelative: false,
  hadNoProtocol: false
});

let isUpdating = false;

// 解析并绑定
const handleParse = (val: string) => {
  if (isUpdating) return;
  isUpdating = true;
  parsedStructure.value = parseUrlString(val);
  isUpdating = false;
};

// 联动重构
const handleReconstruct = () => {
  if (isUpdating) return;
  isUpdating = true;
  rawUrl.value = reconstructUrlString(parsedStructure.value);
  isUpdating = false;
};

// 监听完整输入
watch(rawUrl, (newVal) => {
  handleParse(newVal);
});

// 监听内部结构体的深层变化 (联动重构回 URL 串)
watch(parsedStructure, () => {
  handleReconstruct();
}, { deep: true });

// 快捷操作
const loadSample = (val: string) => {
  rawUrl.value = val;
  toast.success('已载入示例 URL');
};

const handleCopyAll = () => {
  if (!rawUrl.value) return;
  navigator.clipboard.writeText(rawUrl.value).then(() => {
    toast.success('URL 已复制到剪贴板');
  });
};

const handleClear = () => {
  rawUrl.value = '';
  parsedStructure.value = {
    protocol: 'https:',
    hostname: '',
    port: '',
    pathname: '/',
    hash: '',
    params: [],
    isRelative: false,
    hadNoProtocol: false
  };
  toast.success('内容已清空');
};

// 参数列表特有操作
const addParam = () => {
  parsedStructure.value.params.push({
    key: '',
    value: '',
    active: true
  });
};

const removeParam = (idx: number) => {
  parsedStructure.value.params.splice(idx, 1);
};

const clearAllParams = () => {
  parsedStructure.value.params = [];
  toast.success('已清空所有参数');
};

const moveParam = (idx: number, direction: 'up' | 'down') => {
  const list = parsedStructure.value.params;
  if (direction === 'up' && idx > 0) {
    const temp = list[idx];
    list[idx] = list[idx - 1];
    list[idx - 1] = temp;
  } else if (direction === 'down' && idx < list.length - 1) {
    const temp = list[idx];
    list[idx] = list[idx + 1];
    list[idx + 1] = temp;
  }
};

const encodeParamValue = (idx: number) => {
  const item = parsedStructure.value.params[idx];
  try {
    item.value = encodeURIComponent(item.value);
    toast.success('参数值已进行 URL 编码');
  } catch (_) {
    toast.error('编码失败');
  }
};

const decodeParamValue = (idx: number) => {
  const item = parsedStructure.value.params[idx];
  try {
    item.value = decodeURIComponent(item.value);
    toast.success('参数值已进行 URL 解码');
  } catch (_) {
    toast.error('解码失败，可能包含非法转义');
  }
};

onMounted(() => {
  loadSample(SAMPLE_URLS[0].value);
});
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border bg-[var(--bg-color)]">
    <!-- 顶部菜单栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/[0.05] backdrop-blur-md shrink-0">
      <div class="flex items-center gap-3">
        <span class="text-xs text-[var(--text-secondary)]">快速载入示例:</span>
        <div class="flex gap-1.5 overflow-x-auto max-w-[500px] no-scrollbar">
          <button 
            v-for="tpl in SAMPLE_URLS" 
            :key="tpl.name"
            @click="loadSample(tpl.value)"
            class="px-2 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded text-[11px] font-medium text-slate-300 transition-all cursor-pointer whitespace-nowrap"
          >
            {{ tpl.name }}
          </button>
        </div>
      </div>
      
      <div class="flex gap-2">
        <button 
          @click="handleCopyAll"
          class="bg-[var(--accent-color)] border border-blue-500/20 text-white px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-90 transition-all"
        >
          📋 复制完整 URL
        </button>
        <button 
          @click="handleClear"
          class="bg-white/5 border border-white/10 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/10 transition-all"
        >
          🗑️ 清空
        </button>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">
      
      <!-- 上方：URL 完整字符串输入区 -->
      <div class="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col gap-2 shrink-0">
        <div class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          完整 URL 地址
        </div>
        <textarea 
          v-model="rawUrl"
          class="w-full h-20 bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none focus:border-[var(--accent-color)] resize-none"
          placeholder="在此输入需要解析的 URL，或在此处直接进行重构拼装后的实时修改..."
        ></textarea>
      </div>

      <!-- 下方双栏或上下排布：结构化表单与参数控制 -->
      <div class="flex-1 flex gap-3 md:flex-row flex-col min-h-0">
        
        <!-- 左侧：URL 基础物理结构表单 -->
        <div class="w-full md:w-80 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 gap-4 shrink-0">
          <div class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/5 pb-2">
            URL 基础结构
          </div>

          <div class="flex flex-col gap-3.5">
            <!-- 相对路径切换 -->
            <label class="flex items-center gap-2.5 p-2 rounded bg-white/[0.02] border border-white/5 cursor-pointer select-none text-xs text-slate-300" title="切换为仅处理路径与参数段 (如 /api/v1/test)">
              <input type="checkbox" v-model="parsedStructure.isRelative" class="accent-[var(--accent-color)]" />
              <span>标记为相对路径片段</span>
            </label>

            <!-- 协议 -->
            <div v-show="!parsedStructure.isRelative" class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--text-secondary)]">协议 (Protocol)</span>
              <select 
                v-model="parsedStructure.protocol"
                class="bg-zinc-950 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[var(--accent-color)] cursor-pointer"
              >
                <option value="https:">https:// (加密传输)</option>
                <option value="http:">http:// (明文传输)</option>
                <option value="ftp:">ftp:// (文件传输)</option>
                <option value="file:">file:/// (本地文件)</option>
              </select>
            </div>

            <!-- 域名 -->
            <div v-show="!parsedStructure.isRelative" class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--text-secondary)]">域名 (Hostname)</span>
              <input 
                type="text" 
                v-model="parsedStructure.hostname"
                class="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-[var(--accent-color)] outline-none"
                placeholder="例如: www.google.com"
              />
            </div>

            <!-- 端口 -->
            <div v-show="!parsedStructure.isRelative" class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--text-secondary)]">端口 (Port)</span>
              <input 
                type="text" 
                v-model="parsedStructure.port"
                class="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-[var(--accent-color)] outline-none"
                placeholder="默认端口留空"
              />
            </div>

            <!-- 路径 -->
            <div class="flex flex-col gap-1.5 border-t border-white/5 pt-3">
              <span class="text-xs text-[var(--text-secondary)]">路径 (Pathname)</span>
              <input 
                type="text" 
                v-model="parsedStructure.pathname"
                class="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-[var(--accent-color)] outline-none"
                placeholder="例如: /search"
              />
            </div>

            <!-- 哈希 -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs text-[var(--text-secondary)]">锚点哈希 (Hash / Fragment)</span>
              <input 
                type="text" 
                v-model="parsedStructure.hash"
                class="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-[var(--accent-color)] outline-none"
                placeholder="例如: #readme"
              />
            </div>
          </div>
        </div>

        <!-- 右侧：查询参数重构表格 -->
        <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden min-h-0">
          <div class="px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider flex justify-between items-center shrink-0">
            <span>查询参数列表 (Query Parameters)</span>
            <div class="flex gap-2">
              <button 
                @click="addParam"
                class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/10 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all"
              >
                ➕ 添加参数
              </button>
              <button 
                @click="clearAllParams"
                class="bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/10 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all"
              >
                🗑️ 清空所有参数
              </button>
            </div>
          </div>

          <!-- 参数列表容器 -->
          <div class="flex-1 overflow-auto p-4 flex flex-col gap-2 min-h-0">
            <template v-if="parsedStructure.params.length > 0">
              <div 
                v-for="(item, idx) in parsedStructure.params" 
                :key="idx"
                class="flex items-center gap-2 bg-zinc-900 border border-white/[0.02] hover:border-white/5 rounded-lg p-2.5 transition-all group"
              >
                <!-- 1. 启闭开关 -->
                <input 
                  type="checkbox" 
                  v-model="item.active" 
                  class="accent-blue-500 rounded cursor-pointer size-4" 
                  title="控制是否在生成的 URL 中包含该参数"
                />

                <!-- 2. 参数 Key -->
                <input 
                  type="text" 
                  v-model="item.key" 
                  class="w-1/3 bg-zinc-950 border border-white/5 focus:border-blue-500/30 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none"
                  placeholder="键 (Key)"
                />

                <!-- 3. 参数 Value -->
                <input 
                  type="text" 
                  v-model="item.value" 
                  class="flex-1 bg-zinc-950 border border-white/5 focus:border-blue-500/30 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none"
                  placeholder="值 (Value)"
                />

                <!-- 4. 单项操控按钮组 (鼠标悬停或激活可见，更显高级) -->
                <div class="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-all">
                  <!-- 上移 -->
                  <button 
                    @click="moveParam(idx, 'up')" 
                    :disabled="idx === 0"
                    class="p-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 cursor-pointer"
                    title="参数上移"
                  >
                    ▲
                  </button>
                  <!-- 下移 -->
                  <button 
                    @click="moveParam(idx, 'down')" 
                    :disabled="idx === parsedStructure.params.length - 1"
                    class="p-1.5 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 cursor-pointer"
                    title="参数下移"
                  >
                    ▼
                  </button>
                  <!-- URL 编码 -->
                  <button 
                    @click="encodeParamValue(idx)" 
                    class="px-1.5 py-1 bg-white/5 hover:bg-blue-500 hover:text-white rounded text-[10px] text-slate-300 cursor-pointer"
                    title="进行 URL 编码"
                  >
                    Enc
                  </button>
                  <!-- URL 解码 -->
                  <button 
                    @click="decodeParamValue(idx)" 
                    class="px-1.5 py-1 bg-white/5 hover:bg-blue-500 hover:text-white rounded text-[10px] text-slate-300 cursor-pointer"
                    title="进行 URL 解码"
                  >
                    Dec
                  </button>
                  <!-- 删除 -->
                  <button 
                    @click="removeParam(idx)" 
                    class="p-1.5 bg-red-950/20 hover:bg-red-600 hover:text-white rounded text-red-400 cursor-pointer"
                    title="删除参数"
                  >
                    ×
                  </button>
                </div>
              </div>
            </template>
            <div v-else class="flex-1 flex flex-col items-center justify-center border border-white/5 bg-white/[0.002] text-[var(--text-secondary)] rounded-lg text-center gap-1.5">
              <span class="text-3xl opacity-50">🌐</span>
              <div class="text-xs">当前无查询参数</div>
              <div class="text-[10px] text-slate-500">点击右上角“添加参数”为 URL 增加键值对</div>
            </div>
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
