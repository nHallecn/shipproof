/** Pure deterministic evaluator: never asks an LLM to decide readiness. */
export const STATE = Object.freeze({ PASS: 'PASS', BLOCKED: 'BLOCKED', UNKNOWN: 'UNKNOWN' });

export function evaluateRelease({ version, issues, expectedIssueCount, rules }) {
  if (!version || !Array.isArray(issues) || !Array.isArray(rules)) {
    throw new TypeError('version, issues and rules are required');
  }
  const findings = [];
  const complete = Number.isSafeInteger(expectedIssueCount) && expectedIssueCount >= 0 &&
    issues.length === expectedIssueCount;
  findings.push({
    ruleId: 'inventory-complete',
    state: complete ? STATE.PASS : STATE.UNKNOWN,
    message: complete ? `${issues.length} release issue(s) loaded.` : 'Issue inventory is incomplete or unverified.',
    evidence: []
  });
  for (const rule of rules) {
    if (rule.type !== 'ALL_ISSUES_STATUS_CATEGORY') {
      findings.push({ ruleId: rule.id, state: STATE.UNKNOWN, message: 'Unsupported rule type.', evidence: [] });
      continue;
    }
    if (!Array.isArray(rule.allowedCategories) || !rule.allowedCategories.length) {
      findings.push({ ruleId: rule.id, state: STATE.UNKNOWN, message: 'No acceptable status categories configured.', evidence: [] });
      continue;
    }
    if (!complete) {
      findings.push({ ruleId: rule.id, state: STATE.UNKNOWN, message: 'Cannot evaluate incomplete inventory.', evidence: [] });
      continue;
    }
    const missing = issues.filter(i => !i?.key || !i?.statusCategory);
    if (missing.length) {
      findings.push({ ruleId: rule.id, state: STATE.UNKNOWN, message: 'Some issue statuses are unavailable.', evidence: [] });
      continue;
    }
    const blocked = issues.filter(i => !rule.allowedCategories.includes(i.statusCategory));
    findings.push({
      ruleId: rule.id,
      state: blocked.length ? STATE.BLOCKED : STATE.PASS,
      message: blocked.length ? `${blocked.length} issue(s) are not in an allowed status category.` : 'All issues satisfy the status requirement.',
      evidence: blocked.map(i => ({ issueKey: i.key, statusCategory: i.statusCategory }))
    });
  }
  const state = findings.some(f => f.state === STATE.UNKNOWN) ? STATE.UNKNOWN :
    findings.some(f => f.state === STATE.BLOCKED) ? STATE.BLOCKED : STATE.PASS;
  return {
    schemaVersion: 1,
    version: { id: String(version.id), name: String(version.name), released: Boolean(version.released) },
    state, findings,
    caveat: 'Advisory assessment only. ShipProof does not block CI/CD deployments.'
  };
}
