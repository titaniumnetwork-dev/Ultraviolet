import { Syntax } from 'esotope-hammerhead';
const master = '__uv';
const methodPrefix = '__uv$';
const uvMethods = {
    get: methodPrefix + 'get',
    proxy: methodPrefix + 'proxy',
    call: methodPrefix + 'call',
    set: methodPrefix + 'set',
    script: methodPrefix + 'script',
    url: methodPrefix + 'url',
    object: methodPrefix + 'obj'
};
const uvMethodTypes = {
    [methodPrefix + 'get']: 'get',
    [methodPrefix + 'proxy']: 'proxy',
    [methodPrefix + 'call']: 'call',
    [methodPrefix + 'set']: 'set',
    [methodPrefix + 'script']: 'script',
    [methodPrefix + 'url']: 'url',
    [methodPrefix + 'obj']: 'object'
};
const shortHandAssignment = {
    '+=': '+',
    '-=': '-',
    '*=': '*',
    '/=': '/',
    '%=': '%',
    '**=': '**',
    '<<=': '<<',
    '>>=': '>>',
    '>>>=': '>>>',
    '&=': '&',
    '^=': '^',
    '|=': '|',
};
const assignmentOperators = ['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '^=', '|='];


function getProperty(ctx) {
    const { js } = ctx;
    js.on(Syntax.MemberExpression, (node, data, type) => {
        if (type !== 'rewrite') return false;
        if (node.object.type === Syntax.Super)
            return false;
        if (node.parent.type === Syntax.AssignmentExpression && node.parent.left === node)
            return false;
        if (node.parent.type === Syntax.CallExpression && node.parent.callee === node)
            return false;
        if (node.parent.type === Syntax.UnaryExpression && node.parent.operator === 'delete')
            return false;
        if (node.parent.type === Syntax.UpdateExpression && (node.parent.operator === '++' || parent.operator === '--'))
            return false;
        if (node.parent.type === Syntax.NewExpression && node.parent.callee === node)
            return false;
        if (node.parent.type === Syntax.ForInStatement && node.parent.left === node) return false;
        if (node.computed && node.property.type === Syntax.Literal && !shouldWrapProperty(node.property.value))
            return false;
        if (!node.computed && node.property.type === Syntax.Identifier && !shouldWrapProperty(node.property.name))
            return false;

        data.changes.push({
            node: `${uvMethods.get}((`,
            start: node.start,
            end: node.object.start,
        })

        node.object.iterateEnd = function () {
            data.changes.push({
                start: node.object.end,
                end: node.property.start,
            });

            data.changes.push({
                node: '), ('
            });

            if (node.computed) {
                node.property.iterateEnd = function () {
                    data.changes.push({
                        start: node.property.end,
                        end: node.end,
                        node: `), ${master}, true)`
                    });
                    
                };
            } else {
                data.changes.push({
                    end: node.end,
                    node: '"' + node.property.name + `"), ${master}, false)`
                })
            };

        };
    })
};

function call(ctx) {
    const { js } = ctx;
    js.on(Syntax.CallExpression, (node, data, type) => {
        if (type !== 'rewrite') return false;
        if (node.callee.type !== Syntax.MemberExpression) 
            return false;
        if (node.callee.object.type === Syntax.Super) 
            return false;
        if (node.callee.computed && node.callee.property.type === Syntax.Literal && !shouldWrapProperty(node.callee.property.value))
            return false;
        if (!node.callee.computed && node.callee.property.type === Syntax.Identifier && !shouldWrapProperty(node.callee.property.name))
            return false;

        const { callee } = node;

        data.changes.push({
            node: `${uvMethods.call}((`,
            start: node.start,
            end: callee.object.start,
        })

        callee.object.iterateEnd = function () {
            data.changes.push({
                start: callee.object.end,
                end: callee.property.start,
            });

            data.changes.push({
                node: '), ('
            });

            if (callee.computed) {
                callee.property.iterateEnd = function() {

                    data.changes.push({
                        end: node.arguments.length ? node.arguments[0].start : callee.end,
                        start: callee.property.end,
                        node: '), ['
                    })
                    node.iterateEnd = function() {
                        data.changes.push({
                            end: node.end,
                            start: node.arguments.length ? node.arguments[node.arguments.length - 1].end : callee.end,
                            node: `], ${master}, true)`
                        })
                    };
                };
            } else {
                data.changes.push({
                    end: node.arguments.length ? node.arguments[0].start : false,
                    node: '"' + callee.property.name + '"), ['
                })
                node.iterateEnd = function() {
                    data.changes.push({
                        end: node.end,
                        start: node.arguments.length ? node.arguments[node.arguments.length - 1].end : false,
                        node: `], ${master}, false)`
                    })
                };
            };

        };
    });
};

function setProperty(ctx) {
    const { js } = ctx;
    js.on(Syntax.AssignmentExpression, (node, data, type) => {
        if (type !== 'rewrite') return false;
        if (node.left.type !== Syntax.MemberExpression) return false;
        if (!assignmentOperators.includes(node.operator)) return false;
        if (node.left.object.type === Syntax.Super) 
            return false;
        if (node.left.computed && node.left.property.type === Syntax.Literal && !shouldWrapProperty(node.left.property.value))
            return false;
        if (!node.left.computed && node.left.property.type === Syntax.Identifier && !shouldWrapProperty(node.left.property.name))
            return false;

        const { left, right } = node;

        data.changes.push({
            node: `${uvMethods.set}((`,
            start: left.object.start,
            end: left.object.start,
        });

        left.object.iterateEnd = function () {
            data.changes.push({
                start: left.object.end,
                end: left.property.start,
            });

            data.changes.push({
                node: '), ('
            });

            if (left.computed) {
                left.property.iterateEnd = function() {
                    data.changes.push({
                        end: right.start,
                        node: '' + left.property.name + '), '
                    })
                    if (shortHandAssignment[node.operator]) {
                        data.changes.push({
                            node: data.input.slice(left.start, left.end) + ` ${shortHandAssignment[node.operator]} `
                        })
                    };
                    node.iterateEnd = function() {
                        data.changes.push({
                            end: node.end,
                            start: right.end,
                            node: `, ${master}, true)`
                        })
                    };
                };
            } else {
                data.changes.push({
                    end: right.start,
                    node: '"' + left.property.name + '"), '
                })
                if (shortHandAssignment[node.operator]) {
                    data.changes.push({
                        node: data.input.slice(left.start, left.end) + ` ${shortHandAssignment[node.operator]} `
                    })
                };
                node.iterateEnd = function() {
                    data.changes.push({
                        end: node.end,
                        start: right.end,
                        node: `, ${master}, false)`
                    })
                };
            };

        };
    });
};

function wrapEval(ctx) {
    const { js } = ctx;
    js.on(Syntax.CallExpression, (node, data, type) => {
        if (type !== 'rewrite') return false;
        if (!node.arguments.length) return false;
        if (node.callee.type !== Syntax.Identifier) return false;
        if (node.callee.name !== 'eval') return false;
        
        const [ script ] = node.arguments;
    
        data.changes.push({
            node: uvMethods.script + '(',
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

function sourceMethods(ctx) {
    const { js } = ctx;
    js.on(Syntax.CallExpression, (node, data, type) => {
        if (type !== 'source') return false;
        if (node.callee.type !== Syntax.Identifier) return false;
        if (!uvMethodTypes[node.callee.name]) return false;

        const info = uvWrapperInfo(node, data);

        switch(uvMethodTypes[node.callee.name]) {
            case 'set':
                data.changes.push({
                    node: info.computed ? `${info.object}[${info.property}] = ${info.value}` : `${info.object}.${info.property} = ${info.value}`,
                    start: node.start,
                    end: node.end,
                });
                break;
            case 'get':
                data.changes.push({
                    node: info.computed ? `${info.object}[${info.property}]` : `${info.object}.${info.property}`,
                    start: node.start,
                    end: node.end,
                });
                break;
            case 'call':
                data.changes.push({
                    node: info.computed ? `${info.object}[${info.property}](${info.args})` : `${info.object}.${info.property}${info.args}`,
                    start: node.start,
                    end: node.end,
                });
                break;
            case 'script':
                data.changes.push({
                    node: info.script,
                    start: node.start,
                    end: node.end
                });
                break;
            case 'url':
                data.changes.push({
                    node: info.url,
                    start: node.start,
                    end: node.end
                });
                break;
            case 'proxy':
                data.changes.push({
                    node: info.name,
                    start: node.start,
                    end: node.end,
                });
                break;
        };
    });
};

function uvWrapperInfo(node, { input }) {
    const method = uvMethodTypes[node.callee.name];

    switch(method) {   
        case 'set':
            {
                const [ object, property, value, source, computed ] = node.arguments;
                return {
                    method,
                    object: input.slice(object.start - 1, object.end + 1),
                    property: property.type === Syntax.Literal && !computed.value ? property.value : input.slice(property.start, property.end),
                    computed: !!computed.value,
                    value: input.slice(value.start, value.end),
                };
            };
        case 'get':
            {
                const [ object, property, source, computed ] = node.arguments;
                return {
                    method,
                    object: input.slice(object.start - 1, object.end + 1),
                    property: property.type === Syntax.Literal && !computed.value ? property.value : input.slice(property.start, property.end),
                    computed: !!computed.value,
                }
            };
        case 'call': 
            {
                const [ object, property, args, source, computed ] = node.arguments;
                return {
                    method,
                    object: input.slice(object.start - 1, object.end + 1),
                    property: property.type === Syntax.Literal && !computed.value ? property.value : input.slice(property.start, property.end),
                    args: input.slice(args.start + 1, args.end - 1),
                    computed: !!computed.value,
                };
            };
        case 'script':
            {
                const [ script ] = node.arguments;
                return {
                    script: input.slice(script.start, script.end),
                }
            }
        case 'url':
            {
                const [ url ] = node.arguments;
                return {
                    url: input.slice(url.start, url.end),
                }
            }
        case 'proxy':
            {
                const [ name ] = node.arguments;
                return { name };
            };
        default:
            return false;
    };
};

function wrapIdentifier(ctx) {
    const { js } = ctx;
    js.on(Syntax.Identifier, (node, data, type) => {
        if (type !== 'rewrite') return false;
        const { parent } = node;
        if (!shouldWrapIdentifier(node.name)) return false;
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
            node: `${uvMethods.proxy}(${node.name}, __uv)`
        });
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
            node: uvMethods.url + '(',
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

function destructureDeclaration(ctx) {
    const { js } = ctx;
    js.on(Syntax.VariableDeclarator, (node, data, type) => {
        if (type !== 'rewrite') return false;
        if (node.id.type !== Syntax.ObjectPattern) return false;
        const names = [];

        for (const { key } of node.id.properties) {
            names.push(key.name);
        };

        console.log(names);

        data.changes.push({
            node: uvMethods.object + '(',
            start: node.init.start,
            end: node.init.start,
        })
        
        node.iterateEnd = function() {
            data.changes.push({
                node: ')',
                start: node.init.end,
                end: node.init.end,
            });
        };
    });
};

function shouldWrapProperty(name) {
    return name === 'eval' || name === 'postMessage' || name === 'location' || name === 'parent' || name === 'top';
};

function shouldWrapIdentifier(name) {
    return name === 'postMessage' || name === 'location' || name === 'parent' || name === 'top';
};

export { getProperty, destructureDeclaration, setProperty, call, sourceMethods, importDeclaration, dynamicImport, wrapIdentifier, wrapEval };