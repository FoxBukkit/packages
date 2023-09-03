#!/bin/bash
set -ex

mkdir -p repos
cd repos

for repo in `cat ../maven-repos.txt`
do
    git clone "https://github.com/FoxBukkit/$repo"
    pushd "$repo"
    mvn --batch-mode --update-snapshots clean package deploy -s "$GITHUB_WORKSPACE/settings.xml"
    popd
done
