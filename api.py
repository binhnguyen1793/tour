from flask import Flask, request, send_file, after_this_request
from flask_cors import CORS
import os
import shutil
import subprocess
import sys
import threading
import time
import uuid


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
BOT_PATH = os.path.join(BASE_DIR, "bot3.py")
QR_IMAGE_PATH = os.path.join(STATIC_DIR, "qr_only.png")
FULL_IMAGE_PATH = os.path.join(STATIC_DIR, "full_qr.png")

os.makedirs(STATIC_DIR, exist_ok=True)

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "https://tuanguyen130287.github.io"
        }
    },
)

bot_lock = threading.Lock()


def safe_delete(*paths):
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
                print(f"Da xoa: {path}")
        except Exception as error:
            print(f"Loi xoa {path}: {error}")


def delayed_delete(*paths):
    time.sleep(6)
    safe_delete(*paths)


@app.route("/run-bot", methods=["POST"])
def run_bot():
    price_text = request.form.get("price", "").strip()

    if not price_text.isdigit():
        return "So tien khong hop le!", 400

    price = int(price_text)

    if price < 1_000_000:
        return "So tien nap toi thieu la 1.000.000!", 400

    print(f"Nhan yeu cau chay bot voi gia: {price}")

    if not bot_lock.acquire(blocking=False):
        return "Bot dang xu ly mot yeu cau khac!", 429

    try:
        safe_delete(QR_IMAGE_PATH, FULL_IMAGE_PATH)

        start_time = time.time()

        try:
            result = subprocess.run(
                [sys.executable, BOT_PATH, str(price)],
                cwd=BASE_DIR,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=80,
            )

        except subprocess.TimeoutExpired:
            print("Bot timeout sau 80 giay!")
            return "Bot chay qua lau!", 504

        elapsed = time.time() - start_time

        print(f"Bot chay mat: {elapsed:.2f} giay")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)

        if result.returncode != 0:
            print(
                f"Bot loi, returncode: {result.returncode}"
            )
            return "Bot khong tao duoc QR!", 500

        if not os.path.exists(QR_IMAGE_PATH):
            print("Khong tim thay file QR")
            return "Khong co QR!", 500

        if os.path.getsize(QR_IMAGE_PATH) == 0:
            print("File QR rong")
            return "QR rong!", 500

        temp_name = (
            f"qr_{int(time.time())}_"
            f"{uuid.uuid4().hex[:8]}.png"
        )

        temp_qr_path = os.path.join(
            STATIC_DIR,
            temp_name,
        )

        shutil.copyfile(
            QR_IMAGE_PATH,
            temp_qr_path,
        )

        @after_this_request
        def remove_temp_file(response):
            threading.Thread(
                target=delayed_delete,
                args=(temp_qr_path,),
                daemon=True,
            ).start()

            return response

        print(
            f"Gui QR ve client: {temp_qr_path}"
        )

        return send_file(
            temp_qr_path,
            mimetype="image/png",
            as_attachment=False,
        )

    finally:
        bot_lock.release()


@app.route("/health", methods=["GET"])
def health():
    return {
        "ok": True,
        "port": 8080,
    }, 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
        threaded=True,
    )
