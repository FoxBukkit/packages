import { createReadStream, createWriteStream } from 'node:fs';
import { Repository } from "./interfaces.js";
import { createHash } from 'node:crypto';
import { Agent } from 'https';
import fetch, { Response } from 'node-fetch';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';
import { execFile, ExecFileOptions } from 'node:child_process';

const streamPipeline = promisify(pipeline);

const agent = new Agent({
	keepAlive: true,
});

export async function fetchSimple(url: string, repo: Repository): Promise<Response> {
	const res = await fetch(`${repo.url}${url}`, {
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

export async function fileHash(file: string, hashAlgo: string): Promise<Buffer>  {
	const hashObj = createHash(hashAlgo);
	const oldFileRead = createReadStream(file);
	return new Promise((resolve, reject) => {
		oldFileRead
			.on('error', reject)
			.pipe(hashObj)
			.on('readable', () => {
				resolve(hashObj.read());
			})
			.on('error', reject);
	});
}

export async function fileHashHex(file: string, hashAlgo: string): Promise<string>  {
	const hash = await fileHash(file, hashAlgo);
    return hash.toString('hex');
}

export async function fetchToFile(url: string, repo: Repository, file: string): Promise<void> {
	const jarResponse = await fetchSimple(url, repo);
	await streamPipeline(jarResponse.body!, createWriteStream(file));
}

export async function exists(file: string): Promise<boolean> {
	try {
		await stat(file);
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
