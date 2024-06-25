import { Item } from "./data";
const fsPromises = require("fs/promises");

export interface GitHubIssue {
  url: string,
  node_id: string,
  comments_url: string,
  title: string,
  body: string,
  comments: object[]
}

export interface GitHubComment {
  node_id: string,
  url: string,
  issue_url: string,
  body: string,
}

// using the `gh` executable here since there seems to be no tsconfig.json
// that can compile a project that uses both Octokit and DXOS.

export async function getDataOverNetwork(url: string): Promise<GitHubIssue[]> {
  const fetchResult = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  return fetchResult.json();
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

// export async function addIssue(issue: Issue) {
//   const result: { code: any; stdout: string; stderr: string } =
//     await new Promise((resolve) => {
//       exec(`gh api ${url} --method POST`, (code, stdout, stderr) => {
//         resolve({ code, stdout, stderr });
//       });
//     });
//   const { code, stdout, stderr } = result;
//   console.log("GH API call process completed with code", code);
//   console.log("stderr from GH API call:", stderr);
//   const text = stdout;
//   return JSON.parse(text);
// }
// export async function addItem(item: Item) {
//   if (item.type === 'issue') {
//     return addIssue(item as Issue);
//   }
//   if (item.type === 'comment') {
//     return addComment(item as Comment);
//   }
// }

// export async function upsert(item: Item): Promise<void> {
//   let ghApiUrl: string | undefined = item.identifiers.find((x: string) => x.startsWith('gh_api_url:'));
//   if (typeof ghApiUrl === 'undefined') {
//     ghApiUrl = await addItem(item);
//   }
// }