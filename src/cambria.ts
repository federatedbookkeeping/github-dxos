import { loadYamlLens, applyLensToDoc } from "cambria";
import { Issue, Comment } from "./data";
import { GitHubIssue, GitHubComment } from "./github";

const lensYml = `schemaName: Issue

lens:
- rename:
    source: title
    destination: name`;

export async function convertIssue(doc: GitHubIssue): Promise<Issue> {
  // const lens = loadYamlLens(lensYml);
  // const newDoc = applyLensToDoc(lens, doc, undefined, {});
  return {
    type: 'issue',
    identifiers: [`gh_node_id:${doc.node_id!}`, `gh_api_url:${doc.url}`],
    deleted: false,
    title: doc.title,
    completed: false,
  };
}

export async function convertComment(comment: GitHubComment): Promise<Comment> {
  // const lens = loadYamlLens(lensYml);
  // const newDoc = applyLensToDoc(lens, doc, undefined, {});
  return {
    type: 'comment',
    identifiers: [`gh_node_id:${comment.node_id!}`, `gh_api_url:${comment.url}`],
    issueId: `gh_api_url:${comment.issue_url}`,
    deleted: false,
    text: comment.body,
  };
}
