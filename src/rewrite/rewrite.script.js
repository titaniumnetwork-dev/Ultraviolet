import { Syntax } from 'esotope-hammerhead';

function property(ctx) {
    const { js } = ctx;
    js.on('MemberExpression', (node, data, type) => {
        if (node.object.type === 'Super') return false;

        if (type === 'rewrite' && computedProperty(node)) {
            data.changes.push({
                node: '__uv.$wrap((',
                start: node.property.start,
                end: node.property.start,
            })
            node.iterateEnd = function() {
                data.changes.push({
                    node: '))',
                    start: node.property.end,
                    end: node.property.end,
                });
            };
    
        };
    
        if (!node.computed && node.property.name === 'location' && type === 'rewrite' || node.property.name === '__uv$location' && type === 'source') {
            data.changes.push({
                start: node.property.start,
                end: node.property.end,
                node: type === 'rewrite' ? '__uv$setSource(__uv).__uv$location' : 'location'
            });
        };


        if (!node.computed && node.property.name === 'top' && type === 'rewrite' || node.property.name === '__uv$top' && type === 'source') {
            data.changes.push({
                start: node.property.start,
                end: node.property.end,
                node: type === 'rewrite' ? '__uv$setSource(__uv).__uv$top' : 'top'
            });
        };

        if (!node.computed && node.property.name === 'parent' && type === 'rewrite' || node.property.name === '__uv$parent' && type === 'source') {
            data.changes.push({
                start: node.property.start,
                end: node.property.end,
                node: type === 'rewrite' ? '__uv$setSource(__uv).__uv$parent' : 'parent'
            });
        };


        if (!node.computed && node.property.name === 'postMessage' && type === 'rewrite') {
            data.changes.push({
                start: node.property.start,
                end: node.property.end,
                node:'__uv$setSource(__uv).postMessage',
            });
        };


        if (!node.computed && node.property.name === 'eval' && type === 'rewrite' || node.property.name === '__uv$eval' && type === 'source') {
            data.changes.push({
                start: node.property.start,
                end: node.property.end,
                node: type === 'rewrite' ? '__uv$setSource(__uv).__uv$eval' : 'eval'
            });
        };

        if (!node.computed && node.property.name === '__uv$setSource' && type === 'source' && node.parent.type === Syntax.CallExpression) {
            const { parent, property } = node; 
            data.changes.push({
                start: property.start - 1,
                end: parent.end,
            });

            node.iterateEnd = function() {
                data.changes.push({
                    start: property.start,
                    end: parent.end,
                });
            };
        };
    });
};

function identifier(ctx) {
    const { js } = ctx;
    js.on('Identifier', (node, data, type) => {
        if (type !== 'rewrite') return false;
        const { parent } = node;
        if (!['location', 'eval', 'parent', 'top'].includes(node.name)) return false;
        if (parent.type === Syntax.VariableDeclarator && parent.id === node) return false;
        if ((parent.type === Syntax.AssignmentExpression || parent.type === Syntax.AssignmentPattern) && parent.left === node) return false;
        if ((parent.type === Syntax.FunctionExpression || parent.type === Syntax.FunctionDeclaration) && parent.id === node) return false;
        if (parent.type === Syntax.MemberExpression && parent.property === node && !parent.computed) return false;
        if (node.name === 'eval' && parent.type === Syntax.CallExpression && parent.callee === node) return false;
        if (parent.type === Syntax.Property && parent.key === node) return false;
        if (parent.type === Syntax.Property && parent.value === node && parent.shorthand) return false;
        if (parent.type === Syntax.UpdateExpression && (parent.operator === '++' || parent.operator === '--')) return false;
        if ((parent.type === Syntax.FunctionExpression || parent.type === Syntax.FunctionDeclaration || parent.type === Syntax.ArrowFunctionExpression) && parent.params.indexOf(node) !== -1) return false;
        if (parent.type === Syntax.MethodDefinition) return false;
        if (parent.type === Syntax.ClassDeclaration) return false;
        if (parent.type === Syntax.RestElement) return false;
        if (parent.type === Syntax.ExportSpecifier) return false;
        if (parent.type === Syntax.ImportSpecifier) return false;

        data.changes.push({
            start: node.start,
            end: node.end,
            node: '__uv.$get(' + node.name + ')'
        });
    });
};

function wrapEval(ctx) {
    const { js } = ctx;
    js.on('CallExpression', (node, data, type) => {
        if (type !== 'rewrite') return false;
        if (!node.arguments.length) return false;
        if (node.callee.type !== 'Identifier') return false;
        if (node.callee.name !== 'eval') return false;
        
        const [ script ] = node.arguments;
    
        data.changes.push({
            node: '__uv.js.rewrite(',
            start: script.start,
            end: script.start,
        })
        node.iterateEnd = function() {
            data.changes.push({
                node: ')',
                start: script.end,
                end: script.end,
            });
        };
    });
};

function importDeclaration(ctx) {
    const { js } = ctx;
    js.on(Syntax.Literal, (node, data, type) => {
        if (!((node.parent.type === Syntax.ImportDeclaration || node.parent.type === Syntax.ExportAllDeclaration || node.parent.type === Syntax.ExportNamedDeclaration) 
        && node.parent.source === node)) return false;

        data.changes.push({
            start: node.start + 1,
            end: node.end - 1,
            node: type === 'rewrite' ? ctx.rewriteUrl(node.value) : ctx.sourceUrl(node.value)
        });
    });
};

function dynamicImport(ctx) {
    const { js } = ctx;
    js.on(Syntax.ImportExpression, (node, data, type) => {
        if (type !== 'rewrite') return false;
        data.changes.push({
            node: '__uv.rewriteUrl(',
            start: node.source.start,
            end: node.source.start,
        })
        node.iterateEnd = function() {
            data.changes.push({
                node: ')',
                start: node.source.end,
                end: node.source.end,
            });
        };
    });
};

function unwrap(ctx) {
    const { js } = ctx;
    js.on('CallExpression', (node, data, type) => {
        if (type !== 'source') return false;
        if (!isWrapped(node.callee)) return false;

        switch(node.callee.property.name) {
            case '$wrap':
                if (!node.arguments || node.parent.type !== Syntax.MemberExpression || node.parent.property !== node) return false;
                const [ property ] = node.arguments;

                data.changes.push({
                    start: node.callee.start,
                    end: property.start,
                });

                node.iterateEnd = function() {
                    data.changes.push({
                        start: node.end - 2,
                        end: node.end,
                    });
                }; 
                break;
            case '$get':
            case 'rewriteUrl':
                const [ arg ] = node.arguments;

                data.changes.push({
                    start: node.callee.start,
                    end: arg.start,
                });

                node.iterateEnd = function() {
                    data.changes.push({
                        start: node.end - 1,
                        end: node.end,
                    });
                }; 
                break;
            case 'rewrite':
                const [ script ] = node.arguments;
                data.changes.push({
                    start: node.callee.start,
                    end: script.start,
                });
                node.iterateEnd = function() {
                    data.changes.push({
                        start: node.end - 1,
                        end: node.end,
                    });
                };
        };

    });
};

function isWrapped(node) {
    if (node.type !== Syntax.MemberExpression) return false;
    if (node.property.name === 'rewrite' && isWrapped(node.object)) return true;
    if (node.object.type !== Syntax.Identifier || node.object.name !== '__uv') return false;
    if (!['js', '$get', '$wrap', 'rewriteUrl'].includes(node.property.name)) return false;
    return true;
};

function computedProperty(parent) {
    if (!parent.computed) return false;
    const { property: node } = parent; 
    if (node.type === 'Literal' && !['location', 'top', 'parent']) return false;
    return true;
};


export { property, wrapEval, dynamicImport, importDeclaration, identifier, unwrap };