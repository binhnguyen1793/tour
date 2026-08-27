from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException, StaleElementReferenceException

import cv2
import json
import os
import sys
import time

# =========================================================
# UTF-8
# =========================================================
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# =========================================================
# CONFIG
# =========================================================
DEBUG_ADDR = "127.0.0.1:9222"
DEPOSIT_URL = "https://1xlite-2599.pro/vi/office/recharge"
DEPOSIT_URL_KEYWORD = "recharge"

BOT_TIMEOUT = 56.0
FAST_POLL = 0.25
NORMAL_POLL = 0.50

TAB_MAX_WAIT = 5.0
MULTIPAY_MAX_WAIT = 12.0
MODAL_MAX_WAIT = 8.0
BANK_MAX_WAIT = 6.0
BANK_ABSENCE_GRACE = 1.25
INPUT_MAX_WAIT = 5.0
CONFIRM_MAX_WAIT = 5.0

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
FULL_QR_PATH = os.path.join(STATIC_DIR, "full_qr.png")
QR_ONLY_PATH = os.path.join(STATIC_DIR, "qr_only.png")
os.makedirs(STATIC_DIR, exist_ok=True)

# =========================================================
# OUTPUT / EXIT
# =========================================================
def output_result(success, status, message, extra=None):
    result = {
        "success": bool(success),
        "status": status,
        "message": message,
    }
    if extra:
        result.update(extra)
    print("BOT_RESULT:" + json.dumps(result, ensure_ascii=False), flush=True)


def fail(status, message, start_time=None, extra=None, code=2):
    payload = dict(extra or {})
    if start_time is not None:
        payload["elapsed"] = round(time.monotonic() - start_time, 2)
    output_result(False, status, message, payload or None)
    raise SystemExit(code)


# =========================================================
# TIME HELPERS
# =========================================================
def remaining_time(deadline):
    return max(0.0, deadline - time.monotonic())


def expired(deadline):
    return remaining_time(deadline) <= 0


def make_step_deadline(global_deadline, max_seconds):
    return min(global_deadline, time.monotonic() + max_seconds)


def smart_sleep(seconds, deadline):
    left = remaining_time(deadline)
    if left > 0:
        time.sleep(min(seconds, left))


# =========================================================
# INPUT AMOUNT
# =========================================================
def read_amount():
    if len(sys.argv) < 2:
        fail("INVALID_AMOUNT", "Chưa truyền số tiền", code=2)

    amount = str(sys.argv[1]).strip()
    if not amount.isdigit() or int(amount) <= 0:
        fail("INVALID_AMOUNT", "Số tiền không hợp lệ", code=2)

    print("Amount nhận được:", amount, flush=True)
    return amount


# =========================================================
# FILE CLEANUP
# =========================================================
def cleanup_old_files():
    for path in (QR_ONLY_PATH, FULL_QR_PATH):
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as error:
            print("Không xóa được file cũ:", path, error, flush=True)


# =========================================================
# DRIVER
# =========================================================
def attach_to_existing_chrome():
    options = Options()
    options.add_experimental_option("debuggerAddress", DEBUG_ADDR)
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(8)
    return driver


def driver_is_alive(driver):
    try:
        _ = driver.window_handles
        return True
    except Exception:
        return False


# =========================================================
# SECURITY WARNING
# =========================================================
def bypass_security_warning(driver, deadline):
    if expired(deadline):
        return False

    try:
        title = ""
        try:
            title = str(driver.title or "").lower()
        except Exception:
            pass

        warning_found = any(x in title for x in [
            "privacy error",
            "security",
            "lỗi bảo mật",
            "your connection is not private",
        ])

        try:
            has_details = bool(driver.execute_script(
                'return !!document.querySelector("#details-button");'
            ))
        except Exception:
            has_details = False

        if not warning_found and not has_details:
            return False

        print("Phát hiện cảnh báo bảo mật", flush=True)

        try:
            driver.execute_script(
                'const b=document.querySelector("#details-button"); if(b)b.click();'
            )
        except Exception:
            pass

        smart_sleep(0.3, deadline)

        try:
            driver.execute_script(
                'const b=document.querySelector("#proceed-link"); if(b)b.click();'
            )
        except Exception:
            pass

        smart_sleep(0.8, deadline)
        print("Đã thử bỏ qua cảnh báo bảo mật", flush=True)
        return True

    except Exception as error:
        print("Lỗi xử lý cảnh báo:", error, flush=True)
        return False


# =========================================================
# DEPOSIT TAB
# =========================================================
def switch_to_deposit_tab(driver, deadline):
    step_deadline = make_step_deadline(deadline, TAB_MAX_WAIT)
    print("Đang tìm tab nạp tiền...", flush=True)

    try:
        handles = driver.window_handles
    except Exception:
        handles = []

    for handle in handles:
        if expired(step_deadline):
            break
        try:
            driver.switch_to.window(handle)
            current_url = str(driver.current_url or "")
            if DEPOSIT_URL_KEYWORD in current_url.lower():
                print("Đã tìm thấy tab nạp tiền:", current_url, flush=True)
                bypass_security_warning(driver, deadline)
                return True
        except Exception:
            continue

    if expired(deadline):
        return False

    print("Không thấy tab nạp tiền, đang mở trang...", flush=True)
    try:
        driver.switch_to.default_content()
    except Exception:
        pass

    try:
        driver.get(DEPOSIT_URL)
    except TimeoutException:
        print("driver.get load chậm, tiếp tục kiểm tra DOM", flush=True)
    except Exception as error:
        print("driver.get báo:", error, flush=True)

    bypass_security_warning(driver, deadline)
    return driver_is_alive(driver)


# =========================================================
# FRAME HELPERS
# =========================================================
def switch_to_context(driver, context):
    """context = 'root' hoặc index iframe cấp 1."""
    driver.switch_to.default_content()
    if context == "root":
        return True

    if not isinstance(context, int):
        return False

    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    if context >= len(iframes):
        return False
    driver.switch_to.frame(iframes[context])
    return True


def find_visible_payment_modal_in_current_context(driver):
    try:
        return bool(driver.execute_script(
            """
            const modal=document.querySelector('#payment_modal_container');
            if(!modal) return false;
            const s=getComputedStyle(modal);
            return s.display!=='none' && s.visibility!=='hidden';
            """
        ))
    except Exception:
        return False


# =========================================================
# MULTIPAY QR
# =========================================================
def click_multipay_in_current_context(driver):
    try:
        return bool(driver.execute_script(
            """
            const el=document.querySelector("[data-rawmethod='multipay_qr_vn']");
            if(!el) return false;
            try{el.scrollIntoView({block:'center',inline:'center'});}catch(e){}
            try{el.click(); return true;}catch(e){}
            try{
              el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
              return true;
            }catch(e){}
            return false;
            """
        ))
    except Exception:
        return False


def select_multipay_qr(driver, deadline):
    step_deadline = make_step_deadline(deadline, MULTIPAY_MAX_WAIT)
    print("Đang tìm Multipay QR...", flush=True)
    last_iframe_count = -1

    while not expired(step_deadline):
        try:
            driver.switch_to.default_content()
            if click_multipay_in_current_context(driver):
                print("Đã chọn Multipay QR trong trang chính", flush=True)
                return {"success": True, "frame": "root"}
        except Exception:
            pass

        try:
            driver.switch_to.default_content()
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
        except Exception:
            iframes = []

        if len(iframes) != last_iframe_count:
            print("Số iframe:", len(iframes), flush=True)
            last_iframe_count = len(iframes)

        for index in range(len(iframes)):
            if expired(step_deadline):
                break
            try:
                if not switch_to_context(driver, index):
                    continue
                if click_multipay_in_current_context(driver):
                    print(f"Đã chọn Multipay QR trong iframe {index}", flush=True)
                    return {"success": True, "frame": index}
            except (StaleElementReferenceException, WebDriverException, Exception):
                continue

        smart_sleep(FAST_POLL, step_deadline)

    try:
        driver.switch_to.default_content()
    except Exception:
        pass

    print("Không tìm thấy Multipay QR trong thời gian cho phép", flush=True)
    return {"success": False, "frame": None}


# =========================================================
# PAYMENT MODAL
# =========================================================
def wait_for_payment_modal(driver, deadline, preferred_context=None):
    """Tìm modal ở context hiện tại, root, rồi các iframe. Trả context tìm thấy."""
    step_deadline = make_step_deadline(deadline, MODAL_MAX_WAIT)
    print("Đang chờ form thanh toán...", flush=True)

    while not expired(step_deadline):
        contexts = []
        if preferred_context is not None:
            contexts.append(preferred_context)
        if "root" not in contexts:
            contexts.append("root")

        try:
            driver.switch_to.default_content()
            iframe_count = len(driver.find_elements(By.TAG_NAME, "iframe"))
        except Exception:
            iframe_count = 0

        for i in range(iframe_count):
            if i not in contexts:
                contexts.append(i)

        for context in contexts:
            if expired(step_deadline):
                break
            try:
                if not switch_to_context(driver, context):
                    continue
                if find_visible_payment_modal_in_current_context(driver):
                    print("Đã thấy form thanh toán tại:", context, flush=True)
                    return context
            except Exception:
                continue

        smart_sleep(FAST_POLL, step_deadline)

    print("Chưa thấy form thanh toán", flush=True)
    return None


# =========================================================
# BANK
# QUY TẮC:
# - Không có #bank_code -> không cần bank -> đi tiếp.
# - Có #bank_code -> bắt buộc phải chọn được bank đầu tiên.
# - Không dùng visibility/offsetParent của select để quyết định,
#   vì Select2 thường ẩn select thật.
# =========================================================
def inspect_or_select_bank(driver):
    try:
        result = driver.execute_script(
            """
            const modal=document.querySelector('#payment_modal_container');
            if(!modal) return {status:'NO_MODAL'};

            const select=modal.querySelector('#bank_code');
            if(!select) return {status:'NOT_REQUIRED'};

            const options=Array.from(select.options || []);
            const selected=options.find(o => o.value===select.value && String(o.value||'').trim()!=='');
            if(selected){
              return {status:'ALREADY_SELECTED',value:selected.value,text:selected.text};
            }

            const valid=options.find(o => String(o.value||'').trim()!=='' && !o.disabled);
            if(!valid){
              return {status:'WAIT_OPTION',optionCount:options.length,disabled:!!select.disabled};
            }

            try{
              const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
              setter.call(select, valid.value);
            }catch(e){
              select.value=valid.value;
            }

            select.dispatchEvent(new Event('input',{bubbles:true}));
            select.dispatchEvent(new Event('change',{bubbles:true}));

            try{
              if(window.jQuery){
                const $s=window.jQuery(select);
                $s.val(valid.value).trigger('input').trigger('change');
              }
            }catch(e){}

            const rendered=modal.querySelector('#select2-bank_code-container');
            if(rendered){
              rendered.textContent=valid.text;
              rendered.title=valid.text;
            }

            const actual=String(select.value||'').trim();
            if(actual===String(valid.value).trim()){
              return {status:'SELECTED',value:actual,text:valid.text};
            }

            return {status:'SELECT_FAILED',value:actual,wanted:valid.value,text:valid.text};
            """
        )
        return result if isinstance(result, dict) else {"status": "ERROR"}
    except Exception as error:
        print("Lỗi kiểm tra/chọn bank:", error, flush=True)
        return {"status": "ERROR", "error": str(error)}


def handle_bank_selection(driver, deadline):
    step_deadline = make_step_deadline(deadline, BANK_MAX_WAIT)
    bank_detected = False
    no_bank_since = None
    last_status = None

    while not expired(step_deadline):
        result = inspect_or_select_bank(driver)
        status = result.get("status")

        if status != last_status:
            print("Bank status:", status, result, flush=True)
            last_status = status

        if status == "NOT_REQUIRED":
            # Có trang modal hiện trước rồi bank mới render sau một nhịp.
            # Vì vậy không kết luận ngay từ lần kiểm tra đầu tiên.
            if no_bank_since is None:
                no_bank_since = time.monotonic()
            elif time.monotonic() - no_bank_since >= BANK_ABSENCE_GRACE:
                print("Trang này không yêu cầu chọn ngân hàng", flush=True)
                return True

            smart_sleep(FAST_POLL, step_deadline)
            continue

        no_bank_since = None

        if status == "ALREADY_SELECTED":
            print("Ngân hàng đã được chọn:", result.get("text"), flush=True)
            return True

        if status == "SELECTED":
            bank_detected = True
            print("Đã chọn ngân hàng:", result.get("text"), flush=True)
            smart_sleep(0.45, step_deadline)

            verify = inspect_or_select_bank(driver)
            if verify.get("status") in ("ALREADY_SELECTED", "SELECTED"):
                print("Đã xác nhận bank:", verify.get("text"), flush=True)
                return True

        elif status in ("WAIT_OPTION", "SELECT_FAILED"):
            bank_detected = True

        elif status == "NO_MODAL":
            # Modal vừa render lại; tiếp tục chờ trong budget bank.
            pass

        elif status == "ERROR":
            pass

        smart_sleep(FAST_POLL, step_deadline)

    if bank_detected:
        print("Có bước chọn ngân hàng nhưng không chọn được bank trong thời gian cho phép", flush=True)
        return False

    # Nếu suốt thời gian không thấy modal/bank rõ ràng thì không nên giả định thành công.
    print("Không xác định được trạng thái ngân hàng", flush=True)
    return False


# =========================================================
# SET AMOUNT
# =========================================================
def set_amount_once(driver, amount):
    try:
        result = driver.execute_script(
            """
            const amountValue=String(arguments[0]);
            const modal=document.querySelector('#payment_modal_container');
            if(!modal) return 'NO_MODAL';
            const input=modal.querySelector('#amount');
            if(!input) return 'NO_INPUT';

            try{input.scrollIntoView({block:'center'});}catch(e){}
            try{input.focus();}catch(e){}

            try{
              const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
              setter.call(input, amountValue);
            }catch(e){
              input.value=amountValue;
            }

            input.dispatchEvent(new Event('input',{bubbles:true}));
            input.dispatchEvent(new Event('change',{bubbles:true}));
            input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'0'}));
            try{input.blur();}catch(e){}
            return input.value;
            """,
            amount,
        )

        if result in (None, "NO_MODAL", "NO_INPUT"):
            return False

        expected = "".join(c for c in str(amount) if c.isdigit())
        actual = "".join(c for c in str(result) if c.isdigit())
        print("Giá trị input:", result, flush=True)
        return bool(actual and actual == expected)

    except Exception as error:
        print("Lỗi nhập amount:", error, flush=True)
        return False


def set_amount(driver, amount, deadline):
    step_deadline = make_step_deadline(deadline, INPUT_MAX_WAIT)
    while not expired(step_deadline):
        if set_amount_once(driver, amount):
            return True
        smart_sleep(FAST_POLL, step_deadline)
    return False


# =========================================================
# CONFIRM
# =========================================================
def click_confirm_once(driver):
    try:
        result = driver.execute_script(
            """
            const modal=document.querySelector('#payment_modal_container');
            if(!modal) return 'NO_MODAL';
            const button=modal.querySelector('#deposit_button');
            if(!button) return 'NO_BUTTON';

            try{button.scrollIntoView({block:'center'});}catch(e){}

            if(button.disabled) return 'DISABLED';
            const ariaDisabled=String(button.getAttribute('aria-disabled')||'').toLowerCase();
            if(ariaDisabled==='true') return 'DISABLED';

            try{button.click(); return 'CLICKED';}catch(e){}
            try{
              button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
              return 'CLICKED';
            }catch(e){}
            return 'FAILED';
            """
        )
        if result not in ("DISABLED",):
            print("Confirm:", result, flush=True)
        return result == "CLICKED"
    except Exception as error:
        print("Lỗi confirm:", error, flush=True)
        return False


def click_confirm(driver, amount, deadline):
    step_deadline = make_step_deadline(deadline, CONFIRM_MAX_WAIT)
    while not expired(step_deadline):
        if click_confirm_once(driver):
            return True
        # Một số site chỉ enable nút sau input/change, set lại amount rồi thử tiếp.
        set_amount_once(driver, amount)
        smart_sleep(FAST_POLL, step_deadline)
    return False


# =========================================================
# INPUT + CONFIRM
# =========================================================
def input_amount_and_confirm(driver, amount, deadline, preferred_context=None):
    if expired(deadline):
        return False

    payment_context = wait_for_payment_modal(driver, deadline, preferred_context)
    if payment_context is None:
        return False

    try:
        if not switch_to_context(driver, payment_context):
            print("Không chuyển lại được context thanh toán", flush=True)
            return False
    except Exception as error:
        print("Lỗi chuyển context thanh toán:", error, flush=True)
        return False

    # BANK: optional only when element is absent; if present it is mandatory.
    if not handle_bank_selection(driver, deadline):
        print("Không hoàn thành được bước ngân hàng", flush=True)
        return False

    if not set_amount(driver, amount, deadline):
        print("Không nhập được số tiền", flush=True)
        return False

    if not click_confirm(driver, amount, deadline):
        print("Không bấm được xác nhận", flush=True)
        return False

    print("Đã bấm xác nhận", flush=True)
    return True


# =========================================================
# QR DETECT / CROP
# =========================================================
def detect_and_crop_qr(full_path, qr_path):
    try:
        image = cv2.imread(full_path)
        if image is None:
            return False

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        detector = cv2.QRCodeDetector()
        detected, points = detector.detect(gray)

        if not detected or points is None:
            return False

        points = points[0].astype(int)
        x1, y1 = points.min(axis=0)
        x2, y2 = points.max(axis=0)
        padding = 18

        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(image.shape[1], x2 + padding)
        y2 = min(image.shape[0], y2 + padding)

        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            return False

        if not cv2.imwrite(qr_path, crop):
            return False

        return os.path.exists(qr_path) and os.path.getsize(qr_path) > 0

    except Exception as error:
        print("QR detect error:", error, flush=True)
        return False


def screenshot_and_crop_qr(driver, deadline):
    print("Đang chờ QR...", flush=True)
    attempt = 0

    # Chụp toàn browser, nên về root để tránh context iframe stale.
    try:
        driver.switch_to.default_content()
    except Exception:
        pass

    while not expired(deadline):
        attempt += 1
        try:
            saved = driver.save_screenshot(FULL_QR_PATH)
            if saved and detect_and_crop_qr(FULL_QR_PATH, QR_ONLY_PATH):
                print("Đã tìm thấy QR", flush=True)
                return True
        except Exception as error:
            print("Screenshot QR:", error, flush=True)

        if attempt == 1 or attempt % 10 == 0:
            print("Chưa có QR. Còn:", round(remaining_time(deadline), 1), "giây", flush=True)

        smart_sleep(NORMAL_POLL, deadline)

    return False


# =========================================================
# MAIN
# =========================================================
def main():
    start_time = time.monotonic()
    deadline = start_time + BOT_TIMEOUT
    amount = read_amount()
    cleanup_old_files()

    try:
        driver = attach_to_existing_chrome()
        print("Đã kết nối Chrome", flush=True)
    except Exception as error:
        fail(
            "CHROME_CONNECTION_FAILED",
            "Không kết nối được Chrome",
            start_time,
            {"error": str(error)},
        )

    if expired(deadline):
        fail("TIMEOUT", "Hết thời gian xử lý", start_time)

    if not switch_to_deposit_tab(driver, deadline):
        fail("DEPOSIT_PAGE_NOT_READY", "Trang nạp tiền chưa sẵn sàng", start_time)

    if expired(deadline):
        fail("TIMEOUT", "Hết thời gian xử lý", start_time)

    payment_result = select_multipay_qr(driver, deadline)
    if not payment_result.get("success"):
        fail("MULTIPAY_NOT_READY", "Multipay QR chưa tải kịp", start_time)

    if expired(deadline):
        fail("TIMEOUT", "Hết thời gian xử lý", start_time)

    confirmed = input_amount_and_confirm(
        driver,
        amount,
        deadline,
        preferred_context=payment_result.get("frame"),
    )

    if not confirmed:
        fail(
            "FORM_NOT_READY",
            "Form thanh toán chưa hoàn tất trong thời gian cho phép",
            start_time,
        )

    if expired(deadline):
        fail("TIMEOUT", "Hết thời gian xử lý", start_time)

    qr_created = screenshot_and_crop_qr(driver, deadline)
    elapsed = round(time.monotonic() - start_time, 2)

    if not qr_created:
        fail(
            "QR_TIMEOUT",
            "Cổng thanh toán chưa trả QR trước giới hạn thời gian",
            start_time,
            {"amount": amount},
        )

    output_result(
        True,
        "QR_CREATED",
        "Bot đã tạo QR thành công",
        {
            "amount": amount,
            "qr_path": "static/qr_only.png",
            "full_image_path": "static/full_qr.png",
            "elapsed": elapsed,
        },
    )
    print("Bot hoàn tất trong", elapsed, "giây", flush=True)
    raise SystemExit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        output_result(False, "STOPPED", "Bot bị dừng thủ công")
        raise SystemExit(130)
    except SystemExit:
        raise
    except Exception as error:
        output_result(
            False,
            "UNEXPECTED_ERROR",
            "Bot gặp lỗi ngoài dự kiến",
            {"error": str(error)},
        )
        raise SystemExit(2)
