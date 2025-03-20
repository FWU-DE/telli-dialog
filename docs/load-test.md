## load tests

If you need to load test, you need to install `k6` beforehand.

```sh
brew install k6
```

The load tests logic is contained inside the `e2e/load_test` folder.

There are two commands you can run:

```sh
pnpm k6:run:ui
```

This runs one user load tests with the browser enabled so you can see what the load test is doing exactly.

To execute the actual load test, run the following command:

```sh
pnpm k6:run
```
