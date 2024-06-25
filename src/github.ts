import { Item, Issue, Comment, DataStore } from "./data";
const fsPromises = require("fs/promises");

export interface GitHubIssue {
  repository_url: string,
  url: string,
  node_id: string,
  comments_url: string,
  title: string,
  body: string,
  comments: object[]
}
export interface GitHubIssueAdd {
  repository_url: string,
  title: string,
  body: string
}

export interface GitHubComment {
  node_id: string,
  url: string,
  issue_url: string,
  body: string,
}

export interface GitHubCommentAdd {
  issue_url: string,
  body: string,
}

// using the `gh` executable here since there seems to be no tsconfig.json
// that can compile a project that uses both Octokit and DXOS.

export async function apiCall(url: string, method: string, body?: string): Promise<any> {
  if (typeof process.env.GITHUB_TOKEN !== 'string') {
    console.error('export GITHUB_TOKEN=...');
    process.exit(1);
  }
  const fetchResult = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body
  });
  return fetchResult.json();
}
export async function getDataOverNetwork(url: string): Promise<GitHubIssue[]> {
  return apiCall(url, 'GET');
}

export async function remoteCreate(url: string, data: object): Promise<string> {
  const response = await apiCall(url, 'POST', JSON.stringify(data, null, 2)) as { url: string};
  return response.url;
}

export async function getData(filename: string, url: string): Promise<any> {
  let issues: GitHubIssue[] = [];
  try {
    const buff = await fsPromises.readFile(filename);
    issues = JSON.parse(buff.toString());
    console.log(`Loaded ${filename}`);
  } catch {
    console.log(`Failed to load ${filename}, fetching over network`);
    issues = await getDataOverNetwork(url);
    await fsPromises.writeFile(filename, JSON.stringify(issues, null, 2) + "\n");
    console.log(`Saved ${filename}`);
  }
  return issues;
}

export async function getIssues(filename: string): Promise<GitHubIssue[]> {
  return getData(filename, `https://api.github.com/issues`);
}

export async function addIssue(issue: GitHubIssueAdd): Promise<string> {
  return remoteCreate(`${issue.repository_url}/issues`, issue);
}
export async function addComment(comment: GitHubCommentAdd): Promise<string> {
  return remoteCreate(`${comment.issue_url}/comments`, comment);
}

export async function addItem(item: Item, store: DataStore) {
  if (item.type === 'issue') {
    return addIssue({
      repository_url: 'https://api.github.com/federatedbookkeeping/task-tracking',
      title: (item as Issue).title,
      body: ''
    });
  }
  if (item.type === 'comment') {
    const issueUrlCandidates = store.issueIdToIssueIds((item as Comment).issueId);
    for (let i = 0; i < issueUrlCandidates.length; i++) {
      if (issueUrlCandidates[i].startsWith('gh_api_url:')) {
        return addComment({
          issue_url: issueUrlCandidates[i].substring('gh_api_url:'.length),
          body: (item as Comment).body
        });
      }
    }
  }
}

export async function upsert(item: Item, store: DataStore): Promise<void> {
  let ghApiUrl: string | undefined = item.identifiers.find((x: string) => x.startsWith('gh_api_url:'));
  if (typeof ghApiUrl === 'undefined') {
    ghApiUrl = await addItem(item, store);
  }
}