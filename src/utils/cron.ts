import cronstrue from 'cronstrue/i18n';
import { CronExpressionParser } from 'cron-parser';

/**
 * 将 Cron 表达式解析翻译为中文“人话”说明
 */
export function translateCron(expression: string): string {
  if (!expression || !expression.trim()) {
    return '请输入 Cron 表达式';
  }
  try {
    // 强制转换为简体中文
    return cronstrue.toString(expression.trim(), { locale: 'zh_CN' });
  } catch (err: any) {
    // 过滤并处理 cronstrue 报错信息，返回更友好的提示
    const msg = err.toString();
    if (msg.includes('Error:')) {
      return msg.split('Error:')[1].trim();
    }
    return msg;
  }
}

/**
 * 预测 Cron 表达式接下来 N 次的具体执行时间
 */
export function predictNextRuns(expression: string, count: number = 5): string[] {
  if (!expression || !expression.trim()) {
    return [];
  }
  try {
    const options = {
      currentDate: new Date()
    };
    const interval = CronExpressionParser.parse(expression.trim(), options);
    const runs = interval.take(count);
    return runs.map(run => formatDateTime(run.toDate()));
  } catch (err: any) {
    throw new Error(err.message || '无效的 Cron 表达式');
  }
}

/**
 * 时间格式化辅助函数
 */
function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
