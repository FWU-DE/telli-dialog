# E2E Testing

This folder contains the files and configurations to e2e test this app.
Due do the complexity of having the actual vidis authentication provider in the pipeline,
there is a mock oidc server vidis server configured in the `vidis-mock-server.ts` file.
It exposes an OIDC compliant mock server on http://localhost:9000.

When doing an e2e test which tests or requires an authed user (so most of the time).
You should run the mock server and change the env variables required for this in the `.env`.
