import { Octokit } from "octokit";

export async function getIssue(): Promise<object> {

    const octokit = new Octokit({ auth: process.env["GITHUB_TOKEN"] });
    const {
        data: { login },
    } = await octokit.rest.users.getAuthenticated();
    console.log("Hello, %s", login);
    const issues = await octokit.rest.issues.list();
    // console.log(issues);
    const doc = issues.data[0];
    return doc;
}
