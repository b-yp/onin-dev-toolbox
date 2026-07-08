import YAML from 'yaml';

/**
 * 将 YAML 字符串转换为 JSON 字符串
 * @param yamlStr 原始 YAML 字符串
 * @param jsonIndent JSON 缩进：数字（空格数）或 '\\t' 或 0（压缩一行）
 */
export function convertYamlToJson(yamlStr: string, jsonIndent: number | string = 2): string {
  const trimmed = (yamlStr || '').trim();
  if (!trimmed) return '';

  try {
    const parsedObj = YAML.parse(trimmed);
    
    // 如果解析出的是基础类型（例如仅输入普通纯文本 "hello" 且没有结构），
    // 也要能转为 JSON。
    const indent = jsonIndent === 0 ? undefined : jsonIndent;
    return JSON.stringify(parsedObj, null, indent);
  } catch (err: any) {
    // 抛出有参考意义的错误信息，包括语法错位置
    throw new Error(err.message || '无效的 YAML 语法');
  }
}

/**
 * 将 JSON 字符串转换为 YAML 字符串
 * @param jsonStr 原始 JSON 字符串
 * @param yamlIndent YAML 缩进空格数，默认为 2
 */
export function convertJsonToYaml(jsonStr: string, yamlIndent: number = 2): string {
  const trimmed = (jsonStr || '').trim();
  if (!trimmed) return '';

  try {
    const parsedObj = JSON.parse(trimmed);
    return YAML.stringify(parsedObj, {
      indent: yamlIndent,
      // 保持最佳兼容性
      lineWidth: 0 // 禁用自动换行对长文字的强制折行
    });
  } catch (err: any) {
    throw new Error(err.message || '无效的 JSON 语法');
  }
}
