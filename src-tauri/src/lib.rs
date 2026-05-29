use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![Migration {
    version: 1,
    description: "create initial tables",
    sql: "PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO lists (id, name, color, sort_order) VALUES ('default', '收集箱', '#6366f1', 0);",
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::new()
        .add_migrations("sqlite:flowlist.db", migrations)
        .build(),
    )
    .setup(|app| {
      if let Some(window) = app.get_webview_window("main") {
        window.on_window_event(|event| {
          if let tauri::WindowEvent::CloseRequested { .. } = event {
            std::process::exit(0);
          }
        });
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
