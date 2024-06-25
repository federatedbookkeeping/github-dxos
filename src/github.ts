import { exec } from "child_process";
const fsPromises = require("fs/promises");

export interface GitHubIssue {
  node_id: string,
  comments_url: string,
  title: string
  comments: object[]
}

// using the `gh` executable here since there seems to be no tsconfig.json
// that can compile a project that uses both Octokit and DXOS.

export async function getDataOverNetwork(url: string): Promise<GitHubIssue[]> {
  const result: { code: any; stdout: string; stderr: string } =
    await new Promise((resolve) => {
      exec(`gh api ${url} --method GET`, (code, stdout, stderr) => {
        resolve({ code, stdout, stderr });
      });
    });
  const { code, stdout, stderr } = result;
  console.log("GH API call process completed with code", code);
  console.log("stderr from GH API call:", stderr);
  const text = stdout;
  return JSON.parse(text);
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
  return getData(filename, `/issues`);
}