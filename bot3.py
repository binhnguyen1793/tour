from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import sys, os
import cv2

# ===================== NHẬN SỐ TIỀN =====================
if len(sys.argv) < 2:
    print("⚠️ Chưa truyền số tiền")
    sys.exit(1)

AMOUNT = sys.argv[1]
print("💰 Amount nhận được:", AMOUNT)

os.makedirs("static", exist_ok=True)

# ===================== CONFIG =====================
DEBUG_ADDR = "127.0.0.1:9222"
DEPOSIT_URL = "https://fun1x888.com/en/office/recharge"
HOME_URL = "https://fun1x888.com"

# ===================== ATTACH CHROME =====================
def attach_to_existing_chrome():
    options = Options()
    options.add_experimental_option("debuggerAddress", DEBUG_ADDR)
    return webdriver.Chrome(options=options)

# ===================== CLICK MULTIPAY QR =====================
def select_multipay_qr(driver):
    time.sleep(5)

    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    print(f"🧩 Found {len(iframes)} iframe(s)")

    for idx, iframe in enumerate(iframes):
        try:
            driver.switch_to.frame(iframe)
            print(f"➡️ Switched to iframe {idx}")

            result = driver.execute_script("""
                const el = document.querySelector(
                    "div.payment-cell[data-rawmethod='multipay_qr_vn']"
                );
                if (el) {
                    el.scrollIntoView({block:'center'});
                    el.click();
                    return true;
                }
                return false;
            """)

            if result:
                print("✅ MultipayQR CLICKED")
                return True   # giữ iframe để nhập tiền
            driver.switch_to.default_content()
        except:
            driver.switch_to.default_content()
            continue

    print("❌ Không tìm thấy MultipayQR")
    return False

# ===================== NHẬP TIỀN + CONFIRM =====================
def input_amount_and_confirm(driver, amount):
    time.sleep(3)

    driver.execute_script(f"""
        const input = document.querySelector("#amount");
        if (input) {{
            input.value = "{amount}";
            input.dispatchEvent(new Event('input', {{bubbles:true}}));
            input.dispatchEvent(new Event('change', {{bubbles:true}}));
        }}

        const btn = document.querySelector("#deposit_button");
        if (btn) btn.click();
    """)
    print("🚀 Đã click Confirm")

# ===================== SCREENSHOT + CROP QR =====================
def screenshot_and_crop_qr(driver):
    detector = cv2.QRCodeDetector()
    full_img = "static/full_qr.png"
    out = "static/qr_only.png"

    print("⏳ Chờ QR render & detect")

    for i in range(1, 11):  # ~20 giây
        time.sleep(2)

        driver.save_screenshot(full_img)
        img = cv2.imread(full_img)
        if img is None:
            continue

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        ok, pts = detector.detect(gray)
        print(f"🔎 Attempt {i} → detect={ok}")

        if ok and pts is not None:
            pts = pts[0].astype(int)
            x1, y1 = pts.min(axis=0)
            x2, y2 = pts.max(axis=0)

            x1 = max(0, x1); y1 = max(0, y1)
            x2 = min(img.shape[1], x2); y2 = min(img.shape[0], y2)

            crop = img[y1:y2, x1:x2]
            cv2.imwrite(out, crop)

            print("🟢 QR OK → static/qr_only.png")
            print("📸 Full → static/full_qr.png")
            return True

    print("⚠️ Không detect QR – chỉ có full_qr.png")
    return False

# ===================== MAIN =====================
def main():
    driver = attach_to_existing_chrome()
    print("✅ Attached Chrome")

    driver.execute_script("window.open('about:blank','_blank');")
    driver.switch_to.window(driver.window_handles[-1])

    driver.get(DEPOSIT_URL)
    print("🌐 Deposit page loaded")

    if not select_multipay_qr(driver):
        return

    input_amount_and_confirm(driver, AMOUNT)

    # Sau confirm thường thoát iframe → quay về root để chụp full
    try:
        driver.switch_to.default_content()
    except:
        pass

    screenshot_and_crop_qr(driver)

    # THEO Ý BẠN: load luôn về trang chủ (không đóng tab)
    driver.get(HOME_URL)
    print("🏠 Đã load về trang chủ – bot vẫn sống")

# ===================== RUN =====================
if __name__ == "__main__":
    main()
