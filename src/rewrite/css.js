import EventEmitter from "events";

class CSS extends EventEmitter {
	constructor(ctx) {
		super();
		this.ctx = ctx;
		this.meta = ctx.meta;
	}
	rewrite(str, options) {
		return this.recast(str, options, "rewrite");
	}
	source(str, options) {
		return this.recast(str, options, "source");
	}
	recast(str, options, type) {
		// regex from vk6 (https://github.com/ading2210)
		const urlRegex = /url\(['"]?(.+?)['"]?\)/gm;
		const Atruleregex =
			/@import\s+(url\s*?\(.{0,9999}?\)|['"].{0,9999}?['"]|.{0,9999}?)($|\s|;)/gm;
		str = new String(str).toString();
		str = str.replace(urlRegex, (match, url) => {
			const encodedUrl =
				type === "rewrite" ? this.ctx.rewriteUrl(url) : this.ctx.sourceUrl(url);

			return match.replace(url, encodedUrl);
		});
		str = str.replace(Atruleregex, (match, importStatement) => {
			return match.replace(
				importStatement,
				importStatement.replace(
					/^(url\(['"]?|['"]|)(.+?)(['"]|['"]?\)|)$/gm,
					(match, firstQuote, url, endQuote) => {
						if (firstQuote.startsWith("url")) {
							return match;
						}
						const encodedUrl =
							type === "rewrite"
								? this.ctx.rewriteUrl(url)
								: this.ctx.sourceUrl(url);

						return `${firstQuote}${encodedUrl}${endQuote}`;
					}
				)
			);
		});

		return str;
	}
}

export default CSS;
