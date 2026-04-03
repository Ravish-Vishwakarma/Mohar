use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transaction {
    id: i64,
    title: String,
    amount: f64,
    category: String,
    date: String,
    #[serde(rename = "type")]
    transaction_type: String, // "income" or "expense"
}

pub struct DbState {
    db: Mutex<Connection>,
}

#[tauri::command]
fn list(state: State<DbState>) -> Result<Vec<Transaction>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, title, amount, category, date, type FROM transactions ORDER BY date DESC, id DESC")
        .map_err(|e| e.to_string())?;

    let transactions = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                title: row.get(1)?,
                amount: row.get(2)?,
                category: row.get(3)?,
                date: row.get(4)?,
                transaction_type: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<Transaction>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(transactions)
}

#[tauri::command]
fn add(
    state: State<DbState>,
    title: String,
    amount: f64,
    category: String,
    date: String,
    transaction_type: String,
) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "INSERT INTO transactions (title, amount, category, date, type) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![title, amount, category, date, transaction_type],
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
    transaction_type: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE transactions SET title = ?1, amount = ?2, category = ?3, date = ?4, type = ?5 WHERE id = ?6",
        params![title, amount, category, date, transaction_type, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete(state: State<DbState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_categories(state: State<DbState>) -> Result<Vec<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT name FROM categories ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let categories = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(categories)
}

#[tauri::command]
fn add_category(state: State<DbState>, name: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("INSERT OR IGNORE INTO categories (name) VALUES (?1)", params![name])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_category(state: State<DbState>, name: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM categories WHERE name = ?1", params![name])
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
    
    // Create transactions table (replacing expenses)
    db.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            type TEXT NOT NULL
        )",
        [],
    )?;

    // Create categories table
    db.execute(
        "CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

    // Insert some default categories
    let default_categories = vec!["Food", "Transport", "Entertainment", "Salary", "Gift", "Other"];
    for cat in default_categories {
        db.execute("INSERT OR IGNORE INTO categories (name) VALUES (?1)", params![cat])?;
    }
    
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
            delete,
            get_categories,
            add_category,
            delete_category
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
