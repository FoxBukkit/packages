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
		github_release: {
			type: 'github_release',
			url: 'https://api.github.com/',
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
		},
		{
			repository: 'github_release',
			source: 'turikhay/MapModCompanion',
			destination:  'plugins/MapModCompanion.jar',
			params: {
				assetName: 'MapModCompanion.jar',
			},
		},
		{
			repository: 'github_release',
			source: 'dmulloy2/ProtocolLib',
			destination:  'plugins/ProtocolLib.jar',
			params: {
				assetName: 'ProtocolLib.jar',
			},
		},
	]
};
