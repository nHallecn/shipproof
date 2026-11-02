# ShipProof

**Evidence-first release assessments for Atlassian Jira.**

ShipProof is a Codegeist 2026 entry built on Atlassian Forge. It is designed for engineering leads reviewing a release before deployment. The long-term differentiator is a deterministic, traceable check of engineering commitments documented in Confluence against evidence linked to a Jira release.

## Milestone 1 — Jira release evidence

This first pull request deliberately implements only a basic Jira release-status rule:
- Select a Jira release (fixVersion) from a Forge Jira project page.
- Query the release issues through authenticated Jira Cloud REST APIs.
- Check whether every issue is in Jira's Done status category.
- Report **PASS**, **BLOCKED**, or **UNKNOWN**, with evidence for blocked issues.
- Refuse to treat an incomplete issue inventory or missing status as a passing assessment.

**Important:** This is advisory only. A PASS does not prove deploy safety and does not block CI/CD.

## Local development

Requirements: Node.js 22+, an Atlassian Cloud development site with Jira, Forge CLI and an Atlassian developer account.

```bash
npm install
npm test
npm install -g @forge/cli
forge login
forge register
forge deploy
forge install
```

`forge register` must replace the placeholder app ID in `manifest.yml`. Choose your Jira development site at install time. Open **ShipProof** in your Jira project navigation and select a release.

The Forge build and live installation have **not yet been verified** on an Atlassian site.

## Roadmap

See [milestones](docs/MILESTONES.md). Next: formally link a Confluence engineering decision to an explicitly configured, typed release requirement. AI will explain evidence, never determine whether deterministic checks pass.

## Repository workflow

All changes are proposed on feature branches through pull requests. Do not commit feature work directly to `main`.

## License

License to be determined before public distribution.
