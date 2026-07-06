# BulleBrowser Agent Architecture (Foundational v1)

This document describes the production-safe foundational architecture for the BulleBrowser agent stack.

## Core loop

The agent executes the following deterministic lifecycle:

1. perceive
2. plan
3. act
4. verify
5. report

The implementation lives in `packages/agent-core` and is runtime-injected from desktop main process adapters.

## Modules

- `planner.ts`: deterministic plan generation from user intent
- `executor.ts`: stepwise tool execution through typed registry
- `verifier.ts`: post-step verification against expected outcomes
- `policy.ts`: privacy and safety policy decisions + redaction
- `retrieval.ts`: page-first retrieval with local memory fallback
- `memory.ts`: session memory store with TTL and sensitive-key blocking
- `provider.ts`: provider gateway (`local-default` and optional `anthropic`)
- `audit.ts`: structured audit trail for stage decisions
- `tools/index.ts`: typed inspectable tool registry with safe foundational tools

## Privacy and safety defaults

- Local-first execution and summarization by default.
- External synthesis is optional and gated by policy.
- Sensitive-field interactions are blocked or require confirmation.
- Structured redaction is applied before logs/step payloads are emitted.
- Session memory does not persist credential-like keys.

## Browser adapter status

Desktop runtime currently provides concrete implementations for navigation, page reading, typing, clicking, extraction, tab controls, and waits.

The following are adapter-optional and may be mocked/fallback until native hooks are added:

- `getSelection`
- `listLinks` (falls back to URL parsing from readable text)
- `queryDom`

## Deployment safety

- Public desktop IPC contracts are unchanged.
- Existing skills and UI model selectors remain compatible.
- Legacy tool aliases are retained to avoid prompt regressions.
