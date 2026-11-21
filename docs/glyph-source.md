# Glyph source

The glyph data comes from [Iconify](https://iconify.design)'s per-set packages, `@iconify-json/*`,
read at this package's build, never at a consumer's. Iconify is MIT-licensed code from Iconify OÜ,
Estonia. Its data keeps each set's upstream licence, modified by Iconify Tools, and follows each
set's upstream repository, some sets within minutes of an upstream release, others days behind.

Iconify is a single-maintainer risk: one maintainer, cyberalien, made 87% of iconify/iconify's
human commits and 99% of iconify/icon-sets'. The released modules don't depend on it: each is a
plain string, so a release already cut keeps working whatever becomes of Iconify, and only the
next build would need another source of the same set.
