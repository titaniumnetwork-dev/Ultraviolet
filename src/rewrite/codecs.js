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
