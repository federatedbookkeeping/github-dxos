import { getIssue } from "./github.js";
import { convertIssue } from "./cambria.js";
import { DataStore, Issue } from "./data.js";

async function run(): Promise<void> {
  const dataStore = new DataStore();
  await dataStore.load('./data.json');
  const doc = await getIssue();
  console.log(doc);
  const newDoc: Issue = await convertIssue(doc);
  console.log(newDoc);
  dataStore.applyOperation({
    operationType: 'upsert',
    fields: newDoc
  });
  console.log(dataStore.items);
  await dataStore.save('./data.json');
}

// ...
run();
