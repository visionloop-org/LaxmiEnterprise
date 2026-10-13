#!/usr/bin/env node
/**
 * setup-github-labels.mjs
 * Creates or updates GitHub issue labels for visionloop-org/LaxmiEnterprise
 * Uses the GitHub CLI token from the environment.
 */

import { execSync } from 'child_process';

const REPO = 'visionloop-org/LaxmiEnterprise';
const TOKEN = process.env.GITHUB_TOKEN || '';

const labels = [
  // Type labels
  { name: 'bug', color: 'D73A4A', description: 'Something is broken or not working correctly' },
  { name: 'enhancement', color: '0075CA', description: 'New feature or improvement request' },
  { name: 'documentation', color: '0075CA', description: 'Documentation improvements or additions' },
  { name: 'question', color: 'D876E3', description: 'Further information is requested' },
  { name: 'duplicate', color: 'CFD3D7', description: 'This issue or PR already exists' },
  { name: 'wontfix', color: 'FFFFFF', description: 'This will not be worked on' },
  { name: 'good first issue', color: '7057FF', description: 'Good for newcomers / easy to pick up' },
  { name: 'help wanted', color: '008672', description: 'Extra attention is needed, community help welcome' },
  { name: 'invalid', color: 'E4E669', description: 'Something does not seem right' },
  
  // Status labels
  { name: 'needs-triage', color: 'FEF2C0', description: 'Issue not yet reviewed by team' },
  { name: 'in-progress', color: 'F9D0C4', description: 'Actively being worked on' },
  { name: 'blocked', color: 'B60205', description: 'Blocked by another issue or external factor' },
  { name: 'ready-for-review', color: '0E8A16', description: 'PR is ready for review' },
  { name: 'needs-revision', color: 'FBCA04', description: 'Changes requested, needs revision' },
  
  // Component labels
  { name: 'admin-app', color: '1D76DB', description: 'Relates to the Admin Management Portal' },
  { name: 'supervisor-app', color: '0052CC', description: 'Relates to the Supervisor Tablet App' },
  { name: 'shared-package', color: '5319E7', description: 'Relates to the shared packages/shared library' },
  { name: 'google-sheets', color: '34A853', description: 'Relates to Google Sheets / Apps Script backend' },
  { name: 'ci/cd', color: 'E4E669', description: 'Relates to GitHub Actions workflows or CI/CD pipeline' },
  
  // Priority labels
  { name: 'priority: critical', color: 'B60205', description: 'Critical issue - production down or data loss' },
  { name: 'priority: high', color: 'D93F0B', description: 'High priority - significant impact on users' },
  { name: 'priority: medium', color: 'FBCA04', description: 'Medium priority - moderate impact' },
  { name: 'priority: low', color: 'C2E0C6', description: 'Low priority - nice to have' },
  
  // Size labels (for PRs)
  { name: 'size: tiny', color: 'C2E0C6', description: 'PR changes < 10 lines' },
  { name: 'size: small', color: 'A2DAAB', description: 'PR changes 10-50 lines' },
  { name: 'size: medium', color: 'FBCA04', description: 'PR changes 50-200 lines' },
  { name: 'size: large', color: 'D93F0B', description: 'PR changes > 200 lines - consider splitting' },
  
  // Domain labels
  { name: 'attendance', color: '006B75', description: 'Worker attendance check-in/check-out features' },
  { name: 'salary', color: '006B75', description: 'Salary calculations, payroll features' },
  { name: 'leave', color: '006B75', description: 'Leave management and approval workflow' },
  { name: 'performance', color: 'BFD4F2', description: 'Performance improvements, loading speed' },
  { name: 'ui/ux', color: 'BFD4F2', description: 'User interface or user experience' },
  { name: 'security', color: 'B60205', description: 'Security-related issue or improvement' },
  { name: 'dependencies', color: '0075CA', description: 'Dependency updates' },
  { name: 'automated', color: 'CFD3D7', description: 'Created by automation / bot' },
  { name: 'stale', color: 'CFD3D7', description: 'No recent activity — may be closed soon' },
];

async function fetchExistingLabels() {
  try {
    const result = execSync(
      `gh api /repos/${REPO}/labels --paginate`,
      { encoding: 'utf8' }
    );
    return JSON.parse(result);
  } catch (e) {
    console.error('Failed to fetch existing labels:', e.message);
    return [];
  }
}

async function createOrUpdateLabel(label, existingNames) {
  const headers = `-H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28"`;
  
  const body = JSON.stringify({
    name: label.name,
    color: label.color,
    description: label.description
  });
  
  if (existingNames.has(label.name)) {
    // Update existing label
    try {
      execSync(
        `gh api --method PATCH /repos/${REPO}/labels/${encodeURIComponent(label.name)} -f name="${label.name}" -f color="${label.color}" -f description="${label.description}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      console.log(`  ✏️  Updated: ${label.name}`);
    } catch (e) {
      console.log(`  ⚠️  Failed to update "${label.name}": ${e.message.split('\n')[0]}`);
    }
  } else {
    // Create new label
    try {
      execSync(
        `gh api --method POST /repos/${REPO}/labels -f name="${label.name}" -f color="${label.color}" -f description="${label.description}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      console.log(`  ✅ Created: ${label.name}`);
    } catch (e) {
      console.log(`  ⚠️  Failed to create "${label.name}": ${e.message.split('\n')[0]}`);
    }
  }
}

async function main() {
  console.log('🏷️  Setting up GitHub Labels for visionloop-org/LaxmiEnterprise\n');
  
  const existing = await fetchExistingLabels();
  const existingNames = new Set(existing.map(l => l.name));
  console.log(`Found ${existingNames.size} existing labels.\n`);
  
  for (const label of labels) {
    await createOrUpdateLabel(label, existingNames);
  }
  
  console.log(`\n✅ Done! ${labels.length} labels configured.`);
  console.log(`🔗 View at: https://github.com/${REPO}/labels`);
}

main().catch(console.error);
