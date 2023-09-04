import { config } from './config.js';
import { GitUpdater } from './git.js';
import { GithubReleaseUpdater } from './github_release.js';
import { Updater } from './interfaces.js';
import { MavenUpdater } from './maven.js';

const updaters: { [key: string]: Updater } = {
    maven: new MavenUpdater(),
    git: new GitUpdater(),
    github_release: new GithubReleaseUpdater(),
}

async function main() {
	for (const item of config.items) {
		const repo = config.repos[item.repository];
        const updater =  updaters[repo.type];
		console.log(`Updating ${item.source} through ${repo.type} repository at ${repo.url} using ${updater.getName()}`);
        await updater.run(item, repo);
		console.log(`Update of ${item.source} done!`);
	}
}

main().then(() => console.log('OK')).catch(e => console.error(e.stack));
