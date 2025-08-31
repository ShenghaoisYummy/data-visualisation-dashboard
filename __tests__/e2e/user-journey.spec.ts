import { test, expect } from '@playwright/test';
import path from 'path';

// Test data
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'TestPassword123!',
  invitationCode: 'TEST123'
};

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test database state if needed
    // You might want to seed the database with test invitation codes
  });

  test('should complete registration → login → upload → dashboard flow', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveTitle(/register/i);

    // Step 2: Fill registration form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);
    await page.fill('input[name="invitationCode"]', TEST_USER.invitationCode);

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Step 4: Verify registration success
    await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 });

    // Step 5: Navigate to login
    await page.goto('/login');

    // Step 6: Login with registered credentials
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Step 7: Verify login success - should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Step 8: Navigate to upload page
    await page.click('a[href="/upload"]');
    await expect(page).toHaveURL('/upload');

    // Step 9: Upload Excel file
    const fileInput = page.locator('input[type="file"]');
    
    // Create a test Excel file path (you'll need to create this)
    const testFilePath = path.join(__dirname, 'fixtures', 'sample-data.xlsx');
    
    // Upload file
    await fileInput.setInputFiles(testFilePath);
    
    // Click upload button
    await page.click('button:has-text("Upload")');

    // Step 10: Verify upload success
    await expect(page.locator('text=Upload successful')).toBeVisible({ timeout: 15000 });

    // Step 11: Return to dashboard
    await page.goto('/dashboard');

    // Step 12: Verify data appears in dashboard
    await expect(page.locator('[data-testid="product-list"]')).toBeVisible({ timeout: 10000 });
    
    // Should see uploaded products
    await expect(page.locator('.product-item')).toHaveCount.toBeGreaterThan(0);

    // Step 13: Select a product and view chart
    await page.click('.product-item:first-child');
    
    // Verify chart renders
    await expect(page.locator('[data-testid="product-chart"]')).toBeVisible();
    
    // Should see chart lines for inventory, procurement, sales
    await expect(page.locator('.recharts-line')).toHaveCount(3);
  });

  test('should handle invalid login attempts', async ({ page }) => {
    await page.goto('/login');

    // Try invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should protect routes requiring authentication', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Try upload route
    await page.goto('/upload');
    await expect(page).toHaveURL('/login');
  });

  test('should handle file upload errors gracefully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');

    // Go to upload
    await page.goto('/upload');

    // Try to upload invalid file type
    const invalidFile = path.join(__dirname, 'fixtures', 'invalid-file.txt');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles(invalidFile);
    await page.click('button:has-text("Upload")');

    // Should show error message
    await expect(page.locator('text=Invalid file format')).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if mobile navigation works
    if (await page.locator('[data-testid="mobile-menu-button"]').isVisible()) {
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    // Verify layout adapts correctly
    await expect(page.locator('main')).toBeVisible();
  });

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Try to access protected route - should be redirected back to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});