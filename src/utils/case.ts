/**
 * 强健的文本分词器，提取出纯单词小写数组
 * @param str 输入的文本
 */
export function tokenize(str: string): string[] {
  if (!str) return [];
  
  // 1. 将驼峰（小写接大写，数字接大写，大写接大写但后跟小写）用空格断开
  const formatted = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  
  // 2. 匹配所有的英文单词和数字
  const words = formatted.match(/[a-zA-Z0-9]+/g);
  if (!words) return [];
  
  // 3. 统一转换为小写返回
  return words.map(w => w.toLowerCase());
}

/**
 * 转换为 camelCase (小驼峰)
 */
export function toCamelCase(words: string[]): string {
  if (words.length === 0) return '';
  return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/**
 * 转换为 PascalCase (大驼峰)
 */
export function toPascalCase(words: string[]): string {
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/**
 * 转换为 snake_case (蛇形命名)
 */
export function toSnakeCase(words: string[]): string {
  return words.join('_');
}

/**
 * 转换为 kebab-case (中划线命名)
 */
export function toKebabCase(words: string[]): string {
  return words.join('-');
}

/**
 * 转换为 CONSTANT_CASE (常量命名)
 */
export function toConstantCase(words: string[]): string {
  return words.map(w => w.toUpperCase()).join('_');
}

/**
 * 转换为 Title Case (首字母大写)
 */
export function toTitleCase(words: string[]): string {
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
