// Native Windows substitute for POSIX shebang test executables. No dependencies.
use std::{env, io::{self, Read, Write}, thread, time::Duration};

fn quoted(value: &str) -> String {
    let mut result = String::from("\"");
    for ch in value.chars() {
        match ch {
            '"' => result.push_str("\\\""),
            '\\' => result.push_str("\\\\"),
            '\n' => result.push_str("\\n"),
            '\r' => result.push_str("\\r"),
            '\t' => result.push_str("\\t"),
            c if c < '\u{20}' => result.push_str(&format!("\\u{:04x}", c as u32)),
            c => result.push(c),
        }
    }
    result.push('"'); result
}

fn main() {
    // Consume the bounded stdin before output/exit, so the test exercises the runner
    // rather than an unrelated broken-pipe race.
    let mut input = Vec::new(); io::stdin().read_to_end(&mut input).unwrap();
    match "__BEHAVIOR__" {
        "environment" => {
            let variables = env::vars().map(|(k, v)| format!("{}:{}", quoted(&k), quoted(&v))).collect::<Vec<_>>().join(",");
            let args = env::args().skip(1).map(|v| quoted(&v)).collect::<Vec<_>>().join(",");
            print!("{{\"env\":{{{variables}}},\"args\":[{args}]}}");
        }
        "unexpected" => print!("unexpected"),
        "stdout" => { io::stdout().write_all(&vec![b'x'; 3 * 1024 * 1024]).unwrap(); }
        "stderr" => {
            io::stderr().write_all(&vec![b'x'; 16384]).unwrap();
            loop { thread::sleep(Duration::from_secs(1)); }
        }
        "wait" => loop { thread::sleep(Duration::from_secs(1)); },
        _ => panic!("Unknown fixture mode"),
    }
}
