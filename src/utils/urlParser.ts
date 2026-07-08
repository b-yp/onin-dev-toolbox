export interface QueryParamItem {
  key: string;
  value: string;
  active: boolean;
}

export interface ParsedUrlStructure {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  params: QueryParamItem[];
  isRelative: boolean;       // 是否是相对路径片段
  hadNoProtocol: boolean;    // 是否原本是没有协议的完整地址 (如 example.com/path)
}

/**
 * 容错型 URL 拆解解析函数
 */
export function parseUrlString(urlInput: string): ParsedUrlStructure {
  const result: ParsedUrlStructure = {
    protocol: '',
    hostname: '',
    port: '',
    pathname: '',
    hash: '',
    params: [],
    isRelative: false,
    hadNoProtocol: false
  };

  const trimmed = (urlInput || '').trim();
  if (!trimmed) return result;

  let urlInstance: URL | null = null;
  let isRelative = false;
  let hadNoProtocol = false;

  // 1. 尝试直接作为完整 URL 解析
  try {
    urlInstance = new URL(trimmed);
  } catch (_) {
    // 2. 检查是否为无协议的主机地址 (例如 example.com/path)
    if (/^[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}(?:\/|$)/.test(trimmed)) {
      try {
        urlInstance = new URL('http://' + trimmed);
        hadNoProtocol = true;
      } catch (_) {
        urlInstance = null;
      }
    }
  }

  // 3. 兜底为相对路径 (例如 /pathname?q=1 或者是 ?q=1)
  if (!urlInstance) {
    try {
      // 附加占位 BaseURL
      urlInstance = new URL(trimmed, 'http://placeholder.internal');
      isRelative = true;
    } catch (_) {
      return result;
    }
  }

  // 提取基本字段
  result.isRelative = isRelative;
  result.hadNoProtocol = hadNoProtocol;

  if (!isRelative) {
    result.protocol = urlInstance.protocol;
    result.hostname = urlInstance.hostname;
    result.port = urlInstance.port;
  }
  
  result.pathname = urlInstance.pathname;
  result.hash = urlInstance.hash;

  // 提取查询参数
  const params: QueryParamItem[] = [];
  urlInstance.searchParams.forEach((value, key) => {
    params.push({
      key,
      value,
      active: true // 默认解析出来的都是生效的
    });
  });
  result.params = params;

  return result;
}

/**
 * URL 重构组装函数 (实时双向联动拼接)
 */
export function reconstructUrlString(structure: ParsedUrlStructure): string {
  // 1. 组装参数查询字符串
  const activeParams = (structure.params || []).filter(p => p.active);
  let searchStr = '';
  if (activeParams.length > 0) {
    const searchParams = new URLSearchParams();
    activeParams.forEach(p => {
      searchParams.append(p.key, p.value);
    });
    searchStr = '?' + searchParams.toString();
  }

  // 2. 组装哈希
  let hashStr = structure.hash || '';
  if (hashStr && !hashStr.startsWith('#')) {
    hashStr = '#' + hashStr;
  }

  // 3. 如果是相对路径，只拼装 pathname, search & hash
  if (structure.isRelative) {
    let path = structure.pathname || '';
    // 如果没有任何相对路径但有查询参数，我们必须保持首字符是 / 或者为空。
    // 比如仅输入 ?q=1，pathname 是 /，拼接后是 /?q=1
    return `${path}${searchStr}${hashStr}`;
  }

  // 4. 拼装完整 URL
  let proto = structure.protocol || 'https:';
  if (proto && !proto.endsWith(':')) {
    proto += ':';
  }

  let host = structure.hostname || '';
  if (structure.port) {
    host += ':' + structure.port;
  }

  // 恢复无协议地址
  if (structure.hadNoProtocol && structure.protocol === 'http:') {
    return `${host}${structure.pathname}${searchStr}${hashStr}`;
  }

  // 如果原本是有协议或修改后有了域名
  if (host) {
    return `${proto}//${host}${structure.pathname}${searchStr}${hashStr}`;
  }

  // 兜底相对路径
  return `${structure.pathname}${searchStr}${hashStr}`;
}
