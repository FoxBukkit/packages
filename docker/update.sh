#!/bin/bash
set -ex
cd "$1"

npm start --prefix /tools/updater

wget https://dev.bukkit.org/projects/worldedit/files/latest -O worldedit.jar
wget https://dev.bukkit.org/projects/worldguard/files/latest -O worldguard.jar
