# Rule: Prioritize Local AI & Token Conservation for Laxmi Enterprise

## Core Objective
During development and execution of the Laxmi Enterprise project, prioritize local AI and local device compute to conserve online tokens and eliminate third-party cloud API costs.

## Implementation Standards:
1. **Zero-Token Client Computation**:
   - Payroll calculation, overtime multipliers ($1.5\times$), punctuality incentive attribution, vehicle capacity constraints, and contractor settlements must remain 100% client-side in `packages/shared/services/clientComputationService.js`.
   - Never use online LLM API calls for data transformations or business calculations.
2. **Local AI & Edge Agent Integration**:
   - `LaxmiSupervisorEdgeAgent` in `apps/supervisor/src/services/agentClient.js` runs directly on the user's browser/tablet.
   - Any future AI features (e.g. natural language attendance input, voice notes, shift summaries) should query local Ollama (`http://localhost:11434`) or local OpenAI-compatible backends (`http://localhost:1234`) with zero cloud token consumption.
3. **Agent Token Conservation**:
   - Keep file inspections strictly sliced (`view_file` line ranges).
   - Use `grep_search` and `graphify-out` persistent graph for architectural queries.
   - Prevent redundant web browsing or cloud round-trips.
