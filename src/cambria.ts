import { loadYamlLens, applyLensToDoc } from "cambria";
const lensYml = `schemaName: Issue

lens:
- rename:
    source: title
    destination: name`;

export async function convertIssue(doc: object): Promise<object> {
    const lens = loadYamlLens(lensYml);
    const newDoc = applyLensToDoc(lens, doc, undefined, {});
    return newDoc;
}
