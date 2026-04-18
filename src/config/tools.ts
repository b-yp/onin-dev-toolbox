export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
}

export type ToolCategory = 'Transform' | 'Security' | 'Text' | 'Network' | 'Favorites';

export const TOOLS: Tool[] = [
  {
    id: 'json-format',
    name: 'JSON 格式化',
    description: '整理、校验及美化 JSON 数据',
    icon: 'JSON',
    category: 'Transform'
  },
  {
    id: 'base64',
    name: 'Base64 转换',
    description: '文本与 Base64 编码的相互转换',
    icon: 'B64',
    category: 'Transform'
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: 'Unix 时间戳与本地时间的互转',
    icon: 'TS',
    category: 'Transform'
  },
  {
    id: 'md5',
    name: 'MD5 加密',
    description: '计算字符串的 MD5 哈希值',
    icon: 'MD5',
    category: 'Security'
  },
  {
    id: 'sha256',
    name: 'SHA256 加密',
    description: '生成安全的 SHA256 哈希散列',
    icon: 'SHA',
    category: 'Security'
  },
  {
    id: 'jwt-decode',
    name: 'JWT 解码',
    description: '解析及查看 JWT 令牌内容',
    icon: 'JWT',
    category: 'Security'
  },
  {
    id: 'regex-test',
    name: '正则测试',
    description: '实时调试及验证正则表达式',
    icon: 'RE',
    category: 'Text'
  },
  {
    id: 'case-convert',
    name: '大小写转换',
    description: '快速切换文本的大小写格式',
    icon: 'Aa',
    category: 'Text'
  },
  {
    id: 'url-encode',
    name: 'URL 编解码',
    description: '对 URL 进行安全编码及解码',
    icon: 'URL',
    category: 'Network'
  },
  {
    id: 'uuid-generator',
    name: 'UUID 生成器',
    description: '生成通用唯一识别码 (v4)',
    icon: 'ID',
    category: 'Security'
  }
];

export const CATEGORIES: { id: ToolCategory | 'All'; name: string; icon: string }[] = [
  { id: 'All', name: '所有工具', icon: '📱' },
  { id: 'Favorites', name: '收藏夹', icon: '⭐' },
  { id: 'Transform', name: '数据转换', icon: '🔄' },
  { id: 'Security', name: '加密解密', icon: '🔒' },
  { id: 'Text', name: '文本处理', icon: '📝' },
  { id: 'Network', name: '网络工具', icon: '🌐' }
];
