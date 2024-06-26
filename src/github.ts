import { convertComment, convertIssue } from "./cambria";
import { Item, Issue, Comment, DataStore } from "./data";
const fsPromises = require("fs/promises");

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
  tokens: {
    [user: string]: string;
  };
  trackerUrl: string;
  dataPath: string;
};

export class GitHubReplica {
  tokens: {
    [user: string]: string;
  };
  trackerUrl: string;
  dataStore: DataStore;
  dataPath: string;
  constructor(spec: GitHubReplicaSpec, dataStore: DataStore) {
    this.tokens = spec.tokens;
    this.trackerUrl = spec.trackerUrl;
    this.dataPath = spec.dataPath;
    this.dataStore = dataStore;
  }

  async apiCall(args: { url: string, method: string, body?: string, user: string }): Promise<any> {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (typeof args.user === 'string') {
      if (typeof this.tokens[args.user] !== "string") {
        // console.log(this.tokens);
        throw new Error(`No token available for user "${args.user}"`);
      }
      headers['Authorization'] = `Bearer ${this.tokens[args.user]}`;
    }
    console.log('apiCall', args);
    const fetchResult = await fetch(args.url, {
      method: args.method,
      headers,
      body: args.body,
    });
    return fetchResult.json();
  }
  async getDataOverNetwork(url: string, user: string): Promise<GitHubIssue[]> {
    return this.apiCall({ url, method: "GET", user });
  }

  async remoteCreate(user: string, url: string, data: object): Promise<string> {
    const args = {
      user,
      url,
      method: "POST",
      body: JSON.stringify(data, null, 2)
  };
    const response = await this.apiCall(args) as { url: string };
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
    return this.getData(filename, this.trackerUrl + `/issues`, user);
  }

  async addIssue(user: string, issue: GitHubIssueAdd): Promise<string> {
    return this.remoteCreate(user, `${issue.repository_url}/issues`, issue);
  }
  async addComment(user: string, comment: GitHubCommentAdd): Promise<string> {
    return this.remoteCreate(user, `${comment.issue_url}/comments`, comment);
  }

  async addItem(user: string, item: Item) {
    if (item.type === "issue") {
      return this.addIssue(user, {
        repository_url:
          "https://api.github.com/federatedbookkeeping/task-tracking",
        title: (item as Issue).title,
        body: "",
      });
    }
    if (item.type === "comment") {
      const issueUrlCandidates = this.dataStore.issueIdToIssueIds(
        (item as Comment).issueId
      );
      for (let i = 0; i < issueUrlCandidates.length; i++) {
        if (issueUrlCandidates[i].startsWith("gh_api_url:")) {
          return this.addComment(user, {
            issue_url: issueUrlCandidates[i].substring("gh_api_url:".length),
            body: (item as Comment).body,
          });
        }
      }
    }
  }

  async upsert(user: string, item: Item): Promise<void> {
    let ghApiUrl: string | undefined = item.identifiers.find((x: string) =>
      x.startsWith("gh_api_url:")
    );
    if (typeof ghApiUrl === "undefined") {
      ghApiUrl = await this.addItem(user, item);
    }
  }
  async sync(user) {
    const docs: GitHubIssue[] = await this.getIssues(`${this.dataPath}/issues.json`, user);
    let comments: GitHubComment[] = [];
    const commentFetches = docs.map(async doc => {
      const issueComments = await this.getData(`${this.dataPath}/comments_${doc.node_id}.json`, doc.comments_url, user);
      comments = comments.concat(issueComments);
    });
    await Promise.all(commentFetches);
    const docUpserts = docs.map(async (doc) => {
      console.log('upserting doc', doc);
      this.dataStore.applyOperation({
        operationType: 'upsert',
        fields: await convertIssue(doc)
      });
    });
    await Promise.all(docUpserts);
    const commentUpserts = comments.map(async (comment) => {
      console.log('upserting comment', comment);
      this.dataStore.applyOperation({
        operationType: 'upsert',
        fields: await convertComment(comment)
      });
    });
    await Promise.all(commentUpserts);
    // console.log(this.dataStore.items);
  
  }
}
