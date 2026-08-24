# GamePulse

GamePulse 是一个面向多人游戏的遥测与竞技数据平台：游戏客户端通过批量 API 上报事件，服务端完成验证、幂等去重和持久化，再向运营仪表盘与排行榜提供查询能力。

> 求职定位：Python 后端 / 软件开发工程师。这个仓库不是单纯的可视化页面，核心是可测试的 FastAPI 服务、事务边界、幂等写入和排名领域逻辑。

## Online demo

部署中的仪表盘使用 React/Vinext + Cloudflare D1，提供与 Python 服务一致的核心 API 契约。Python/FastAPI 是便于独立部署和面试讲解的主后端实现。

## Architecture

```text
Game client / SDK
        │  POST /api/v1/events/batch
        ▼
FastAPI validation ── API key boundary
        │
        ├── idempotency key + transaction
        ├── telemetry event store
        └── Elo ranking projection
                         │
                         ▼
                Operations dashboard
```

## Engineering highlights

- 幂等事件摄取：`Idempotency-Key` 对请求结果做持久化缓存，重试不会产生重复事件。
- 明确事务边界：`BEGIN IMMEDIATE` 将“幂等检查—事件写入—结果落库”放在同一写事务中。
- 领域逻辑隔离：Elo 更新与稳定事件 ID 是无副作用函数，可独立单元测试。
- API 防护：API Key、Pydantic 校验、批量大小上限和分页上限。
- 在线 Demo 默认关闭外部批量写入，并限制每日模拟写入量，避免公开演示数据库被滥用。
- 可交付工程：Dockerfile、GitHub Actions、SQLite 索引、健康检查、自动生成 OpenAPI 文档。
- 双运行时演示：FastAPI 适合常规容器部署；公开 Dashboard 使用 Worker + D1 以获得低运维在线体验。

## Run the Python API

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
$env:GAMEPULSE_API_KEY = "change-me"
.venv\Scripts\python -m uvicorn gamepulse.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the interactive API documentation.

```powershell
$headers = @{ "X-API-Key" = "change-me"; "Idempotency-Key" = "demo-001" }
$body = '{"events":[{"type":"session.started","playerId":"p-1001","payload":{"build":"1.4.2"}}]}'
Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/v1/events/batch -Headers $headers -ContentType application/json -Body $body
```

## Run the dashboard

Requires Node.js 24+ and pnpm.

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

## Quality checks

```powershell
pnpm lint
pnpm build
cd backend
.venv\Scripts\python -m pytest -q
```

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Liveness and version |
| `POST` | `/api/v1/events/batch` | Idempotent batch ingestion |
| `GET` | `/api/v1/leaderboard` | Ranked player projection |
| `POST` | `/api/v1/matches/simulate` | Demo match and Elo update |

## Trade-offs and next steps

SQLite/D1 让演示环境简单可靠，但单主写入不适合极高写吞吐。生产演进路线是：API 先将事件写入 Kafka/Pulsar，消费端批量落入 ClickHouse，玩家与赛季状态保留在 PostgreSQL/Redis；幂等键增加 TTL，API Key 改为 OAuth2/JWT，并补充 OpenTelemetry、限流和压测基线。

面试讲解与简历措辞见 [`docs/interview-guide.zh-CN.md`](docs/interview-guide.zh-CN.md)。

