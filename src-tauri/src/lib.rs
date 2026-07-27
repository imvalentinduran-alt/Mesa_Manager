use tauri::Manager;

const API_URL: &str = "https://web-production-acce5.up.railway.app";

#[tauri::command]
async fn check_api_health() -> bool {
    let client = reqwest::Client::new();
    client.get(format!("{}/health", API_URL))
        .send().await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

#[tauri::command]
async fn api_proxy(
    method: String,
    path: String,
    body: Option<String>,
    token: Option<String>,
) -> Result<serde_json::Value, String> {
    if !path.starts_with('/') {
        return Err("path inválido".to_string());
    }
    let client = reqwest::Client::new();
    let url = format!("{}{}", API_URL, path);

    let mut req = match method.to_uppercase().as_str() {
        "GET"    => client.get(&url),
        "POST"   => client.post(&url),
        "PUT"    => client.put(&url),
        "PATCH"  => client.patch(&url),
        "DELETE" => client.delete(&url),
        m        => return Err(format!("método desconocido: {m}")),
    };

    if let Some(t) = token {
        req = req.header("Authorization", format!("Bearer {t}"));
    }
    if let Some(b) = body {
        req = req.header("Content-Type", "application/json").body(b);
    }

    let res = req.send().await.map_err(|e| e.to_string())?;
    let status = res.status().as_u16();
    let text = res.text().await.unwrap_or_default();
    let data: serde_json::Value = serde_json::from_str(&text)
        .unwrap_or(serde_json::Value::String(text));

    Ok(serde_json::json!({ "status": status, "data": data }))
}

#[tauri::command]
async fn api_proxy_blob(
    method: String,
    path: String,
    token: Option<String>,
) -> Result<Vec<u8>, String> {
    if !path.starts_with('/') {
        return Err("path inválido".to_string());
    }
    let client = reqwest::Client::new();
    let url = format!("{}{}", API_URL, path);

    let mut req = match method.to_uppercase().as_str() {
        "GET"  => client.get(&url),
        "POST" => client.post(&url),
        m      => return Err(format!("método desconocido: {m}")),
    };

    if let Some(t) = token {
        req = req.header("Authorization", format!("Bearer {t}"));
    }

    let res = req.send().await.map_err(|e| e.to_string())?;
    res.bytes().await.map(|b| b.to_vec()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn descargar_excel(
    path: String,
    filename: String,
    token: Option<String>,
) -> Result<String, String> {
    if !path.starts_with('/') {
        return Err("path inválido".to_string());
    }
    let handle = rfd::AsyncFileDialog::new()
        .set_title("Guardar Excel de Estudiantes")
        .set_file_name(&filename)
        .add_filter("Excel", &["xlsx"])
        .save_file()
        .await;

    let file_handle = match handle {
        Some(h) => h,
        None    => return Err("cancelado".to_string()),
    };

    let client = reqwest::Client::new();
    let url    = format!("{}{}", API_URL, path);
    let mut req = client.get(&url);
    if let Some(t) = token {
        req = req.header("Authorization", format!("Bearer {t}"));
    }
    let res = req.send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("Error del servidor: {}", res.status().as_u16()));
    }
    let bytes = res.bytes().await.map_err(|e| e.to_string())?;

    let dest = file_handle.path().to_path_buf();
    std::fs::write(&dest, bytes).map_err(|e| e.to_string())?;

    Ok(dest.to_string_lossy().into_owned())
}

#[tauri::command]
async fn descargar_pdf_reporte(token: Option<String>) -> Result<String, String> {
    let handle = rfd::AsyncFileDialog::new()
        .set_title("Guardar reporte de defensas")
        .set_file_name("reporte_mensual_mesas.pdf")
        .add_filter("PDF", &["pdf"])
        .save_file()
        .await;

    let file_handle = match handle {
        Some(h) => h,
        None    => return Err("cancelado".to_string()),
    };

    let client = reqwest::Client::new();
    let mut req = client.get(format!("{}/api/dashboard/reporte-pdf", API_URL));
    if let Some(t) = token {
        req = req.header("Authorization", format!("Bearer {t}"));
    }
    let res = req.send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("Error del servidor: {}", res.status().as_u16()));
    }
    let bytes = res.bytes().await.map_err(|e| e.to_string())?;

    let dest = file_handle.path().to_path_buf();
    std::fs::write(&dest, bytes).map_err(|e| e.to_string())?;

    Ok(dest.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
      if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
      }
    }))
    .invoke_handler(tauri::generate_handler![check_api_health, api_proxy, api_proxy_blob, descargar_pdf_reporte, descargar_excel])
    .setup(|app| {
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
      )?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
