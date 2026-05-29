use tauri::Manager;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![Migration {
    version: 1,
    description: "create initial tables",
    sql: "CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      parent_id TEXT,
      title TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      priority INTEGER NOT NULL DEFAULT 4,
      due_date TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      repeat_rule TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1'
    );
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (task_id, tag_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      triggered INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO lists (id, name, color, sort_order) VALUES ('default', '收集箱', '#6366f1', 0);
    INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'light');",
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::new()
        .add_migrations("sqlite:flowlist.db", migrations)
        .build(),
    )
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_autostart::init(
      tauri_plugin_autostart::MacosLauncher::LaunchAgent,
      None,
    ))
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        let window = app.get_webview_window("main").unwrap();
        window.open_devtools();
      }

      let menu = tauri::menu::MenuBuilder::new(app)
        .text("show", "显示主窗口")
        .separator()
        .text("quit", "退出")
        .build()?;

      let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("FlowList")
        .on_menu_event(|app, event| {
          if event.id().as_ref() == "show" {
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          } else if event.id().as_ref() == "quit" {
            app.exit(0);
          }
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
        })
        .menu(&menu)
        .build(app)?;

      #[cfg(target_os = "macos")]
      tray.set_show_menu_on_left_click(false);

      let window = app.get_webview_window("main").unwrap();
      let tray_clone = tray.clone();

      window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
          if let Some(w) = tray_clone.app_handle().get_webview_window("main") {
            let _ = w.hide();
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
