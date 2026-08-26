from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import (
    TimeoutException,
    WebDriverException,
    StaleElementReferenceException,
)

import cv2
import json
import os
import sys
import time


# =========================================================
# UTF-8
# =========================================================

try:
    sys.stdout.reconfigure(
        encoding="utf-8",
        errors="replace",
    )

    sys.stderr.reconfigure(
        encoding="utf-8",
        errors="replace",
    )

except Exception:
    pass


# =========================================================
# CONFIG
# =========================================================

DEBUG_ADDR = "127.0.0.1:9222"

DEPOSIT_URL = (
    "https://1xlite-2599.pro/"
    "vi/office/recharge"
)

DEPOSIT_URL_KEYWORD = "recharge"


# =========================================================
# TIMEOUT CHUNG
# =========================================================

# Luồng bên ngoài chờ 60s.
# Bot chỉ chạy tối đa 56s để còn thời gian
# cho server đọc file + trả response.
BOT_TIMEOUT = 56.0

# Tần suất poll giao diện.
FAST_POLL = 0.25

NORMAL_POLL = 0.5


# =========================================================
# GIỚI HẠN TỪNG GIAI ĐOẠN
# =========================================================

# Đây chỉ là giới hạn cho từng bước,
# nhưng vẫn bị chặn bởi deadline chung 56s.

TAB_MAX_WAIT = 5.0

MULTIPAY_MAX_WAIT = 12.0

MODAL_MAX_WAIT = 8.0

BANK_MAX_WAIT = 2.0

INPUT_MAX_WAIT = 5.0

CONFIRM_MAX_WAIT = 5.0


# =========================================================
# FILE OUTPUT
# =========================================================

STATIC_DIR = "static"

FULL_QR_PATH = os.path.join(
    STATIC_DIR,
    "full_qr.png",
)

QR_ONLY_PATH = os.path.join(
    STATIC_DIR,
    "qr_only.png",
)


os.makedirs(
    STATIC_DIR,
    exist_ok=True,
)


# =========================================================
# NHẬN SỐ TIỀN
# =========================================================

if len(sys.argv) < 2:

    print(
        "BOT_RESULT:"
        + json.dumps(
            {
                "success": False,
                "status": "INVALID_AMOUNT",
                "message": "Chưa truyền số tiền",
            },
            ensure_ascii=False,
        )
    )

    sys.exit(0)


AMOUNT = str(
    sys.argv[1]
).strip()


if not AMOUNT.isdigit():

    print(
        "BOT_RESULT:"
        + json.dumps(
            {
                "success": False,
                "status": "INVALID_AMOUNT",
                "message": "Số tiền không hợp lệ",
            },
            ensure_ascii=False,
        )
    )

    sys.exit(0)


print(
    "Amount nhận được:",
    AMOUNT,
)


# =========================================================
# XÓA QR CŨ
# =========================================================

for path in [
    QR_ONLY_PATH,
    FULL_QR_PATH,
]:

    try:

        if os.path.exists(
            path
        ):
            os.remove(
                path
            )

    except Exception as error:

        print(
            "Không xóa được file cũ:",
            path,
            error,
        )


# =========================================================
# TIME HELPERS
# =========================================================

def remaining_time(
    deadline
):

    return max(
        0.0,
        deadline
        - time.monotonic(),
    )


def expired(
    deadline
):

    return (
        remaining_time(
            deadline
        )
        <= 0
    )


def make_step_deadline(
    global_deadline,
    max_seconds,
):

    return min(
        global_deadline,
        time.monotonic()
        + max_seconds,
    )


def smart_sleep(
    seconds,
    deadline,
):

    remaining = (
        remaining_time(
            deadline
        )
    )

    if remaining <= 0:
        return

    time.sleep(
        min(
            seconds,
            remaining,
        )
    )


# =========================================================
# OUTPUT CHUẨN
# =========================================================

def output_result(
    success,
    status,
    message,
    extra=None,
):

    result = {
        "success": bool(
            success
        ),
        "status": status,
        "message": message,
    }


    if extra:
        result.update(
            extra
        )


    print(
        "BOT_RESULT:"
        + json.dumps(
            result,
            ensure_ascii=False,
        )
    )


# =========================================================
# DRIVER
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


    # Không để driver.get treo quá lâu.
    driver.set_page_load_timeout(
        8
    )


    return driver


def driver_is_alive(
    driver
):

    try:

        _ = driver.window_handles

        return True

    except Exception:

        return False


# =========================================================
# SECURITY WARNING
# =========================================================

def bypass_security_warning(
    driver,
    deadline,
):

    if expired(
        deadline
    ):
        return False


    try:

        title = ""

        try:

            title = str(
                driver.title
                or ""
            ).lower()

        except Exception:
            pass


        warning_found = (
            "privacy error"
            in title

            or "security"
            in title

            or "lỗi bảo mật"
            in title

            or "your connection is not private"
            in title
        )


        try:

            has_details_button = (
                driver.execute_script(
                    """
                    return !!document.querySelector(
                        "#details-button"
                    );
                    """
                )
            )

        except Exception:

            has_details_button = False


        if (
            not warning_found
            and not has_details_button
        ):

            return False


        print(
            "Phát hiện cảnh báo bảo mật"
        )


        try:

            driver.execute_script(
                """
                const btn =
                    document.querySelector(
                        "#details-button"
                    );

                if (btn) {
                    btn.click();
                }
                """
            )

        except Exception:
            pass


        smart_sleep(
            0.3,
            deadline,
        )


        try:

            driver.execute_script(
                """
                const btn =
                    document.querySelector(
                        "#proceed-link"
                    );

                if (btn) {
                    btn.click();
                }
                """
            )

        except Exception:
            pass


        smart_sleep(
            0.8,
            deadline,
        )


        print(
            "Đã thử bỏ qua cảnh báo bảo mật"
        )


        return True


    except Exception as error:

        print(
            "Lỗi xử lý cảnh báo:",
            error,
        )

        return False


# =========================================================
# TÌM TAB NẠP TIỀN
# =========================================================

def switch_to_deposit_tab(
    driver,
    deadline,
):

    step_deadline = (
        make_step_deadline(
            deadline,
            TAB_MAX_WAIT,
        )
    )


    print(
        "Đang tìm tab nạp tiền..."
    )


    # =====================================================
    # TÌM TAB ĐANG MỞ
    # =====================================================

    while not expired(
        step_deadline
    ):

        try:

            handles = (
                driver.window_handles
            )

        except Exception:

            handles = []


        for handle in handles:

            if expired(
                step_deadline
            ):
                break


            try:

                driver.switch_to.window(
                    handle
                )


                current_url = str(
                    driver.current_url
                    or ""
                )


                if (
                    DEPOSIT_URL_KEYWORD
                    in current_url.lower()
                ):

                    print(
                        "Đã tìm thấy tab nạp tiền:",
                        current_url,
                    )


                    bypass_security_warning(
                        driver,
                        deadline,
                    )


                    return True


            except Exception:
                continue


        break


    # =====================================================
    # KHÔNG CÓ -> MỞ TRANG
    # =====================================================

    if expired(
        deadline
    ):

        return False


    print(
        "Không thấy tab nạp tiền, "
        "đang mở trang..."
    )


    try:

        driver.switch_to.default_content()

    except Exception:
        pass


    try:

        driver.get(
            DEPOSIT_URL
        )

    except TimeoutException:

        # Không coi page-load timeout là thất bại.
        print(
            "driver.get load chậm, "
            "tiếp tục kiểm tra DOM"
        )

    except Exception as error:

        print(
            "driver.get báo:",
            error,
        )


    bypass_security_warning(
        driver,
        deadline,
    )


    # Chỉ cần Chrome còn sống,
    # trang SPA có thể tiếp tục render.
    return driver_is_alive(
        driver
    )


# =========================================================
# CLICK MULTIPAY TRONG CONTEXT HIỆN TẠI
# =========================================================

def click_multipay_in_current_context(
    driver
):

    try:

        result = (
            driver.execute_script(
                """
                const element =
                    document.querySelector(
                        "[data-rawmethod='multipay_qr_vn']"
                    );


                if (!element) {
                    return false;
                }


                try {
                    element.scrollIntoView({
                        block: "center",
                        inline: "center"
                    });
                } catch (e) {}


                try {

                    element.click();

                    return true;

                } catch (e) {}


                try {

                    element.dispatchEvent(
                        new MouseEvent(
                            "click",
                            {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            }
                        )
                    );

                    return true;

                } catch (e) {}


                return false;
                """
            )
        )


        return bool(
            result
        )


    except Exception:

        return False


# =========================================================
# MULTIPAY QR
# =========================================================

def select_multipay_qr(
    driver,
    deadline,
):

    step_deadline = (
        make_step_deadline(
            deadline,
            MULTIPAY_MAX_WAIT,
        )
    )


    print(
        "Đang tìm Multipay QR..."
    )


    last_iframe_count = -1


    while not expired(
        step_deadline
    ):

        # =================================================
        # ROOT
        # =================================================

        try:

            driver.switch_to.default_content()


            if click_multipay_in_current_context(
                driver
            ):

                print(
                    "Đã chọn Multipay QR "
                    "trong trang chính"
                )


                return {
                    "success": True,
                    "frame": "root",
                }


        except Exception:
            pass


        # =================================================
        # IFRAME
        # =================================================

        try:

            driver.switch_to.default_content()


            iframes = (
                driver.find_elements(
                    By.TAG_NAME,
                    "iframe",
                )
            )

        except Exception:

            iframes = []


        if (
            len(iframes)
            != last_iframe_count
        ):

            print(
                "Số iframe:",
                len(iframes),
            )

            last_iframe_count = (
                len(iframes)
            )


        for index in range(
            len(iframes)
        ):

            if expired(
                step_deadline
            ):
                break


            try:

                driver.switch_to.default_content()


                current_iframes = (
                    driver.find_elements(
                        By.TAG_NAME,
                        "iframe",
                    )
                )


                if (
                    index
                    >= len(
                        current_iframes
                    )
                ):
                    continue


                driver.switch_to.frame(
                    current_iframes[
                        index
                    ]
                )


                if click_multipay_in_current_context(
                    driver
                ):

                    print(
                        "Đã chọn Multipay QR "
                        f"trong iframe {index}"
                    )


                    return {
                        "success": True,
                        "frame": index,
                    }


            except (
                StaleElementReferenceException,
                WebDriverException,
                Exception,
            ):

                continue


        smart_sleep(
            FAST_POLL,
            step_deadline,
        )


    try:

        driver.switch_to.default_content()

    except Exception:
        pass


    print(
        "Không tìm thấy Multipay QR "
        "trong thời gian cho phép"
    )


    return {
        "success": False,
        "frame": None,
    }


# =========================================================
# PAYMENT MODAL
# =========================================================

def wait_for_payment_modal(
    driver,
    deadline,
):

    step_deadline = (
        make_step_deadline(
            deadline,
            MODAL_MAX_WAIT,
        )
    )


    print(
        "Đang chờ form thanh toán..."
    )


    while not expired(
        step_deadline
    ):

        try:

            result = (
                driver.execute_script(
                    """
                    const modal =
                        document.querySelector(
                            "#payment_modal_container"
                        );


                    if (!modal) {
                        return false;
                    }


                    const style =
                        window.getComputedStyle(
                            modal
                        );


                    if (
                        style.display === "none"
                        ||
                        style.visibility === "hidden"
                    ) {
                        return false;
                    }


                    return true;
                    """
                )
            )


            if result:

                print(
                    "Đã thấy form thanh toán"
                )

                return True


        except Exception:
            pass


        smart_sleep(
            FAST_POLL,
            step_deadline,
        )


    print(
        "Chưa thấy form thanh toán"
    )


    return False


# =========================================================
# BANK
# =========================================================

def inspect_or_select_bank(
    driver
):

    try:

        result = (
            driver.execute_script(
                """
                const modal =
                    document.querySelector(
                        "#payment_modal_container"
                    );


                if (!modal) {

                    return {
                        status: "NO_MODAL"
                    };
                }


                const select =
                    modal.querySelector(
                        "#bank_code"
                    );


                // Không có bank selector:
                // coi là không cần chọn bank.
                if (!select) {

                    return {
                        status: "NOT_REQUIRED"
                    };
                }


                const style =
                    window.getComputedStyle(
                        select
                    );


                const hidden =
                    select.offsetParent === null
                    ||
                    style.display === "none"
                    ||
                    style.visibility === "hidden";


                const validOption =
                    Array.from(
                        select.options || []
                    ).find(
                        option =>
                            option.value
                            &&
                            option.value.trim() !== ""
                            &&
                            !option.disabled
                    );


                if (!validOption) {

                    if (hidden) {

                        return {
                            status: "NOT_REQUIRED"
                        };
                    }


                    return {
                        status: "WAIT_OPTION"
                    };
                }


                select.value =
                    validOption.value;


                select.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );


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


                return {
                    status: "SELECTED",
                    value: validOption.value,
                    text: validOption.text
                };
                """
            )
        )


        if isinstance(
            result,
            dict,
        ):

            return result


        return {
            "status": "ERROR"
        }


    except Exception as error:

        print(
            "Lỗi kiểm tra bank:",
            error,
        )


        return {
            "status": "ERROR"
        }


def handle_bank_selection(
    driver,
    deadline,
):

    step_deadline = (
        make_step_deadline(
            deadline,
            BANK_MAX_WAIT,
        )
    )


    while not expired(
        step_deadline
    ):

        result = (
            inspect_or_select_bank(
                driver
            )
        )


        status = result.get(
            "status"
        )


        if status == "SELECTED":

            print(
                "Đã chọn ngân hàng:",
                result.get(
                    "text"
                ),
            )


            return True


        if status == "NOT_REQUIRED":

            print(
                "Không cần chọn ngân hàng"
            )


            return True


        if status in [
            "WAIT_OPTION",
            "NO_MODAL",
            "ERROR",
        ]:

            smart_sleep(
                FAST_POLL,
                step_deadline,
            )

            continue


    # =====================================================
    # QUAN TRỌNG:
    # Không cho bank làm bot chết.
    # =====================================================

    print(
        "Không xác định được bank "
        "sau 2s -> bỏ qua và tiếp tục"
    )


    return True


# =========================================================
# SET AMOUNT
# =========================================================

def set_amount_once(
    driver,
    amount,
):

    try:

        result = (
            driver.execute_script(
                """
                const amountValue =
                    String(
                        arguments[0]
                    );


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


                try {

                    input.scrollIntoView({
                        block: "center"
                    });

                } catch (e) {}


                try {

                    input.focus();

                } catch (e) {}


                try {

                    const setter =
                        Object.getOwnPropertyDescriptor(
                            HTMLInputElement.prototype,
                            "value"
                        ).set;


                    setter.call(
                        input,
                        amountValue
                    );

                } catch (e) {

                    input.value =
                        amountValue;
                }


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
                    new KeyboardEvent(
                        "keyup",
                        {
                            bubbles: true
                        }
                    )
                );


                try {

                    input.blur();

                } catch (e) {}


                return input.value;
                """,
                amount,
            )
        )


        if result in [
            None,
            "NO_MODAL",
            "NO_INPUT",
        ]:

            return False


        expected = "".join(
            char
            for char in str(
                amount
            )
            if char.isdigit()
        )


        actual = "".join(
            char
            for char in str(
                result
            )
            if char.isdigit()
        )


        print(
            "Giá trị input:",
            result,
        )


        return (
            actual == expected
            and actual != ""
        )


    except Exception as error:

        print(
            "Lỗi nhập amount:",
            error,
        )


        return False


def set_amount(
    driver,
    amount,
    deadline,
):

    step_deadline = (
        make_step_deadline(
            deadline,
            INPUT_MAX_WAIT,
        )
    )


    while not expired(
        step_deadline
    ):

        if set_amount_once(
            driver,
            amount,
        ):

            return True


        smart_sleep(
            FAST_POLL,
            step_deadline,
        )


    return False


# =========================================================
# CONFIRM
# =========================================================

def click_confirm_once(
    driver
):

    try:

        result = (
            driver.execute_script(
                """
                const modal =
                    document.querySelector(
                        "#payment_modal_container"
                    );


                if (!modal) {
                    return "NO_MODAL";
                }


                const button =
                    modal.querySelector(
                        "#deposit_button"
                    );


                if (!button) {
                    return "NO_BUTTON";
                }


                try {

                    button.scrollIntoView({
                        block: "center"
                    });

                } catch (e) {}


                if (
                    button.disabled
                    ||
                    button.getAttribute(
                        "aria-disabled"
                    ) === "true"
                ) {

                    return "DISABLED";
                }


                try {

                    button.click();

                    return "CLICKED";

                } catch (e) {}


                try {

                    button.dispatchEvent(
                        new MouseEvent(
                            "click",
                            {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            }
                        )
                    );

                    return "CLICKED";

                } catch (e) {}


                return "FAILED";
                """
            )
        )


        print(
            "Confirm:",
            result,
        )


        return (
            result == "CLICKED"
        )


    except Exception as error:

        print(
            "Lỗi confirm:",
            error,
        )


        return False


def click_confirm(
    driver,
    amount,
    deadline,
):

    step_deadline = (
        make_step_deadline(
            deadline,
            CONFIRM_MAX_WAIT,
        )
    )


    while not expired(
        step_deadline
    ):

        if click_confirm_once(
            driver
        ):

            return True


        # Có site nhận input chậm.
        # Set lại giá trị trước khi thử click.
        set_amount_once(
            driver,
            amount,
        )


        smart_sleep(
            FAST_POLL,
            step_deadline,
        )


    return False


# =========================================================
# INPUT + CONFIRM
# =========================================================

def input_amount_and_confirm(
    driver,
    amount,
    deadline,
):

    if expired(
        deadline
    ):
        return False


    # =====================================================
    # MODAL
    # =====================================================

    if not wait_for_payment_modal(
        driver,
        deadline,
    ):

        return False


    # =====================================================
    # BANK OPTIONAL
    # =====================================================

    handle_bank_selection(
        driver,
        deadline,
    )


    # =====================================================
    # AMOUNT
    # =====================================================

    if not set_amount(
        driver,
        amount,
        deadline,
    ):

        print(
            "Không nhập được số tiền"
        )

        return False


    # =====================================================
    # CONFIRM
    # =====================================================

    if not click_confirm(
        driver,
        amount,
        deadline,
    ):

        print(
            "Không bấm được xác nhận"
        )

        return False


    print(
        "Đã bấm xác nhận"
    )


    return True


# =========================================================
# QR DETECT
# =========================================================

def detect_and_crop_qr(
    full_path,
    qr_path,
):

    try:

        image = cv2.imread(
            full_path
        )


        if image is None:
            return False


        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )


        detector = (
            cv2.QRCodeDetector()
        )


        detected, points = (
            detector.detect(
                gray
            )
        )


        if (
            not detected
            or points is None
        ):

            return False


        points = (
            points[0]
            .astype(int)
        )


        x1, y1 = (
            points.min(
                axis=0
            )
        )

        x2, y2 = (
            points.max(
                axis=0
            )
        )


        padding = 18


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


        crop = image[
            y1:y2,
            x1:x2
        ]


        if crop.size == 0:
            return False


        if not cv2.imwrite(
            qr_path,
            crop,
        ):

            return False


        return (
            os.path.exists(
                qr_path
            )
            and os.path.getsize(
                qr_path
            ) > 0
        )


    except Exception as error:

        print(
            "QR detect error:",
            error,
        )


        return False


# =========================================================
# CHỜ QR
# =========================================================

def screenshot_and_crop_qr(
    driver,
    deadline,
):

    print(
        "Đang chờ QR..."
    )


    attempt = 0


    # =====================================================
    # Không có timeout riêng.
    #
    # QR được dùng TOÀN BỘ thời gian còn lại.
    # =====================================================

    while not expired(
        deadline
    ):

        attempt += 1


        try:

            saved = (
                driver.save_screenshot(
                    FULL_QR_PATH
                )
            )


            if saved:

                if detect_and_crop_qr(
                    FULL_QR_PATH,
                    QR_ONLY_PATH,
                ):

                    print(
                        "Đã tìm thấy QR"
                    )


                    return True


        except Exception as error:

            print(
                "Screenshot QR:",
                error,
            )


        if (
            attempt == 1
            or attempt % 10 == 0
        ):

            print(
                "Chưa có QR. "
                "Còn:",
                round(
                    remaining_time(
                        deadline
                    ),
                    1,
                ),
                "giây",
            )


        smart_sleep(
            NORMAL_POLL,
            deadline,
        )


    return False


# =========================================================
# MAIN
# =========================================================

def main():

    start_time = (
        time.monotonic()
    )


    deadline = (
        start_time
        + BOT_TIMEOUT
    )


    driver = None


    # =====================================================
    # CONNECT CHROME
    # =====================================================

    try:

        driver = (
            attach_to_existing_chrome()
        )


        print(
            "Đã kết nối Chrome"
        )


    except Exception as error:

        output_result(
            False,
            "CHROME_CONNECTION_FAILED",
            "Không kết nối được Chrome",
            {
                "error": str(
                    error
                ),
                "elapsed": round(
                    time.monotonic()
                    - start_time,
                    2,
                ),
            },
        )


        sys.exit(0)


    if expired(
        deadline
    ):

        output_result(
            False,
            "TIMEOUT",
            "Hết thời gian xử lý",
        )

        sys.exit(0)


    # =====================================================
    # TAB
    # =====================================================

    if not switch_to_deposit_tab(
        driver,
        deadline,
    ):

        output_result(
            False,
            "DEPOSIT_PAGE_NOT_READY",
            "Trang nạp tiền chưa sẵn sàng",
            {
                "elapsed": round(
                    time.monotonic()
                    - start_time,
                    2,
                ),
            },
        )


        sys.exit(0)


    if expired(
        deadline
    ):

        output_result(
            False,
            "TIMEOUT",
            "Hết thời gian xử lý",
        )

        sys.exit(0)


    # =====================================================
    # MULTIPAY
    # =====================================================

    payment_result = (
        select_multipay_qr(
            driver,
            deadline,
        )
    )


    if not payment_result.get(
        "success"
    ):

        output_result(
            False,
            "MULTIPAY_NOT_READY",
            "Multipay QR chưa tải kịp",
            {
                "elapsed": round(
                    time.monotonic()
                    - start_time,
                    2,
                ),
            },
        )


        sys.exit(0)


    if expired(
        deadline
    ):

        output_result(
            False,
            "TIMEOUT",
            "Hết thời gian xử lý",
        )

        sys.exit(0)


    # =====================================================
    # AMOUNT + CONFIRM
    # =====================================================

    confirmed = (
        input_amount_and_confirm(
            driver,
            AMOUNT,
            deadline,
        )
    )


    if not confirmed:

        output_result(
            False,
            "FORM_NOT_READY",
            (
                "Form thanh toán chưa "
                "hoàn tất trong thời gian cho phép"
            ),
            {
                "elapsed": round(
                    time.monotonic()
                    - start_time,
                    2,
                ),
            },
        )


        sys.exit(0)


    if expired(
        deadline
    ):

        output_result(
            False,
            "TIMEOUT",
            "Hết thời gian xử lý",
        )

        sys.exit(0)


    # =====================================================
    # QR
    # =====================================================

    qr_created = (
        screenshot_and_crop_qr(
            driver,
            deadline,
        )
    )


    elapsed = round(
        time.monotonic()
        - start_time,
        2,
    )


    if qr_created:

        output_result(
            True,
            "QR_CREATED",
            "Bot đã tạo QR thành công",
            {
                "amount": AMOUNT,
                "qr_path": QR_ONLY_PATH,
                "full_image_path": FULL_QR_PATH,
                "elapsed": elapsed,
            },
        )


        print(
            "Bot hoàn tất trong",
            elapsed,
            "giây"
        )


        sys.exit(0)


    # =====================================================
    # TIMEOUT CUỐI
    # =====================================================

    output_result(
        False,
        "QR_TIMEOUT",
        (
            "Cổng thanh toán chưa trả QR "
            "trước giới hạn thời gian"
        ),
        {
            "amount": AMOUNT,
            "elapsed": elapsed,
        },
    )


    sys.exit(0)


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    try:

        main()


    except KeyboardInterrupt:

        output_result(
            False,
            "STOPPED",
            "Bot bị dừng thủ công",
        )


        sys.exit(0)


    except Exception as error:

        output_result(
            False,
            "UNEXPECTED_ERROR",
            "Bot gặp lỗi ngoài dự kiến",
            {
                "error": str(
                    error
                ),
            },
        )


        sys.exit(0)
