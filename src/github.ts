import { convertComment, convertIssue } from "./cambria";
import { Item, Issue, Comment, DataStore, Operation } from "./data";
const fsPromises = require("fs/promises");


const DEFAULT_HTTP_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const API_URL_ID_SCHEME = 'gh_api_url';
const REL_API_PATH_ISSUES = `/issues`;
const REL_API_PATH_COMMENTS = `/comments`;

export interface GitHubIssue {
  repository_url: string;
  url: string;
  node_id: string;
  comments_url: string;
  title: string;
  body: string;
  comments: object[];
}
export interface GitHubIssueAdd {
  repository_url: string;
  title: string;
  body: string;
}

export interface GitHubComment {
  node_id: string;
  url: string;
  issue_url: string;
  body: string;
}

export interface GitHubCommentAdd {
  issue_url: string;
  body: string;
}

export type GitHubReplicaSpec = {
  name: string;
  tokens: {
    [user: string]: string;
  };
  defaultUser: string;
  trackerUrl: string;
  dataPath: string;
};

export class GitHubReplica {
  spec: GitHubReplicaSpec;
  dataStore: DataStore;
  apiUrlIdentifierPrefix: string;
  constructor(spec: GitHubReplicaSpec, dataStore: DataStore) {
    this.spec = spec;
    this.apiUrlIdentifierPrefix = `${API_URL_ID_SCHEME}:${this.spec.trackerUrl}`;
    this.dataStore = dataStore;
    this.dataStore.on("operation", async (operation: Operation) => {
      if (operation.origin === this.spec.name) {
        return;
      }
      console.log(`Replica ${this.spec.name} sees operation`, operation);
      await this.handleOperation(operation);
      console.log(`Replica ${this.spec.name} finished handling operation`);
    });
  }

  async apiCall(args: {
    url: string;
    method: string;
    body?: string;
    user: string;
  }): Promise<any> {
    const headers = DEFAULT_HTTP_HEADERS;
    if (typeof args.user === "string") {
      if (typeof this.spec.tokens[args.user] !== "string") {
        // console.log(this.spec.tokens);
        throw new Error(`No token available for user "${args.user}"`);
      }
      headers["Authorization"] = `Bearer ${this.spec.tokens[args.user]}`;
    }
    console.log("apiCall", args);
    const fetchResult = await fetch(args.url, {
      method: args.method,
      headers,
      body: args.body,
    });
    // console.log(fetchResult);
    return fetchResult.json();
  }
  async getDataOverNetwork(url: string, user: string): Promise<GitHubIssue[]> {
    return this.apiCall({ url, method: "GET", user });
  }

  async remoteCreate(user: string, url: string, data: object): Promise<string> {
    console.log('remoteCreate', user, url);
    const args = {
      user,
      url,
      method: "POST",
      body: JSON.stringify(data, null, 2),
    };
    const response = (await this.apiCall(args)) as { url: string };
    // console.log(response);
    return response.url;
  }

  async getData(filename: string, url: string, user: string): Promise<any> {
    let issues: GitHubIssue[] = [];
    try {
      const buff = await fsPromises.readFile(filename);
      issues = JSON.parse(buff.toString());
      console.log(`Loaded ${filename}`);
    } catch {
      console.log(`Failed to load ${filename}, fetching over network`);
      issues = await this.getDataOverNetwork(url, user);
      await fsPromises.writeFile(
        filename,
        JSON.stringify(issues, null, 2) + "\n"
      );
      console.log(`Saved ${filename}`);
    }
    return issues;
  }

  async getIssues(filename: string, user: string): Promise<GitHubIssue[]> {
    return this.getData(filename, this.spec.trackerUrl + REL_API_PATH_ISSUES, user);
  }

  async addIssue(user: string, issue: GitHubIssueAdd): Promise<string> {
    return this.remoteCreate(user, issue.repository_url + REL_API_PATH_ISSUES, issue);
  }
  async addComment(user: string, comment: GitHubCommentAdd): Promise<string> {
    return this.remoteCreate(user, comment.issue_url + REL_API_PATH_COMMENTS, comment);
  }

  async addItem(user: string, item: Item): Promise<string> {
    if (item.type === "issue") {
      return this.addIssue(user, {
        repository_url: this.spec.trackerUrl,
        title: (item as Issue).title,
        body: (item as Issue).body,
      });
    }
    if (item.type === "comment") {
      const issueUrlCandidates = this.dataStore.issueIdToIssueIds(
        (item as Comment).issueId
      );
      console.log(`found issue url candidate for ${(item as Comment).issueId}`, issueUrlCandidates);
      for (let i = 0; i < issueUrlCandidates.length; i++) {
        if (issueUrlCandidates[i].startsWith(this.apiUrlIdentifierPrefix)) {
          return this.addComment(user, {
            issue_url: issueUrlCandidates[i].substring(API_URL_ID_SCHEME.length),
            body: (item as Comment).body,
          });
        }
      }
      throw new Error('cannot post comment if issue doesnt exist');
    }
    throw new Error(`Unknown item type ${item.type}`);
  }

  async upsert(user: string, item: Item): Promise<string | undefined> {
    let ghApiUrl: string | undefined = item.identifiers.find((x: string) =>
      x.startsWith(this.apiUrlIdentifierPrefix)
    );
    console.log('no identifier found with prefix', this.apiUrlIdentifierPrefix);
    if (typeof ghApiUrl === "undefined") {
      return this.addItem(user, item);
    }
  }

  async handleOperation(operation: Operation) {
    switch (operation.operationType) {
      case "upsert":
        const item = operation.fields as Item;
        const additionalIdentifier: string | undefined = await this.upsert(this.spec.defaultUser, item);
        console.log('additional identifier camem back from upsert', additionalIdentifier);
        if (typeof additionalIdentifier === 'string') {
          this.dataStore.addIdentifier(item.identifiers[0], additionalIdentifier);
        }
        break;
      case "merge":
        // not implemented yet
        break;
      case "fork":
        // not implemented yet
        break;
      default:
        console.error("unknown operation type", operation);
    }
  }
  getIssuesFilePath() {
    return `${this.spec.dataPath}/issues.json`;
  }
  getCommentsFilePath(nodeId: string) {
    return `${this.spec.dataPath}/comments_${nodeId}.json`;
  }
  async sync() {
    const docs: GitHubIssue[] = await this.getIssues(
      this.getIssuesFilePath(),
      this.spec.defaultUser
    );
    let comments: GitHubComment[] = [];
    const commentFetches = docs.map(async (doc) => {
      const issueComments = await this.getData(
        this.getCommentsFilePath(doc.node_id),
        doc.comments_url,
        this.spec.defaultUser
      );
      comments = comments.concat(issueComments);
    });
    await Promise.all(commentFetches);
    const docUpserts = docs.map(async (doc) => {
      // console.log('upserting doc', doc);
      this.dataStore.applyOperation({
        origin: this.spec.name,
        operationType: "upsert",
        fields: await convertIssue(doc),
      });
    });
    await Promise.all(docUpserts);
    const commentUpserts = comments.map(async (comment) => {
      // console.log('upserting comment', comment);
      this.dataStore.applyOperation({
        origin: this.spec.name,
        operationType: "upsert",
        fields: await convertComment(comment),
      });
    });
    await Promise.all(commentUpserts);
    // console.log(this.dataStore.items);
  }
}
