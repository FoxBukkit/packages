import { Item, Repository, Updater } from "./interfaces.js";
import { fetchSimple, fetchToFileWithContentMD5 } from "./util.js";

interface MinimalGithubAsset {
    name: string;
    url: string;
    browser_download_url: string;
}

interface MinimalGithubRelease {
    assets: MinimalGithubAsset[];
}

export class GithubReleaseUpdater implements Updater {
    public async run(item: Item, repo: Repository): Promise<void> {
        const latestReleaseResp = await fetchSimple(`repos/${item.source}/releases/latest`, repo);
        const latestReleaseInfo = (await latestReleaseResp.json()) as MinimalGithubRelease;

        const targetAssetName = item.params?.assetName;
        const asset = latestReleaseInfo.assets.find((asset) => {
            return (!targetAssetName) || (targetAssetName === asset.name);
        });

        if (!asset) {
            throw new Error('No asset found!');
        }

        await fetchToFileWithContentMD5(asset.browser_download_url, repo, item);
    }

    public getName(): string {
        return 'github_release';
    }
}
