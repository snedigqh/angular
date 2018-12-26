# Copyright Google Inc. All Rights Reserved.
#
# Use of this source code is governed by an MIT-style license that can be
# found in the LICENSE file at https://angular.io/license

"""Package file which defines dependencies of Angular rules in skylark
"""

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def rules_angular_dependencies():
    """
    Fetch our transitive dependencies.

    If the user wants to get a different version of these, they can just fetch it
    from their WORKSPACE before calling this function, or not call this function at all.
    """

    #
    # Download Bazel toolchain dependencies as needed by build actions
    # Use a SHA to get fix for needing symlink_prefix during npm publishing
    # TODO(alexeagle): update to release later than 0.16.4
    _maybe(
        http_archive,
        name = "build_bazel_rules_nodejs",
        url = "https://github.com/bazelbuild/rules_nodejs/archive/bbf31af8aafad8dd5193356081c6b233ba143aa3.zip",
        strip_prefix = "rules_nodejs-bbf31af8aafad8dd5193356081c6b233ba143aa3",
    )

    _maybe(
        http_archive,
        name = "build_bazel_rules_typescript",
        url = "https://github.com/bazelbuild/rules_typescript/archive/0.22.0.zip",
        strip_prefix = "rules_typescript-0.22.0",
    )

    # Needed for Remote Execution
    _maybe(
        http_archive,
        name = "bazel_toolchains",
        sha256 = "07a81ee03f5feae354c9f98c884e8e886914856fb2b6a63cba4619ef10aaaf0b",
        strip_prefix = "bazel-toolchains-31b5dc8c4e9c7fd3f5f4d04c6714f2ce87b126c1",
        urls = [
            "https://mirror.bazel.build/github.com/bazelbuild/bazel-toolchains/archive/31b5dc8c4e9c7fd3f5f4d04c6714f2ce87b126c1.tar.gz",
            "https://github.com/bazelbuild/bazel-toolchains/archive/31b5dc8c4e9c7fd3f5f4d04c6714f2ce87b126c1.tar.gz",
        ],
    )

def rules_angular_dev_dependencies():
    """
    Fetch dependencies needed for local development, but not needed by users.

    These are in this file to keep version information in one place, and make the WORKSPACE
    shorter.
    """

    # We have a source dependency on the Devkit repository, because it's built with
    # Bazel.
    # This allows us to edit sources and have the effect appear immediately without
    # re-packaging or "npm link"ing.
    # Even better, things like aspects will visit the entire graph including
    # ts_library rules in the devkit repository.
    http_archive(
        name = "angular_cli",
        sha256 = "8cf320ea58c321e103f39087376feea502f20eaf79c61a4fdb05c7286c8684fd",
        strip_prefix = "angular-cli-6.1.0-rc.0",
        url = "https://github.com/angular/angular-cli/archive/v6.1.0-rc.0.zip",
    )

    http_archive(
        name = "org_brotli",
        sha256 = "774b893a0700b0692a76e2e5b7e7610dbbe330ffbe3fe864b4b52ca718061d5a",
        strip_prefix = "brotli-1.0.5",
        url = "https://github.com/google/brotli/archive/v1.0.5.zip",
    )

    #############################################
    # Dependencies for generating documentation #
    #############################################
    http_archive(
        name = "io_bazel_rules_sass",
        strip_prefix = "rules_sass-1.15.1",
        url = "https://github.com/bazelbuild/rules_sass/archive/1.15.1.zip",
    )

    http_archive(
        name = "io_bazel_skydoc",
        strip_prefix = "skydoc-a9550cb3ca3939cbabe3b589c57b6f531937fa99",
        # TODO: switch to upstream when https://github.com/bazelbuild/skydoc/pull/103 is merged
        url = "https://github.com/alexeagle/skydoc/archive/a9550cb3ca3939cbabe3b589c57b6f531937fa99.zip",
    )

def _maybe(repo_rule, name, **kwargs):
    if name not in native.existing_rules():
        repo_rule(name = name, **kwargs)
