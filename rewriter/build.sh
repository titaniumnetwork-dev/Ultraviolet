RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+simd128' cargo build --target wasm32-unknown-unknown -Z build-std=panic_abort,std --release
wasm-bindgen --weak-refs --target web --out-dir out/ target/wasm32-unknown-unknown/release/rewriter.wasm

cd ../
pnpm build
cp dist/* ../public/uv/
cp rewriter/out/rewriter_bg.wasm  ../public/
