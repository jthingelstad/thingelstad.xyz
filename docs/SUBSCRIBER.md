# GitHub push subscriber (off)

The sync intake accepts signed pushes only for the public repositories in
this registry. Its proposed API destination pins sync-rebuild.yml. The
workflow defaults to a credential-free dry run; real work additionally
requires SYNC_REBUILD_ENABLED=true and dispatches the existing collector.
It passes only the pushed registered repository. The collector's existing
selector refreshes that repository and its commit evidence; website,
Wayback, Tinylytics and screenshot collection are skipped. Its own
repository is excluded to prevent collection commits creating a loop.
Targeted collection PRs supersede only the same repository's earlier PR;
they never close a pending full collection PR. Ordinary manual and daily
collection keep their existing broad behavior.
The global collector remains serialized, with GitHub's `queue: max` keeping
up to 100 pending selectors instead of replacing a different repository's
pending run. Each starts from current main. Requests beyond GitHub's queue
limit can still be canceled; the daily collection remains the backstop.
See [GitHub's concurrency contract](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
That collector's validation, pull request, checks and publish path remain
the authority. The existing daily collection clock stays in place until a
natural event proves the new route. No observation or content was collected
or published to rehearse this proposal, and this PR stays unmerged.

Jamie adds github_registry_actions_token to sync-runtime: a fine-grained PAT
limited to thingelstad.xyz with Actions write. GitHub does not scope a PAT
to one workflow; the static connection endpoint and role do. Configure the
rehearsal lane first. No value enters a session. Duplicate event delivery
can request collection again; the existing collector serializes its runs
and does nothing when its observations have not changed.
