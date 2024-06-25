import { GitHubIssue } from "./github";

const { readFileSync, writeFileSync } = require("fs");
const { Client } = require("@dxos/client");
const { Space } = require("@dxos/client/echo");
const { InvitationEncoder } = require('@dxos/client/invitations');
const { Expando, create } = require('@dxos/client/echo');

export class Dxos {
  client: typeof Client;
  invite: { code: string, authCode: string } | undefined = undefined;
  space: typeof Space | undefined = undefined;
  filename: string;
  constructor(filename: string) {
    this.client = new Client;
    this.filename = filename;
  }
  async init() {
    console.log('DXOS initialize');
    await this.client.initialize();
    if (!this.client.halo.identity.get()) {
      console.log('creating DXOS identity');
      await this.client.halo.createIdentity();
    }
    console.log('DXOS waiting for spaces to be ready');
    await this.client.spaces.isReady.wait();
    console.log('DXOS spaces ready');
    await this.joinSpace();
  }
  async joinSpace() {
    let invite: { code: string, authCode: string } | undefined = undefined;
    try {
      const buff = readFileSync(this.filename);
      invite = JSON.parse(buff.toString());
      console.log(`Read ${this.filename}`, invite);
    } catch {
      console.log(`No ${this.filename}`, invite);
    }
    if (typeof invite === 'undefined') {
      console.log('Generating invite');
      const result: { code: string, authCode: string } = await this.generateInvite();
      invite = { code: result.code, authCode: result.authCode };
      writeFileSync(this.filename, JSON.stringify(invite));
      console.log(`Wrote ${this.filename}`, invite);
    } else {
      console.log('Accepting invite');
      await this.acceptInvite(invite?.code!, invite?.authCode!);
    }
  }
  async acceptInvite(code: string, authCode: string): Promise<typeof Space> {
    const receivedInvitation = InvitationEncoder.decode(code);
    console.log('joining with receivedInvitation');
    const invitation = this.client.spaces.join(receivedInvitation);
    console.log('joined invitation', invitation);
    await invitation.authenticate(authCode);
    console.log('authenticated with authCode', authCode);
    console.log("getting spaceKey from invitation", invitation.get().spaceKey);
    this.space = this.client.spaces.get(invitation.get().spaceKey!)!;
    console.log("space with that spaceKey", this.space);
  }
  async generateInvite(): Promise<{ code: string, authCode: string }> {
    this.space = this.client.spaces.default;
    const invitation = this.space!.share();
    console.log('invitation for our default space', invitation);
    const data = invitation.get();
    console.log('invitation.get()', data);
    const code = InvitationEncoder.encode(data);
    console.log('DXOS share invitation', code, data.authCode);
    return { code, authCode: data.authCode };
  }
  async ensureIssue(issue: GitHubIssue): Promise<void> {
    const result = await this.space.db.query({ type: 'task' }).run();
    const object = create(Expando, { type: 'task', title: issue.title, node_id: issue.node_id, isCompleted: false });

  await this.space.db.add(object);
  }
}
