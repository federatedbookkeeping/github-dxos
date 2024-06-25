import { GitHubIssue, getIssues, getData, GitHubComment } from "./github.js";
import { DataStore } from "./data.js";
import { convertComment, convertIssue } from "./cambria.js";

async function run(): Promise<void> {
  const dataStore = new DataStore();
  await dataStore.load('./data.json');
  const docs: GitHubIssue[] = await getIssues('gh-data/issues.json');
  let comments: GitHubComment[] = [];
  const commentFetches = docs.map(async doc => {
    const issueComments = await getData(`gh-data/comments_${doc.node_id}.json`, doc.comments_url);
    comments = comments.concat(issueComments);
  });
  await Promise.all(commentFetches);
  const docUpserts = docs.map(async (doc) => {
    console.log('upserting doc', doc);
    dataStore.applyOperation({
      operationType: 'upsert',
      fields: await convertIssue(doc)
    });
  });
  const commentUpserts = comments.map(async (comment) => {
    console.log('upserting comment', comment);
    dataStore.applyOperation({
      operationType: 'upsert',
      fields: await convertComment(comment)
    });
  });
  await Promise.all(docUpserts);
  console.log(dataStore.items);
  await dataStore.save('./data.json');
}

// ...
run();
