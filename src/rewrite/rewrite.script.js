/**
 * @typedef {import('./index').default} Ultraviolet
 */

/**
 *
 * @param {Ultraviolet} ctx
 */
function property(ctx) {
	const { js } = ctx;
	js.on("MemberExpression", (node, data, type) => {
		if (node.object.type === "Super") return false;

		if (type === "rewrite" && computedProperty(node)) {
			data.changes.push({
				node: "__uv.$wrap((",
				start: node.property.start,
				end: node.property.start,
			});
			node.iterateEnd = function () {
				data.changes.push({
					node: "))",
					start: node.property.end,
					end: node.property.end,
				});
			};
		}

		if (
			(!node.computed &&
				node.property.name === "location" &&
				type === "rewrite") ||
			(node.property.name === "__uv$location" && type === "source")
		) {
			data.changes.push({
				start: node.property.start,
				end: node.property.end,
				node:
					type === "rewrite"
						? "__uv$setSource(__uv).__uv$location"
						: "location",
			});
		}

		if (
			(!node.computed && node.property.name === "top" && type === "rewrite") ||
			(node.property.name === "__uv$top" && type === "source")
		) {
			data.changes.push({
				start: node.property.start,
				end: node.property.end,
				node: type === "rewrite" ? "__uv$setSource(__uv).__uv$top" : "top",
			});
		}

		if (
			(!node.computed &&
				node.property.name === "parent" &&
				type === "rewrite") ||
			(node.property.name === "__uv$parent" && type === "source")
		) {
			data.changes.push({
				start: node.property.start,
				end: node.property.end,
				node:
					type === "rewrite" ? "__uv$setSource(__uv).__uv$parent" : "parent",
			});
		}

		if (
			!node.computed &&
			node.property.name === "postMessage" &&
			type === "rewrite"
		) {
			data.changes.push({
				start: node.property.start,
				end: node.property.end,
				node: "__uv$setSource(__uv).postMessage",
			});
		}

		if (
			(!node.computed && node.property.name === "eval" && type === "rewrite") ||
			(node.property.name === "__uv$eval" && type === "source")
		) {
			data.changes.push({
				start: node.property.start,
				end: node.property.end,
				node: type === "rewrite" ? "__uv$setSource(__uv).__uv$eval" : "eval",
			});
		}

		if (
			!node.computed &&
			node.property.name === "__uv$setSource" &&
			type === "source" &&
			node.parent.type === "CallExpression"
		) {
			const { parent, property } = node;
			data.changes.push({
				start: property.start - 1,
				end: parent.end,
			});

			node.iterateEnd = function () {
				data.changes.push({
					start: property.start,
					end: parent.end,
				});
			};
		}
	});
}

/**
 *
 * @param {Ultraviolet} ctx
 */
function identifier(ctx) {
	const { js } = ctx;
	js.on("Identifier", (node, data, type) => {
		if (type !== "rewrite") return false;
		const { parent } = node;
		if (!["location", "eval", "parent", "top"].includes(node.name))
			return false;
		if (parent.type === "VariableDeclarator" && parent.id === node)
			return false;
		if (
			(parent.type === "AssignmentExpression" ||
				parent.type === "AssignmentPattern") &&
			parent.left === node
		)
			return false;
		if (
			(parent.type === "FunctionExpression" ||
				parent.type === "FunctionDeclaration") &&
			parent.id === node
		)
			return false;
		if (
			parent.type === "MemberExpression" &&
			parent.property === node &&
			!parent.computed
		)
			return false;
		if (
			node.name === "eval" &&
			parent.type === "CallExpression" &&
			parent.callee === node
		)
			return false;
		if (parent.type === "Property" && parent.key === node) return false;
		if (parent.type === "Property" && parent.value === node && parent.shorthand)
			return false;
		if (
			parent.type === "UpdateExpression" &&
			(parent.operator === "++" || parent.operator === "--")
		)
			return false;
		if (
			(parent.type === "FunctionExpression" ||
				parent.type === "FunctionDeclaration" ||
				parent.type === "ArrowFunctionExpression") &&
			parent.params.indexOf(node) !== -1
		)
			return false;
		if (parent.type === "MethodDefinition") return false;
		if (parent.type === "ClassDeclaration") return false;
		if (parent.type === "RestElement") return false;
		if (parent.type === "ExportSpecifier") return false;
		if (parent.type === "ImportSpecifier") return false;

		data.changes.push({
			start: node.start,
			end: node.end,
			node: "__uv.$get(" + node.name + ")",
		});
	});
}

/**
 *
 * @param {Ultraviolet} ctx
 */
function wrapEval(ctx) {
	const { js } = ctx;
	js.on("CallExpression", (node, data, type) => {
		if (type !== "rewrite") return false;
		if (!node.arguments.length) return false;
		if (node.callee.type !== "Identifier") return false;
		if (node.callee.name !== "eval") return false;

		const [script] = node.arguments;

		data.changes.push({
			node: "__uv.js.rewrite(",
			start: script.start,
			end: script.start,
		});
		node.iterateEnd = function () {
			data.changes.push({
				node: ")",
				start: script.end,
				end: script.end,
			});
		};
	});
}

/**
 *
 * @param {Ultraviolet} ctx
 */
function importDeclaration(ctx) {
	const { js } = ctx;
	js.on("Literal", (node, data, type) => {
		if (
			!(
				(node.parent.type === "ImportDeclaration" ||
					node.parent.type === "ExportAllDeclaration" ||
					node.parent.type === "ExportNamedDeclaration") &&
				node.parent.source === node
			)
		)
			return false;

		data.changes.push({
			start: node.start + 1,
			end: node.end - 1,
			node:
				type === "rewrite"
					? ctx.rewriteUrl(node.value)
					: ctx.sourceUrl(node.value),
		});
	});
}

/**
 *
 * @param {Ultraviolet} ctx
 */
function dynamicImport(ctx) {
	const { js } = ctx;
	js.on("ImportExpression", (node, data, type) => {
		if (type !== "rewrite") return false;
		data.changes.push({
			// pass script URL to dynamicImport
			// import() is always relative to script URL
			node: `__uv.rewriteImport(${JSON.stringify(ctx.meta.url)},`,
			start: node.source.start,
			end: node.source.start,
		});
		node.iterateEnd = function () {
			data.changes.push({
				node: ")",
				start: node.source.end,
				end: node.source.end,
			});
		};
	});
}

/**
 *
 * @param {Ultraviolet} ctx
 */
function unwrap(ctx) {
	const { js } = ctx;
	js.on("CallExpression", (node, data, type) => {
		if (type !== "source") return false;
		if (!isWrapped(node.callee)) return false;

		switch (node.callee.property.name) {
			case "$wrap":
				{
					if (
						!node.arguments ||
						node.parent.type !== "MemberExpression" ||
						node.parent.property !== node
					)
						return false;
					const [property] = node.arguments;

					data.changes.push({
						start: node.callee.start,
						end: property.start,
					});

					node.iterateEnd = function () {
						data.changes.push({
							start: node.end - 2,
							end: node.end,
						});
					};
				}
				break;
			case "$get":
			case "rewriteUrl":
				{
					const [arg] = node.arguments;

					data.changes.push({
						start: node.callee.start,
						end: arg.start,
					});

					node.iterateEnd = function () {
						data.changes.push({
							start: node.end - 1,
							end: node.end,
						});
					};
				}
				break;
			case "rewrite":
				{
					const [script] = node.arguments;
					data.changes.push({
						start: node.callee.start,
						end: script.start,
					});
					node.iterateEnd = function () {
						data.changes.push({
							start: node.end - 1,
							end: node.end,
						});
					};
				}
				break;
		}
	});
}

function isWrapped(node) {
	if (node.type !== "MemberExpression") return false;
	if (node.property.name === "rewrite" && isWrapped(node.object)) return true;
	if (node.object.type !== "Identifier" || node.object.name !== "__uv")
		return false;
	if (!["js", "$get", "$wrap", "rewriteUrl"].includes(node.property.name))
		return false;
	return true;
}

function computedProperty(parent) {
	if (!parent.computed) return false;
	const { property: node } = parent;
	if (node.type === "Literal" && !["location", "top", "parent"]) return false;
	return true;
}

export {
	property,
	wrapEval,
	dynamicImport,
	importDeclaration,
	identifier,
	unwrap,
};
