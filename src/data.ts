export type OperationType = 'upsert' | 'merge' | 'fork';
export type ObjectType = 'issue' | 'worked' | 'comment';

export type Item = {
  identifiers: Set<string>,
  deleted: boolean;
}

export type Issue = {
  identifiers: Set<string>,
  deleted: boolean,
  title: string,
  completed: boolean
};

export type Worked = {
  identifiers: Set<string>,
  deleted: boolean,
  userId: string,
  project: string,
  task: string,
  description: string,
  startTime: string,
  endTime: string,
  date: string
};

export type Comment = {
  identifiers: Set<string>,
  deleted: boolean,
  issueId: string,
  text: string
}

export type Operation = {
  operationType: OperationType,
  fields: Partial<Issue> | Partial<Worked> | Partial<Comment>
};

export class DataStore {
  items: Item[] = [];
  match(identifiers: Set<string>, cb: (i: number, id: string) => void) {
    for (let i = 0; i < this.items.length; i++) {
      for (const id of identifiers) {
        if (this.items[i].identifiers.has(id)) {
          cb(i, id);
        }
      }
    }
  }
  applyOperation(operation: Operation) {
    switch(operation.operationType) {
      case 'upsert':
        let matched = false;
        this.match(operation.fields.identifiers!, (i: number) => {
          this.items[i] = { ...this.items[i], ...operation.fields };
          matched = true;
        });
        if (!matched) {
          this.items.push(operation.fields as Item);
        }
      break;
      case 'merge':
        let winner = -1;
        this.match(operation.fields.identifiers!, (i: number) => {
          if (winner === -1) {
            winner = i;
          } else {
            for (const id of this.items[i].identifiers) {
              this.items[winner].identifiers.add(id);
              this.items[i].identifiers.delete(id);
            }
            this.items[i].deleted = true;
          }
        });
        case 'fork':
          let added = -1;
          this.match(operation.fields.identifiers!, (i: number, id: string) => {
            if (added === -1) {
              added = this.items.length;
              this.items.push({ ...this.items[i]});
              this.items[added].identifiers.clear();
            }
            this.items[added].identifiers.add(id);
            this.items[i].identifiers.delete(id);
          });
        default:
    }
  }
}