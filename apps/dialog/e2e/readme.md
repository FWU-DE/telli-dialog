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

Make sure that there is a `.env.local` file that contains the configuration necessary for the tests to run.

Ensure that all the requried browsers are installed

```sh
pnpm playwright install
```

Then you can run the e2e tests.

1. `pnpm e2e` - This runs all tests in headless mode without a visible browser.
2. `pnpm e2e:headed` - This runs the tests in a visible browser.
3. `pnpm e2e:ui` - This starts a graphical interface where the test are run. You can rerun tests directly within the interface.
4. `pnpm e2e:api` - This runs the api tests.

### Run tests in vscode

In order to run tests directly in vscode, the extension `Playwright Test for VSCode` is recommended.
The extension provides a `Test Explorer` available through the `Testing` icon on the left menu bar.
Run or debug a test directly from here.
