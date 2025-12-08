# Analytics Module Documentation

## Структура модуля

```
src/lib/analytics/
├── index.ts          # Main export
├── types.ts          # TypeScript types
├── gtm.ts            # Google Tag Manager
├── ga4.ts            # Google Analytics 4
├── pixel.ts          # Meta Pixel
├── capi.ts           # Meta CAPI client helper
└── dispatcher.ts     # Unified dispatcher
```

## Використання

### Базове використання

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const { trackAddToCart, trackViewItem } = useAnalytics();

// Track add to cart
trackAddToCart({
  id: 123,
  name: 'Product Name',
  price: 1500,
  quantity: 1,
});
```

### Пряме використання dispatcher

```typescript
import * as analytics from '@/lib/analytics';

// Track custom event
analytics.dispatch('custom_event', {
  category: 'UI',
  action: 'click',
  label: 'button',
});
```

### Автоматичне відстеження сторінок

```typescript
import { usePageTracking } from '@/hooks/useAnalytics';

function MyPage() {
  usePageTracking(); // Автоматично відстежує перегляди сторінок
  return <div>...</div>;
}
```

### Відстеження scroll depth

```typescript
import { useScrollDepth } from '@/hooks/useAnalytics';

function MyPage() {
  useScrollDepth(); // Автоматично відстежує глибину прокрутки
  return <div>...</div>;
}
```

## Доступні функції

### E-commerce Events

- `trackViewItem()` - Перегляд товару
- `trackViewItemList()` - Перегляд списку товарів
- `trackAddToCart()` - Додавання в кошик
- `trackRemoveFromCart()` - Видалення з кошика
- `trackViewCart()` - Перегляд кошика
- `trackBeginCheckout()` - Початок оформлення
- `trackAddPaymentInfo()` - Додавання платежної інформації
- `trackAddShippingInfo()` - Додавання адреси доставки
- `trackPurchase()` - Завершення покупки

### Search & Navigation

- `trackSearch()` - Пошук
- `trackSelectItem()` - Вибір товару зі списку
- `trackFilter()` - Використання фільтрів
- `trackPagination()` - Пагінація

### UI Events

- `trackUIInteraction()` - Взаємодія з UI
- `trackFavorite()` - Додавання/видалення з обраних
- `trackBannerClick()` - Клік по банеру
- `trackBannerImpression()` - Показ банера
- `trackScrollDepth()` - Глибина прокрутки

### Promotions

- `trackViewPromotion()` - Перегляд промо
- `trackSelectPromotion()` - Вибір промо

## Типи

Всі типи знаходяться в `types.ts`:

- `AnalyticsProduct` - Структура продукту
- `GA4ViewItemParams` - Параметри для GA4 подій
- `PixelViewContentParams` - Параметри для Pixel подій
- `CAPIParams` - Параметри для CAPI подій

## Приклади

Дивіться `ANALYTICS_SETUP.md` для детальних прикладів інтеграції.



