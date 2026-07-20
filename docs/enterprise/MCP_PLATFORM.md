# BulleBrowser MCP Platform Specification

## 1. Purpose

This document defines the implementation contract for Model Context Protocol support in BulleBrowser. MCP must extend the existing typed tool registry and policy system without bypassing browser safety controls.

## 2. Architectural rule

MCP tools are external capabilities. They must be normalized into the same canonical tool contract used by `packages/agent-core/src/tools/`.

No MCP server may execute directly from renderer code.

## 3. Required capabilities

### MCP-001 Server registry

Maintain a local registry of configured MCP servers containing:

- stable server ID
- display name
- transport type
- command or endpoint
- arguments
- environment-variable references
- enabled status
- trust status
- organization scope when applicable
- created and updated timestamps

Secrets must be referenced, not persisted in plain text configuration.

### MCP-002 Supported transports

Initial support:

- stdio
- streamable HTTP when supported by the selected MCP SDK

Transport implementations must be isolated behind a common client interface.

### MCP-003 Capability discovery

For each enabled server, discover and cache:

- tools
- resources
- prompts
- protocol version
- server metadata

Cache entries must expire and be refreshable.

### MCP-004 Tool normalization

Convert discovered MCP tools into the BulleBrowser canonical tool schema.

Each normalized tool must include:

- namespaced identifier
- server ID
- title
- description
- input schema
- output handling policy
- risk class
- confirmation requirement
- timeout

Tool-name collisions must be impossible through namespacing.

### MCP-005 Policy enforcement

Before every MCP invocation, evaluate:

- server trust
- organization policy
- tool allowlist or denylist
- sensitive-data exposure
- confirmation requirement
- requested filesystem or network scope
- timeout and cancellation

MCP must not bypass `packages/agent-core/src/policy.ts`.

### MCP-006 Lifecycle management

The desktop main process must own:

- process launch
- connection establishment
- health checks
- reconnect behavior
- shutdown
- cancellation
- orphan-process cleanup

### MCP-007 Auditability

Audit events must include:

- server ID
- tool ID
- request timestamp
- completion timestamp
- policy decision
- confirmation result
- normalized outcome
- error category

Do not log secrets or unredacted sensitive payloads.

## 4. Expected repository locations

Codex must inspect current conventions first. Expected changes:

- `packages/agent-core/src/tools/`
- `packages/agent-core/src/policy.ts`
- `packages/agent-core/src/audit.ts`
- `packages/agent-core/src/types.ts`
- `apps/desktop/src/main/`
- `apps/desktop/src/main/storage/`
- `apps/desktop/src/main/storage/secrets.ts`
- `apps/desktop/src/shared/ipc.ts`
- `apps/desktop/src/preload/`
- `apps/desktop/src/renderer/`

Recommended additions:

- `apps/desktop/src/main/mcp/server-registry.ts`
- `apps/desktop/src/main/mcp/client-manager.ts`
- `apps/desktop/src/main/mcp/transports/stdio.ts`
- `apps/desktop/src/main/mcp/transports/http.ts`
- `packages/agent-core/src/mcp/normalize-tool.ts`
- `packages/agent-core/src/mcp/types.ts`

## 5. IPC surface

Expose narrow typed operations only:

- list configured servers
- add server
- update server
- remove server
- enable or disable server
- test connection
- refresh capabilities
- read safe server status

Do not expose process handles, raw environment variables, credentials, or unrestricted command execution.

## 6. Security requirements

- stdio commands require explicit user configuration.
- arguments must be stored as structured arrays, not shell strings.
- never invoke through an implicit shell.
- environment variables must come from an allowlisted mapping.
- HTTP endpoints must be validated.
- remote plaintext HTTP is forbidden outside explicit localhost development.
- server output must be size-limited.
- calls must support cancellation and hard timeouts.
- repeated crashes must trigger a circuit breaker.

## 7. Failure model

Normalize MCP failures into:

- configuration invalid
- launch failed
- connection failed
- protocol mismatch
- discovery failed
- invocation timeout
- invocation cancelled
- server unavailable
- malformed response
- policy denied
- confirmation denied

## 8. Acceptance criteria

MCP work is complete only when:

1. A stdio MCP server can be configured and tested.
2. Tools are discovered and namespaced.
3. A discovered tool is callable through the canonical agent tool registry.
4. Policy denial blocks invocation.
5. Cancellation terminates the active call.
6. Desktop shutdown leaves no orphan child process.
7. Secrets never appear in renderer state, logs, or persisted plain text.
8. Tool-name collisions are covered by tests.
9. Malformed server responses do not crash the agent loop.
10. Existing built-in browser tools continue to work unchanged.

## 9. Validation

Run actual repository scripts, including available equivalents of:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Add integration tests with a deterministic local fixture MCP server. Tests must not depend on public network availability.

## 10. Non-goals

Do not implement:

- public MCP marketplace
- automatic installation of arbitrary binaries
- unrestricted shell commands
- hidden server activation
- cloud-hosted credential relay
- bypasses around existing confirmation rules

## 11. Rollback

MCP must be feature-gated. When disabled, no server process may launch and the existing built-in tool registry must remain unchanged.
