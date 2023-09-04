#!/bin/bash
set -ex
cd "$1"

update_package() {
	node /tools/maven-downloader/index.js "$1" "$1.jar"
}

update_package foxbukkit-permissions
update_package foxbukkit-chat
update_package foxbukkit-lua

if [ -d FoxBukkitLua/modules ]
then
    git -C FoxBukkitLua/modules pull
else
    git clone https://github.com/FoxBukkit/foxbukkit-lua-modules FoxBukkitLua/modules
fi

wget https://dev.bukkit.org/projects/worldedit/files/latest -O worldedit.jar
wget https://dev.bukkit.org/projects/worldguard/files/latest -O worldguard.jar