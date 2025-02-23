# Issues

This is an incomplete list of know issues and their ways around.

1.
Using `pnpm dev:turbo` leads to much faster dev mode and faster page loads resulting in a way developer flow.
Con: Currently sentry (logging) is not fully working with turbomode and can therefore lead to undefined behhaviour.
If you debug some logging specific issue, it is recommended to run `pnpm dev`.
