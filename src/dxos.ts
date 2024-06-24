import { Client } from '@dxos/client';

export class Replica {
  client: Client;
  space: object;
  constructor() {
    this.client = new Client();
  }
  async init(): Promise<void> {
    await this.client.initialize();
    if (!this.client.halo.identity.get()) {
      await this.client.halo.createIdentity();
    }
    this.space = await this.client.spaces.create();
  }
}
