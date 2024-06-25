import { loadYamlLens, applyLensToDoc } from "cambria";
import { Issue } from "./data";
const lensYml = `schemaName: Issue

lens:
- rename:
    source: title
    destination: name`;

export async function convertIssue(doc: object): Promise<Issue> {
  const lens = loadYamlLens(lensYml);
  const newDoc = applyLensToDoc(lens, doc, undefined, {});
  return {
    type: 'issue',
    identifiers: [`gh_node_id:${newDoc.node_id}`],
    deleted: false,
    title: newDoc.name,
    completed: false,
  };
}
