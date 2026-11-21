# Adding a set

A set is added in a minor release, by three changes: the set's `@iconify-json/<set>` package as an
exact devDependency; its upstream LICENSE in `licenses/<set>/LICENSE`, byte for byte, fetched at the
upstream tag the package's data follows; and its entry in `sets.json`, naming the package, the
LICENSE's path and sha256, and the repository, commit, and tag it was fetched from. The build then
generates it into `dist/<set>/`, or fails naming the set when its licence isn't one of those the
README's [Sets and licences](../README.md#sets-and-licences) names. The version's minor number
moves, as the release adds modules and removes none, and the CHANGELOG's entry names the set and its
licence.
