# Volume 3: Enterprise Architecture Blueprint

## 1. Purpose

Define the target architecture for enterprise capabilities without breaking the existing BulleBrowser desktop and agent foundations.

## 2. Architectural invariants

- The renderer remains untrusted and cannot access Node APIs or secrets directly.
- Preload exposes only typed, narrow IPC contracts.
- Desktop main owns browser views, native