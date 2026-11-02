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
    /// 默认位置（%APPDATA%\com.typewake.app），用于「恢复默认」时展示
    default_dir: String,
    /// 用户改过目录没有
    custom: bool,
    first_run: bool,
}

#[derive(Serialize, Deserialize, Default)]
struct Config {
    /// 用户指定的数据目录；空表示用默认位置
    #[serde(default)]
    data_dir: Option<String>,
}

/// 默认数据目录：Windows 上是 %APPDATA%\com.typewake.app
fn default_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("无法定位应用数据目录: {e}"))
}

/// config.json 永远放在**默认目录**里。
///
/// 不能把「自定义目录在哪」记在自定义目录里 —— 那样下次启动就找不到自己了，
/// 相当于把钥匙锁在箱子里。
fn config_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = default_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| format!("无法创建配置目录: {e}"))?;
    Ok(dir.join("config.json"))
}

fn read_config(app: &tauri::AppHandle) -> Config {
    let Ok(path) = config_file(app) else { return Config::default() };
    let Ok(raw) = fs::read_to_string(&path) else { return Config::default() };
    serde_json::from_str(&raw).unwrap_or_default()
}

fn write_config(app: &tauri::AppHandle, cfg: &Config) -> Result<(), String> {
    let path = config_file(app)?;
    let body = serde_json::to_string_pretty(cfg).map_err(|e| format!("序列化配置失败: {e}"))?;
    fs::write(&path, body).map_err(|e| format!("写入配置失败: {e}"))
}

/// 当前生效的数据目录：配置里有且目录还在就用它，否则回落到默认。
///
/// 「目录还在」这一条很重要：自定义目录常在移动硬盘或网盘里，
/// 拔掉之后如果还往里写，会在本机凭空造出一棵树，看起来像数据丢了。
fn effective_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let cfg = read_config(app);
    if let Some(custom) = cfg.data_dir.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let p = PathBuf::from(custom);
        if p.is_dir() {
            return Ok(p);
        }
    }
    default_dir(app)
}

fn data_file(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let dir = effective_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| format!("无法创建数据目录: {e}"))?;
    Ok(dir.join(name))
}

/// 能不能往这个目录写东西（建目录 + 试写一个临时文件）
fn ensure_writable(dir: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| format!("无法创建目录: {e}"))?;
    let probe = dir.join(".typewake-write-test");
    fs::write(&probe, b"ok").map_err(|e| format!("目录不可写: {e}"))?;
    let _ = fs::remove_file(&probe);
    Ok(())
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
    let data_dir = effective_dir(&app)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let default = default_dir(&app)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let first_run = !PathBuf::from(&data_dir).join("progress.json").exists();
    AppInfo {
        version: app.package_info().version.to_string(),
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        custom: read_config(&app).data_dir.is_some() && data_dir != default,
        data_dir,
        default_dir: default,
        first_run,
    }
}

/// 让用户挑一个目录。返回 None 表示取消了。
#[tauri::command]
async fn pick_data_dir(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let picked = app.dialog().file().blocking_pick_folder();
    match picked {
        None => Ok(None),
        Some(p) => p
            .into_path()
            .map(|p| Some(p.to_string_lossy().to_string()))
            .map_err(|e| format!("无法解析所选目录: {e}")),
    }
}

/// 换数据目录：校验可写 → 把现有 progress.json 复制过去 → 记进配置。
///
/// 只复制不删除。旧目录里的文件留着 —— 换目录这件事出错的代价太大，
/// 让用户自己确认新位置没问题之后再手动清理，比我们替他删靠谱。
#[tauri::command]
fn set_data_dir(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let target = PathBuf::from(path.trim());
    if target.as_os_str().is_empty() {
        return Err("目录不能为空".into());
    }
    ensure_writable(&target)?;

    let old_dir = effective_dir(&app)?;
    for name in ["progress.json", "runs.jsonl"] {
        let from = old_dir.join(name);
        let to = target.join(name);
        if from.exists() && !to.exists() {
            fs::copy(&from, &to).map_err(|e| format!("复制 {name} 失败: {e}"))?;
        }
    }

    write_config(&app, &Config { data_dir: Some(target.to_string_lossy().to_string()) })?;
    Ok(target.to_string_lossy().to_string())
}

/// 恢复默认目录（同样不动文件，只是改指向）
#[tauri::command]
fn reset_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    write_config(&app, &Config { data_dir: None })?;
    Ok(default_dir(&app)?.to_string_lossy().to_string())
}

/// 在文件管理器里打开数据目录
#[tauri::command]
fn open_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = effective_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| format!("无法创建数据目录: {e}"))?;
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer.exe")
            .arg(&dir)
            .spawn()
            .map_err(|e| format!("无法打开目录: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&dir)
            .spawn()
            .map_err(|e| format!("无法打开目录: {e}"))?;
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&dir)
            .spawn()
            .map_err(|e| format!("无法打开目录: {e}"))?;
    }
    Ok(dir.to_string_lossy().to_string())
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
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            load_progress,
            save_progress,
            export_progress,
            app_info,
            append_run,
            report_ready,
            pick_data_dir,
            set_data_dir,
            reset_data_dir,
            open_data_dir
        ])
        .run(tauri::generate_context!())
        .expect("TypeWake 启动失败");
}
