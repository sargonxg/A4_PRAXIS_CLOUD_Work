use praxis_semantica_core::validate_context_graph_json;
use serde::Serialize;
use std::io::{self, Read};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CliResponse<T> {
    ok: bool,
    engine: &'static str,
    version: &'static str,
    result: Option<T>,
    error: Option<String>,
}

fn main() {
    let mut input = String::new();
    if let Err(err) = io::stdin().read_to_string(&mut input) {
        print_error(format!("failed to read stdin: {err}"));
        std::process::exit(2);
    }

    match validate_context_graph_json(&input) {
        Ok(result) => {
            let response = CliResponse {
                ok: true,
                engine: "praxis-semantica-core-rust",
                version: env!("CARGO_PKG_VERSION"),
                result: Some(result),
                error: None,
            };
            println!("{}", serde_json::to_string(&response).expect("response serializes"));
        }
        Err(err) => {
            print_error(err);
            std::process::exit(1);
        }
    }
}

fn print_error(error: String) {
    let response: CliResponse<()> = CliResponse {
        ok: false,
        engine: "praxis-semantica-core-rust",
        version: env!("CARGO_PKG_VERSION"),
        result: None,
        error: Some(error),
    };
    println!("{}", serde_json::to_string(&response).expect("response serializes"));
}
