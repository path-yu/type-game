//! TypeWake 桌面端 —— Rust 侧只做三件事：
//! 1. 读写本地进度（不依赖浏览器 localStorage，卸载重装不丢档）
//! 2. 输出运行环境信息（版本 / 平台 / 是否首次运行）
//! 3. 提供跨平台的导出能力（把学习数据导出成 JSON）

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize)]
struct AppInfo {
    version: String,
    platform: String,
    arch: String,
    data_dir: String,
    first_run: bool,
}

fn data_file(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法定位应用数据目录: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("无法创建数据目录: {e}"))?;
    Ok(dir.join(name))
}

/// 读取保存的进度；不存在时返回 None（前端会回落到默认档案）
#[tauri::command]
fn load_progress(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = data_file(&app, "progress.json")?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(&path)
        .map(Some)
        .map_err(|e| format!("读取进度失败: {e}"))
}

/// 保存进度（原子写：先写临时文件再替换，避免中途断电损坏档案）
#[tauri::command]
fn save_progress(app: tauri::AppHandle, payload: String) -> Result<(), String> {
    let path = data_file(&app, "progress.json")?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, payload.as_bytes()).map_err(|e| format!("写入临时文件失败: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("替换进度文件失败: {e}"))?;
    Ok(())
}

/// 把学习数据导出到「下载」目录，返回完整路径
#[tauri::command]
fn export_progress(app: tauri::AppHandle, payload: String) -> Result<String, String> {
    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().app_data_dir())
        .map_err(|e| format!("无法定位导出目录: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("无法创建导出目录: {e}"))?;
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let path = dir.join(format!("typewake-{stamp}.json"));
    fs::write(&path, payload.as_bytes()).map_err(|e| format!("导出失败: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn app_info(app: tauri::AppHandle) -> AppInfo {
    let data_dir = app
        .path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let first_run = !PathBuf::from(&data_dir).join("progress.json").exists();
    AppInfo {
        version: app.package_info().version.to_string(),
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        data_dir,
        first_run,
    }
}

/// 结算回执：写入本地日志，便于将来做「打字体检」的历史分析
#[derive(Deserialize, Serialize)]
struct RunRecord {
    article_id: String,
    wpm: u32,
    accuracy: f64,
    consistency: u32,
    stars: u8,
    elapsed_ms: u64,
    ts: u64,
}

#[tauri::command]
fn append_run(app: tauri::AppHandle, record: RunRecord) -> Result<(), String> {
    let path = data_file(&app, "runs.jsonl")?;
    let mut line = serde_json::to_string(&record).map_err(|e| format!("序列化失败: {e}"))?;
    line.push('\n');
    use std::io::Write;
    let mut f = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("打开记录文件失败: {e}"))?;
    f.write_all(line.as_bytes())
        .map_err(|e| format!("写入记录失败: {e}"))?;
    Ok(())
}

/// 启动自检：前端把「实际加载到多少条文本 / 多少个词」回写一次，
/// 用于确认桌面端资源加载通路正常（也方便用户排查白屏问题）。
#[tauri::command]
fn report_ready(app: tauri::AppHandle, articles: usize, words: usize) -> Result<String, String> {
    let path = data_file(&app, "ready.json")?;
    let body = serde_json::json!({
        "articles": articles,
        "words": words,
        "ts": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0),
    });
    fs::write(&path, body.to_string()).map_err(|e| format!("写入自检失败: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_progress,
            save_progress,
            export_progress,
            app_info,
            append_run,
            report_ready
        ])
        .run(tauri::generate_context!())
        .expect("TypeWake 启动失败");
}
