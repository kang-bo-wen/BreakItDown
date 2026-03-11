import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test('should successfully register a new user', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:8000/register');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'screenshots/register-initial.png', fullPage: true });

    // Generate unique email for testing
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    // Fill in registration form
    await page.fill('input#name', 'Test User');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', 'testpassword123');
    await page.fill('input#confirmPassword', 'testpassword123');

    // Take screenshot before submission
    await page.screenshot({ path: 'screenshots/register-filled.png', fullPage: true });

    // Click register button
    await page.click('button[type="submit"]');

    // Wait for navigation or error message
    await page.waitForTimeout(3000);

    // Take screenshot after submission
    await page.screenshot({ path: 'screenshots/register-after-submit.png', fullPage: true });

    // Check for success (should redirect to /setup or show success message)
    const currentUrl = page.url();
    console.log('Current URL after registration:', currentUrl);

    // Check for error messages
    const errorElement = await page.$('text=/注册失败|error|失败/i');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('Error message found:', errorText);

      // Get console logs
      page.on('console', msg => console.log('Browser console:', msg.text()));

      // Get network errors
      page.on('requestfailed', request => {
        console.log('Failed request:', request.url(), request.failure()?.errorText);
      });
    }

    // Assert no error message is shown
    expect(errorElement).toBeNull();

    // Assert successful redirect or success message
    expect(currentUrl).toContain('/setup');
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('http://localhost:8000/register');
    await page.waitForLoadState('networkidle');

    // Use the same email twice
    const testEmail = 'duplicate@example.com';

    // First registration
    await page.fill('input#email', testEmail);
    await page.fill('input#password', 'testpassword123');
    await page.fill('input#confirmPassword', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go back to register page
    await page.goto('http://localhost:8000/register');
    await page.waitForLoadState('networkidle');

    // Try to register again with same email
    await page.fill('input#email', testEmail);
    await page.fill('input#password', 'testpassword123');
    await page.fill('input#confirmPassword', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/register-duplicate-error.png', fullPage: true });

    // Should show error message
    const errorElement = await page.$('text=/该邮箱已被注册|already/i');
    expect(errorElement).not.toBeNull();
  });
});
