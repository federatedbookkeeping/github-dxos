import { getIssue } from "./github.js";
import { convertIssue } from "./cambria.js";
import { DataStore, Issue } from "./data.js";
// import { Dxos } from "./dxos.js";

async function run(): Promise<void> {
  const dataStore = new DataStore();
  // const dxos = new Dxos('dxos-invite.json');
  // await dxos.init();
  const doc = await getIssue();
  console.log(doc);
  const newDoc: Issue = await convertIssue(doc);
  console.log(newDoc);
  dataStore.applyOperation({
    operationType: 'upsert',
    fields: newDoc
  });
  console.log(dataStore.items);
  // await dxos.ensureIssue(newDoc);
  // console.log('newDoc should now be in DXOS!');
  // process.exit(0);
}

// ...
run();
