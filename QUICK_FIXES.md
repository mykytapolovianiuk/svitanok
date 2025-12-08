# Quick Fixes for TypeScript Errors

## Critical Fixes Needed Before Deployment

### 1. Fix Unused Imports/Variables
Many files have unused imports and variables that need to be removed:

```bash
# Run this to identify unused variables
npx eslint . --ext .ts,.tsx --rule '@typescript-eslint/no-unused-vars: error'
```

Common fixes:
- Remove unused imports like `useEffect`, `Link`, etc.
- Remove unused variables like `totalItems`, `index`, etc.

### 2. Install Missing Dependencies
Install Swiper CSS modules:

```bash
npm install swiper
```

### 3. Fix Type Issues
In `src/lib/sentry.ts`, fix the BrowserTracing integration:

```typescript
// Replace the BrowserTracing configuration with:
new BrowserTracing({
  tracePropagationTargets: [SITE_URL, 'localhost'],
}),
```

### 4. Fix Window.fbq Access
In `src/lib/analytics/pixel.ts`, update the fbq initialization:

```typescript
// Replace the problematic lines with:
if (window.fbq) {
  (window.fbq as any).q = (window.fbq as any).q || [];
  (window.fbq as any).q.push(args);
}
```

### 5. Fix Cart State Access
In `src/pages/Cart.tsx`, fix the cart state access:

```typescript
// Replace with proper cart state access
const { items, updateQuantity, removeItem, clearCart } = useCartStore();
// Calculate total price in component instead of accessing non-existent property
```

## Quick Command Sequence

```bash
# 1. Install missing dependencies
npm install swiper

# 2. Fix most common issues with automated tools
npx eslint . --ext .ts,.tsx --fix

# 3. Try build again
npm run build
```

## If Build Still Fails

1. Temporarily disable TypeScript checking during build by modifying `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "noUnusedLocals": false,
       "noUnusedParameters": false
     }
   }
   ```

2. Or fix errors one by one focusing on the most critical ones first.

## Priority Order for Fixes

1. Module resolution errors (Swiper CSS)
2. Type mismatch errors (Sentry, fbq)
3. Unused variable/import errors
4. Property access errors