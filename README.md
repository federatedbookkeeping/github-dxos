# Work in Progress

```
npm install
npm run build
cp replicas.example.json replicas.json
# Configure replicas and
# add your API credentials for then
npm start
```

In the current implementation,
data will only be downloaded if it's missing.
You need to delete the files under `./replica-data/` to trigger a re-fetch.
That's just for debugging! In the working version, each change in any of the
replicas should immediately trigger the replica-data of that replica to update,
then the data-store, and then all other replicas.

To generate personal access tokens for GitHub, visit
[Fine-grained personal access tokens](https://github.com/settings/tokens?type=beta)
and click [Generate new token](https://github.com/settings/personal-access-tokens/new).
The token will need read and write on Issues.

For access to org-owned repos, make sure you [enroll the org first](https://github.com/organizations/federatedbookkeeping/settings/personal-access-tokens-onboarding)