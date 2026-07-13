import { describe, it, expect } from 'vitest';
import { parseShellArgs, dockerRunToCompose, composeToDockerRun } from '../src/utils/dockerParser';

describe('Docker ↔ Compose 转换器测试', () => {
  describe('parseShellArgs', () => {
    it('正确解析简单的空格分隔命令', () => {
      const cmd = 'docker run -d nginx:latest';
      expect(parseShellArgs(cmd)).toEqual(['docker', 'run', '-d', 'nginx:latest']);
    });

    it('正确合并 shell 反斜杠换行折行', () => {
      const cmd = `docker run -d \\
        --name web \\
        -p 8080:80 \\
        nginx:latest`;
      expect(parseShellArgs(cmd)).toEqual([
        'docker', 'run', '-d',
        '--name', 'web',
        '-p', '8080:80',
        'nginx:latest'
      ]);
    });

    it('正确处理单双引号包裹的空格内容且剥离外层引号', () => {
      const cmd = `docker run -e "MYSQL_ROOT_PASSWORD=my password" -v '/home/user/my folder:/data' mysql`;
      expect(parseShellArgs(cmd)).toEqual([
        'docker', 'run',
        '-e', 'MYSQL_ROOT_PASSWORD=my password',
        '-v', '/home/user/my folder:/data',
        'mysql'
      ]);
    });

    it('支持包含转义字符的反斜杠处理', () => {
      const cmd = 'docker run --name foo \\"bar\\"';
      // 注意：我们在 tokenizer 中对不在单引号内的反斜杠处理是：转义下一个字符
      // 所以 \\" 实际上剥离了反斜杠，保留了 "
      // \本身做转义时，\\" 会变成 "
      expect(parseShellArgs(cmd)).toEqual(['docker', 'run', '--name', 'foo', '"bar"']);
    });
  });

  describe('dockerRunToCompose (Docker Run ➔ Compose)', () => {
    it('应正确转换简单的 docker run 命令', () => {
      const cmd = 'docker run -d --name my-web nginx:alpine';
      const yaml = dockerRunToCompose(cmd);
      
      expect(yaml).toContain('version: "3.8"');
      expect(yaml).toContain('services:');
      expect(yaml).toContain('my-web:');
      expect(yaml).toContain('image: nginx:alpine');
      expect(yaml).toContain('container_name: my-web');
    });

    it('应正确处理带有大量参数的复杂 docker run 命令', () => {
      const cmd = `docker run -d --name db-service \\
        -p 3306:3306 -p 33060:33060 \\
        -v mysql_data:/var/lib/mysql -v /host/path:/container/path:ro \\
        -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=mydb \\
        --env-file .env \\
        --restart always \\
        --network my-net \\
        -w /app \\
        --privileged \\
        --expose 8080 \\
        -h db-host \\
        -m 1g \\
        --cpu-shares 512 \\
        mysql:8.0`;
      
      const yaml = dockerRunToCompose(cmd);

      expect(yaml).toContain('container_name: db-service');
      expect(yaml).toContain('image: mysql:8.0');
      expect(yaml).toContain('ports:\n      - 3306:3306\n      - 33060:33060');
      expect(yaml).toContain('volumes:\n      - mysql_data:/var/lib/mysql\n      - /host/path:/container/path:ro');
      expect(yaml).toContain('environment:\n      - MYSQL_ROOT_PASSWORD=secret\n      - MYSQL_DATABASE=mydb');
      expect(yaml).toContain('env_file: .env');
      expect(yaml).toContain('restart: always');
      expect(yaml).toContain('networks:\n      - my-net');
      expect(yaml).toContain('working_dir: /app');
      expect(yaml).toContain('privileged: true');
      expect(yaml).toContain('expose:\n      - "8080"');
      expect(yaml).toContain('hostname: db-host');
      expect(yaml).toContain('mem_limit: 1g');
      expect(yaml).toContain('cpu_shares: 512');
    });

    it('应当能识别多行并且转换出多个 service', () => {
      const cmd = `
        docker run -d --name web -p 80:80 nginx:latest
        docker run -d --name db -e PASSWORD=123 redis:6
      `;
      const yaml = dockerRunToCompose(cmd);

      expect(yaml).toContain('web:');
      expect(yaml).toContain('image: nginx:latest');
      expect(yaml).toContain('db:');
      expect(yaml).toContain('image: redis:6');
      expect(yaml).toContain('PASSWORD=123');
    });

    it('非法没有镜像的输入应抛出错误', () => {
      const cmd = 'docker run -d --name only-name';
      expect(() => dockerRunToCompose(cmd)).toThrowError();
    });
  });

  describe('composeToDockerRun (Compose ➔ Docker Run)', () => {
    it('应正确转换单个服务的 Compose YML', () => {
      const yaml = `version: "3"
services:
  web-app:
    image: nginx:latest
    container_name: custom-nginx
    ports:
      - "8080:80"
    volumes:
      - /host/path:/container/path
    environment:
      - NODE_ENV=production
      - PORT=80
    restart: unless-stopped`;

      const cmd = composeToDockerRun(yaml, { format: 'single', detach: true });
      expect(cmd).toContain('docker run -d');
      expect(cmd).toContain('--name custom-nginx');
      expect(cmd).toContain('-p 8080:80');
      expect(cmd).toContain('-v /host/path:/container/path');
      expect(cmd).toContain('-e NODE_ENV=production');
      expect(cmd).toContain('-e PORT=80');
      expect(cmd).toContain('--restart unless-stopped');
      expect(cmd).toContain('nginx:latest');
    });

    it('支持生成不同操作系统的折行格式', () => {
      const yaml = `services:
  web:
    image: alpine
    container_name: test-env
    environment:
      KEY: val`;

      const bashCmd = composeToDockerRun(yaml, { format: 'bash' });
      expect(bashCmd).toContain('docker run -d \\\n  --name test-env \\\n  -e KEY=val \\\n  alpine');

      const cmdCmd = composeToDockerRun(yaml, { format: 'cmd' });
      expect(cmdCmd).toContain('docker run -d ^\n  --name test-env ^\n  -e KEY=val ^\n  alpine');

      const psCmd = composeToDockerRun(yaml, { format: 'powershell' });
      expect(psCmd).toContain('docker run -d `\n  --name test-env `\n  -e KEY=val `\n  alpine');
    });

    it('多服务应生成多条命令且以空行分隔', () => {
      const yaml = `
        services:
          web:
            image: nginx
          db:
            image: redis
      `;

      const cmd = composeToDockerRun(yaml, { format: 'single' });
      const lines = cmd.split('\n\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('nginx');
      expect(lines[1]).toContain('redis');
    });
  });
});
