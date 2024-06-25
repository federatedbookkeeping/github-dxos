const { Client } = require("@dxos/client");
const { Space } = require("@dxos/client/echo");
const { InvitationEncoder } = require('@dxos/client/invitations');

export async function initDxos(): Promise<Client> {
  const client = new Client();
  console.log('DXOS initialize');
  await client.initialize();
  if (!client.halo.identity.get()) {
    console.log('creating DXOS identity');
    await client.halo.createIdentity();
  }
  console.log('DXOS waiting for spaces to be ready');
  await client.spaces.isReady.wait();
  console.log('DXOS spaces ready');
  return client;
}
export async function acceptInvite(client: Client, code: string, authCode: string): Promise<Space> {
  const receivedInvitation = InvitationEncoder.decode(code);
  const invitation = client.spaces.join(receivedInvitation);
  await invitation.authenticate(authCode);
  return client.spaces.get(invitation.get().spaceKey!)!;
}

export async function generateInvite(client: Client): Promise<{ space: object, code: string, authCode: string }> {
  const space = client.spaces.default;
  const invitation = space.share();
  const code = InvitationEncoder.encode(invitation.get());
  const authCode = invitation.get().authCode!;
  console.log('DXOS share invitation', code, authCode);
  return { space, code, authCode };  
}