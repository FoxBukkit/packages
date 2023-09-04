#!/bin/bash
set -ex
cd "$1"

npm start --prefix /tools/updater
