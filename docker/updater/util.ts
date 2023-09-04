import { createReadStream, createWriteStream } from 'node:fs';
import { Item, Repository } from "./interfaces.js";
import { createHash } from 'node:crypto';
import { Agent } from 'https';
import fetch, { Response } from 'node-fetch';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { stat, unlink, rename } from 'node:fs/promises';
import { execFile, ExecFileOptions } from 'node:child_process';

const streamPipeline = promisify(pipeline);

const agent = new Agent({
	keepAlive: true,
});

interface RequestOptions {
	method?: string;
}

export async function fetchSimple(url: string, repo: Repository, options?: RequestOptions): Promise<Response> {
	if (!url.includes(':')) {
		url = `${repo.url}${url}`;
	}
	const res = await fetch(url, {
		...options,
		agent,
		headers: repo.authorization ? {
			Authorization: repo.authorization,
		} : undefined,
	});
	if (res.status !== 200) {
		throw new Error(`Status code ${res.status} for URL ${url}`);
	}
	return res;
}

function _prepareVersionStr(v: string): string[] {
	return v.replace(/-SNAPSHOT$/, '').split('.');
}

export function compareVersions(v1: string, v2: string): boolean {
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

export async function fileHash(item: Item, hashAlgo: string): Promise<Buffer>  {
	try {
		const hashObj = createHash(hashAlgo);
		const oldFileRead = createReadStream(makeAbsoluteDestination(item));
		return await new Promise((resolve, reject) => {
			oldFileRead
				.on('error', reject)
				.pipe(hashObj)
				.on('readable', () => {
					resolve(hashObj.read());
				})
				.on('error', reject);
		});
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e;
		}
		return Buffer.alloc(0);
	}
}

type HashEncoding = 'hex' | 'base64';

export async function fileHashString(item: Item, hashAlgo: string, encoding: HashEncoding = 'hex'): Promise<string>  {
	const hash = await fileHash(item, hashAlgo);
    return hash.toString(encoding);
}

export async function fetchToFileWithContentMD5(url: string, repo: Repository, item: Item, md5Header: string = 'content-md5', md5Encoding: HashEncoding = 'base64'): Promise<void> {
	const response = await fetchSimple(url, repo);
	const remoteMD5 = response.headers.get(md5Header).replace(/[\r\n\t "']/g, '');
	if (remoteMD5) {
		const fileMD5 = await fileHashString(item, 'md5', md5Encoding);
		if (remoteMD5 === fileMD5) {
			console.log(`Hashes match, skipping ${item.destination}`);
			return;
		}
	}

	await fetchToFileInternal(response, item);
}

export async function fetchToFile(url: string, repo: Repository, item: Item): Promise<void> {
	await fetchToFileInternal(await fetchSimple(url, repo), item);
}

async function fetchToFileInternal(resp: Response, item: Item): Promise<void> {
	const file = makeAbsoluteDestination(item);
	const tempFile = `${file}.tmp`;
	try {	
		await streamPipeline(resp.body!, createWriteStream(tempFile));
		await _unlinkSafe(file);
		await rename(tempFile, file);
	} finally {
		await _unlinkSafe(tempFile);
	}
}

async function _unlinkSafe(file: string): Promise<void> {
	try {
		await unlink(file);
	} catch { }
}

export async function exists(item: Item): Promise<boolean> {
	try {
		await stat(makeAbsoluteDestination(item));
		return true;
	} catch {
		return false;
	}
}

const execFileAsyncBase = promisify(execFile);
export async function execFileAsync(file: string, args: string[], options?: ExecFileOptions) {
	const res = await execFileAsyncBase(file, args, options);
	process.stdout.write(res.stdout);
	process.stderr.write(res.stderr);
}

let pathPrefix = '';
export function setPathPrefix(prefix: string): void {
	pathPrefix = prefix;
}

export function makeAbsoluteDestination(item: Item): string {
	return `${pathPrefix}${item.destination}`;
}
