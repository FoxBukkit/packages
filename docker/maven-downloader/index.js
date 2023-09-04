'use strict';

import { createWriteStream, createReadStream } from 'node:fs';
import { parseStringPromise } from 'xml2js';
import fetch from 'node-fetch';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import config from './config.js';
import { createHash } from 'node:crypto';

const streamPipeline = promisify(pipeline);

const authToken = process.env['MAVEN_GITHUB_TOKEN'];
const authBasic = Buffer.from(`pat:${authToken}`).toString('base64');
const authHeader = `Basic ${authBasic}`;

function _prepareVersionStr(v) {
	return v.replace(/-SNAPSHOT$/, '').split('.');
}

function compareVersions(v1, v2) {
	const v1parts = _prepareVersionStr(v1), v2parts = _prepareVersionStr(v2);
	const maxLen = Math.max(v1parts.length, v2parts.length);
	let part1, part2;
	for (let i = 0; i < maxLen; i++) {
		part1 = parseInt(v1parts[i], 10) || 0;
		part2 = parseInt(v2parts[i], 10) || 0;
		if (part1 < part2) {
			return false;
		} else if(part1 > part2) {
			return true;
		}
	}
	return false;
}

async function fetchWithErrors(url) {
	const res = await fetch(url, {
		headers: {
			Authorization: authHeader,
		},
	});
	if (res.status !== 200) {
		throw new Error(`Status code ${res.status} for URL ${url}`);
	}
	return res;
}

async function fileSHA1(file)  {
	const fileSHA1 = createHash(config.hashAlgo);
	const oldFileRead = createReadStream(file);
	return new Promise((resolve, reject) => {
		oldFileRead
			.on('error', reject)
			.pipe(fileSHA1)
			.on('readable', () => {
				resolve(fileSHA1.read());
			})
			.on('error', reject);
	});
}

async function main() {
	let mvnPkg = process.argv[2];
	const dest = process.argv[3];

	if (!mvnPkg || !dest) {
		throw new Error('mvnget PACKAGE DEST');
	}

	if (config.aliases[mvnPkg]) {
		mvnPkg = config.aliases[mvnPkg];
	} else if(mvnPkg.indexOf(':') < 0) {
		mvnPkg = config.defaultGroup + ':' + mvnPkg;
	}

	let url = config.repo + mvnPkg.replace(/[:.]/g, '/');
	const artifactId = mvnPkg.replace(/^.*:/, '');

	const metadataRes = await fetchWithErrors(`${url}/maven-metadata.xml`);
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

	url += `/${latestVersion}`;

	const versionMetadataRes = await fetchWithErrors(`${url}/maven-metadata.xml`);
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

	const jarUrl = `${url}/${artifactId}-${jarSnapshot.value[0]}.jar`;
	const hashUrl = `${jarUrl}.${config.hashAlgo}`;

	const hashResponse = await fetchWithErrors(hashUrl);
	const remoteSHA1 = (await hashResponse.text()).trim();

	try {
		const localSHA1 = (await fileSHA1(dest)).toString('hex');
		if (remoteSHA1 === localSHA1) {
			console.log('Hashes already match!');
			return;
		}
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e;
		}
	}

	const jarResponse = await fetchWithErrors(jarUrl);
	await streamPipeline(jarResponse.body, createWriteStream(dest));
	console.log(`Downloaded ${jarUrl}`);
}

main().then(() => console.log('OK')).catch(console.error);
