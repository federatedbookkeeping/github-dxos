import { getIssues } from "./github.js";
import { DataStore, Issue } from "./data.js";
import { convertIssue } from "./cambria.js";

async function run(): Promise<void> {
  const dataStore = new DataStore();
  await dataStore.load('./data.json');
  const docs = await getIssues();
  const promises = docs.map(async (doc) => {
    console.log('upserting doc', doc);
    dataStore.applyOperation({
      operationType: 'upsert',
      fields: await convertIssue(doc)
    });
  });
  await Promise.all(promises);
  console.log(dataStore.items);
  await dataStore.save('./data.json');
}

// ...
run();
