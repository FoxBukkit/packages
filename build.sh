#!/bin/bash
set -ex

for repo in `cat maven-repos.txt`
do
    git clone "https://github.com/FoxBukkit/$repo"
    pushd "$repo"
    mvn --batch-mode --update-snapshots clean package deploy
    popd
done
