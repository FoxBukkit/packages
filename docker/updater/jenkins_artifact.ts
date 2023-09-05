// https://ci.codemc.io/job/pop4959/job/LWC//lastSuccessfulBuild/api/json
// https://ci.codemc.io/job/pop4959/job/LWC/lastSuccessfulBuild/artifact/build/libs/LWC-2.3.1.jar

import { Item, Repository, Updater } from "./interfaces.js";
import { fetchSimple, fetchToFile, fetchToFileWithContentMD5 } from "./util.js";

interface Artifact {
    displayPath: string;
    fileName: string;
    relativePath: string;
}

interface MinimalJenkinsBuild {
    artifacts: Artifact[];
}

export class JenkinsArtifactUpdater implements Updater {
    public async run(item: Item, repo: Repository): Promise<void> {
        const buildUrl = `${item.source}/lastSuccessfulBuild`;
        const latestBuildResp = await fetchSimple(`${buildUrl}/api/json`, repo);
        const latestBuildInfo = (await latestBuildResp.json()) as MinimalJenkinsBuild;

        const fileNameMatcher = new RegExp(item.params['artifactRegex']);

        const artifact = latestBuildInfo.artifacts.find((asset) => {
            return fileNameMatcher.test(asset.fileName);
        });

        if (!artifact) {
            throw new Error('No artifact found!');
        }

        await fetchToFile(`${buildUrl}/artifact/${artifact.relativePath}`, repo, item);
    }

    public getName(): string {
        return 'jenkins_artifact';
    }
}
