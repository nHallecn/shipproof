# ShipProof milestones

## M1 — Jira release evidence (this PR)
- Forge project page with release selection
- Authenticated as-user Jira version and issue queries
- Deterministic status-category assessment with PASS / BLOCKED / UNKNOWN
- Pagination safeguards, unit tests and GitHub Actions checks

## M2 — Decision-backed rule
- Confluence decision reference explicitly registered by a human
- Typed requirement and immutable evidence snapshot
- No autonomous interpretation of policies by an LLM

## M3 — Context and presentation
- Teamwork Graph feasibility validation; only use if access available
- Rovo explanation agent that cannot alter rule outcomes
- Read-only MCP tool if eligibility and preview access permit

Security note: M1 is advisory, not a deployment gate. A PASS is not proof that a release is safe. Live Forge deployment is unverified.
