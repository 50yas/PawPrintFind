from playwright.sync_api import sync_playwright
import time

def run_verification(page):
    # Navigate to the app
    page.goto("http://localhost:3000")
    page.wait_for_timeout(5000) # Wait more for Vite reload

    page.evaluate("() => { localStorage.setItem('pawprint_view', 'adminDashboard'); localStorage.setItem('pawprint_admin_tab', 'ai'); }")
    page.reload()
    page.wait_for_timeout(5000)

    # Wait for the main container or some admin dashboard element
    try:
        page.wait_for_selector("h2", timeout=10000)
    except:
        pass

    page.screenshot(path="/home/jules/verification/screenshots/admin_ai_settings_retry.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 720}
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
