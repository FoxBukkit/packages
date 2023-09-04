import { Item, Repository, Updater } from "./interfaces.js";
import { fetchToFile, fileHashString, fetchSimple, compareVersions } from "./util.js";
import { parseStringPromise } from 'xml2js';

export class MavenUpdater implements Updater {
    public async run(item: Item, repo: Repository): Promise<void> {
        const hashAlgo = repo.params?.hashAlgo ?? 'sha1';
    
        const baseUrl = item.source.replace(/[:.]/g, '/');
        const artifactId = item.source.replace(/^.*:/, '');
    
        const metadataRes = await fetchSimple(`${baseUrl}/maven-metadata.xml`, repo);
        const metadata = await parseStringPromise(await metadataRes.text());
    
        const latestVersion = metadata.metadata.versioning[0].versions[0].version.reduce((latestVersion, version) => {
            if (!latestVersion || compareVersions(version, latestVersion)) {
                return version;
            } else {
                return latestVersion;
            }
        }, null);
    
        if (!latestVersion) {
            throw new Error('No version found');
        }
    
        const versionUrl = `${baseUrl}/${latestVersion}`;
    
        const versionMetadataRes = await fetchSimple(`${versionUrl}/maven-metadata.xml`, repo);
        const versionMetadata = await parseStringPromise(await versionMetadataRes.text());
    
        const jarSnapshot = versionMetadata.metadata.versioning[0].snapshotVersions[0].snapshotVersion.filter(snapshot => {
            return (snapshot.extension[0] === 'jar' && !snapshot.classifier);
        }).reduce((latestJarSnapshot, currentJarSnapshot) => {
            if (!latestJarSnapshot) {
                return currentJarSnapshot;
            }
        
            if (latestJarSnapshot.updated[0].localeCompare(currentJarSnapshot.updated[0]) < 0) {
                return currentJarSnapshot;
            }
    
            return latestJarSnapshot;
        }, null);
    
        if (!jarSnapshot) {
            throw new Error('No binary snapshot found');
        }
    
        const jarUrl = `${versionUrl}/${artifactId}-${jarSnapshot.value[0]}.jar`;
        const hashUrl = `${jarUrl}.${hashAlgo}`;
    
        const hashResponse = await fetchSimple(hashUrl, repo);
        const remoteHash = (await hashResponse.text()).trim();
    
        const localHash = await fileHashString(item, hashAlgo);
        if (remoteHash === localHash) {
            console.log('Hashes already match!');
            return;
        }

        await fetchToFile(jarUrl, repo, item);
    }

    public getName(): string {
        return 'maven';
    }
}
