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