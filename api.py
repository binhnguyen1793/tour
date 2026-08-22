from flask import (
    Flask,
    request,
    send_file,
    after_this_request,
)

from flask_cors import CORS

import os
import shutil
import subprocess
import sys
import threading
import time
import uuid


# =========================================================
# ĐƯỜNG DẪN
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

STATIC_DIR = os.path.join(
    BASE_DIR,
    "static",
)

BOT_PATH = os.path.join(
    BASE_DIR,
    "bot3.py",
)

QR_IMAGE_PATH = os.path.join(
    STATIC_DIR,
    "qr_only.png",
)

FULL_IMAGE_PATH = os.path.join(
    STATIC_DIR,
    "full_qr.png",
)

os.makedirs(
    STATIC_DIR,
    exist_ok=True,
)


# =========================================================
# FLASK VÀ CORS
# =========================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": (
                "https://"
                "tuanguyen130287.github.io"
            )
        }
    },
)


# Chỉ cho phép bot xử lý một yêu cầu tại một thời điểm
bot_lock = threading.Lock()


# =========================================================
# XÓA FILE
# =========================================================

def safe_delete(*paths):
    for path in paths:
        try:
            if (
                path
                and os.path.exists(path)
            ):
                os.remove(path)

                print(
                    f"Da xoa: {path}"
                )

        except Exception as error:
            print(
                f"Loi xoa {path}: "
                f"{error}"
            )


def delayed_delete(*paths):
    time.sleep(6)

    safe_delete(*paths)


# =========================================================
# API TẠO QR
# =========================================================

@app.route(
    "/run-bot",
    methods=["POST"],
)
def run_bot():
    price_text = request.form.get(
        "price",
        "",
    ).strip()

    if not price_text.isdigit():
        return (
            "So tien khong hop le!",
            400,
        )

    price = int(price_text)

    if price < 1_000_000:
        return (
            "So tien nap toi thieu "
            "la 1.000.000!",
            400,
        )

    print(
        f"Nhan yeu cau chay bot "
        f"voi gia: {price}"
    )

    # Không xếp nhiều yêu cầu chờ nhau
    if not bot_lock.acquire(
        blocking=False
    ):
        return (
            "Bot dang xu ly "
            "mot yeu cau khac!",
            429,
        )

    try:
        # Xóa ảnh của lần chạy trước
        safe_delete(
            QR_IMAGE_PATH,
            FULL_IMAGE_PATH,
        )

        start_time = time.time()

        # Chạy bot3.py bằng đúng Python
        # đang dùng để chạy api.py
        try:
            result = subprocess.run(
                [
                    sys.executable,
                    BOT_PATH,
                    str(price),
                ],
                cwd=BASE_DIR,
                timeout=80,
            )

        except subprocess.TimeoutExpired:
            print(
                "Bot timeout sau 80 giay!"
            )

            return (
                "Bot chay qua lau!",
                504,
            )

        elapsed = (
            time.time()
            - start_time
        )

        print(
            f"Bot chay mat: "
            f"{elapsed:.2f} giay"
        )

        # Bot báo lỗi
        if result.returncode != 0:
            print(
                "Bot loi, returncode: "
                f"{result.returncode}"
            )

            return (
                "Bot khong tao duoc QR!",
                500,
            )

        # Không tìm thấy ảnh QR
        if not os.path.exists(
            QR_IMAGE_PATH
        ):
            print(
                "Khong tim thay file QR"
            )

            return (
                "Khong co QR!",
                500,
            )

        # Ảnh QR bị rỗng
        if os.path.getsize(
            QR_IMAGE_PATH
        ) == 0:
            print(
                "File QR rong"
            )

            return (
                "QR rong!",
                500,
            )

        # Tạo tên file tạm duy nhất
        temp_name = (
            f"qr_{int(time.time())}_"
            f"{uuid.uuid4().hex[:8]}"
            ".png"
        )

        temp_qr_path = os.path.join(
            STATIC_DIR,
            temp_name,
        )

        # Sao chép QR sang file tạm
        shutil.copyfile(
            QR_IMAGE_PATH,
            temp_qr_path,
        )

        # Sau khi gửi xong sẽ xóa file tạm
        @after_this_request
        def remove_temp_file(response):
            threading.Thread(
                target=delayed_delete,
                args=(temp_qr_path,),
                daemon=True,
            ).start()

            return response

        print(
            "Gui QR ve client: "
            f"{temp_qr_path}"
        )

        return send_file(
            temp_qr_path,
            mimetype="image/png",
            as_attachment=False,
        )

    finally:
        bot_lock.release()


# =========================================================
# KIỂM TRA API VÀ CLOUDFLARED
# =========================================================

@app.route(
    "/health",
    methods=["GET"],
)
def health():
    return {
        "ok": True,
        "port": 8080,
    }, 200


# =========================================================
# KHỞI ĐỘNG API
# =========================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
        threaded=True,
    )
