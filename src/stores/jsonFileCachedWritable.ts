import { writable } from 'svelte/store';
import { type Vault } from 'obsidian';

export function jsonFileCachedWritable<T>(filename: string, vault: Vault) {
	const store = writable<T>();

	// Read async
	(async () => {
		if (await vault.adapter.exists(filename)) {
			console.info(`Obsidian GitHub Comments: Loading cache ${filename}`);
			const fileContents = await vault.adapter.read(filename)
			if (fileContents) {
				const data: T = JSON.parse(fileContents);
				store.set(data);
			}
		} else {
			console.info(`Obsidian GitHub Comments: Cache not found ${filename}`)
		}
	})();

	const writeToFile = (data: T) => {
		vault.adapter.write(filename, JSON.stringify(data));
	};

	// Return sync
	return {
		subscribe: store.subscribe,
		set: (value: T) => {
			writeToFile(value);
			store.set(value);
		},
		update: (updater: (value: T) => T) => {
			store.update((value: T) => {
				writeToFile(value);
				return updater(value);
			});
		},
	};
}
