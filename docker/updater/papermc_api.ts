import { Item, Repository, Updater } from "./interfaces.js";
import { fetchSimple, fetchToFile, fileHashString } from "./util.js";

interface MinimalPaperBuild {
    build: number;
    time: string;
    downloads: {
        [key: string] : {
            name: string;
            sha256: string;
        }
    };
}

interface MinimalPaperAPI {
    builds: MinimalPaperBuild[];
}

export class PaperMCUpdater implements Updater {
    public async run(item: Item, repo: Repository): Promise<void> {
        const baseUrl = `projects/${item.source}/versions/${item.params!.version!}/builds`;
        const latestReleaseResp = await fetchSimple(baseUrl, repo);
        const latestReleaseInfo = (await latestReleaseResp.json()) as MinimalPaperAPI;

        const build = latestReleaseInfo.builds.reduce((latestBuild, build) => {
            if (!latestBuild || build.build > latestBuild.build)  {
                return build;
            }
            return latestBuild;
        }, null);
        if (!build) {
            throw new Error('No build found!');
        }

        const buildDownload = build.downloads[item.params!.download];
        if (!buildDownload) {
            throw new Error('No build download found!');
        }

        const localHash = await fileHashString(item, 'sha256');
        if (buildDownload.sha256 === localHash) {
            console.log('Hashes already match!');
            return;
        }

        await fetchToFile(`${baseUrl}/${build.build}/downloads/${buildDownload.name}`, repo, item);

    }

    public getName(): string {
        return 'papermc_api';
    }
}
