### MCP server

NestJS Observe exposes a read-only [MCP](https://modelcontextprotocol.io/) server, so an MCP-compatible client - Claude Code, Claude Desktop, Cursor, VS Code, or an agent you wrote yourself - can ask questions about your projects directly instead of you copying dashboard data into a prompt. Regressions, slow operations, error groups, traces, jobs, alerts: the same data the dashboard shows, scoped to exactly what you can see.

> info **Hint** MCP is one of two ways to get telemetry to an agent. The **Copy agent prompt** button (see [Dashboard](/observability/dashboard#handing-a-failure-to-a-coding-agent)) packages one page as text for a single paste; MCP is for an agent that needs to keep asking - follow a trace, check whether the error is still firing - without you relaying each answer.

The endpoint speaks Streamable HTTP at `POST https://<api-host>/mcp`. It's stateless - there's no session to open, nothing to keep alive, and no setup beyond the request itself. The exact host is shown next to your tokens in the dashboard.

#### Getting a token

Personal MCP tokens are minted in the dashboard under **MCP tokens**.

- Click **Create token**, give it a name, and optionally set an expiry. A token with no expiry never expires - MCP clients have no refresh flow.
- The secret (`omcp_...`) is shown **once**, in the response to creating it. Copy it immediately; only its hash is stored, so it cannot be retrieved again. Lost it? Revoke the token and mint another.
- Tokens act **as the user who created them**, with their exact project permissions. There is nothing to scope: if you can see it in the dashboard, the token can read it over MCP - and if you can't, neither can the token.

Revoking a token from the same page cuts it off immediately. Token management itself is dashboard-only, on purpose: an MCP token cannot mint or revoke MCP tokens, so a leaked credential can't extend its own life.

#### Connecting a client

Any client that speaks Streamable HTTP can connect: there's one URL and one header, and no OAuth dance. What differs between clients is only where the config file lives and what its keys are called.

**Claude Code**

```bash
$ claude mcp add observe --transport http https://<api-host>/mcp --header "Authorization: Bearer <token>"
```

**Claude Desktop, and other `mcpServers` clients**

```json
{
  "mcpServers": {
    "observe": {
      "url": "https://<api-host>/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

**Cursor** uses the same `mcpServers` shape in `~/.cursor/mcp.json` (every project) or `.cursor/mcp.json` (one project), and expands `${{ '{' }}env:...{{ '}' }}` inside `url` and `headers`, which is how you keep the token out of a file you might commit:

```json
{
  "mcpServers": {
    "observe": {
      "url": "https://<api-host>/mcp",
      "headers": { "Authorization": "Bearer ${env:OBSERVE_MCP_TOKEN}" }
    }
  }
}
```

**VS Code (Copilot agent mode)** uses `servers` rather than `mcpServers`, wants an explicit `type`, and can prompt for the token once and store it encrypted. In `.vscode/mcp.json` for one workspace, or your user `mcp.json` for all of them:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "observe-token",
      "description": "NestJS Observe MCP token",
      "password": true
    }
  ],
  "servers": {
    "observe": {
      "type": "http",
      "url": "https://<api-host>/mcp",
      "headers": { "Authorization": "Bearer ${input:observe-token}" }
    }
  }
}
```

**Your own agent.** With the official TypeScript SDK, the endpoint is a `StreamableHTTPClientTransport` and the token rides in `requestInit.headers`:

```typescript
const client = new Client({ name: 'my-agent', version: '1.0.0' });

await client.connect(
  new StreamableHTTPClientTransport(new URL('https://<api-host>/mcp'), {
    requestInit: {
      headers: { Authorization: `Bearer ${process.env.OBSERVE_MCP_TOKEN}` },
    },
  }),
);

const { tools } = await client.listTools();
```

Before debugging a client's config, confirm the endpoint and token work at all - this lists the tools the server would advertise:

```bash
$ curl -s https://<api-host>/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

A tool list back means the credential is good and anything still broken is client-side. A **401** means the token is missing, expired, revoked, or the header is malformed; a **405** means the client sent `GET` or `DELETE` - every MCP request to this endpoint is a `POST`.

#### An example investigation

The tools are shaped around investigations rather than endpoints, so each answer carries the key the next question needs. A deploy went out and something feels wrong:

1. **"What regressed after the last deploy?"** - `find_regressions` compares error rate and latency either side of each release boundary (your `serviceVersion` values) and names the release that made things worse, along with the operations it degraded.
2. **"Show me that operation."** - `get_operation_details` returns the route's latency and error summary plus recent individual requests, each with a `traceId`.
3. **"What did that request actually do?"** - `get_trace` resolves the trace id into the waterfall: every execution under it, across services, with span trees.
4. **"What did the code say while it happened?"** - `get_trace_logs` returns every log line emitted under the same trace id, in order.

Errors and background jobs follow the same shape: `list_error_groups` → `get_error_details` → `get_trace`, and `list_jobs` → `get_job_details` → `get_trace`. Start with `list_projects` in any case - almost every diagnostic tool takes a `projectId`.

#### Available tools

Every tool is read-only. Most diagnostic tools share a scope: a required `projectId`, an optional `applicationId` to narrow to one service, and an optional `timeInterval` look-back window (`1h`, `3h`, `12h`, `1d`, `3d`, `7d`, `30d`), defaulting to `1d`.

| Tool                     | What it answers                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_projects`          | Every project you're a member of, with team and application counts. Start here to resolve project ids.                                            |
| `get_project`            | One project by id, including your access level and subscription state.                                                                            |
| `search`                 | Full-text search over your projects, applications, alert rules, SLOs, and issues.                                                                 |
| `find_regressions`       | Releases that made things worse: error rate and latency before vs. after each release boundary, with the specific operations each one degraded.    |
| `list_slow_operations`   | The slowest HTTP operations in the window, p95-ranked, with volume alongside - so effort goes to what's slow _and_ hot.                            |
| `get_operation_details`  | One route: latency and error summary plus recent individual requests, each with duration, status, and `traceId`.                                  |
| `get_trace`              | A `traceId` resolved to every execution that ran under it - across services, requests, and jobs - each with its span tree.                        |
| `get_trace_logs`         | Every log line emitted under a `traceId`, in order.                                                                                               |
| `list_error_groups`      | Errors grouped by fingerprint, ranked by occurrence count, with class, sample message and stack trace, first/last seen, and the introducing release. |
| `get_error_details`      | Recent occurrences of one error class: per-occurrence message, status, user, and `traceId`, plus a summary.                                       |
| `get_error_trend`        | Whether errors are growing or decaying over the window, already classified as a direction.                                                        |
| `get_affected_users`     | The blast radius of one error class: which end users hit it and how often.                                                                        |
| `list_jobs`              | Background job performance in the window, per job name and queue: volume, duration, and failure counts.                                           |
| `get_job_details`        | One job name on one queue: duration and wait-time summaries plus recent individual executions, each with status and `traceId`.                    |
| `list_issues`, `get_issue` | Issues across your projects, and one issue with its comments and activity.                                                                      |
| `list_slos`              | A project's SLOs with current status and error-budget burn.                                                                                       |
| `list_alert_rules`, `list_alert_events` | Alert rules across every project you can see, and their firing history.                                                            |

There is currently no way to create, resolve, or modify anything through MCP - not issues, not alert rules, not error-group status. Those stay in the dashboard. Tool results also drop the time-bucketed chart series the dashboard endpoints return, because hundreds of bucket values cost context and say less than the summary derived from them.
