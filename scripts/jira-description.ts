type AdfNode = {
  type?: string;
  text?: string;
  content?: AdfNode[];
  attrs?: Record<string, unknown>;
};

type JiraIssueResponse = {
  key: string;
  fields: {
    summary?: string;
    description?: AdfNode;
  };
};

const REQUIRED_ENV_VARS = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'] as const;

function getRequiredEnv(name: (typeof REQUIRED_ENV_VARS)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function parseArgs(): { issueKey: string; includeRaw: boolean } {
  const [, , maybeIssueKey, ...flags] = process.argv;

  if (!maybeIssueKey || maybeIssueKey.startsWith('-')) {
    throw new Error(
      'Usage: pnpm jira:description -- <ISSUE_KEY> [--raw]\nExample: pnpm jira:description -- TD-1004',
    );
  }

  return {
    issueKey: maybeIssueKey,
    includeRaw: flags.includes('--raw'),
  };
}

function inlineText(nodes: AdfNode[] | undefined): string {
  if (!nodes || nodes.length === 0) {
    return '';
  }

  return nodes
    .map((node) => {
      if (node.type === 'text') {
        return node.text ?? '';
      }

      if (node.type === 'hardBreak') {
        return '\n';
      }

      return inlineText(node.content);
    })
    .join('');
}

function adfToLines(node: AdfNode | undefined, indent = 0): string[] {
  if (!node) {
    return [];
  }

  if (node.type === 'doc') {
    return (node.content ?? []).flatMap((child) => adfToLines(child, indent));
  }

  if (node.type === 'heading') {
    const heading = inlineText(node.content).trim();
    return heading ? [heading, ''] : [];
  }

  if (node.type === 'paragraph') {
    const paragraph = inlineText(node.content).trim();
    return [paragraph];
  }

  if (node.type === 'bulletList') {
    return (node.content ?? []).flatMap((item) => adfToLines(item, indent));
  }

  if (node.type === 'orderedList') {
    return (node.content ?? []).flatMap((item, index) =>
      adfToLines(item, indent).map((line) =>
        line.replace(/^\s*- /, `${'  '.repeat(indent)}${index + 1}. `),
      ),
    );
  }

  if (node.type === 'listItem') {
    const paragraphs = (node.content ?? []).flatMap((child) => adfToLines(child, indent + 1));
    const text = paragraphs.join(' ').replace(/\s+/g, ' ').trim();

    if (!text) {
      return [];
    }

    return [`${'  '.repeat(indent)}- ${text}`];
  }

  if (node.type === 'blockquote' || node.type === 'panel' || node.type === 'expand') {
    return (node.content ?? []).flatMap((child) => adfToLines(child, indent));
  }

  return (node.content ?? []).flatMap((child) => adfToLines(child, indent));
}

function extractAcceptanceCriteria(descriptionLines: string[]): string[] {
  return descriptionLines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s+/, ''));
}

async function fetchIssue(issueKey: string): Promise<JiraIssueResponse> {
  const baseUrl = getRequiredEnv('JIRA_BASE_URL').replace(/\/$/, '');
  const email = getRequiredEnv('JIRA_EMAIL');
  const token = getRequiredEnv('JIRA_API_TOKEN');

  const authHeader = Buffer.from(`${email}:${token}`).toString('base64');
  const url = `${baseUrl}/rest/api/3/issue/${issueKey}?fields=summary,description`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${authHeader}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jira request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return (await response.json()) as JiraIssueResponse;
}

async function main(): Promise<void> {
  const { issueKey, includeRaw } = parseArgs();
  const issue = await fetchIssue(issueKey);
  const descriptionLines = adfToLines(issue.fields.description)
    .map((line) => line.trimEnd())
    .filter((line, index, arr) => !(line === '' && arr[index - 1] === ''));
  const acceptanceCriteria = extractAcceptanceCriteria(descriptionLines);

  console.log(`# ${issue.key}: ${issue.fields.summary ?? '(no summary)'}`);
  console.log('');
  console.log('## Description');

  if (descriptionLines.length === 0) {
    console.log('(empty)');
  } else {
    for (const line of descriptionLines) {
      console.log(line);
    }
  }

  console.log('');
  console.log('## Acceptance Criteria Candidates');

  if (acceptanceCriteria.length === 0) {
    console.log('No bullet-point acceptance criteria found in description.');
  } else {
    acceptanceCriteria.forEach((ac, index) => {
      console.log(`${index + 1}. ${ac}`);
    });
  }

  if (includeRaw) {
    console.log('');
    console.log('## Raw Description JSON');
    console.log(JSON.stringify(issue.fields.description ?? {}, null, 2));
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
