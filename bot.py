from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time, sys, os, cv2

# ===================== CONFIG =====================
CHROME_PROFILE = os.path.expanduser("~/chrome-bot-profile")
TARGET_URL = "https://8xbet515.cc/deposit"

if len(sys.argv) < 2:
    print("⚠️ Chưa truyền số tiền")
    sys.exit(1)

AMOUNT = sys.argv[1]
os.makedirs("static", exist_ok=True)

# ===================== CHROME OPTIONS =====================
options = webdriver.ChromeOptions()
options.add_argument(f"--user-data-dir={CHROME_PROFILE}")
options.add_argument("--start-maximized")
options.add_argument("--no-first-run")
options.add_argument("--no-default-browser-check")
options.add_argument("--disable-notifications")
options.add_argument("--disable-infobars")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option("useAutomationExtension", False)

# ===================== START DRIVER =====================
print("🚀 Khởi động Chrome…")
driver = webdriver.Chrome(options=options)

wait = WebDriverWait(driver, 20)
print("✅ Chrome đã mở")

# ===================== OPEN DEPOSIT =====================
print("➡️ Mở trang nạp tiền")
driver.get(TARGET_URL)
time.sleep(6)

print("🌐 URL hiện tại:", driver.current_url)
driver.save_screenshot("static/step1_page.png")
print("📸 Đã chụp static/step1_page.png")

# ===================== FIND QR (IFRAME SAFE) =====================
print("🔍 Tìm QR (dò iframe nếu có)")
found = False

iframes = driver.find_elements(By.TAG_NAME, "iframe")
print(f"👉 Số iframe phát hiện: {len(iframes)}")

# Thử ngoài iframe trước
try:
    qr = wait.until(EC.element_to_be_clickable(
        (By.XPATH, "//img[contains(@src,'bankQRCode')]/ancestor::div")
    ))
    qr.click()
    print("✅ Click QR (ngoài iframe)")
    found = True
except:
    pass

# Nếu chưa thấy → thử iframe
if not found:
    for i, iframe in enumerate(iframes):
        try:
            driver.switch_to.frame(iframe)
            driver.save_screenshot(f"static/iframe_{i}.png")
            print(f"📸 iframe_{i}.png")

            qr = WebDriverWait(driver, 5).until(EC.element_to_be_clickable(
                (By.XPATH, "//img[contains(@src,'bankQRCode')]")
            ))
            qr.click()
            print(f"✅ Click QR trong iframe {i}")
            found = True
            break
        except:
            driver.switch_to.default_content()

if not found:
    print("❌ Không tìm thấy QR – xem ảnh debug trong thư mục static/")
    driver.quit()
    sys.exit()

driver.switch_to.default_content()
time.sleep(4)

# ===================== INPUT AMOUNT =====================
print("💰 Nhập số tiền:", AMOUNT)
try:
    money = wait.until(EC.presence_of_element_located(
        (By.XPATH, "//input[@type='decimal' or @inputmode='decimal']")
    ))
    money.clear()
    money.send_keys(AMOUNT)
except:
    print("❌ Không tìm thấy ô nhập tiền")
    driver.save_screenshot("static/error_no_amount.png")
    driver.quit()
    sys.exit()

# ===================== CONFIRM =====================
for step in ["deposit-third-party-submit-btn", "friendly-tips-primary-btn"]:
    try:
        btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, f"//button[@data-testid='{step}']")
        ))
        btn.click()
        print(f"👉 Click {step}")
        time.sleep(2)
    except:
        pass

# ===================== SWITCH TAB QR =====================
time.sleep(5)
tabs = driver.window_handles
driver.switch_to.window(tabs[-1])
print("🔄 Đã sang tab QR")

# ===================== SCREENSHOT =====================
full_img = "static/full_qr.png"
driver.save_screenshot(full_img)
print("📸 Đã lưu full_qr.png")

# ===================== CROP QR =====================
print("✂️ Cắt QR")
img = cv2.imread(full_img)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
detector = cv2.QRCodeDetector()

ok, pts = detector.detect(gray)
if ok and pts is not None:
    pts = pts[0].astype(int)
    x1, y1 = pts.min(axis=0)
    x2, y2 = pts.max(axis=0)
    crop = img[y1:y2, x1:x2]
    out = "static/qr_only.png"
    cv2.imwrite(out, crop)
    print("🟢 QR OK → static/qr_only.png")
else:
    print("⚠️ Không detect QR – dùng full_qr.png")

# ===================== CLEAN EXIT =====================
print("🧹 Đóng Chrome")
driver.quit()
print("✅ BOT HOÀN TẤT")
