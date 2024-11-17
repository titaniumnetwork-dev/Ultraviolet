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
	        let len = str.length;
	        for (let i = 0; i < len; i++) {
	            const char = str[i];
	            result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
	        }
	        return encodeURIComponent(result);
	},
	decode(str) {
	        if (!str) return str;
	        str = decodeURIComponent(str);
	        let result = "";
	        let len = str.length;
	        for (let i = 0; i < len; i++) {
	            const char = str[i];
	            result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
	        }
		return result;
	}
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
