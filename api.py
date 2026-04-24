from flask import Flask, request, send_file, after_this_request
from flask_cors import CORS
import subprocess
import os
import threading
import time
import shutil
import uuid

app = Flask(__name__)
CORS(app)

# Lock để đảm bảo chỉ 1 người được chạy bot tại 1 thời điểm
bot_lock = threading.Lock()

@app.route("/run-bot", methods=["POST"])
def run_bot():
    price = request.form.get("price", "no-price")
    print(f"💰 Nhận yêu cầu chạy bot với giá: {price}")

    # Thử chiếm lock — nếu đã có người đang chạy thì người sau phải đợi
    with bot_lock:
        print("🔒 Lock bot thành công — xử lý yêu cầu này...")
        start = time.time()

        # Gọi bot xử lý (giữ nguyên như bạn)
        # Thêm timeout để tránh treo vĩnh viễn (có thể bỏ nếu không muốn)
        try:
            result = subprocess.run(
                ["python3", "bot3.py", price],
                capture_output=True,
                text=True,
                timeout=180  # 3 phút, chỉnh tùy bạn
            )
        except subprocess.TimeoutExpired:
            print("⏰ Bot timeout!")
            return "Bot chạy quá lâu (timeout)!", 500

        print(result.stdout)
        print(result.stderr)

        # Đường dẫn ảnh QR đã cắt và ảnh toàn trang (giữ nguyên)
        qr_image_path = os.path.join("static", "qr_only.png")
        full_image_path = os.path.join("static", "full_qr.png")

        # Nếu bot lỗi (không bắt buộc, nhưng giúp debug)
        if result.returncode != 0:
            print(f"❌ Bot returncode != 0: {result.returncode}")

        if os.path.exists(qr_image_path):
            elapsed = int(time.time() - start)
            print(f"✅ Bot xử lý xong trong {elapsed}s. Trả ảnh QR.")

            # ===================== NEW: COPY QR SANG FILE TẠM RIÊNG =====================
            # Lý do: nếu client tải chậm mà bạn xóa qr_only.png sớm -> dễ lỗi
            tmp_name = f"qr_{int(time.time())}_{uuid.uuid4().hex[:8]}.png"
            tmp_qr_path = os.path.join("static", tmp_name)

            try:
                shutil.copyfile(qr_image_path, tmp_qr_path)
                print(f"🧷 Đã copy QR sang file tạm: {tmp_qr_path}")
            except Exception as e:
                print("❌ Không copy được QR sang file tạm:", e)
                return "Lỗi tạo file QR tạm!", 500

            # ✅ Sau khi gửi file QR (file tạm), xóa cả 3 ảnh:
            # - tmp_qr_path (file trả về)
            # - qr_only.png (file gốc)
            # - full_qr.png (full screenshot)
            @after_this_request
            def remove_files(response):
                # Delay xoá nhẹ 2s để client tải về xong (giữ nguyên ý của bạn)
                threading.Thread(
                    target=delayed_delete,
                    args=(tmp_qr_path, qr_image_path, full_image_path),
                    daemon=True
                ).start()
                return response

            # Trả file tạm (an toàn hơn)
            return send_file(tmp_qr_path, mimetype="image/png")

        else:
            print("❌ Không tìm thấy ảnh QR sau khi chạy bot.")
            return "Không tìm thấy ảnh QR đã cắt!", 500


def delayed_delete(*paths):
    time.sleep(2)
    for path in paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"🗑️ Đã xóa ảnh: {path}")
        except Exception as e:
            print(f"❌ Lỗi khi xóa ảnh {path}:", e)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
