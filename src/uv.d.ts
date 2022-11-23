const Ultraviolet: typeof import('./rewrite/index').default;
const UVClient: typeof import('./client/index').default;

export type UltravioletCtor = typeof Ultraviolet;
export type UVClientCtor = typeof UVClient;
