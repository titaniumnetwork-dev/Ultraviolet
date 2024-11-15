import { openDB } from "idb";

// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------
export const none = {
	encode: async (str) => str,
	decode: async (str) => str,
};

export const plain = {
	async encode(str) {
		if (!str) return str;
		return encodeURIComponent(str);
	},
	async decode(str) {
		if (!str) return str;
		return decodeURIComponent(str);
	},
};

export const xor = {
	async encode(str) {
		if (!str) return str;
		let result = "";
		for (let i = 0; i < str.length; i++) {
			result += i % 2 ? String.fromCharCode(str.charCodeAt(i) ^ 2) : str[i];
		}
		return encodeURIComponent(result);
	},
	async decode(str) {
		if (!str) return str;
		const [input, ...search] = str.split("?");
		let result = "";
		const decoded = decodeURIComponent(input);
		for (let i = 0; i < decoded.length; i++) {
			result +=
				i % 2 ? String.fromCharCode(decoded.charCodeAt(i) ^ 2) : decoded[i];
		}
		return result + (search.length ? "?" + search.join("?") : "");
	},
};

export const base64 = {
	async encode(str) {
		if (!str) return str;
		str = str.toString();

		return btoa(encodeURIComponent(str));
	},
	async decode(str) {
		if (!str) return str;
		str = str.toString();

		return decodeURIComponent(atob(str));
	},
};

async function getOrSetIdb(storeName, key) {
	const db = await openDB("myDatabase", 1, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName);
			}
		},
	});

	let value = await db.get(storeName, key);

	if (!value) {
		value = crypto.randomUUID();
		await db.put(storeName, value, key);
	}

	return value;
}

export const nebelcrypt = {
	async encode(str) {
		if (!str) return str;

		const key = await getOrSetIdb("nebelcrypt", "key");
		const encoder = new TextEncoder();
		const data = encoder.encode(str);

		const cryptoKey = await window.crypto.subtle.importKey(
			"raw",
			encoder.encode(key),
			{ name: "AES-GCM" },
			false,
			["encrypt"]
		);

		const iv = window.crypto.getRandomValues(new Uint8Array(12));

		const encryptedData = await window.crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv },
			cryptoKey,
			data
		);

		const combined = new Uint8Array(iv.byteLength + encryptedData.byteLength);
		combined.set(iv);
		combined.set(new Uint8Array(encryptedData), iv.byteLength);

		return btoa(String.fromCharCode(...combined));
	},

	async decode(str) {
		if (!str) return str;

		const key = await getOrSetIdb("nebelcrypt", "key");
		const decoder = new TextDecoder();

		const combined = new Uint8Array(
			atob(str)
				.split("")
				.map((char) => char.charCodeAt(0))
		);

		const iv = combined.slice(0, 12);

		const encryptedData = combined.slice(12);

		const encoder = new TextEncoder();
		const cryptoKey = await window.crypto.subtle.importKey(
			"raw",
			encoder.encode(key),
			{ name: "AES-GCM" },
			false,
			["decrypt"]
		);

		try {
			const decryptedData = await window.crypto.subtle.decrypt(
				{ name: "AES-GCM", iv: iv },
				cryptoKey,
				encryptedData
			);

			return decoder.decode(decryptedData);
		} catch (e) {
			console.error("Decryption failed:", e);
			return null;
		}
	},
};
