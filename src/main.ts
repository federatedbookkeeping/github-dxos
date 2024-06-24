import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env["GITHUB_TOKEN"] });
const repo = await octokit.rest.repos.get({
  owner: "federatedbookkeeping",
  repo: "github-dxos",
});
console.log(repo);
