# E2E Testing

This folder contains test files and utils for running e2e and api tests.

One of the most notable things is an oidc mock provider to mock [VIDIS](https://www.vidis.schule/)

## Mock OIDC Vidis

Due do the complexity of having the actual vidis authentication provider in the pipeline,
there is a mock oidc server vidis server configured in the [`vidis-mock-server.ts`](./vidis-mock-server.ts) file.

It exposes an OIDC compliant mock server (with VIDIS claims) on [http://localhost:9000](http://localhost:9000).

To run the mock vidis provider:

```sh
pnpm start:oidc
```

In the console you will see the credentials that the `telli-chatbot` needs to connect to it.

There are currently two users specified and returned by the provider. The username for one is `teacher` and for the other is `student`:

```js
teacher: {
    sub: 'f4830567-2ca9-4b9c-9c27-1900d443c07c',
    schulkennung: 'school1',
    rolle: 'LEHR',
    bundesland: 'DE-BY',
},
    student: {
    sub: '322594dc-548c-45be-b880-fda58fe863d3',
    schulkennung: 'school1',
    rolle: 'LERN',
    bundesland: 'DE-BY',
},
```

When being directed for the oidc provider page and the username and password, you just have to specify the username. The password currently does not matter.

## Run e2e tests

Ensure that all the requried browsers are installed

```sh
pnpm playwright install
```

Before running the e2e test locally is is recommended to manually build and start the app beforehand:

```sh
pnpm build:e2e && pnpm start:e2e
```

Those command are the same as `pnpm build:envless` but use the `.env.e2e` file as the environment file.

Then you can run the e2e tests. There are two main ways of doing it:

1. `pnpm e2e:op` - This runs in headless mode and is also the command that is executed in the CI, you will most likely not be able to debug there.
2. `pnpm e2e:ui` - This starts a browser where the test are run it, so you can see live what is happening and debug.

## Run api tests

### Prerequisites

Make sure that there is a `.env.local` file that contains the configuration necessary for the api tests to run.
At least the following keys are needed:

- API_KEY
- DATABASE_URL

### Run api tests via command line

The following command will run all api tests that are located in the api test folder.
If no running web server is located, playwright will start one (see playwright.config.ts for details).

```sh
pnpm e2e:api
```

### Run api tests in vscode

In order to run api tests directly in vscode, the extension `Playwright Test for VSCode` is recommended.
The extension provides a `Test Explorer` available through the `Testing` icon on the left menu bar.
Run or debug a test directly from here.
