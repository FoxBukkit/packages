import { Item, Repository } from "./interfaces.js";

export const config: {
	repos: { [key: string]: Repository };
	items: Item[];
} = {
	repos: {
		foxbukkit_maven: {
			type: 'maven',
			url: 'https://maven.pkg.github.com/foxbukkit/packages/',
			authorization: 'Basic ' + Buffer.from(`pat:${process.env['MAVEN_GITHUB_TOKEN']}`).toString('base64'),
			params: {
				hashAlgo: 'sha1',
			}
		},
		github: {
			type: 'git',
			url: 'https://github.com/',
		},
	},
	items: [
		{
			repository: 'foxbukkit_maven',
			source: 'net.doridian.foxbukkit:foxbukkit-permissions',
			destination: 'plugins/foxbukkit-permissions.jar',
		},
		{
			repository: 'foxbukkit_maven',
			source: 'net.doridian.foxbukkit:foxbukkit-chat',
			destination: 'plugins/foxbukkit-chat.jar',
		},
		{
			repository: 'foxbukkit_maven',
			source: 'net.doridian.foxbukkit:foxbukkit-lua',
			destination: 'plugins/foxbukkit-lua.jar',
		},
		{
			repository: 'github',
			source: 'FoxBukkit/foxbukkit-lua-modules',
			destination: 'plugins/FoxBukkitLua/modules',
		}
	]
};
