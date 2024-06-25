import { exec } from "child_process";

export interface GitHubIssue {
  node_id: string,
  comments_url: string,
  title: string
  comments: object[]
}

// using the `gh` executable here since there seems to be no tsconfig.json
// that can compile a project that uses both Octokit and DXOS.

export async function getIssues(): Promise<GitHubIssue[]> {
  const result: { code: any; stdout: string; stderr: string } =
    await new Promise((resolve) => {
      exec(`gh api /issues --method GET`, (code, stdout, stderr) => {
        resolve({ code, stdout, stderr });
      });
    });
  const { code, stdout, stderr } = result;
  console.log("GH API call process completed with code", code);
  console.log("stderr from GH API call:", stderr);
  const text = stdout;
  return JSON.parse(text);
}
