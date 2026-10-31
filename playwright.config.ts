import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./e2e', use:{ baseURL:'http://localhost:3000', browserName:'chromium', channel:'chrome' }, webServer:{ command:'npm run dev', url:'http://localhost:3000', reuseExistingServer:!process.env.CI, timeout:60000 } });
