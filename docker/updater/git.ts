import { Item, Repository, Updater } from "./interfaces.js";
import { mkdir } from 'node:fs/promises';
import { ExecFileOptions } from 'node:child_process';
import { exists, execFileAsync, makeAbsoluteDestination } from "./util.js";

export class GitUpdater implements Updater {
    public async run(item: Item, repo: Repository): Promise<void> {
        const gitUrl = `${repo.url}${item.source}`;
        const branch = item.params?.branch ?? 'main';
        const options: ExecFileOptions = {
            cwd: makeAbsoluteDestination(item),
        };

        if (!(await exists(item))) {
            try {
                await mkdir(makeAbsoluteDestination(item));
            } catch { }
            await execFileAsync('git', ['init'], options);
            await execFileAsync('git', ['remote', 'add', 'origin', gitUrl], options);
        } else {
            await execFileAsync('git', ['remote', 'set-url', 'origin', gitUrl], options);
        }

        await execFileAsync('git', ['fetch', 'origin'], options);
        await execFileAsync('git', ['reset', '--hard', `origin/${branch}`], options);
    }

    public getName(): string {
        return 'git';
    }
}
