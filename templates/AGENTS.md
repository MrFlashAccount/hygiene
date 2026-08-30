# Project agent instructions

## Validation

- Run `<project validation command>` before handing off a change.
- Do not bypass failed checks or add broad lint, type, formatter, or dead-code suppressions.
- Any necessary exception must be narrow and explain the invariant that makes it safe.

## Architecture

- Each module owns one cohesive set of invariants and has one cohesive reason to change.
- Keep external DTOs and runtime inputs behind validated adapters.
- Do not move a project-specific invariant into a shared abstraction unless it is intentionally part of the shared contract and its effect on every consumer has been verified.

## Types

- Every type assertion except `as const` requires an adjacent WHY comment explaining why it is necessary and why a safe typed alternative is unavailable.
- Assertions never replace runtime validation.
- Represent related states with discriminated unions and handle closed unions exhaustively.
- Do not use `never` or another assertion to hide an unresolved type mismatch.

## Tests and documentation

- Test observable behavior and meaningful invariants, not incidental representation.
- Comments and JSDoc explain contracts or WHY, not names or syntax.
- Document exported domain contracts and public application APIs; avoid ceremonial documentation for obvious leaf code.

<!--
Optional capability-architecture section.
Keep this section only when the project enables `noDirectEffects`,
`capabilityArchitecture`, or equivalent custom boundaries.

## Capability architecture

- Domain code must not depend on React, UI, or infrastructure.
- UI declares intent and receives typed capabilities; it must not directly access network, storage, wall-clock time, randomness, or infrastructure adapters.
- Direct React effects are allowed only inside explicitly named synchronization boundary hooks.
- Effects synchronize with external systems after commit; they must not schedule render-data loading.
-->
