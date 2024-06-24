import { getIssue } from "./github.js";
import { convertIssue } from "./cambria.js";
import { Replica } from "./dxos.js";

async function run(): Promise<void> {
  const doc = await getIssue();
  console.log(doc);
  const newDoc = await convertIssue(doc);
  console.log(newDoc);
  const replica = new Replica();
  await replica.init();
}

// ...
run();
