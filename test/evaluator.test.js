import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRelease } from '../src/core/evaluator.js';

const version = { id: 42, name: 'Release 1', released: false };
const rules = [{ id: 'all-done', type: 'ALL_ISSUES_STATUS_CATEGORY', allowedCategories: ['done'] }];
const run = (issues, count = issues.length, customRules = rules) =>
  evaluateRelease({ version, issues, expectedIssueCount: count, rules: customRules });

test('passes when all release issues are done', () => {
  assert.equal(run([{ key: 'APP-1', statusCategory: 'done' }]).state, 'PASS');
});
test('blocks open issue with auditable evidence', () => {
  const result = run([{ key: 'APP-1', statusCategory: 'indeterminate' }]);
  assert.equal(result.state, 'BLOCKED');
  assert.equal(result.findings[1].evidence[0].issueKey, 'APP-1');
});
test('fails closed on incomplete inventory', () => {
  assert.equal(run([{ key: 'APP-1', statusCategory: 'done' }], 2).state, 'UNKNOWN');
});
test('fails closed when status is missing', () => {
  assert.equal(run([{ key: 'APP-1' }]).state, 'UNKNOWN');
});
test('fails closed on unsupported rule', () => {
  assert.equal(run([], 0, [{ id: 'unknown', type: 'LLM_GUESS' }]).state, 'UNKNOWN');
});
test('fails closed on invalid rule config', () => {
  assert.equal(run([], 0, [{ id: 'bad', type: 'ALL_ISSUES_STATUS_CATEGORY', allowedCategories: [] }]).state, 'UNKNOWN');
});
test('throws on malformed input', () => {
  assert.throws(() => evaluateRelease({ version, issues: null, rules }), TypeError);
});
test('allows zero issues as vacuous pass (not evidence of deploy safety)', () => {
  assert.equal(run([]).state, 'PASS');
});
