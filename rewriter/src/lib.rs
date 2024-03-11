use rslint_parser::{parse_text, AstNode, GreenNode, SyntaxKind};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    log("hello from rust");
}

#[wasm_bindgen]
pub fn recast(str: &str, data: JsValue, casttype: &str) -> JsValue {
    let parsed = parse_text(str, 0);
    let tree = parsed.tree();

    tree.items().for_each(|node| {
        node.syntax()
            .children()
            .for_each(|child| log(&format!("{:?}", child)));
    });

    return tree.text().into();
}
