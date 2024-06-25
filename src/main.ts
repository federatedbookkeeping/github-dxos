import { readFileSync, writeFileSync } from "fs";
import { getIssue } from "./github.js";
import { convertIssue } from "./cambria.js";
import { acceptInvite, generateInvite, initDxos } from "./dxos.js";

async function run(): Promise<void> {
  let invite: { code: string, authCode: string } | undefined = undefined;
  try {
    const buff = readFileSync('space-key.json');
    invite = JSON.parse(buff.toString());
  } catch {
  }
  const dxosClient = await initDxos();
  let space: object | undefined = undefined;
  if (typeof invite === undefined) {
    const result: { space: object, code: string, authCode: string } = await generateInvite(dxosClient);
    invite = { code: result.code, authCode: result.authCode };
    writeFileSync('space-key.json', JSON.stringify(invite));
  } else {
    await acceptInvite(dxosClient, invite?.code!, invite?.authCode!);
  }
  // const doc = await getIssue();
  // console.log(doc);
  // const newDoc = await convertIssue(doc);
  // console.log(newDoc);
  process.exit(0);
}

// ...
run();
