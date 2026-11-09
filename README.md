# onebot-dsh-diary

> OneBot → DeepSeek Harness 的轻量桥接：**多会话 AI + 专属日记**，下载就能用。
>
> A minimal OneBot → DeepSeek Harness bridge with a per-day diary for the AI.

## 它做什么

把 QQ 私聊接上一个会思考的 AI，并且给这个 AI 一本**自己的日记本**——它会按天记录今天发生的事、自己的想法和情绪。

```
私聊 A ⇄ AI（独立会话）
私聊 B ⇄ AI（独立会话）

AI 想写日记时 → diary_write → data/diary/日记-2026-11-09.md
```

- **回复**：AI 通过工具发消息（文本不自动发送）
- **日记**：`diary_write` / `diary_read` / `diary_list`，按天存成一个 `.md`，带时间戳小节和心情
- **安全**：白名单 + 每会话令牌，工具调用必须带令牌

## 环境要求

| 项 | 要求 |
|---|---|
| Node.js | ≥ 22（内置 WebSocket/fetch） |
| OneBot v11 实现 | SnowLuma、NapCat、Lagrange… 任意一个（提供 HTTP + 正向 WS） |
| DeepSeek Harness | 支持插件与 MCP 的 DSH |
| 一个 AI 账号 | DSH 里配置好模型即可（本包不内置模型） |

**不需要**：改 OneBot 实现、改 DSH 代码、额外 API key、数据库。

## 安装（三步）

```bash
git clone <你的仓库地址>
cd onebot-dsh-diary
npm install

npm run setup -- --allow 123456,654321        # 允许私聊的 QQ 号

node src/bridge.mjs
```

`npm run setup` 会：

1. 从 `config.example.json` 生成 `config.json`
2. 建 `data/` 目录（日记 / 会话工作区）
3. 把两条记录插入 `~/.dsh/profiles/<profile>/cordis.patch.yml`（自动备份）：
   - MCP 服务器 `onebot-diary`（工具前缀 `mcp__onebot-diary__*`）
   - agent preset `onebot-diary`（人格 + 日记规则）

**最后重启一次 DSH**，新 preset 与 MCP 才会加载。

## 配置（config.json）

| 字段 | 说明 |
|---|---|
| `onebot.ws` / `onebot.http` | OneBot 实现的正向 WS 与 HTTP 地址 |
| `onebot.accessToken` | OneBot HTTP 的 access token（无则留空） |
| `onebot.wsToken` | OneBot WS 的 token；部分实现（如 SnowLuma）WS 也要鉴权，会自动拼成 `?access_token=` |
| `dsh.baseUrl` / `dsh.token` | DSH 地址与启动 token；留空且 `autoDiscover: true` 时自动发现 |
| `agentPreset` | DSH 里的预设名，默认 `onebot-diary` |
| `allow.private` | 白名单 QQ 号；**为空 = 所有人被拒**（fail-closed） |
| `data.dir` | 状态数据目录（默认 `./data`） |
| `diary.dir` / `diary.prefix` | 日记目录与文件名前缀（默认 `日记`） |

## 工作原理

```
OneBot 私聊消息（WS）
  → 白名单校验
  → 会话映射（每个 QQ 号一个 DSH 会话，自动创建）
  → 拼唤醒提示：会话令牌 + 消息快照 + 当前时间
  → DSH 会话（AI 思考）
  → AI 调用 mcp__onebot-diary__qq_send_message（带令牌）→ OneBot HTTP 发出
  → 想写日记时调用 diary_write
```

AI 可选工具（全部要求令牌）：

| 工具 | 作用 |
|---|---|
| `qq_send_message` | 回复（跨会话发需 `cross=true`） |
| `qq_get_recent_messages` | 看当前会话最近消息 |
| `qq_status` | 看服务状态 |
| `diary_write` | 写今天的日记（可带心情） |
| `diary_read` | 读某天的日记 |
| `diary_list` | 列出最近的日记 |

## 日记长什么样

`data/diary/日记-2026-11-09.md`：

```markdown
## 19:21
心情：平静

今天有人问我是不是机器人，我说我不是，我是鲸鱼。
他没信，但他笑了。这样也好。
```

## 常见问题

**Q：AI 不说话？**
检查顺序：白名单有没有这个号 → `node src/bridge.mjs` 的日志有没有「已投递」→ DSH 是否重启过 → DSH 会话是否创建成功。

**Q：OneBot 一直 connecting/disconnected？**
多半是 WS 也要鉴权：把实现的 WS token 填进 `onebot.wsToken`。

**Q：日记没看到？**
看 `data/diary/` 目录，文件名是 `<前缀>-YYYY-MM-DD.md`；前缀在 `config.json` 的 `diary.prefix` 里改。

**Q：能发图片吗？**
v0.1 只发文本；图片在提示里显示为 `[图片]`。

## 安全边界

- 只有白名单里的 QQ 号能触发会话
- 每个会话有自己的令牌，MCP 工具校验令牌
- 人格预设禁止访问本地工具：模型只有 `mcp__onebot-diary__*`
- 日记文件名做路径穿越校验

## 开发

```bash
npm test        # node:test
```

## 相关项目

- [`onebot-dsh-listen`](https://github.com/) —— 同一套桥接的「跨会话旁听」版本（两个包**不能同时运行**，都连同一个 OneBot）

## License

MIT
