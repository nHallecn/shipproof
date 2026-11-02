import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { evaluateRelease } from '../core/evaluator.js';

const resolver = new Resolver();
const projectKeyPattern = /^[A-Z][A-Z0-9_]{0,19}$/i;
const versionIdPattern = /^\d+$/;

async function getJson(path) {
  const response = await api.asUser().requestJira(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Jira API returned HTTP ${response.status}`);
  return response.json();
}

resolver.define('listVersions', async ({ payload }) => {
  const projectKey = String(payload?.projectKey || '');
  if (!projectKeyPattern.test(projectKey)) throw new Error('Invalid project key');
  const versions = await getJson(route`/rest/api/3/project/${projectKey}/versions`);
  if (!Array.isArray(versions)) throw new Error('Invalid Jira versions response');
  return versions.filter(v => !v.archived).map(v => ({ id: String(v.id), name: v.name, released: Boolean(v.released) }));
});

resolver.define('assessRelease', async ({ payload }) => {
  const projectKey = String(payload?.projectKey || '');
  const versionId = String(payload?.versionId || '');
  if (!projectKeyPattern.test(projectKey) || !versionIdPattern.test(versionId)) throw new Error('Invalid release selection');
  const version = await getJson(route`/rest/api/3/version/${versionId}`);
  const projectVersions = await getJson(route`/rest/api/3/project/${projectKey}/versions`);
  if (!Array.isArray(projectVersions) || !projectVersions.some(v => String(v.id) === versionId)) {
    throw new Error('Selected version is not in this project');
  }

  const issues = [];
  let nextPageToken;
  let page = 0;
  do {
    if (++page > 100) throw new Error('Too many issue pages to assess safely');
    const body = { jql: `project = "${projectKey}" AND fixVersion = ${versionId}`,
      maxResults: 100, fields: ['status'], ...(nextPageToken ? { nextPageToken } : {}) };
    const response = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Jira search returned HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.issues)) throw new Error('Invalid issue search response');
    for (const issue of data.issues) {
      issues.push({ key: issue.key, statusCategory: issue.fields?.status?.statusCategory?.key });
    }
    if (data.isLast !== true && !data.nextPageToken) throw new Error('Search completeness not confirmed');
    nextPageToken = data.isLast === true ? undefined : data.nextPageToken;
  } while (nextPageToken);

  return evaluateRelease({ version, issues, expectedIssueCount: issues.length,
    rules: [{ id: 'all-release-issues-done', type: 'ALL_ISSUES_STATUS_CATEGORY', allowedCategories: ['done'] }] });
});

export const handler = resolver.getDefinitions();
