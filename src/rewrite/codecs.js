import CryptoJS from "crypto-js";
import { openDB } from "idb";

// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------
export const none = {
	encode: (str) => str,
	decode: (str) => str,
};

export const plain = {
	encode(str) {
		if (!str) return str;
		return encodeURIComponent(str);
	},
	decode(str) {
		if (!str) return str;
		return decodeURIComponent(str);
	},
};

export const xor = {
	encode(str) {
		if (!str) return str;
		let result = "";
		for (let i = 0; i < str.length; i++) {
			result += i % 2 ? String.fromCharCode(str.charCodeAt(i) ^ 2) : str[i];
		}
		return encodeURIComponent(result);
	},
	decode(str) {
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
	encode(str) {
		if (!str) return str;
		str = str.toString();

		return btoa(encodeURIComponent(str));
	},
	decode(str) {
		if (!str) return str;
		str = str.toString();

		return decodeURIComponent(atob(str));
	},
};

function generateUUID() {
  const buffer = new Uint8Array(16);
  window.crypto.getRandomValues(buffer);
  buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
  buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant 1
  return [...buffer].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getDB() {
	return openDB("uvDatabase", 1, {
		upgrade(db) {
			if (!db.objectStoreNames.contains("codecs")) {
				db.createObjectStore("codecs");
			}
		},
	});
}

async function getCodecStore(key) {
	const db = await getDB();
	const store = db.transaction("codecs", "readwrite").objectStore("codecs");

	let value = await store.get(key);
	if (!value) {
		value = generateUUID();
		await store.put(value, key);
	}

	return value;
}

let key = "";

(async () => {
	key = await getCodecStore("nebelcrypt");
})();

export const nebelcrypt = {
	encode(str) {
		if (!str) return str;
		return encodeURIComponent(CryptoJS.AES.encrypt(str, key)).toString();
	},
	decode(str) {
		if (!str) return str;
		return CryptoJS.AES.decrypt(decodeURIComponent(str), key).toString(
			CryptoJS.enc.Utf8
		);
	},
};
