# UI Test Suite

Automated UI tests for the Feedback App using Playwright.

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium
```

## Running Tests

### Local Testing
```bash
# From root directory
npm run test:ui:local

# Or from ui-test directory
npm test
```

### Testing Against Vercel Deployment
```bash
# Update the URL in root package.json first, then:
npm run test:ui:vercel

# Or manually specify URL:
cd ui-test
BASE_URL=https://your-app.vercel.app npm test
```

### Interactive Mode
```bash
cd ui-test
npm run test:ui
```

### Debug Mode (with browser visible)
```bash
cd ui-test
npm run test:headed
```

## Test Coverage

### RefId Validation Tests
- ✅ Valid refId displays washroom label correctly
- ✅ Loading state appears during validation
- ✅ Missing refId shows appropriate error (when required)
- ✅ Invalid refId shows error message

## CI/CD Integration

Add to GitHub Actions or your CI pipeline:

```yaml
- name: Run UI Tests
  run: |
    npm run test:ui:local
```

For testing against deployed Vercel preview:
```yaml
- name: Test Vercel Deployment
  run: |
    BASE_URL=${{ steps.deploy.outputs.url }} npm run test:ui
```

## Configuration

Edit `playwright.config.js` to:
- Add more browsers (Firefox, WebKit)
- Adjust timeouts
- Change screenshot/video settings
- Modify parallel execution
