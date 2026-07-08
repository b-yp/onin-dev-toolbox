<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { toast as oninToast } from 'onin-sdk';
import { translateCron, predictNextRuns } from '../../utils/cron';

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

// 快捷模版定义
const CRON_TEMPLATES = [
  { name: '每分钟', value: '* * * * *' },
  { name: '每 5 分钟', value: '*/5 * * * *' },
  { name: '每小时', value: '0 * * * *' },
  { name: '每天凌晨 2 点', value: '0 2 * * *' },
  { name: '每个工作日凌晨 4 点', value: '0 4 * * 1-5' },
  { name: '每月 1 号零点', value: '0 0 1 * *' },
  { name: '每周五下午 6 点', value: '0 18 * * 5' },
  { name: '每秒 (需启用 6 位秒模式)', value: '* * * * * *', isSeconds: true }
];

// 左侧编辑器数据
const cronExpression = ref('*/5 * * * *');
const isSecondsMode = ref(false);
const showHelp = ref(false);

// 执行预测行数
const predictCount = ref(5);

// 计算并实时预测
const translation = computed(() => translateCron(cronExpression.value));

const nextRuns = computed(() => {
  try {
    return predictNextRuns(cronExpression.value, predictCount.value);
  } catch (err: any) {
    return [];
  }
});

const isExpressionValid = computed(() => {
  try {
    predictNextRuns(cronExpression.value, 1);
    return true;
  } catch (_) {
    return false;
  }
});

// 可视化生成器配置类型
interface CronFieldConfig {
  type: 'all' | 'step' | 'specific';
  step: number;
  specifics: number[];
}

// 可视化 Tab 状态
const activeTab = ref<'second' | 'minute' | 'hour' | 'day' | 'month' | 'week'>('minute');

// 各个域的初始配置
const secondConfig = ref<CronFieldConfig>({ type: 'all', step: 5, specifics: [] });
const minuteConfig = ref<CronFieldConfig>({ type: 'step', step: 5, specifics: [] });
const hourConfig = ref<CronFieldConfig>({ type: 'all', step: 2, specifics: [] });
const dayConfig = ref<CronFieldConfig>({ type: 'all', step: 1, specifics: [] });
const monthConfig = ref<CronFieldConfig>({ type: 'all', step: 1, specifics: [] });
const weekConfig = ref<CronFieldConfig>({ type: 'all', step: 1, specifics: [] });

// 当秒级模式开启或关闭时，自动切换 Tab 默认聚焦
watch(isSecondsMode, (enabled) => {
  if (enabled) {
    activeTab.value = 'second';
    // 如果原表达式只有 5 位，自动在前补 *
    const parts = cronExpression.value.trim().split(/\s+/);
    if (parts.length === 5) {
      cronExpression.value = '* ' + cronExpression.value;
    }
  } else {
    activeTab.value = 'minute';
    // 如果原表达式有 6 位，自动移除第一位（秒）
    const parts = cronExpression.value.trim().split(/\s+/);
    if (parts.length === 6) {
      parts.shift();
      cronExpression.value = parts.join(' ');
    }
  }
});

// 计算生成的 Cron 表达式 (基于右侧可视化配置)
const compiledExpression = computed(() => {
  const compileField = (cfg: CronFieldConfig, defaultVal: string = '*') => {
    if (cfg.type === 'all') return '*';
    if (cfg.type === 'step') return `*/${cfg.step}`;
    if (cfg.type === 'specific') {
      if (cfg.specifics.length === 0) return defaultVal;
      const sorted = [...cfg.specifics].sort((a, b) => a - b);
      return sorted.join(',');
    }
    return '*';
  };

  const parts = [
    compileField(minuteConfig.value, '*'),
    compileField(hourConfig.value, '*'),
    compileField(dayConfig.value, '*'),
    compileField(monthConfig.value, '*'),
    compileField(weekConfig.value, '*')
  ];

  if (isSecondsMode.value) {
    parts.unshift(compileField(secondConfig.value, '*'));
  }

  return parts.join(' ');
});

// 当右侧生成的表达式发生变化时，如果开启了同步，自动覆盖左侧的输入框
let isUpdatingFromVisual = false;
watch(compiledExpression, (newVal) => {
  isUpdatingFromVisual = true;
  cronExpression.value = newVal;
  // 恢复锁
  setTimeout(() => { isUpdatingFromVisual = false; }, 20);
});

// 当左侧输入变动时，仅在非右侧修改引起的变动下，判断字段长度自动切换 isSecondsMode 状态
watch(cronExpression, (newVal) => {
  if (isUpdatingFromVisual) return;
  const parts = newVal.trim().split(/\s+/);
  if (parts.length === 6 && !isSecondsMode.value) {
    isSecondsMode.value = true;
  } else if (parts.length === 5 && isSecondsMode.value) {
    isSecondsMode.value = false;
  }
});

// 快捷载入模版
const handleLoadTemplate = (tpl: typeof CRON_TEMPLATES[0]) => {
  if (tpl.isSeconds) {
    isSecondsMode.value = true;
  } else {
    isSecondsMode.value = false;
  }
  cronExpression.value = tpl.value;
  toast.success(`已载入模版: ${tpl.name}`);
};

const handleCopyCron = () => {
  navigator.clipboard.writeText(cronExpression.value).then(() => {
    toast.success('Cron 表达式已成功复制');
  });
};

// 辅助方法：快速全选、清除、奇偶数过滤
const handleQuickSelect = (tab: string, type: 'all' | 'clear' | 'odd' | 'even') => {
  let limit = 59;
  let start = 0;
  let targetRef: any = null;

  if (tab === 'second') { targetRef = secondConfig; limit = 59; }
  else if (tab === 'minute') { targetRef = minuteConfig; limit = 59; }
  else if (tab === 'hour') { targetRef = hourConfig; limit = 23; }
  else if (tab === 'day') { targetRef = dayConfig; limit = 31; start = 1; }
  else if (tab === 'month') { targetRef = monthConfig; limit = 12; start = 1; }
  else if (tab === 'week') { targetRef = weekConfig; limit = 6; start = 0; }

  if (!targetRef) return;

  targetRef.value.type = 'specific';
  if (type === 'clear') {
    targetRef.value.specifics = [];
  } else if (type === 'all') {
    const list = [];
    for (let i = start; i <= limit; i++) list.push(i);
    targetRef.value.specifics = list;
  } else if (type === 'odd') {
    const list = [];
    for (let i = start; i <= limit; i++) {
      if (i % 2 !== 0) list.push(i);
    }
    targetRef.value.specifics = list;
  } else if (type === 'even') {
    const list = [];
    for (let i = start; i <= limit; i++) {
      if (i % 2 === 0) list.push(i);
    }
    targetRef.value.specifics = list;
  }
};

const toggleSpecificValue = (configRef: any, val: number) => {
  configRef.type = 'specific';
  const idx = configRef.specifics.indexOf(val);
  if (idx > -1) {
    configRef.specifics.splice(idx, 1);
  } else {
    configRef.specifics.push(val);
  }
};

// 星期文字格式化
const getWeekName = (val: number) => {
  const weeks = ['周日 (0)', '周一 (1)', '周二 (2)', '周三 (3)', '周四 (4)', '周五 (5)', '周六 (6)'];
  return weeks[val];
};

// 月份简写
const getMonthName = (val: number) => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return `${months[val - 1]} (${val})`;
};
// 包装后的组件字段配置对象，利用 computed 保持依赖收集并保留原始 Ref 容器以解除模板歧义
const fieldsList = computed(() => {
  return [
    { id: 'second', config: secondConfig, limit: 59, label: '秒', start: 0 },
    { id: 'minute', config: minuteConfig, limit: 59, label: '分钟', start: 0 },
    { id: 'hour', config: hourConfig, limit: 23, label: '小时', start: 0 },
    { id: 'day', config: dayConfig, limit: 31, label: '日期', start: 1 },
    { id: 'month', config: monthConfig, limit: 12, label: '月份', start: 1 },
    { id: 'week', config: weekConfig, limit: 6, label: '星期', start: 0 }
  ];
});
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-3 box-border bg-[var(--bg-color)]">
    <!-- 顶部菜单栏 -->
    <div class="flex items-center justify-between bg-white/[0.03] p-2 px-4 rounded-xl border border-white/[0.05] backdrop-blur-md">
      <div class="flex items-center gap-3">
        <!-- 6位/5位模式选择 -->
        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input type="checkbox" v-model="isSecondsMode" class="accent-[var(--accent-color)] rounded" />
          <span class="font-medium">启用秒级模式 (6位)</span>
        </label>
        <div class="w-px h-5 bg-white/10"></div>
        
        <!-- 模版快速载入 -->
        <span class="text-xs text-[var(--text-secondary)]">常用模版:</span>
        <div class="flex gap-1.5 overflow-x-auto max-w-[400px] no-scrollbar">
          <button 
            v-for="tpl in CRON_TEMPLATES" 
            :key="tpl.name"
            v-show="!tpl.isSeconds || isSecondsMode"
            @click="handleLoadTemplate(tpl)"
            class="px-2 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded text-[11px] font-medium text-slate-300 transition-all cursor-pointer whitespace-nowrap"
          >
            {{ tpl.name }}
          </button>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          @click="showHelp = !showHelp"
          class="bg-white/[0.05] border border-white/[0.1] text-slate-300 px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/[0.1]"
        >
          {{ showHelp ? '📖 隐藏格式说明' : '📖 格式说明' }}
        </button>
      </div>
    </div>

    <!-- 格式说明面板 -->
    <div v-show="showHelp" class="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-xs text-slate-300 flex flex-col gap-2">
      <h3 class="font-bold text-sm text-blue-400 mb-1">Standard Cron 表达式域说明：</h3>
      <div class="grid grid-cols-6 gap-2 border-b border-white/5 pb-2 font-semibold text-slate-400">
        <div>域名称</div>
        <div>是否必填</div>
        <div>允许的值</div>
        <div>允许的特殊字符</div>
        <div class="col-span-2">表达式示例</div>
      </div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono">
        <div class="text-emerald-400">秒 (Seconds)</div>
        <div>是 (6位模式)</div>
        <div>0 - 59</div>
        <div>, - * /</div>
        <div class="col-span-2">`*` (每秒), `*/5` (每5秒)</div>
      </div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono">
        <div class="text-blue-400">分 (Minutes)</div>
        <div>是</div>
        <div>0 - 59</div>
        <div>, - * /</div>
        <div class="col-span-2">`30` (第30分), `15,45` (15和45分)</div>
      </div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono">
        <div class="text-blue-400">时 (Hours)</div>
        <div>是</div>
        <div>0 - 23</div>
        <div>, - * /</div>
        <div class="col-span-2">`0` (午夜), `9-17` (朝九晚五)</div>
      </div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono">
        <div class="text-blue-400">日 (Day of Month)</div>
        <div>是</div>
        <div>1 - 31</div>
        <div>, - * / ?</div>
        <div class="col-span-2">`1,15` (每月1号和15号)</div>
      </div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono">
        <div class="text-blue-400">月 (Month)</div>
        <div>是</div>
        <div>1 - 12</div>
        <div>, - * /</div>
        <div class="col-span-2">`*/3` (每季度一次)</div>
      </div>
      <div class="grid grid-cols-6 gap-2 text-slate-300 leading-relaxed font-mono">
        <div class="text-blue-400">周 (Day of Week)</div>
        <div>是</div>
        <div>0 - 6 (0=周日)</div>
        <div>, - * / ?</div>
        <div class="col-span-2">`1-5` (周一至周五)</div>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="flex-1 overflow-hidden relative">
      <div class="flex w-full h-full gap-3 md:flex-row flex-col">
        
        <!-- 左侧：解析与时间预测 -->
        <div class="flex-1 flex flex-col gap-3 min-w-0">
          
          <!-- 表达式大输入框 -->
          <div class="flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 gap-3 relative">
            <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Cron 表达式 ({{ isSecondsMode ? '6位秒级' : '5位标准' }})
            </span>
            <div class="flex items-center gap-3">
              <input 
                type="text" 
                v-model="cronExpression" 
                class="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono tracking-widest text-slate-200 outline-none focus:border-[var(--accent-color)] font-bold"
                placeholder="输入 Cron 表达式，如 */5 * * * *"
              />
              <button 
                @click="handleCopyCron"
                class="bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl text-xs font-semibold cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all shrink-0"
              >
                📋 复制表达式
              </button>
            </div>
            
            <!-- 表达式人话解释区 -->
            <div :class="[
              'p-3.5 rounded-lg border text-xs font-medium leading-relaxed transition-all flex items-center gap-2',
              isExpressionValid ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            ]">
              <span class="text-sm font-bold">{{ isExpressionValid ? '💡' : '⚠️' }}</span>
              <div>{{ translation }}</div>
            </div>
          </div>

          <!-- 执行预测面板 -->
          <div class="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden min-h-0">
            <div class="px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider flex justify-between items-center">
              <span>未来执行时间预测 (CST/本地时间)</span>
              <div class="flex bg-white/[0.05] p-0.5 rounded">
                <button 
                  v-for="c in [5, 10]" 
                  :key="c"
                  :class="['px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all', predictCount === c ? 'bg-white/[0.1] text-white' : 'bg-transparent text-slate-400 hover:text-white']"
                  @click="predictCount = c"
                >
                  前 {{ c }} 次
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-auto p-4 flex flex-col gap-2">
              <template v-if="isExpressionValid && nextRuns.length > 0">
                <div 
                  v-for="(time, idx) in nextRuns" 
                  :key="idx"
                  class="flex items-center justify-between p-3 bg-zinc-900 border border-white/[0.02] rounded-lg hover:border-white/5 transition-all font-mono"
                >
                  <span class="text-xs text-slate-500">第 {{ idx + 1 }} 次运行时间</span>
                  <span class="text-xs text-emerald-400 font-bold tracking-wider">{{ time }}</span>
                </div>
              </template>
              <div v-else class="flex-1 flex flex-col items-center justify-center p-6 border border-white/5 bg-white/[0.002] text-[var(--text-secondary)] rounded-lg text-center gap-1.5">
                <span class="text-3xl opacity-50">⏰</span>
                <div class="text-xs">等待生成合法有效的表达式</div>
                <div class="text-[10px] text-slate-500">表达式语法正确时，未来的预计计划执行日期将在此实时显示</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：可视化生成器 -->
        <div class="w-full md:w-[480px] flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shrink-0">
          <div class="px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] bg-white/[0.03] border-b border-white/[0.05] uppercase tracking-wider flex justify-between items-center">
            <span>可视化生成器</span>
            <span class="text-[10px] text-blue-400 font-mono">FORM CONFIGURATOR</span>
          </div>

          <!-- 可视化配置选项卡导航 -->
          <div class="flex bg-white/[0.02] border-b border-white/[0.05] overflow-x-auto no-scrollbar">
            <button 
              v-if="isSecondsMode"
              :class="['px-4 py-3 text-xs font-semibold cursor-pointer border-b-2 transition-all', activeTab === 'second' ? 'border-[var(--accent-color)] text-white bg-white/[0.02]' : 'border-transparent text-slate-400 hover:text-white']"
              @click="activeTab = 'second'"
            >
              秒 (Sec)
            </button>
            <button 
              v-for="tab in [
                { id: 'minute', label: '分 (Min)' },
                { id: 'hour', label: '时 (Hour)' },
                { id: 'day', label: '日 (Day)' },
                { id: 'month', label: '月 (Month)' },
                { id: 'week', label: '周 (Week)' }
              ]"
              :key="tab.id"
              :class="['px-4 py-3 text-xs font-semibold cursor-pointer border-b-2 transition-all', activeTab === tab.id ? 'border-[var(--accent-color)] text-white bg-white/[0.02]' : 'border-transparent text-slate-400 hover:text-white']"
              @click="activeTab = tab.id as any"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- 可视化配置选项卡内容区 -->
          <div class="flex-1 p-4 overflow-auto min-h-0 flex flex-col gap-4">
            
            <!-- 动态渲染激活的 Tab -->
            <div 
              v-for="current in fieldsList"
              :key="current.id"
              v-show="activeTab === current.id"
              class="flex flex-col gap-4"
            >
              <!-- 1. 任意值选择 -->
              <label class="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-900 border border-white/[0.02] hover:border-white/5 cursor-pointer select-none">
                <input type="radio" value="all" v-model="current.config.value.type" class="accent-[var(--accent-color)]" />
                <div class="flex flex-col">
                  <span class="text-xs text-slate-200 font-semibold">每一{{ current.label }} (通配符 `*`)</span>
                  <span class="text-[10px] text-slate-500 mt-0.5">该域在计划执行时允许所有数值</span>
                </div>
              </label>

              <!-- 2. 周期步长值选择 -->
              <div class="flex flex-col gap-2 p-3 rounded-lg bg-zinc-900 border border-white/[0.02]">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="radio" value="step" v-model="current.config.value.type" class="accent-[var(--accent-color)]" />
                  <span class="text-xs text-slate-200 font-semibold">定期周期 (间隔执行)</span>
                </label>
                <div v-show="current.config.value.type === 'step'" class="flex items-center gap-3 pl-6 mt-1 transition-all">
                  <span class="text-xs text-slate-400">每隔</span>
                  <div class="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      :max="current.limit" 
                      v-model.number="current.config.value.step"
                      class="w-16 bg-zinc-950 border border-white/10 rounded px-2 py-1 text-xs font-mono text-slate-200 text-center focus:border-[var(--accent-color)] outline-none font-bold" 
                    />
                    <span class="text-xs text-slate-400">{{ current.label }}执行一次</span>
                  </div>
                </div>
              </div>

              <!-- 3. 指定特定具体的值 -->
              <div class="flex flex-col gap-3 p-3 rounded-lg bg-zinc-900 border border-white/[0.02]">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="radio" value="specific" v-model="current.config.value.type" class="accent-[var(--accent-color)]" />
                  <span class="text-xs text-slate-200 font-semibold">指定具体时间 (支持多选)</span>
                </label>
                
                <div v-show="current.config.value.type === 'specific'" class="pl-6 flex flex-col gap-3">
                  <!-- 快捷辅助控制 -->
                  <div class="flex gap-2">
                    <button @click="handleQuickSelect(current.id, 'all')" class="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer">全选</button>
                    <button @click="handleQuickSelect(current.id, 'clear')" class="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer">清除</button>
                    <button v-show="current.id !== 'week'" @click="handleQuickSelect(current.id, 'odd')" class="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer">奇数</button>
                    <button v-show="current.id !== 'week'" @click="handleQuickSelect(current.id, 'even')" class="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 cursor-pointer">偶数</button>
                  </div>

                  <!-- 网格布局选项 -->
                  <div :class="[
                    'grid gap-1.5 max-h-48 overflow-y-auto pr-1 select-none',
                    current.id === 'week' ? 'grid-cols-2' : (current.id === 'month' ? 'grid-cols-3' : 'grid-cols-6')
                  ]">
                    <button 
                      v-for="val in (current.limit - current.start + 1)"
                      :key="val"
                      @click="toggleSpecificValue(current.config.value, (val - 1 + current.start))"
                      :class="[
                        'py-1 text-xs rounded border transition-all cursor-pointer font-medium font-mono',
                        current.config.value.specifics.includes((val - 1 + current.start))
                          ? 'bg-[var(--accent-color)] text-white border-blue-400' 
                          : 'bg-zinc-950 text-slate-400 border-white/5 hover:border-white/10'
                      ]"
                    >
                      <template v-if="current.id === 'week'">{{ getWeekName(val - 1 + current.start) }}</template>
                      <template v-else-if="current.id === 'month'">{{ getMonthName(val - 1 + current.start) }}</template>
                      <template v-else>{{ val - 1 + current.start }}</template>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- 实时可视化拼接结果框 -->
          <div class="p-4 border-t border-white/[0.05] bg-white/[0.01] flex flex-col gap-1">
            <span class="text-[10px] text-[var(--text-secondary)] uppercase">当前勾选的生成值:</span>
            <div class="font-mono text-sm text-emerald-400 font-bold break-all">
              {{ compiledExpression }}
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
