use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Expense {
    id: i64,
    title: String,
    amount: f64,
    category: String,
    date: String,
}

pub struct DbState {
    db: Mutex<Connection>,
}

#[tauri::command]
fn list(state: State<DbState>) -> Result<Vec<Expense>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, title, amount, category, date FROM expenses ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map([], |row| {
            Ok(Expense {
                id: row.get(0)?,
                title: row.get(1)?,
                amount: row.get(2)?,
                category: row.get(3)?,
                date: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Expense>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(expenses)
}

#[tauri::command]
fn add(
    state: State<DbState>,
    title: String,
    amount: f64,
    category: String,
    date: String,
) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "INSERT INTO expenses (title, amount, category, date) VALUES (?1, ?2, ?3, ?4)",
        params![title, amount, category, date],
    )
    .map_err(|e| e.to_string())?;

    Ok(db.last_insert_rowid())
}

#[tauri::command]
fn update(
    state: State<DbState>,
    id: i64,
    title: String,
    amount: f64,
    category: String,
    date: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE expenses SET title = ?1, amount = ?2, category = ?3, date = ?4 WHERE id = ?5",
        params![title, amount, category, date, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete(state: State<DbState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM expenses WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn init_db(app_handle: &AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    std::fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join("mohar.db");
    
    let db = Connection::open(db_path)?;
    db.execute(
        "CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL
        )",
        [],
    )?;
    
    Ok(db)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = init_db(app.handle())?;
            app.manage(DbState {
                db: Mutex::new(db),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list,
            add,
            update,
            delete
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
