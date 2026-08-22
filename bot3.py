from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

import cv2
import os
import sys
import time


# =========================================================
# CẤU HÌNH UTF-8
# =========================================================

sys.stdout.reconfigure(
    encoding="utf-8",
    errors="replace",
)

sys.stderr.reconfigure(
    encoding="utf-8",
    errors="replace",
)


# =========================================================
# NHẬN SỐ TIỀN
# =========================================================

if len(sys.argv) < 2:
    print("Chưa truyền số tiền")
    sys.exit(1)

AMOUNT = sys.argv[1]

if not AMOUNT.isdigit():
    print("Số tiền không hợp lệ")
    sys.exit(1)

print("Amount nhận được:", AMOUNT)

os.makedirs(
    "static",
    exist_ok=True,
)


# =========================================================
# CẤU HÌNH
# =========================================================

DEBUG_ADDR = "127.0.0.1:9222"

DEPOSIT_URL = (
    "https://1xlite-0873.pro/"
    "vi/office/recharge"
)

DEPOSIT_URL_KEYWORD = "recharge"


# =========================================================
# KẾT NỐI CHROME ĐANG CHẠY
# =========================================================

def attach_to_existing_chrome():
    options = Options()

    options.add_experimental_option(
        "debuggerAddress",
        DEBUG_ADDR,
    )

    driver = webdriver.Chrome(
        options=options,
    )

    driver.set_page_load_timeout(30)

    return driver


# =========================================================
# XỬ LÝ TRANG CẢNH BÁO BẢO MẬT
# =========================================================

def bypass_security_warning(driver):
    try:
        title = driver.title.lower()

        print(
            "TITLE:",
            driver.title,
        )

        has_warning = (
            "lỗi bảo mật" in title
            or "privacy error" in title
            or "security" in title
        )

        if not has_warning:
            return False

        print(
            "Security warning detected"
        )

        driver.execute_script(
            """
            const button =
                document.querySelector(
                    "#details-button"
                );

            if (button) {
                button.click();
            }
            """
        )

        time.sleep(1)

        driver.execute_script(
            """
            const proceed =
                document.querySelector(
                    "#proceed-link"
                );

            if (proceed) {
                proceed.click();
            }
            """
        )

        time.sleep(5)

        print(
            "Đã xử lý trang cảnh báo"
        )

        return True

    except Exception as error:
        print(
            "Lỗi xử lý cảnh báo:",
            error,
        )

        return False


# =========================================================
# CHỌN ĐÚNG TAB NẠP TIỀN
# =========================================================

def switch_to_deposit_tab(driver):
    print(
        "Đang tìm tab nạp tiền..."
    )

    for handle in driver.window_handles:
        try:
            driver.switch_to.window(handle)

            current_url = driver.current_url

            print(
                "TAB:",
                current_url,
            )

            if DEPOSIT_URL_KEYWORD in current_url:
                print(
                    "Đã tìm thấy tab nạp tiền"
                )

                bypass_security_warning(
                    driver
                )

                return True

        except Exception as error:
            print(
                "Lỗi kiểm tra tab:",
                error,
            )

    print(
        "Không thấy tab nạp tiền, "
        "đang mở trang mới..."
    )

    try:
        driver.get(DEPOSIT_URL)

    except Exception as error:
        print(
            "Lỗi mở trang nạp tiền:",
            error,
        )

        return False

    time.sleep(5)

    bypass_security_warning(
        driver
    )

    return True


# =========================================================
# CHỌN MULTIPAY QR
# =========================================================

def select_multipay_qr(driver):
    time.sleep(5)

    # Thử tìm trong trang chính trước
    try:
        driver.switch_to.default_content()

        result = driver.execute_script(
            """
            const element =
                document.querySelector(
                    "[data-rawmethod='multipay_qr_vn']"
                );

            if (!element) {
                return false;
            }

            element.scrollIntoView({
                block: "center"
            });

            element.click();

            return true;
            """
        )

        if result:
            print(
                "Đã chọn Multipay QR "
                "trong trang chính"
            )

            return "root"

    except Exception as error:
        print(
            "Lỗi chọn Multipay QR "
            "trong trang chính:",
            error,
        )

    # Nếu không thấy thì tìm trong iframe
    try:
        driver.switch_to.default_content()

        iframes = driver.find_elements(
            By.TAG_NAME,
            "iframe",
        )

    except Exception as error:
        print(
            "Lỗi tìm iframe:",
            error,
        )

        return -1

    print(
        f"Tìm thấy {len(iframes)} iframe"
    )

    for index, iframe in enumerate(
        iframes
    ):
        try:
            driver.switch_to.default_content()

            driver.switch_to.frame(
                iframe
            )

            print(
                f"Đang kiểm tra iframe {index}"
            )

            result = driver.execute_script(
                """
                const element =
                    document.querySelector(
                        "[data-rawmethod='multipay_qr_vn']"
                    );

                if (!element) {
                    return false;
                }

                element.scrollIntoView({
                    block: "center"
                });

                element.click();

                return true;
                """
            )

            if result:
                print(
                    "Đã chọn Multipay QR "
                    f"trong iframe {index}"
                )

                return index

        except Exception as error:
            print(
                f"Lỗi iframe {index}:",
                error,
            )

    driver.switch_to.default_content()

    print(
        "Không tìm thấy Multipay QR"
    )

    return -1


# =========================================================
# TỰ ĐỘNG CHỌN NGÂN HÀNG ĐẦU TIÊN
# =========================================================

def auto_select_first_bank(driver):
    try:
        time.sleep(1)

        result = driver.execute_script(
            """
            const modal =
                document.querySelector(
                    "#payment_modal_container"
                );

            if (!modal) {
                return "NO_MODAL";
            }

            const select =
                modal.querySelector(
                    "#bank_code"
                );

            if (!select) {
                return "NO_SELECT";
            }

            const validOption =
                Array.from(
                    select.options
                ).find(
                    option =>
                        option.value
                        && option.value.trim() !== ""
                );

            if (!validOption) {
                return "NO_OPTION";
            }

            select.value =
                validOption.value;

            select.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles: true
                    }
                )
            );

            const rendered =
                modal.querySelector(
                    "#select2-bank_code-container"
                );

            if (rendered) {
                rendered.textContent =
                    validOption.text;

                rendered.title =
                    validOption.text;
            }

            return (
                validOption.value
                + " | "
                + validOption.text
            );
            """
        )

        print(
            "Kết quả chọn ngân hàng:",
            result,
        )

        return result not in [
            "NO_MODAL",
            "NO_SELECT",
            "NO_OPTION",
        ]

    except Exception as error:
        print(
            "Lỗi chọn ngân hàng:",
            error,
        )

        return False


# =========================================================
# NHẬP TIỀN VÀ BẤM XÁC NHẬN
# =========================================================

def input_amount_and_confirm(
    driver,
    amount,
):
    time.sleep(2)

    bank_selected = (
        auto_select_first_bank(
            driver
        )
    )

    if not bank_selected:
        print(
            "Không chọn được ngân hàng"
        )

        return False

    time.sleep(1)

    try:
        result = driver.execute_script(
            """
            const amountValue =
                arguments[0];

            const modal =
                document.querySelector(
                    "#payment_modal_container"
                );

            if (!modal) {
                return "NO_MODAL";
            }

            const input =
                modal.querySelector(
                    "#amount"
                );

            if (!input) {
                return "NO_INPUT";
            }

            input.focus();
            input.value = "";

            input.dispatchEvent(
                new Event(
                    "input",
                    {
                        bubbles: true
                    }
                )
            );

            input.value =
                String(amountValue);

            input.dispatchEvent(
                new Event(
                    "input",
                    {
                        bubbles: true
                    }
                )
            );

            input.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles: true
                    }
                )
            );

            input.dispatchEvent(
                new Event(
                    "blur",
                    {
                        bubbles: true
                    }
                )
            );

            return input.value;
            """,
            amount,
        )

    except Exception as error:
        print(
            "Lỗi nhập số tiền:",
            error,
        )

        return False

    print(
        "Giá trị sau khi nhập:",
        result,
    )

    if result in [
        "NO_MODAL",
        "NO_INPUT",
    ]:
        return False

    time.sleep(1)

    try:
        clicked = driver.execute_script(
            """
            const modal =
                document.querySelector(
                    "#payment_modal_container"
                );

            if (!modal) {
                return false;
            }

            const button =
                modal.querySelector(
                    "#deposit_button"
                );

            if (!button) {
                return false;
            }

            button.click();

            return true;
            """
        )

    except Exception as error:
        print(
            "Lỗi bấm nút xác nhận:",
            error,
        )

        return False

    if clicked:
        print(
            "Đã bấm nút xác nhận"
        )

        return True

    print(
        "Không tìm thấy nút xác nhận"
    )

    return False


# =========================================================
# CHỤP MÀN HÌNH VÀ CẮT QR
# =========================================================

def screenshot_and_crop_qr(driver):
    detector = cv2.QRCodeDetector()

    full_image_path = (
        "static/full_qr.png"
    )

    qr_image_path = (
        "static/qr_only.png"
    )

    print(
        "Đang chờ QR hiển thị..."
    )

    for attempt in range(1, 11):
        time.sleep(2)

        try:
            driver.save_screenshot(
                full_image_path
            )

        except Exception as error:
            print(
                "Lỗi chụp màn hình:",
                error,
            )

            continue

        image = cv2.imread(
            full_image_path
        )

        if image is None:
            print(
                f"Lần {attempt}: "
                "không đọc được ảnh"
            )

            continue

        gray_image = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        detected, points = (
            detector.detect(
                gray_image
            )
        )

        print(
            f"Lần {attempt}: "
            f"detect={detected}"
        )

        if (
            not detected
            or points is None
        ):
            continue

        points = points[0].astype(int)

        x1, y1 = points.min(axis=0)
        x2, y2 = points.max(axis=0)

        padding = 12

        x1 = max(
            0,
            x1 - padding,
        )

        y1 = max(
            0,
            y1 - padding,
        )

        x2 = min(
            image.shape[1],
            x2 + padding,
        )

        y2 = min(
            image.shape[0],
            y2 + padding,
        )

        cropped_image = image[
            y1:y2,
            x1:x2
        ]

        if cropped_image.size == 0:
            print(
                "Ảnh QR sau khi cắt bị rỗng"
            )

            continue

        saved = cv2.imwrite(
            qr_image_path,
            cropped_image,
        )

        if not saved:
            print(
                "Không lưu được ảnh QR"
            )

            continue

        if not os.path.exists(
            qr_image_path
        ):
            continue

        if os.path.getsize(
            qr_image_path
        ) == 0:
            continue

        print(
            "Đã tạo QR: "
            "static/qr_only.png"
        )

        print(
            "Ảnh đầy đủ: "
            "static/full_qr.png"
        )

        return True

    print(
        "Không nhận diện được QR"
    )

    return False


# =========================================================
# CHƯƠNG TRÌNH CHÍNH
# =========================================================

def main():
    try:
        driver = (
            attach_to_existing_chrome()
        )

    except Exception as error:
        print(
            "Không kết nối được Chrome:",
            error,
        )

        sys.exit(2)

    print(
        "Đã kết nối Chrome"
    )

    if not switch_to_deposit_tab(
        driver
    ):
        print(
            "Không mở được trang nạp tiền"
        )

        sys.exit(2)

    print(
        "Tiêu đề hiện tại:",
        driver.title,
    )

    frame_result = (
        select_multipay_qr(
            driver
        )
    )

    if frame_result == -1:
        print(
            "Không chọn được Multipay QR"
        )

        sys.exit(2)

    if frame_result == "root":
        driver.switch_to.default_content()

    amount_entered = (
        input_amount_and_confirm(
            driver,
            AMOUNT,
        )
    )

    if not amount_entered:
        print(
            "Không nhập hoặc xác nhận "
            "được số tiền"
        )

        sys.exit(2)

    qr_created = (
        screenshot_and_crop_qr(
            driver
        )
    )

    if not qr_created:
        print(
            "Không tạo được file QR"
        )

        sys.exit(2)

    print(
        "Bot đã tạo QR xong"
    )


# =========================================================
# CHẠY BOT
# =========================================================

if __name__ == "__main__":
    main()
