import { GitHubIssue, getIssues, getData } from "./github.js";
import { DataStore, Issue } from "./data.js";
import { convertIssue } from "./cambria.js";

async function run(): Promise<void> {
  const dataStore = new DataStore();
  await dataStore.load('./data.json');
  const docs: GitHubIssue[] = await getIssues('gh-data/issues.json');
  await Promise.all(docs.map(doc => getData(`gh-data/comments_${doc.node_id}.json`, doc.comments_url)));
  const upserts = docs.map(async (doc) => {
    console.log('upserting doc', doc);
    dataStore.applyOperation({
      operationType: 'upsert',
      fields: await convertIssue(doc)
    });
  });
  await Promise.all(upserts);
  console.log(dataStore.items);
  await dataStore.save('./data.json');
}

// ...
run();
