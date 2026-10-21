# Throwaway — negative proof of the Mobile UI path filter

This file exists only so a pull request diff touches `apps/api/**` and nothing
else. It verifies that PR #137 removed `apps/api/**` from the `pull_request`
trigger of `.github/workflows/mobile-ui.yml`.

Expected: this pull request produces a `CI` run and NO `Mobile UI` run at all.
The proof is the absence of the run, so it costs zero macOS minutes.

This branch is closed without merging.
