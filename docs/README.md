# Neon Rush Documentation

This folder is the deep-dive documentation for Neon Rush. The root
[`README.md`](../README.md) is the project's front door - installation,
controls, and a quick orientation. Everything below goes further than that
README intentionally does.

## Where to start

- **New to the codebase?** Start with [ARCHITECTURE.md](ARCHITECTURE.md)
  for the big picture, then [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md) for
  how each mechanic actually works.
- **Curious about a specific choice** (why Phaser 3 and not 4, why
  `EventBus` doesn't extend Phaser's emitter, why localStorage)?
  [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) covers the trade-offs
  directly, including one that was discovered mid-project and changed as a
  result.
- **Want to understand the design intent** behind the obstacle system,
  character unlocks, the daily challenge, or the ghost replay - including
  the honest limits of what the daily challenge and ghost replay actually
  are? [GAME_DESIGN.md](GAME_DESIGN.md).
- **Setting up to contribute?**
  [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) has every script, the
  milestone order the project was actually built in, and the debugging
  workflow.
- **Verifying a change didn't break anything?** [TESTING.md](TESTING.md).
- **Performance question, or wondering what's actually been measured vs.
  assumed?** [PERFORMANCE.md](PERFORMANCE.md).
- **Learning the underlying concepts, not just this project's specific
  code?** [LEARNING_GUIDE.md](LEARNING_GUIDE.md) is a six-level path from
  browser-game basics through production engineering, using this
  codebase's real files as every example.

## Diagrams

All diagrams are Mermaid, viewable directly on GitHub or in any Mermaid-
compatible viewer:

- [System architecture](diagrams/system-architecture.md) - how React,
  Phaser, EventBus, storage, and audio fit together.
- [Gameplay flow](diagrams/gameplay-flow.md) - menu → loading → playing →
  paused/game over → back to menu.
- [Game state machine](diagrams/game-state-machine.md) - the screen/run
  states, separate from the player entity's own state machine.
- [Collision flow](diagrams/collision-flow.md) - the exact per-frame order
  of movement, collision, coin pickup, and near-miss checks.

## Document index

| File                                               | Covers                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | System structure, layer responsibilities, data flow               |
| [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md)         | Every mechanic in depth: problem, implementation, edge cases      |
| [GAME_DESIGN.md](GAME_DESIGN.md)                   | Design intent and rationale, including honest scope limits        |
| [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md)   | Stack and implementation trade-offs, with alternatives considered |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | Setup, scripts, conventions, debugging                            |
| [TESTING.md](TESTING.md)                           | What's automated, what's manual, and why                          |
| [PERFORMANCE.md](PERFORMANCE.md)                   | Optimization decisions and measured results                       |
| [LEARNING_GUIDE.md](LEARNING_GUIDE.md)             | A six-level guided tour of the concepts this project demonstrates |
