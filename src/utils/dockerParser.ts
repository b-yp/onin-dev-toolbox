import YAML from 'yaml';

/**
 * 将 Shell 命令行参数拆分为独立的 Token 数组，支持引号、转义字符以及转义折行
 * @param commandStr 原始命令字符串
 */
export function parseShellArgs(commandStr: string): string[] {
  // 1. 合并 shell 中的转义折行 (即 \ 后面直接跟换行)
  const cleaned = commandStr.replace(/\\\r?\n/g, ' ');
  
  const tokens: string[] = [];
  let currentToken = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let isEscaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (isEscaped) {
      currentToken += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      if (inSingleQuote) {
        // 单引号中反斜杠就是普通字符
        currentToken += char;
      } else {
        isEscaped = true;
      }
      continue;
    }

    if (char === "'") {
      if (inDoubleQuote) {
        // 双引号中单引号就是普通字符
        currentToken += char;
      } else {
        inSingleQuote = !inSingleQuote;
      }
      continue;
    }

    if (char === '"') {
      if (inSingleQuote) {
        // 单引号中双引号就是普通字符
        currentToken += char;
      } else {
        inDoubleQuote = !inDoubleQuote;
      }
      continue;
    }

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      if (inSingleQuote || inDoubleQuote) {
        currentToken += char;
      } else {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
      }
      continue;
    }

    currentToken += char;
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
}

export interface DockerRunOptions {
  // 生成 docker run 命令的折行风格
  format?: 'single' | 'bash' | 'cmd' | 'powershell';
  // 是否默认添加 -d 后台运行标志
  detach?: boolean;
}

/**
 * 解析 docker run 命令并转换为 Docker Compose YAML 字符串
 * @param dockerCommands 包含一条或多条 docker run 命令行
 */
export function dockerRunToCompose(dockerCommands: string): string {
  const normalized = (dockerCommands || '').trim();
  if (!normalized) return '';

  // 识别可能的多条 docker run 命令
  // 我们简单以 "docker run" 或者 "docker create" 进行切分
  // 也可以通过找出所有匹配的关键字位置来分割
  const matches = [...normalized.matchAll(/\bdocker\s+(run|create)\b/g)];
  const commandSections: string[] = [];

  if (matches.length === 0) {
    // 尝试如果没有 docker run 关键字，直接当做一条命令参数处理
    commandSections.push(normalized);
  } else {
    for (let j = 0; j < matches.length; j++) {
      const startIdx = matches[j].index!;
      const endIdx = j < matches.length - 1 ? matches[j + 1].index! : normalized.length;
      commandSections.push(normalized.substring(startIdx, endIdx));
    }
  }

  const services: Record<string, any> = {};

  for (const cmdSection of commandSections) {
    const tokens = parseShellArgs(cmdSection);
    if (tokens.length === 0) continue;

    // 寻找 run / create 的起点以忽略前置垃圾字符
    let startTokenIdx = tokens.findIndex(t => t === 'run' || t === 'create');
    if (startTokenIdx === -1) {
      // 找不到就从 0 开始
      startTokenIdx = -1;
    }

    let i = startTokenIdx + 1;

    let containerName = '';
    let image = '';
    const ports: string[] = [];
    const volumes: string[] = [];
    const environment: string[] = [];
    const envFiles: string[] = [];
    const networks: string[] = [];
    let restart = '';
    let workdir = '';
    let entrypoint = '';
    let user = '';
    let privileged = false;
    let tty = false;
    let stdinOpen = false;
    const expose: string[] = [];
    const labels: string[] = [];
    const links: string[] = [];
    let cpuShares: number | null = null;
    let memory: string | null = null;
    let hostname = '';
    const extraHosts: string[] = [];
    const capAdd: string[] = [];
    const capDrop: string[] = [];
    let command: string[] = [];

    while (i < tokens.length) {
      const token = tokens[i];

      // 如果不是以 - 开头，说明遇到了镜像名 (Image)
      if (!token.startsWith('-')) {
        image = token;
        // 镜像名后面的所有 token 都是容器启动运行的命令 (Command)
        command = tokens.slice(i + 1);
        break;
      }

      // 处理参数
      if (token === '--name') {
        containerName = tokens[++i];
      } else if (token === '-p' || token === '--publish') {
        ports.push(tokens[++i]);
      } else if (token === '-v' || token === '--volume') {
        volumes.push(tokens[++i]);
      } else if (token === '-e' || token === '--env') {
        environment.push(tokens[++i]);
      } else if (token === '--env-file') {
        envFiles.push(tokens[++i]);
      } else if (token === '--network' || token === '--net') {
        networks.push(tokens[++i]);
      } else if (token === '--restart') {
        restart = tokens[++i];
      } else if (token === '-w' || token === '--workdir') {
        workdir = tokens[++i];
      } else if (token === '--entrypoint') {
        entrypoint = tokens[++i];
      } else if (token === '-u' || token === '--user') {
        user = tokens[++i];
      } else if (token === '--expose') {
        expose.push(tokens[++i]);
      } else if (token === '-l' || token === '--label') {
        labels.push(tokens[++i]);
      } else if (token === '--link') {
        links.push(tokens[++i]);
      } else if (token === '--cpu-shares') {
        cpuShares = parseInt(tokens[++i], 10);
      } else if (token === '-m' || token === '--memory') {
        memory = tokens[++i];
      } else if (token === '-h' || token === '--hostname') {
        hostname = tokens[++i];
      } else if (token === '--add-host') {
        extraHosts.push(tokens[++i]);
      } else if (token === '--cap-add') {
        capAdd.push(tokens[++i]);
      } else if (token === '--cap-drop') {
        capDrop.push(tokens[++i]);
      } else if (token === '--privileged') {
        privileged = true;
      } else if (token === '-t' || token === '--tty') {
        tty = true;
      } else if (token === '-i' || token === '--interactive') {
        stdinOpen = true;
      } else if (token.startsWith('-') && !token.startsWith('--')) {
        // 处理组合短参数如 -itd, -d 等
        const chars = token.slice(1);
        let hasValueOption = false;

        for (let cIdx = 0; cIdx < chars.length; cIdx++) {
          const c = chars[cIdx];
          if (c === 'd') {
            // detach compose 默认
          } else if (c === 't') {
            tty = true;
          } else if (c === 'i') {
            stdinOpen = true;
          } else if (c === 'p' || c === 'v' || c === 'e' || c === 'w' || c === 'u' || c === 'm' || c === 'h') {
            // 这些是带值选项，如果是组合参数的最后一个，可以直接获取下一个 token
            if (cIdx === chars.length - 1) {
              const val = tokens[++i];
              if (c === 'p') ports.push(val);
              else if (c === 'v') volumes.push(val);
              else if (c === 'e') environment.push(val);
              else if (c === 'w') workdir = val;
              else if (c === 'u') user = val;
              else if (c === 'm') memory = val;
              else if (c === 'h') hostname = val;
              hasValueOption = true;
            }
          }
        }
        if (hasValueOption) {
          // 已经消费了下一个 token
        }
      }
      i++;
    }

    if (!image) continue;

    // 清洗服务名，如果不提供容器名，则根据镜像名生成
    let serviceKey = containerName;
    if (!serviceKey) {
      // 去除镜像的 tag 和 registry 域
      const parts = image.split('/');
      const baseImage = parts[parts.length - 1];
      serviceKey = baseImage.split(':')[0] || 'web';
    }
    // 移除非法字符，保证 YAML 服务键名合法
    serviceKey = serviceKey.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

    // 确保服务名不重复
    let uniqueServiceKey = serviceKey;
    let suffix = 1;
    while (services[uniqueServiceKey]) {
      uniqueServiceKey = `${serviceKey}-${suffix++}`;
    }

    const serviceDef: Record<string, any> = { image };

    if (containerName) serviceDef.container_name = containerName;
    if (ports.length > 0) serviceDef.ports = ports;
    if (volumes.length > 0) serviceDef.volumes = volumes;
    
    if (environment.length > 0) {
      serviceDef.environment = environment;
    }
    if (envFiles.length > 0) {
      serviceDef.env_file = envFiles.length === 1 ? envFiles[0] : envFiles;
    }
    if (networks.length > 0) {
      // 默认将网络列表直接映射到 networks 中
      serviceDef.networks = networks;
    }
    if (restart) serviceDef.restart = restart;
    if (workdir) serviceDef.working_dir = workdir;
    if (entrypoint) serviceDef.entrypoint = entrypoint;
    if (user) serviceDef.user = user;
    if (privileged) serviceDef.privileged = true;
    if (tty) serviceDef.tty = true;
    if (stdinOpen) serviceDef.stdin_open = true;
    if (expose.length > 0) serviceDef.expose = expose;
    
    if (labels.length > 0) {
      serviceDef.labels = labels;
    }
    if (links.length > 0) serviceDef.links = links;
    
    if (cpuShares !== null) serviceDef.cpu_shares = cpuShares;
    if (memory) serviceDef.mem_limit = memory;
    if (hostname) serviceDef.hostname = hostname;
    if (extraHosts.length > 0) serviceDef.extra_hosts = extraHosts;
    if (capAdd.length > 0) serviceDef.cap_add = capAdd;
    if (capDrop.length > 0) serviceDef.cap_drop = capDrop;

    if (command.length > 0) {
      serviceDef.command = command;
    }

    services[uniqueServiceKey] = serviceDef;
  }

  if (Object.keys(services).length === 0) {
    throw new Error('未识别到有效的 docker run 镜像或命令');
  }

  return YAML.stringify({
    version: '3.8',
    services
  }, { indent: 2 });
}

/**
 * 将 Docker Compose 配置对象转换为多条或单条 docker run 命令
 * @param composeYaml docker-compose.yml 的配置文本
 * @param options 转换参数，如折行风格等
 */
export function composeToDockerRun(composeYaml: string, options: DockerRunOptions = {}): string {
  const { format = 'bash', detach = true } = options;
  const trimmed = (composeYaml || '').trim();
  if (!trimmed) return '';

  let parsed: any;
  try {
    parsed = YAML.parse(trimmed);
  } catch (err: any) {
    throw new Error(`YAML 解析错误: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('无效的 YAML 结构');
  }

  const services = parsed.services;
  if (!services || typeof services !== 'object') {
    throw new Error('未找到 services 声明，请检查 Compose 文件格式');
  }

  const runCommands: string[] = [];

  // 获取折行连接符
  let lineContinuation = ' ';
  if (format === 'bash') lineContinuation = ' \\\n  ';
  else if (format === 'cmd') lineContinuation = ' ^\n  ';
  else if (format === 'powershell') lineContinuation = ' `\n  ';

  for (const [serviceKey, service] of Object.entries(services)) {
    if (!service || typeof service !== 'object') continue;

    const parts: string[] = [detach ? 'docker run -d' : 'docker run'];

    // 2. container_name
    const s = service as any;
    const name = s.container_name || serviceKey;
    parts.push(`--name ${name}`);

    // 3. restart
    if (s.restart) {
      parts.push(`--restart ${s.restart}`);
    }

    // 4. privileged
    if (s.privileged) {
      parts.push('--privileged');
    }

    // 5. tty / stdin_open
    if (s.tty) {
      parts.push('-t');
    }
    if (s.stdin_open) {
      parts.push('-i');
    }

    // 6. working_dir
    if (s.working_dir) {
      parts.push(`-w ${s.working_dir}`);
    }

    // 7. user
    if (s.user) {
      parts.push(`-u ${s.user}`);
    }

    // 8. hostname
    if (s.hostname) {
      parts.push(`-h ${s.hostname}`);
    }

    // 9. entrypoint
    if (s.entrypoint) {
      if (Array.isArray(s.entrypoint)) {
        parts.push(`--entrypoint "${s.entrypoint.join(' ')}"`);
      } else {
        parts.push(`--entrypoint "${s.entrypoint}"`);
      }
    }

    // 10. ports
    if (Array.isArray(s.ports)) {
      for (const p of s.ports) {
        parts.push(`-p ${p}`);
      }
    }

    // 11. volumes
    if (Array.isArray(s.volumes)) {
      for (const v of s.volumes) {
        // 如果有空格，用引号包裹
        if (v.includes(' ')) {
          parts.push(`-v "${v}"`);
        } else {
          parts.push(`-v ${v}`);
        }
      }
    }

    // 12. environment
    if (s.environment) {
      if (Array.isArray(s.environment)) {
        for (const env of s.environment) {
          parts.push(`-e ${env}`);
        }
      } else if (typeof s.environment === 'object') {
        for (const [k, v] of Object.entries(s.environment)) {
          if (v === null || v === undefined) {
            parts.push(`-e ${k}`);
          } else {
            parts.push(`-e ${k}=${v}`);
          }
        }
      }
    }

    // 13. env_file
    if (s.env_file) {
      if (Array.isArray(s.env_file)) {
        for (const ef of s.env_file) {
          parts.push(`--env-file ${ef}`);
        }
      } else {
        parts.push(`--env-file ${s.env_file}`);
      }
    }

    // 14. networks
    if (s.network_mode) {
      parts.push(`--network ${s.network_mode}`);
    } else if (Array.isArray(s.networks)) {
      for (const net of s.networks) {
        parts.push(`--network ${net}`);
      }
    } else if (s.networks && typeof s.networks === 'object') {
      // 处理类似 networks: [webnet] 的 map 结构
      for (const net of Object.keys(s.networks)) {
        parts.push(`--network ${net}`);
      }
    }

    // 15. expose
    if (Array.isArray(s.expose)) {
      for (const exp of s.expose) {
        parts.push(`--expose ${exp}`);
      }
    }

    // 16. labels
    if (s.labels) {
      if (Array.isArray(s.labels)) {
        for (const l of s.labels) {
          parts.push(`-l ${l}`);
        }
      } else if (typeof s.labels === 'object') {
        for (const [k, v] of Object.entries(s.labels)) {
          parts.push(`-l ${k}=${v}`);
        }
      }
    }

    // 17. links
    if (Array.isArray(s.links)) {
      for (const l of s.links) {
        parts.push(`--link ${l}`);
      }
    }

    // 18. extra_hosts
    if (Array.isArray(s.extra_hosts)) {
      for (const eh of s.extra_hosts) {
        parts.push(`--add-host ${eh}`);
      }
    }

    // 19. cap_add / cap_drop
    if (Array.isArray(s.cap_add)) {
      for (const ca of s.cap_add) {
        parts.push(`--cap-add ${ca}`);
      }
    }
    if (Array.isArray(s.cap_drop)) {
      for (const cd of s.cap_drop) {
        parts.push(`--cap-drop ${cd}`);
      }
    }

    // 20. cpu_shares / mem_limit
    if (s.cpu_shares) {
      parts.push(`--cpu-shares ${s.cpu_shares}`);
    }
    if (s.mem_limit) {
      parts.push(`-m ${s.mem_limit}`);
    }

    // 21. image (必须存在)
    if (!s.image) {
      throw new Error(`服务 [${serviceKey}] 缺少 image 属性`);
    }
    parts.push(s.image);

    // 22. command
    if (s.command) {
      if (Array.isArray(s.command)) {
        parts.push(...s.command);
      } else {
        // 如果是 string，可直接当做命令
        parts.push(s.command);
      }
    }

    // 组合成命令行
    const cmdStr = parts.join(lineContinuation);
    runCommands.push(cmdStr);
  }

  return runCommands.join('\n\n');
}
