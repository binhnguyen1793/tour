

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time, sys, cv2, os


# ===========================================================
# BOT AUTO NẠP – DÙNG SESSION ĐĂNG NHẬP SẴN
# ===========================================================
if len(sys.argv) < 2:
    print("⚠ Bạn chưa nhập số tiền")
    sys.exit(1)

AMOUNT = sys.argv[1]

# KẾT NỐI VỚI CHROME DEBUG
options = webdriver.ChromeOptions()
options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 15)

print("\n🚀 BOT KHỞI CHẠY — SESSION ĐANG GIỮ ĐĂNG NHẬP\n")


# ===========================================================
# MỞ TRANG NẠP
# ===========================================================
driver.get("https://8xbet515.cc/deposit")
time.sleep(2)


# ===========================================================
# TÌM BUTTON QR
# ===========================================================
    # Click vào nút "Quét Mã QR Thanh Toán" (Tìm theo ảnh hoặc text)
try:
    qr_button = wait.until(EC.element_to_be_clickable(
        (By.XPATH, "//img[contains(@src, 'bankQRCode')]//ancestor::div[contains(@class, 'cursor-pointer')]")
    ))
    qr_button.click()
    print("click vào quet ma QR")

except:
    print("khong tim thay nut QR")
    time.sleep(3)
    try:
        qr_button = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//span[contains(text(), 'Quét Mã QR Thanh Toán') or contains(text(), 'Bank Direct Scan')]")
        ))
        qr_button.click()
        print("thu lai QR")
    except:
        print("bo qua buoc nay")

    # Chờ trang load
time.sleep(3)


# ===========================================================
# NHẬP TIỀN
# ===========================================================
try:
    money = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='decimal']")))
    money.clear(); money.send_keys(AMOUNT)
    print(f"💰 Nhập số tiền {AMOUNT}")
except:
    print("❌ Không nhập được tiền")
    sys.exit()


# CLICK 2 NÚT XÁC NHẬN
for step in ["deposit-third-party-submit-btn", "friendly-tips-primary-btn"]:
    try:
        btn = wait.until(EC.element_to_be_clickable((By.XPATH, f"//button[@data-testid='{step}']")))
        btn.click(); print(f"👉 Click {step}")
        time.sleep(1)
    except: pass


# ===========================================================
# CHUYỂN TAB → LẤY QR
# ===========================================================
driver.switch_to.window(driver.window_handles[-1])
print("🔄 Đã mở tab QR")
time.sleep(3)

img_path = "static/full_qr.png"
driver.save_screenshot(img_path)
print("📸 Screenshot →", img_path)


# ===========================================================
# CROP QR
# ===========================================================
try:
    img = cv2.imread(img_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    detect = cv2.QRCodeDetector()

    ok, pts = detect.detect(gray)
    if ok and pts is not None:
        pts = pts[0].astype(int)
        x1,y1 = pts.min(axis=0); x2,y2 = pts.max(axis=0)
        crop = img[y1:y2, x1:x2]

        out = "static/qr_only.png"
        cv2.imwrite(out, crop)
        print("🟢 QR EXTRACT →", out)
    else:
        print("⚠ Không detect QR")
except Exception as e:
    print("❌ Lỗi QR:", e)


# ===========================================================
# ĐÓNG TAB — GIỮ CHROME SỐNG
# ===========================================================
if len(driver.window_handles)>1:
    driver.close(); driver.switch_to.window(driver.window_handles[0])
    print("🧹 Đóng tab QR")
