import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Heading, Inline, Lozenge, SectionMessage, Select, Stack, Text, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

function App() {
  const context = useProductContext();
  const projectKey = context?.extension?.project?.key;
  const [versions, setVersions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!projectKey) return;
    setVersions([]); setSelected(null); setAssessment(null); setError('');
    invoke('listVersions', { projectKey }).then(setVersions).catch(e => setError(e.message));
  }, [projectKey]);

  async function assess() {
    if (!selected || !projectKey) return;
    setBusy(true); setError(''); setAssessment(null);
    try { setAssessment(await invoke('assessRelease', { projectKey, versionId: selected.value })); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const color = assessment?.state === 'PASS' ? 'success' :
    assessment?.state === 'BLOCKED' ? 'removed' : 'inprogress';
  return <Stack space="space.300">
    <Heading size="large">ShipProof</Heading>
    <Text>Evidence-first release assessment · Milestone 1</Text>
    <Text>Jira project: {projectKey || 'Loading context…'}</Text>
    {error && <SectionMessage appearance="error"><Text>{error}</Text></SectionMessage>}
    <Select placeholder="Select a release" value={selected} onChange={setSelected}
      options={versions.map(v => ({ label: `${v.name}${v.released ? ' (released)' : ''}`, value: v.id }))} />
    <Inline space="space.200">
      <Button appearance="primary" isDisabled={!selected || busy} onClick={assess}>
        {busy ? 'Checking…' : 'Assess release'}
      </Button>
    </Inline>
    {assessment && <Stack space="space.200">
      <Inline space="space.200">
        <Heading size="medium">{assessment.version.name}</Heading>
        <Lozenge appearance={color}>{assessment.state}</Lozenge>
      </Inline>
      {assessment.findings.map(f => <SectionMessage key={f.ruleId} appearance={f.state === 'BLOCKED' ? 'error' : f.state === 'UNKNOWN' ? 'warning' : 'confirmation'}>
        <Text>{f.ruleId}: {f.message}</Text>
        {f.evidence.map(e => <Text key={e.issueKey}>{e.issueKey} · {e.statusCategory}</Text>)}
      </SectionMessage>)}
      <Text>{assessment.caveat}</Text>
    </Stack>}
    <Text>Only checks Jira fixVersion issue statuses. Confluence decisions, Teamwork Graph and Rovo are not implemented yet.</Text>
  </Stack>;
}

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);
