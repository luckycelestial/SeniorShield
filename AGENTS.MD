# AGENTS.md — Solo Builder Rules & Engineering Principles

> Guidelines and working principles for AI agents operating as a high-velocity pair-programmer and autonomous co-builder for solo developers.

---

## 1. Core Philosophy: Solo Velocity & Pragmatism

1. **Bias for Action & Working Software:** Working, tested code beats abstract architectures. Focus on shipping end-to-end functionality quickly.
2. **Ruthless Simplicity (Anti-Overengineering):**
   - Avoid premature optimization, excessive layers of indirection, and bloated design patterns.
   - Apply the **Rule of Three**: Do not abstract until a pattern repeats three times.
   - Colocate code and state where it is used; do not split simple components into dozens of tiny files without necessity.
3. **Low Maintenance Burden:**
   - Every additional dependency is future maintenance debt. Prefer language primitives and framework built-ins before reaching for external packages.
   - Choose battle-tested, standard libraries over niche or unmaintained packages.

---

## 2. Code Quality & Defensive Engineering

1. **Strict Typing & Explicit Interfaces:**
   - Always define explicit schemas and types for data boundaries (APIs, storage, props, external services).
   - Never use `any` unless strictly unavoidable; ensure full type safety across data pipelines.
2. **Defensive I/O & Graceful Degradation:**
   - Always wrap network calls, file system I/O, native bridges, and JSON parsing in robust `try/catch` blocks.
   - Implement sensible fallback states, meaningful error messages, and retry logic where appropriate.
   - Never fail silently; log actionable debug information for rapid troubleshooting.
3. **No Incomplete Code or Placeholder Debt:**
   - Write complete, production-ready logic. Avoid leaving `TODO`, `FIXME`, or stubbed empty handlers.
   - If an edge case exists, handle it or explicitly document the constraint.

---

## 3. Agent Execution & Operational Rules

1. **Autonomous & Proactive Execution:**
   - Investigate context thoroughly using search and inspection tools before modifying code.
   - Do not ask for user confirmation for trivial, obvious steps—execute and report results clearly.
2. **Surgical, Non-Destructive Edits:**
   - Make focused, minimal-diff modifications directly addressing the task.
   - Preserve existing code conventions, naming schemes, comments, and architecture unless instructed to refactor.
3. **Continuous Verification:**
   - Always verify changes after editing (run linters, tests, builds, or scripts).
   - If a command or build fails, immediately inspect the root cause, fix it, and re-verify before completing the turn.

---

## 4. UI/UX & Interaction Standards

1. **Accessibility & Visual Polish First:**
   - Ensure high visual contrast, intuitive spacing, and responsive layout hierarchies.
   - Make all touch targets and interactive controls accessible, well-proportioned, and ergonomic.
2. **Responsive State Feedback:**
   - Provide immediate visual feedback for loading, empty, success, and error states.
   - Ensure no UI action leaves the user wondering if an operation succeeded or failed.