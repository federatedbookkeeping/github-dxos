import { loadYamlLens, applyLensToDoc } from "cambria";
import { Issue } from "./data";
import { GitHubIssue } from "./github";

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
    identifiers: [`gh_node_id:${doc.node_id!}`],
    deleted: false,
    title: doc.title,
    completed: false,
  };
}
