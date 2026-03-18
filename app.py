from flask import Flask, render_template, request, jsonify, send_from_directory, session, send_file
import os, json, base64, zipfile, io, secrets
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
import requests as http_requests

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", secrets.token_hex(32))

# ── Paths (Ajustados para Permissão da Vercel) ─────────────
ANTHROPIC_API_URL = "https://api.anthropic.com"
ANTHROPIC_MODEL   = "claude-haiku-4-5-20251001"
OPENAI_API_URL    = "https://api.openai.com"

# Usamos /tmp porque a Vercel é somente leitura na raiz
MOCKUPS_DIR  = Path("/tmp/mockups")
SESSIONS_DIR = Path("/tmp/sessions")
MOCKUPS_FILE = Path("/tmp/mockups_library.json")

# O parents=True e exist_ok=True garantem que o app não trave ao iniciar
MOCKUPS_DIR.mkdir(parents=True, exist_ok=True)
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_KEY    = os.getenv("OPENAI_API_KEY", "")


def get_anthropic_key():
    """Retorna a chave Anthropic: header da requisicao tem prioridade sobre .env"""
    return request.headers.get("X-Anthropic-Key", "").strip() or ANTHROPIC_KEY

def get_openai_key():
    """Retorna a chave OpenAI: header da requisicao tem prioridade sobre .env"""
    return request.headers.get("X-OpenAI-Key", "").strip() or OPENAI_KEY

def load_json(path, default):
    if path.exists():
        try: return json.loads(path.read_text(encoding="utf-8"))
        except: pass
    return default

def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def get_uid():
    """Retorna um ID único por navegador, criado automaticamente."""
    if "uid" not in session:
        session["uid"] = secrets.token_hex(16)
        session.permanent = True
    return session["uid"]

def user_dir(uid):
    d = SESSIONS_DIR / uid; d.mkdir(exist_ok=True); return d

def user_pastas_file(uid):
    return user_dir(uid) / "pastas.json"

def user_imagens_dir(uid):
    d = user_dir(uid) / "imagens"; d.mkdir(exist_ok=True); return d

def user_history_file(uid):
    return user_dir(uid) / "historico.json"

# ── AUTH STUBS ────────────────────────────────────────────
@app.route("/api/me")
def api_me():
    return jsonify({"user": "local", "uid": get_uid()})

@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})

# ── PAGES ─────────────────────────────────────────────────
@app.route("/")
def index():
    get_uid()  # garante que o uid existe
    return render_template("index.html")

@app.route("/mockups/<filename>")
def serve_mockup(filename):
    return send_from_directory(MOCKUPS_DIR, filename)

@app.route("/sessions/<uid>/imagens/<filename>")
def serve_user_image(uid, filename):
    if get_uid() != uid: return "Forbidden", 403
    return send_from_directory(user_imagens_dir(uid), filename)

# ── MOCKUPS ───────────────────────────────────────────────
@app.route("/api/mockups", methods=["GET"])
def get_mockups(): return jsonify(load_json(MOCKUPS_FILE, []))

@app.route("/api/mockups", methods=["POST"])
def add_mockup():
    data = request.get_json(force=True)
    b64  = data.get("image_b64",""); nome = data.get("nome","Mockup").strip() or "Mockup"; mime = data.get("mime","image/jpeg")
    if not b64: return jsonify({"error":"Imagem nao enviada."}), 400
    ext = "jpg" if "jpeg" in mime else mime.split("/")[-1]
    ts = datetime.now().strftime("%Y%m%d%H%M%S%f"); fname = f"mockup_{ts}.{ext}"
    try: (MOCKUPS_DIR / fname).write_bytes(base64.b64decode(b64))
    except Exception as e: return jsonify({"error": f"Erro: {str(e)}"}), 500
    library = load_json(MOCKUPS_FILE, [])
    entry = {"id":ts,"nome":nome,"filename":fname,"url":f"/mockups/{fname}","favorito":False,"data":datetime.now().strftime("%d/%m/%Y %H:%M")}
    library.insert(0, entry); save_json(MOCKUPS_FILE, library)
    return jsonify(entry)

@app.route("/api/mockups/<string:mid>/favorito", methods=["POST"])
def toggle_favorito(mid):
    library = load_json(MOCKUPS_FILE, [])
    for m in library:
        if m.get("id") == mid: m["favorito"] = not m.get("favorito", False); break
    save_json(MOCKUPS_FILE, library); return jsonify({"ok": True})

@app.route("/api/mockups/<string:mid>", methods=["DELETE"])
def delete_mockup(mid):
    library = load_json(MOCKUPS_FILE, [])
    new_lib = []
    for m in library:
        if m.get("id") == mid:
            try: (MOCKUPS_DIR / m["filename"]).unlink()
            except: pass
        else: new_lib.append(m)
    save_json(MOCKUPS_FILE, new_lib); return jsonify({"ok": True})

@app.route("/api/mockups/<string:mid>/molduras", methods=["POST"])
def salvar_molduras(mid):
    data = request.get_json(force=True); molduras = data.get("molduras", [])
    if len(molduras) != 3: return jsonify({"error":"Envie 3 molduras."}), 400
    library = load_json(MOCKUPS_FILE, [])
    for m in library:
        if m.get("id") == mid: m["molduras"] = molduras; break
    save_json(MOCKUPS_FILE, library); return jsonify({"ok": True})

# ── HISTÓRICO ─────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
def get_history(): return jsonify(load_json(user_history_file(get_uid()), []))

@app.route("/api/history", methods=["DELETE"])
def clear_history(): save_json(user_history_file(get_uid()), []); return jsonify({"ok": True})

@app.route("/api/history/<int:idx>", methods=["DELETE"])
def delete_history_item(idx):
    f = user_history_file(get_uid()); entries = load_json(f, [])
    if 0 <= idx < len(entries): entries.pop(idx); save_json(f, entries)
    return jsonify({"ok": True})

# ── PASTAS ────────────────────────────────────────────────
@app.route("/api/pastas", methods=["GET"])
def get_pastas(): return jsonify(load_json(user_pastas_file(get_uid()), []))

@app.route("/api/pastas", methods=["POST"])
def criar_pasta():
    data = request.get_json(force=True); nome = data.get("nome","Nova Pasta").strip() or "Nova Pasta"
    uid = get_uid(); f = user_pastas_file(uid); pastas = load_json(f, [])
    pid = datetime.now().strftime("%Y%m%d%H%M%S%f")
    pasta = {"id":pid,"nome":nome,"data":datetime.now().strftime("%d/%m/%Y %H:%M"),"imagens":[],"titulo":"","descricao":""}
    pastas.insert(0, pasta); save_json(f, pastas); return jsonify(pasta)

@app.route("/api/pastas/<string:pid>", methods=["PUT"])
def atualizar_pasta(pid):
    data = request.get_json(force=True); uid = get_uid(); f = user_pastas_file(uid); pastas = load_json(f, [])
    for p in pastas:
        if p["id"] == pid:
            if "nome"      in data: p["nome"]      = data["nome"]
            if "titulo"    in data: p["titulo"]    = data["titulo"]
            if "descricao" in data: p["descricao"] = data["descricao"]
            break
    save_json(f, pastas); return jsonify({"ok": True})

@app.route("/api/pastas/<string:pid>", methods=["DELETE"])
def deletar_pasta(pid):
    uid = get_uid(); f = user_pastas_file(uid); pastas = load_json(f, [])
    pastas = [p for p in pastas if p["id"] != pid]; save_json(f, pastas); return jsonify({"ok": True})

@app.route("/api/pastas/<string:pid>/imagens", methods=["POST"])
def adicionar_imagem_pasta(pid):
    data = request.get_json(force=True); img_b64 = data.get("image_b64",""); nome = data.get("nome","imagem").strip() or "imagem"
    uid = get_uid()
    if not img_b64: return jsonify({"error":"Imagem nao enviada."}), 400
    ts = datetime.now().strftime("%Y%m%d%H%M%S%f"); fname = f"{ts}.png"
    fpath = user_imagens_dir(uid) / fname
    try: fpath.write_bytes(base64.b64decode(img_b64))
    except Exception as e: return jsonify({"error":str(e)}), 500
    img_entry = {"id":ts,"nome":nome,"filename":fname,"url":f"/sessions/{uid}/imagens/{fname}","data":datetime.now().strftime("%d/%m/%Y %H:%M")}
    f = user_pastas_file(uid); pastas = load_json(f, [])
    for p in pastas:
        if p["id"] == pid: p.setdefault("imagens",[]).insert(0, img_entry); break
    save_json(f, pastas); return jsonify(img_entry)

@app.route("/api/pastas/<string:pid>/imagens/<string:iid>", methods=["DELETE"])
def remover_imagem_pasta(pid, iid):
    uid = get_uid(); f = user_pastas_file(uid); pastas = load_json(f, [])
    for p in pastas:
        if p["id"] == pid:
            for img in p.get("imagens",[]):
                if img["id"] == iid:
                    try: (user_imagens_dir(uid) / img["filename"]).unlink()
                    except: pass
            p["imagens"] = [i for i in p.get("imagens",[]) if i["id"] != iid]; break
    save_json(f, pastas); return jsonify({"ok": True})

@app.route("/api/pastas/<string:pid>/download", methods=["GET"])
def download_pasta(pid):
    uid = get_uid(); pastas = load_json(user_pastas_file(uid), [])
    pasta = next((p for p in pastas if p["id"] == pid), None)
    if not pasta: return jsonify({"error":"Pasta nao encontrada."}), 404
    buf = io.BytesIO(); nome_zip = pasta["nome"].replace(" ","_")
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        txt = f"TITULO:\n{pasta.get('titulo','')}\n\nDESCRICAO:\n{pasta.get('descricao','')}"
        zf.writestr(f"{nome_zip}/anuncio.txt", txt)
        for img in pasta.get("imagens",[]):
            fpath = user_imagens_dir(uid) / img["filename"]
            if fpath.exists(): zf.write(fpath, f"{nome_zip}/{img['nome']}.png")
    buf.seek(0)
    return send_file(buf, mimetype="application/zip", as_attachment=True, download_name=f"{nome_zip}.zip")

# ── GERAR PROMPT ──────────────────────────────────────────
@app.route("/api/generate", methods=["POST"])
def generate():
    anthropic_key = get_anthropic_key()
    if not anthropic_key: return jsonify({"error":"Chave Anthropic nao configurada."}), 500
    data = request.get_json(force=True)
    sys_p = data.get("system_prompt",""); usr_p = data.get("user_prompt","")
    if not sys_p or not usr_p: return jsonify({"error":"Prompts nao enviados."}), 400
    try:
        resp = http_requests.post(ANTHROPIC_API_URL, timeout=90, headers={
            "Content-Type":"application/json","x-api-key":anthropic_key,"anthropic-version":"2023-06-01"
        }, json={"model":ANTHROPIC_MODEL,"max_tokens":12000,"system":sys_p,"messages":[{"role":"user","content":usr_p}]})
        resp.raise_for_status(); api_data = resp.json()
    except http_requests.exceptions.HTTPError as e:
        try: msg = e.response.json().get("error",{}).get("message",str(e))
        except: msg = str(e)
        return jsonify({"error":f"Erro Anthropic: {msg}"}), 502
    except Exception as e: return jsonify({"error":f"Erro: {str(e)}"}), 502
    raw = api_data["content"][0]["text"].strip().replace("```json","").replace("```","").strip()
    s, e2 = raw.find("{"), raw.rfind("}") + 1
    if s == -1: return jsonify({"error":"Resposta invalida."}), 502
    try: result = json.loads(raw[s:e2])
    except Exception as e: return jsonify({"error":f"JSON invalido: {str(e)}"}), 502
    # Custo Claude Haiku: $1/MTok input, $5/MTok output
    usage = api_data.get("usage", {})
    inp = usage.get("input_tokens", 0); out = usage.get("output_tokens", 0)
    cost_usd = (inp * 1 + out * 5) / 1_000_000
    DOLAR_BRL = 5.80
    result["cost_usd"] = round(cost_usd, 5)
    result["cost_brl"] = round(cost_usd * DOLAR_BRL, 5)
    try:
        uid = get_uid(); hf = user_history_file(uid); entries = load_json(hf, [])
        kit = result.get("kits",[{}])[0]
        entries.insert(0,{"id":datetime.now().strftime("%Y%m%d%H%M%S%f"),"data":datetime.now().strftime("%d/%m/%Y %H:%M"),
            "nome":kit.get("nome","Sem nome"),"prompt":kit.get("pecas",[{}])[0].get("prompt",""),"negative":result.get("negative","")})
        save_json(hf, entries[:100])
    except: pass
    return jsonify(result)

# ── IMPORTAR PECA (extensao Chrome) ──────────────────────
@app.route("/api/import-peca", methods=["POST", "OPTIONS"])
def import_peca():
    if request.method == "OPTIONS":
        resp = jsonify({"ok": True})
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return resp
    data = request.get_json(force=True)
    slot = int(data.get("slot", 0))
    b64  = data.get("b64", "")
    nome = data.get("nome", f"peca_{slot+1}.jpg")
    if not b64: return jsonify({"error": "Imagem vazia."}), 400
    resp = jsonify({"ok": True, "slot": slot, "nome": nome})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

SCENE_OPTIONS = {
    # SALA MODERNA
    "sala_frente":       {"label":"Sala Moderna — Frontal",         "room":"modern living room, light gray wall, beige linen sofa, oak wood floor, warm recessed ceiling lights"},
    "sala_dir":          {"label":"Sala Moderna — Lateral Direita", "room":"modern living room, light gray wall, beige linen sofa, oak wood floor, warm recessed ceiling lights"},
    "sala_esq":          {"label":"Sala Moderna — Lateral Esquerda","room":"modern living room, light gray wall, beige linen sofa, oak wood floor, warm recessed ceiling lights"},
    # SALA DARK
    "sala_dark_frente":  {"label":"Sala Dark — Frontal",            "room":"luxury living room, deep charcoal textured wall, black leather sofa, marble floor, dramatic recessed spot lights"},
    "sala_dark_dir":     {"label":"Sala Dark — Lateral Direita",    "room":"luxury living room, deep charcoal textured wall, black leather sofa, marble floor, dramatic recessed spot lights"},
    "sala_dark_esq":     {"label":"Sala Dark — Lateral Esquerda",   "room":"luxury living room, deep charcoal textured wall, black leather sofa, marble floor, dramatic recessed spot lights"},
    # SALA MINIMALISTA
    "minimal_frente":    {"label":"Sala Minimalista — Frontal",     "room":"minimalist living room, pure white wall, white linen sofa, light ash wood floor, clean natural daylight"},
    "minimal_dir":       {"label":"Sala Minimalista — Lateral Dir", "room":"minimalist living room, pure white wall, white linen sofa, light ash wood floor, clean natural daylight"},
    "minimal_esq":       {"label":"Sala Minimalista — Lateral Esq", "room":"minimalist living room, pure white wall, white linen sofa, light ash wood floor, clean natural daylight"},
    # SALA LUXO
    "luxo_sala_frente":  {"label":"Sala Luxo — Frontal",            "room":"luxury high-end living room, cream marble wall, velvet champagne sofa, gold accent furniture, crystal chandelier, parquet floor"},
    "luxo_sala_dir":     {"label":"Sala Luxo — Lateral Direita",    "room":"luxury high-end living room, cream marble wall, velvet champagne sofa, gold accent furniture, crystal chandelier, parquet floor"},
    "luxo_sala_esq":     {"label":"Sala Luxo — Lateral Esquerda",   "room":"luxury high-end living room, cream marble wall, velvet champagne sofa, gold accent furniture, crystal chandelier, parquet floor"},
    # QUARTO
    "quarto_frente":     {"label":"Quarto — Frontal",               "room":"cozy bedroom, warm off-white wall, wooden bed frame, soft neutral linen bedding, warm bedside lamps"},
    "quarto_dir":        {"label":"Quarto — Lateral Direita",       "room":"cozy bedroom, warm off-white wall, wooden bed frame, soft neutral linen bedding, warm bedside lamps"},
    "quarto_esq":        {"label":"Quarto — Lateral Esquerda",      "room":"cozy bedroom, warm off-white wall, wooden bed frame, soft neutral linen bedding, warm bedside lamps"},
    # QUARTO LUXUOSO
    "luxo_frente":       {"label":"Quarto Luxuoso — Frontal",       "room":"luxury master bedroom, dark navy blue wall, king size bed with white silk bedding, gold accent lamps, herringbone parquet floor"},
    "luxo_dir":          {"label":"Quarto Luxuoso — Lateral Dir",   "room":"luxury master bedroom, dark navy blue wall, king size bed with white silk bedding, gold accent lamps, herringbone parquet floor"},
    "luxo_esq":          {"label":"Quarto Luxuoso — Lateral Esq",   "room":"luxury master bedroom, dark navy blue wall, king size bed with white silk bedding, gold accent lamps, herringbone parquet floor"},
    # QUARTO INFANTIL
    "infantil_frente":   {"label":"Quarto Infantil — Frontal",      "room":"cute kids bedroom, pastel light blue wall, white wooden children bed, colorful plush toys on floor, soft warm lighting"},
    "infantil_dir":      {"label":"Quarto Infantil — Lateral Dir",  "room":"cute kids bedroom, pastel light blue wall, white wooden children bed, colorful plush toys on floor, soft warm lighting"},
    "infantil_esq":      {"label":"Quarto Infantil — Lateral Esq",  "room":"cute kids bedroom, pastel light blue wall, white wooden children bed, colorful plush toys on floor, soft warm lighting"},
    # QUARTO GAMER
    "gamer_frente":      {"label":"Quarto Gamer — Frontal",         "room":"gamer bedroom, dark gray wall, RGB gaming desk setup with monitors and keyboard, gaming chair, neon LED strip lights on ceiling, dark floor"},
    "gamer_dir":         {"label":"Quarto Gamer — Lateral Direita", "room":"gamer bedroom, dark gray wall, RGB gaming desk setup with monitors and keyboard, gaming chair, neon LED strip lights on ceiling, dark floor"},
    "gamer_esq":         {"label":"Quarto Gamer — Lateral Esquerda","room":"gamer bedroom, dark gray wall, RGB gaming desk setup with monitors and keyboard, gaming chair, neon LED strip lights on ceiling, dark floor"},
    # ESCRITÓRIO
    "escritorio_frente": {"label":"Escritório — Frontal",           "room":"modern home office, light gray wall, wooden desk with laptop, ergonomic chair, bookshelf, warm task lighting"},
    "escritorio_dir":    {"label":"Escritório — Lateral Direita",   "room":"modern home office, light gray wall, wooden desk with laptop, ergonomic chair, bookshelf, warm task lighting"},
    "escritorio_esq":    {"label":"Escritório — Lateral Esquerda",  "room":"modern home office, light gray wall, wooden desk with laptop, ergonomic chair, bookshelf, warm task lighting"},
    # LAVABO
    "lavabo_frente":     {"label":"Lavabo — Frontal",               "room":"elegant bathroom, white marble wall, floating sink with gold faucet, decorative candles and plants, soft warm lighting"},
    "lavabo_dir":        {"label":"Lavabo — Lateral Direita",       "room":"elegant bathroom, white marble wall, floating sink with gold faucet, decorative candles and plants, soft warm lighting"},
    "lavabo_esq":        {"label":"Lavabo — Lateral Esquerda",      "room":"elegant bathroom, white marble wall, floating sink with gold faucet, decorative candles and plants, soft warm lighting"},
}

CAMERA_BY_TYPE = {
    "frente": "straight-on frontal shot of the wall, camera perfectly parallel to the wall, slight low angle looking up slightly to emphasize the large frames",
    "dir":    "dynamic perspective angle from the right side, camera at 30-40 degrees showing the wall in perspective with the room behind",
    "esq":    "dynamic perspective angle from the left side, camera at 30-40 degrees showing the wall in perspective with the room behind",
}

def get_camera(scene_id):
    if scene_id.endswith("_frente"): return CAMERA_BY_TYPE["frente"]
    if scene_id.endswith("_dir"):    return CAMERA_BY_TYPE["dir"]
    if scene_id.endswith("_esq"):    return CAMERA_BY_TYPE["esq"]
    return CAMERA_BY_TYPE["frente"]

@app.route("/api/scene-options", methods=["GET"])
def get_scene_options():
    return jsonify([{"id": k, "label": v["label"]} for k, v in SCENE_OPTIONS.items()])

def detect_frames(mockup_cv):
    """Detecta automaticamente as 3 molduras brancas no mockup."""
    import cv2 as _cv2
    import numpy as _np
    h, w = mockup_cv.shape[:2]
    gray = _cv2.cvtColor(mockup_cv, _cv2.COLOR_BGR2GRAY)
    _, thresh = _cv2.threshold(gray, 200, 255, _cv2.THRESH_BINARY)
    contours, _ = _cv2.findContours(thresh, _cv2.RETR_EXTERNAL, _cv2.CHAIN_APPROX_SIMPLE)

    def order_pts(pts):
        pts = pts.reshape(4,2).astype(_np.float32)
        s = pts.sum(axis=1); diff = _np.diff(pts, axis=1)
        return _np.array([pts[_np.argmin(s)], pts[_np.argmin(diff)],
                          pts[_np.argmax(s)], pts[_np.argmax(diff)]], dtype=_np.float32)

    candidates = []
    for c in contours:
        area = _cv2.contourArea(c)
        if area < w * h * 0.04: continue
        peri = _cv2.arcLength(c, True)
        approx = _cv2.approxPolyDP(c, 0.02 * peri, True)
        bx, by, bw, bh = _cv2.boundingRect(approx)
        if len(approx) == 4 and bh / max(bw, 1) > 1.0:
            candidates.append((bx, order_pts(approx)))

    candidates.sort(key=lambda c: c[0])
    return [pts for _, pts in candidates[:3]]

def split_kit_panels(kit_cv):
    """Divide o kit nos 3 painéis, detectando separadores brancos automaticamente."""
    import numpy as _np
    kh, kw = kit_cv.shape[:2]
    gray = cv2_module.cvtColor(kit_cv, cv2_module.COLOR_BGR2GRAY)
    col_mean = gray.mean(axis=0)
    white_cols = _np.where(col_mean > 230)[0]

    if len(white_cols) > 10:
        gaps = _np.split(white_cols, _np.where(_np.diff(white_cols) > 5)[0] + 1)
        separators = [g for g in gaps if g[0] > kw * 0.1 and g[-1] < kw * 0.9 and len(g) > 2]
        if len(separators) >= 2:
            s1s, s1e = int(separators[0][0]),  int(separators[0][-1])
            s2s, s2e = int(separators[1][0]),  int(separators[1][-1])
            left_end  = int(white_cols[0])  if white_cols[0]  < kw * 0.1 else 0
            right_start = int(white_cols[-1]) if white_cols[-1] > kw * 0.9 else kw
            return [kit_cv[:, left_end:s1s], kit_cv[:, s1e+1:s2s], kit_cv[:, s2e+1:right_start]]

    pw = kw // 3
    return [kit_cv[:, 0:pw], kit_cv[:, pw:pw*2], kit_cv[:, pw*2:]]


def detect_colored_zones(mockup_cv, target_color='red'):
    """
    Detecta 3 zonas coloridas no mockup (ex: vermelho puro).
    Retorna lista de 3 contornos com 4 pontos cada (perspectiva incluída).
    """
    import cv2 as _cv2
    import numpy as _np

    hsv = _cv2.cvtColor(mockup_cv, _cv2.COLOR_BGR2HSV)
    h, w = mockup_cv.shape[:2]

    COLOR_RANGES = {
        'red':   [(_np.array([0,120,80]),   _np.array([10,255,255])),
                  (_np.array([165,120,80]),  _np.array([180,255,255]))],
        'green': [(_np.array([45,120,80]),  _np.array([90,255,255]))],
        'blue':  [(_np.array([100,120,80]), _np.array([140,255,255]))],
        'yellow':[(_np.array([22,120,80]),  _np.array([38,255,255]))],
        'cyan':  [(_np.array([85,120,80]),  _np.array([100,255,255]))],
    }
    ranges = COLOR_RANGES.get(target_color, COLOR_RANGES['red'])

    mask = _np.zeros(hsv.shape[:2], dtype=_np.uint8)
    for lo, hi in ranges:
        mask |= _cv2.inRange(hsv, lo, hi)

    # Morfologia para fechar buracos pequenos
    kernel = _np.ones((5,5), _np.uint8)
    mask = _cv2.morphologyEx(mask, _cv2.MORPH_CLOSE, kernel)
    mask = _cv2.morphologyEx(mask, _cv2.MORPH_OPEN,  kernel)

    conts, _ = _cv2.findContours(mask, _cv2.RETR_EXTERNAL, _cv2.CHAIN_APPROX_SIMPLE)
    zones = []
    for c in conts:
        area = _cv2.contourArea(c)
        if area < w * h * 0.01: continue  # ignora pequenos ruídos
        peri = _cv2.arcLength(c, True)
        # Tenta approximar como quadrilátero
        for eps in [0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.10]:
            approx = _cv2.approxPolyDP(c, eps * peri, True)
            if len(approx) == 4:
                zones.append((int(_cv2.boundingRect(c)[0]), approx.reshape(4,2).astype(_np.float32)))
                break
        else:
            # Fallback: usa bounding rect
            bx, by, bw, bh = _cv2.boundingRect(c)
            pts = _np.float32([[bx,by],[bx+bw,by],[bx+bw,by+bh],[bx,by+bh]])
            zones.append((bx, pts))

    zones.sort(key=lambda z: z[0])
    return [pts for _, pts in zones[:3]]


def order_quad(pts):
    """Ordena 4 pontos: topo-esq, topo-dir, baixo-dir, baixo-esq."""
    import numpy as _np
    pts = pts.reshape(4, 2).astype(_np.float32)
    s = pts.sum(axis=1)
    diff = pts[:, 1] - pts[:, 0]
    return _np.array([
        pts[_np.argmin(s)],    # topo-esq
        pts[_np.argmin(diff)], # topo-dir
        pts[_np.argmax(s)],    # baixo-dir
        pts[_np.argmax(diff)]  # baixo-esq
    ], dtype=_np.float32)


# draw_frame_border removida — moldura vem do mockup original




@app.route("/api/generate-anuncio-single", methods=["POST"])
def generate_anuncio_single():
    data      = request.get_json(force=True)
    mockup_id = data.get("mockup_id","").strip()
    pecas_b64 = data.get("pecas_b64", [])   # lista de 3 b64, uma por peça
    # Retrocompatibilidade: se vier kit_b64, aceita também
    kit_b64   = data.get("kit_b64","").strip()

    if not mockup_id: return jsonify({"error":"Selecione um mockup."}), 400
    if not pecas_b64 and not kit_b64:
        return jsonify({"error":"Envie as 3 pecas ou o kit."}), 400

    library = load_json(MOCKUPS_FILE, [])
    entry   = next((m for m in library if m["id"] == mockup_id), None)
    if not entry: return jsonify({"error":"Mockup nao encontrado."}), 400
    fpath = MOCKUPS_DIR / entry["filename"]
    if not fpath.exists(): return jsonify({"error":"Arquivo do mockup nao encontrado."}), 400

    try:
        import cv2 as cv2_local
        import numpy as np_local
        from PIL import Image as PILImage
        import io as _io

        mockup_arr = np_local.frombuffer(fpath.read_bytes(), np_local.uint8)
        mockup_cv  = cv2_local.imdecode(mockup_arr, cv2_local.IMREAD_COLOR)
        if mockup_cv is None:
            return jsonify({"error": "Erro ao carregar mockup."}), 500

        mh, mw = mockup_cv.shape[:2]

        # ── Carrega os 3 painéis ──────────────────────────
        def load_panel_b64(b64str):
            arr = np_local.frombuffer(base64.b64decode(b64str), np_local.uint8)
            return cv2_local.imdecode(arr, cv2_local.IMREAD_COLOR)

        if pecas_b64 and len(pecas_b64) == 3 and all(pecas_b64):
            # Novo modo: 3 imagens separadas
            panels_raw = [load_panel_b64(b) for b in pecas_b64]
            if any(p is None for p in panels_raw):
                return jsonify({"error": "Erro ao carregar uma das pecas."}), 500
        else:
            # Retrocompatibilidade: divide kit em 3
            kit_bytes = base64.b64decode(kit_b64)
            kit_arr   = np_local.frombuffer(kit_bytes, np_local.uint8)
            kit_cv    = cv2_local.imdecode(kit_arr, cv2_local.IMREAD_COLOR)
            if kit_cv is None:
                return jsonify({"error": "Erro ao carregar kit."}), 500
            kh, kw = kit_cv.shape[:2]
            gray_k = cv2_local.cvtColor(kit_cv, cv2_local.COLOR_BGR2GRAY)
            col_mean = gray_k.mean(axis=0)
            white_cols = np_local.where(col_mean > 230)[0]
            if len(white_cols) > 10:
                gaps = np_local.split(white_cols, np_local.where(np_local.diff(white_cols) > 5)[0]+1)
                seps = [g for g in gaps if g[0]>kw*0.1 and g[-1]<kw*0.9 and len(g)>2]
                if len(seps) >= 2:
                    s1s,s1e = int(seps[0][0]),int(seps[0][-1])
                    s2s,s2e = int(seps[1][0]),int(seps[1][-1])
                    le = int(white_cols[0]) if white_cols[0]<kw*0.1 else 0
                    rs = int(white_cols[-1])+1 if white_cols[-1]>kw*0.9 else kw
                    panels_raw = [kit_cv[:,le:s1s], kit_cv[:,s1e+1:s2s], kit_cv[:,s2e+1:rs]]
                else:
                    pw = kw//3; panels_raw = [kit_cv[:,0:pw], kit_cv[:,pw:pw*2], kit_cv[:,pw*2:]]
            else:
                pw = kw//3; panels_raw = [kit_cv[:,0:pw], kit_cv[:,pw:pw*2], kit_cv[:,pw*2:]]

        def crop_white_border(panel, thresh=240):
            pg = cv2_local.cvtColor(panel, cv2_local.COLOR_BGR2GRAY)
            ph, pw = panel.shape[:2]
            col_has = (pg < thresh).any(axis=0)
            row_has = (pg < thresh).any(axis=1)
            cols = np_local.where(col_has)[0]; rows = np_local.where(row_has)[0]
            if not len(cols) or not len(rows): return panel
            x1,x2 = max(0,cols[0]-1), min(pw,cols[-1]+2)
            y1,y2 = max(0,rows[0]-1), min(ph,rows[-1]+2)
            c = panel[y1:y2, x1:x2]
            return c if c.shape[0]>ph*0.05 and c.shape[1]>pw*0.05 else panel

        panels = [crop_white_border(p) for p in panels_raw]

        # ── Detecta zonas e cola ─────────────────────────
        gray_m   = cv2_local.cvtColor(mockup_cv, cv2_local.COLOR_BGR2GRAY)
        detect_color = data.get("detect_color", "auto")  # auto|red|green|blue|yellow|cyan

        def add_inner_shadow(panel, strength=0.35, size_frac=0.06):
            ph,pw2=panel.shape[:2]
            mask=np_local.ones((ph,pw2),dtype=np_local.float32)
            sx=max(1,int(pw2*size_frac)); sy=max(1,int(ph*size_frac))
            for x in range(sx):
                v=strength+(1-strength)*(x/sx)
                mask[:,x]*=v; mask[:,pw2-1-x]*=v
            for y in range(sy):
                v=strength+(1-strength)*(y/sy)
                mask[y,:]*=v; mask[ph-1-y,:]*=v
            m3=np_local.stack([mask,mask,mask],axis=2)
            return (panel.astype(np_local.float32)*m3).clip(0,255).astype(np_local.uint8)

        def measure_black_border(gray, bx, by, bw, bh, side_samples=5):
            """
            Mede a espessura real da borda preta em cada lado do bounding rect.
            Varre pixels para fora do bounding rect buscando a região preta.
            Retorna a espessura medida (mediana de N amostras por lado).
            """
            BLACK_THRESH = 60   # pixels abaixo disto são "pretos"
            MAX_SCAN     = 40   # máximo a varrer para fora
            measurements = []

            # Lado esquerdo: varre para a esquerda a partir de bx
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                row = int(by + bh * frac)
                row = np_local.clip(row, 0, mh - 1)
                thickness = 0
                for dx in range(1, MAX_SCAN + 1):
                    col = bx - dx
                    if col < 0: break
                    if gray[row, col] < BLACK_THRESH:
                        thickness = dx
                    else:
                        break
                measurements.append(thickness)

            # Lado direito: varre para a direita a partir de bx+bw
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                row = int(by + bh * frac)
                row = np_local.clip(row, 0, mh - 1)
                thickness = 0
                for dx in range(1, MAX_SCAN + 1):
                    col = bx + bw + dx
                    if col >= mw: break
                    if gray[row, col] < BLACK_THRESH:
                        thickness = dx
                    else:
                        break
                measurements.append(thickness)

            # Lado superior: varre para cima a partir de by
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                col = int(bx + bw * frac)
                col = np_local.clip(col, 0, mw - 1)
                thickness = 0
                for dy in range(1, MAX_SCAN + 1):
                    row = by - dy
                    if row < 0: break
                    if gray[row, col] < BLACK_THRESH:
                        thickness = dy
                    else:
                        break
                measurements.append(thickness)

            # Lado inferior: varre para baixo a partir de by+bh
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                col = int(bx + bw * frac)
                col = np_local.clip(col, 0, mw - 1)
                thickness = 0
                for dy in range(1, MAX_SCAN + 1):
                    row = by + bh + dy
                    if row >= mh: break
                    if gray[row, col] < BLACK_THRESH:
                        thickness = dy
                    else:
                        break
                measurements.append(thickness)

            measured = int(np_local.median([m for m in measurements if m > 0] or [8]))
            # Mínimo de 4px, máximo de MAX_SCAN; adiciona 3px de margem de segurança
            return np_local.clip(measured + 3, 4, MAX_SCAN)

        def find_frame_interior(gray, bx, by, bw, bh):
            """
            Retorna a região interior da moldura (bounding rect da área branca).
            A arte fica DENTRO, com pequeno inset para não vazar sobre a borda.
            """
            EXP_H = 0
            EXP_V = 0
            ix1 = max(0,  bx - EXP_H)
            iy1 = max(0,  by - EXP_V)
            ix2 = min(mw, bx + bw + EXP_H)
            iy2 = min(mh, by + bh + EXP_V)
            return ix1, iy1, ix2, iy2

        def order_pts_l(pts):
            pts=pts.reshape(4,2).astype(np_local.float32)
            s=pts.sum(axis=1); diff=pts[:,1]-pts[:,0]
            return np_local.array([pts[np_local.argmin(s)],pts[np_local.argmin(diff)],
                                   pts[np_local.argmax(s)],pts[np_local.argmax(diff)]],dtype=np_local.float32)

        def find_frames_robust(gray, w, h):
            for tv in [170,160,150,180,200,220,140]:
                _,thresh=cv2_local.threshold(gray,tv,255,cv2_local.THRESH_BINARY)
                conts,_=cv2_local.findContours(thresh,cv2_local.RETR_EXTERNAL,cv2_local.CHAIN_APPROX_SIMPLE)
                cands=[]
                for c in conts:
                    area=cv2_local.contourArea(c)
                    if area<w*h*0.02 or area>w*h*0.35: continue
                    bx,by,bw,bh=cv2_local.boundingRect(c)
                    if bh/max(bw,1)>=0.8 and bw>=w*0.07 and bw<=w*0.46:
                        cands.append((bx,bx,by,bw,bh,c))
                cands.sort(key=lambda x:x[0])
                if len(cands)>=3: return cands[:3]
            return []

        # ── Tenta detecção por cor (mockups com zonas coloridas) ──
        detect_color = data.get("detect_color", "auto")

        use_color_detect = False
        color_quads = []
        if detect_color != 'white':
            try_colors = ['red','green','blue','yellow','cyan'] if detect_color=='auto' else [detect_color]
            for tc in try_colors:
                color_quads = detect_colored_zones(mockup_cv, tc)
                if len(color_quads) >= 3:
                    use_color_detect = True
                    break

        result = mockup_cv.copy()

        if use_color_detect:
            # MODO COR: warp perfeito nos quadriláteros coloridos
            for i, raw_quad in enumerate(color_quads[:3]):
                if i >= len(panels): break
                panel   = panels[i]; ph,pw2=panel.shape[:2]
                panel_s = add_inner_shadow(panel)
                dst = order_quad(raw_quad)
                dst[:,0]=np_local.clip(dst[:,0],0,mw-1)
                dst[:,1]=np_local.clip(dst[:,1],0,mh-1)
                src=np_local.float32([[0,0],[pw2,0],[pw2,ph],[0,ph]])
                M=cv2_local.getPerspectiveTransform(src,dst)
                warped=cv2_local.warpPerspective(panel_s,M,(mw,mh),flags=cv2_local.INTER_LANCZOS4)
                mask=np_local.zeros((mh,mw),np_local.uint8)
                cv2_local.fillPoly(mask,[dst.astype(np_local.int32)],255)
                result=np_local.where(cv2_local.merge([mask,mask,mask])>0,warped,result)
        else:
            # MODO BRANCO: detecção clássica por brilho
            frames = find_frames_robust(gray_m, mw, mh)
            if len(frames)<3:
                return jsonify({"error":"Nao foi possivel detectar 3 molduras neste mockup."}), 400
            widths=[f[3] for f in frames]
            has_persp=(max(widths)-min(widths))>mw*0.04
            for i,(_,bx,by,bw,bh,contour) in enumerate(frames):
                ix1,iy1,ix2,iy2 = find_frame_interior(gray_m,bx,by,bw,bh)
                iw,ih=ix2-ix1,iy2-iy1
                if iw<10 or ih<10: continue
                panel=panels[i]; ph,pw2=panel.shape[:2]
                panel_s=add_inner_shadow(panel)
                if has_persp:
                    peri=cv2_local.arcLength(contour,True); ap=None
                    for eps in [0.02,0.03,0.04,0.05,0.06,0.08]:
                        a=cv2_local.approxPolyDP(contour,eps*peri,True)
                        if len(a)==4: ap=a; break
                    if ap is not None:
                        dst=order_pts_l(ap)
                        dst[:,0]=np_local.clip(dst[:,0],0,mw-1)
                        dst[:,1]=np_local.clip(dst[:,1],0,mh-1)
                        src=np_local.float32([[0,0],[pw2,0],[pw2,ph],[0,ph]])
                        M=cv2_local.getPerspectiveTransform(src,dst)
                        warped=cv2_local.warpPerspective(panel_s,M,(mw,mh),flags=cv2_local.INTER_LANCZOS4)
                        mask=np_local.zeros((mh,mw),np_local.uint8)
                        cv2_local.fillPoly(mask,[dst.astype(np_local.int32)],255)
                        result=np_local.where(cv2_local.merge([mask,mask,mask])>0,warped,result)
                        continue
                result[iy1:iy2,ix1:ix2]=cv2_local.resize(panel_s,(iw,ih),interpolation=cv2_local.INTER_LANCZOS4)

        # ── Converte para JPEG, upscale 2000x2000 ─────────
        result_pil = PILImage.fromarray(cv2_local.cvtColor(result, cv2_local.COLOR_BGR2RGB))
        result_pil = result_pil.resize((2000, 2000), PILImage.LANCZOS)
        buf = _io.BytesIO()
        result_pil.save(buf, format="JPEG", quality=95)
        img_b64 = base64.b64encode(buf.getvalue()).decode()

        return jsonify({"ok": True, "image_b64": img_b64,
                        "mockup_nome": entry.get("nome", "Mockup"),
                        "mockup_id": mockup_id,
                        "cost_usd": 0, "cost_brl": 0})

    except Exception as e:
        return jsonify({"error": f"Erro na composicao: {str(e)}"}), 502


# ── GERAR ANÚNCIO BATCH (múltiplos mockups) ───────────────
@app.route("/api/generate-anuncio-batch", methods=["POST"])
def generate_anuncio_batch():
    """
    Gera um anúncio para cada mockup da lista.
    Body: { pecas_b64: [b64, b64, b64], mockup_ids: ["id1","id2",...] }
    Retorna um stream NDJSON — uma linha JSON por mockup processado.
    """
    import cv2 as cv2_local
    import numpy as np_local
    from PIL import Image as PILImage
    import io as _io

    data       = request.get_json(force=True)
    pecas_b64  = data.get("pecas_b64", [])
    mockup_ids = data.get("mockup_ids", [])

    if len(pecas_b64) != 3 or not all(pecas_b64):
        return jsonify({"error": "Envie exatamente 3 peças."}), 400
    if not mockup_ids:
        return jsonify({"error": "Nenhum mockup selecionado."}), 400

    library = load_json(MOCKUPS_FILE, [])
    lib_idx  = {m["id"]: m for m in library}

    def compositar(mockup_cv, panels):
        """Mesmo algoritmo do generate-anuncio-single, extraído para reuso."""
        mh2, mw2 = mockup_cv.shape[:2]
        gray_m = cv2_local.cvtColor(mockup_cv, cv2_local.COLOR_BGR2GRAY)

        def add_inner_shadow(panel, strength=0.35, size_frac=0.06):
            ph, pw2 = panel.shape[:2]
            mask = np_local.ones((ph, pw2), dtype=np_local.float32)
            sx = max(1, int(pw2 * size_frac)); sy = max(1, int(ph * size_frac))
            for x in range(sx):
                v = strength + (1 - strength) * (x / sx)
                mask[:, x] *= v; mask[:, pw2-1-x] *= v
            for y in range(sy):
                v = strength + (1 - strength) * (y / sy)
                mask[y, :] *= v; mask[ph-1-y, :] *= v
            m3 = np_local.stack([mask, mask, mask], axis=2)
            return (panel.astype(np_local.float32) * m3).clip(0, 255).astype(np_local.uint8)

        def measure_black_border_inner(gray, bx, by, bw, bh, side_samples=5):
            BLACK_THRESH = 60; MAX_SCAN = 40
            measurements = []
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                row = int(np_local.clip(by + bh * frac, 0, mh2 - 1))
                t = 0
                for dx in range(1, MAX_SCAN + 1):
                    col = bx - dx
                    if col < 0: break
                    if gray[row, col] < BLACK_THRESH: t = dx
                    else: break
                measurements.append(t)
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                row = int(np_local.clip(by + bh * frac, 0, mh2 - 1))
                t = 0
                for dx in range(1, MAX_SCAN + 1):
                    col = bx + bw + dx
                    if col >= mw2: break
                    if gray[row, col] < BLACK_THRESH: t = dx
                    else: break
                measurements.append(t)
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                col = int(np_local.clip(bx + bw * frac, 0, mw2 - 1))
                t = 0
                for dy in range(1, MAX_SCAN + 1):
                    row = by - dy
                    if row < 0: break
                    if gray[row, col] < BLACK_THRESH: t = dy
                    else: break
                measurements.append(t)
            for frac in np_local.linspace(0.2, 0.8, side_samples):
                col = int(np_local.clip(bx + bw * frac, 0, mw2 - 1))
                t = 0
                for dy in range(1, MAX_SCAN + 1):
                    row = by + bh + dy
                    if row >= mh2: break
                    if gray[row, col] < BLACK_THRESH: t = dy
                    else: break
                measurements.append(t)
            measured = int(np_local.median([m for m in measurements if m > 0] or [8]))
            return int(np_local.clip(measured + 3, 4, MAX_SCAN))

        def find_frame_interior_inner(gray, bx, by, bw, bh):
            EXP_H = 0
            EXP_V = 0
            return (max(0,   bx - EXP_H), max(0,   by - EXP_V),
                    min(mw2, bx+bw+EXP_H), min(mh2, by+bh+EXP_V))

        def order_pts_l(pts):
            pts = pts.reshape(4, 2).astype(np_local.float32)
            s = pts.sum(axis=1); diff = pts[:, 1] - pts[:, 0]
            return np_local.array([pts[np_local.argmin(s)], pts[np_local.argmin(diff)],
                                   pts[np_local.argmax(s)], pts[np_local.argmax(diff)]], dtype=np_local.float32)

        def find_frames_robust_inner(gray, w, h):
            for tv in [170, 160, 150, 180, 200, 220, 140]:
                _, thresh = cv2_local.threshold(gray, tv, 255, cv2_local.THRESH_BINARY)
                conts, _  = cv2_local.findContours(thresh, cv2_local.RETR_EXTERNAL, cv2_local.CHAIN_APPROX_SIMPLE)
                cands = []
                for c in conts:
                    area = cv2_local.contourArea(c)
                    if area < w*h*0.02 or area > w*h*0.35: continue
                    bx, by, bw, bh = cv2_local.boundingRect(c)
                    if bh/max(bw,1) >= 0.8 and bw >= w*0.07 and bw <= w*0.46:
                        cands.append((bx, bx, by, bw, bh, c))
                cands.sort(key=lambda x: x[0])
                if len(cands) >= 3: return cands[:3]
            return []

        frames = find_frames_robust_inner(gray_m, mw2, mh2)
        if len(frames) < 3:
            raise ValueError("Não foi possível detectar 3 molduras neste mockup.")

        widths   = [f[3] for f in frames]
        has_persp = (max(widths) - min(widths)) > mw2 * 0.04

        result = mockup_cv.copy()
        for i, (_, bx, by, bw, bh, contour) in enumerate(frames):
            ix1, iy1, ix2, iy2 = find_frame_interior_inner(gray_m, bx, by, bw, bh)
            iw, ih = ix2 - ix1, iy2 - iy1
            if iw < 10 or ih < 10: continue
            panel   = panels[i]
            ph, pw2 = panel.shape[:2]
            panel_s = add_inner_shadow(panel)

            if has_persp:
                peri = cv2_local.arcLength(contour, True); ap = None
                for eps in [0.02, 0.03, 0.04, 0.05, 0.06, 0.08]:
                    a = cv2_local.approxPolyDP(contour, eps * peri, True)
                    if len(a) == 4: ap = a; break
                if ap is not None:
                    dst = order_pts_l(ap)
                    cx, cy = dst[:, 0].mean(), dst[:, 1].mean()
                    dirs   = dst - np_local.array([cx, cy])
                    norms  = np_local.linalg.norm(dirs, axis=1, keepdims=True)
                    norms  = np_local.where(norms == 0, 1, norms)
                    dst    = (dst + dirs / norms * 14).astype(np_local.float32)
                    dst[:, 0] = np_local.clip(dst[:, 0], 0, mw2-1)
                    dst[:, 1] = np_local.clip(dst[:, 1], 0, mh2-1)
                    src = np_local.float32([[0,0],[pw2,0],[pw2,ph],[0,ph]])
                    M   = cv2_local.getPerspectiveTransform(src, dst)
                    warped = cv2_local.warpPerspective(panel_s, M, (mw2, mh2), flags=cv2_local.INTER_LANCZOS4)
                    mask   = np_local.zeros((mh2, mw2), np_local.uint8)
                    cv2_local.fillPoly(mask, [dst.astype(np_local.int32)], 255)
                    result = np_local.where(cv2_local.merge([mask, mask, mask]) > 0, warped, result)
                    continue
            result[iy1:iy2, ix1:ix2] = cv2_local.resize(panel_s, (iw, ih), interpolation=cv2_local.INTER_LANCZOS4)

        result_pil = PILImage.fromarray(cv2_local.cvtColor(result, cv2_local.COLOR_BGR2RGB))
        result_pil = result_pil.resize((2000, 2000), PILImage.LANCZOS)
        buf = _io.BytesIO()
        result_pil.save(buf, format="JPEG", quality=95)
        return base64.b64encode(buf.getvalue()).decode()

    # Carrega painéis uma única vez
    def load_panel(b64str):
        arr = np_local.frombuffer(base64.b64decode(b64str), np_local.uint8)
        return cv2_local.imdecode(arr, cv2_local.IMREAD_COLOR)

    def crop_white_border(panel, thresh=240):
        pg = cv2_local.cvtColor(panel, cv2_local.COLOR_BGR2GRAY)
        ph, pw2 = panel.shape[:2]
        col_has = (pg < thresh).any(axis=0); row_has = (pg < thresh).any(axis=1)
        cols = np_local.where(col_has)[0]; rows = np_local.where(row_has)[0]
        if not len(cols) or not len(rows): return panel
        x1, x2 = max(0, cols[0]-1), min(pw2, cols[-1]+2)
        y1, y2 = max(0, rows[0]-1), min(ph,  rows[-1]+2)
        c = panel[y1:y2, x1:x2]
        return c if c.shape[0] > ph*0.05 and c.shape[1] > pw2*0.05 else panel

    try:
        panels_raw = [load_panel(b) for b in pecas_b64]
        if any(p is None for p in panels_raw):
            return jsonify({"error": "Erro ao carregar uma das peças."}), 500
        panels = [crop_white_border(p) for p in panels_raw]
    except Exception as e:
        return jsonify({"error": f"Erro ao carregar peças: {str(e)}"}), 500

    def generate_stream():
        total = len(mockup_ids)
        for idx, mid in enumerate(mockup_ids):
            entry = lib_idx.get(mid)
            if not entry:
                yield json.dumps({"idx": idx, "total": total, "mockup_id": mid,
                                  "error": "Mockup não encontrado."}) + "\n"
                continue
            fpath = MOCKUPS_DIR / entry["filename"]
            if not fpath.exists():
                yield json.dumps({"idx": idx, "total": total, "mockup_id": mid,
                                  "error": "Arquivo do mockup não encontrado."}) + "\n"
                continue
            try:
                mockup_arr = np_local.frombuffer(fpath.read_bytes(), np_local.uint8)
                mockup_cv  = cv2_local.imdecode(mockup_arr, cv2_local.IMREAD_COLOR)
                if mockup_cv is None: raise ValueError("Falha ao decodificar imagem.")
                img_b64 = compositar(mockup_cv, panels)
                yield json.dumps({
                    "idx": idx, "total": total,
                    "mockup_id": mid,
                    "mockup_nome": entry.get("nome", "Mockup"),
                    "ok": True,
                    "image_b64": img_b64
                }) + "\n"
            except Exception as e:
                yield json.dumps({"idx": idx, "total": total, "mockup_id": mid,
                                  "error": str(e)}) + "\n"

    return app.response_class(generate_stream(), mimetype="application/x-ndjson")


@app.route("/api/generate-listing", methods=["POST"])
def generate_listing():
    anthropic_key = get_anthropic_key()
    if not anthropic_key: return jsonify({"error":"Chave Anthropic nao configurada."}), 500
    data = request.get_json(force=True)
    kit_nome   = data.get("kit_nome","Kit de quadros").strip()
    kit_prompt = data.get("kit_prompt","").strip()
    system_prompt = """Voce e um especialista em SEO para marketplace brasileiro.
Gere 3 titulos e 1 descricao para um kit de quadros decorativos.

TITULOS: 3 opcoes, ENTRE 88 e 95 caracteres cada, palavras-chave diretas, sem pontuacao excessiva.
Exemplo: "Kit 3 Quadros Decorativos Gamer Neon Verde Decoracao Quarto Moderno Presente"
Varie: 1 foca no tema, 1 no ambiente, 1 no diferencial. Sem emojis.

DESCRICAO — template (adapte so o primeiro bloco):
🎨 [2-3 frases diretas sobre o tema e impacto visual]

📦 Material e Qualidade
✅ MDF 3mm florestado, tratado e imunizado
✅ Impressao em adesivo vinil de alta qualidade
✅ Acabamento premium — ja vem pronto para pendurar

🔧 Instalacao Facil — Sem Furar a Parede!
Fitas adesivas de alta fixacao inclusas.

📐 Dimensoes Disponiveis
• Kit 3 Pecas — 20x30 cm cada
• Kit 3 Pecas — 50x30 cm cada
• Kit 3 Pecas — 60x40 cm cada

🧹 Cuidados
• Limpeza com pano seco • Somente ambientes internos • Evite umidade e sol direto

💬 Duvidas? Fale conosco!

RETORNE APENAS JSON: {"titulos":["t1","t2","t3"],"descricao":"..."}"""
    try:
        resp = http_requests.post(ANTHROPIC_API_URL, timeout=60, headers={
            "Content-Type":"application/json","x-api-key":anthropic_key,"anthropic-version":"2023-06-01"
        }, json={"model":ANTHROPIC_MODEL,"max_tokens":3000,"system":system_prompt,
                 "messages":[{"role":"user","content":f"Kit: {kit_nome}\nArte: {kit_prompt or 'Kit premium'}\n\nGere titulos (88-95 chars) e descricao."}]})
        resp.raise_for_status()
        raw = resp.json()["content"][0]["text"].strip().replace("```json","").replace("```","").strip()
        s, e = raw.find("{"), raw.rfind("}") + 1
        result = json.loads(raw[s:e])
        result["titulos"] = [t[:95] for t in result.get("titulos",[])]
        return jsonify(result)
    except http_requests.exceptions.HTTPError as ex:
        try: msg = ex.response.json().get("error",{}).get("message",str(ex))
        except: msg = str(ex)
        return jsonify({"error":f"Erro Anthropic: {msg}"}), 502
    except Exception as ex: return jsonify({"error":str(ex)}), 502

if __name__ == "__main__":
    print("="*54); print("  QuadroAI Pro — http://localhost:5000"); print("="*54)
    app.run(debug=True, port=5000)
