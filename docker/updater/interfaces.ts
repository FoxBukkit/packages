export interface Repository {
	type: string;
	url: string;
	authorization?: string;
	params?: { [key: string]: string };
}

export interface Item {
	repository: string;
	source: string;
	destination: string;
	params?: { [key: string]: string };
}

export interface Updater {
    run(item: Item, repo: Repository): Promise<void>;
    getName(): string;
}
