import { getIssue } from "./github.js";
import { convertIssue } from "./cambria.js";

const doc = await getIssue();
// const doc = {
//   "id": 1,
//   "state": "open",
//   "name": "Found a bug!!!",
//   "body": "I'm having a problem with this.",
//   "category": "feature",
//   "created_at": "2011-04-22T13:33:48Z",
//   "updated_at": "2011-04-22T13:33:48Z"
// };

console.log(doc);
const newDoc = await convertIssue(doc);
console.log(newDoc);