
const fsPromises = require("fs/promises");
import { DataStore } from "./data.js";
import { GitHubReplica } from "./github.js";

async function getReplicaSpecs() {
  const buff = await fsPromises.readFile('replicas.json');
  return JSON.parse(buff.toString());
}
export async function getReplicas(dataStore: DataStore) {
  const specs = await getReplicaSpecs();
  const promises = specs.map(spec => {
    switch(spec.type) {
      case 'github':
        return new GitHubReplica(spec, dataStore);
      default:
        throw new Error('unknown replica type');
    }
  });
  return Promise.all(promises);
}
