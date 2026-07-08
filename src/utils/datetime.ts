/**
 * 格式化 Date 为 YYYY-MM-DD HH:mm:ss 格式的本地时间字符串
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * 将时间戳转为本地时间格式的字符串
 * @param ts 时间戳字符串或数字
 * @param unit 单位：'s'（秒）或 'ms'（毫秒）
 */
export function timestampToDate(ts: string | number, unit: 's' | 'ms'): string {
  const val = typeof ts === 'string' ? parseInt(ts, 10) : ts;
  if (isNaN(val)) throw new Error('无效的时间戳');
  
  const date = unit === 's' ? new Date(val * 1000) : new Date(val);
  if (isNaN(date.getTime())) throw new Error('无效的时间戳');
  return formatDate(date);
}

/**
 * 将本地日期时间字符串转为秒与毫秒级时间戳
 * @param dateStr 日期时间字符串 (例如 "2026-07-08 10:00:00")
 */
export function dateToTimestamp(dateStr: string): { s: string; ms: string } {
  if (!dateStr) throw new Error('日期字符串不能为空');
  const date = new Date(dateStr.replace(/-/g, '/')); // 替换连字符保证跨浏览器/Node 环境更好的兼容性
  if (isNaN(date.getTime())) throw new Error('无效的日期格式');
  
  return {
    s: Math.floor(date.getTime() / 1000).toString(),
    ms: date.getTime().toString()
  };
}
