import { Item, Repository, Updater } from "./interfaces.js";
import { fetchToFileWithContentMD5 } from "./util.js";

export class DevBukkitOrgUpdater implements Updater {
    public async run(item: Item, repo: Repository): Promise<void> {
        await fetchToFileWithContentMD5(`projects/${item.source}/files/latest`, repo, item, 'etag', 'hex');
    }

    public getName(): string {
        return 'dev_bukkit_org';
    }
}
