import { DataStore } from "./data.js";
import { getReplicas } from "./replicas.js";

async function run(): Promise<void> {
  const dataStore = new DataStore();
  await dataStore.load('./data.json');
  const replicas = await getReplicas(dataStore);
  await Promise.all(replicas.map(replica => replica.sync()));
  await dataStore.save('./data.json');
}

// ...
run();
