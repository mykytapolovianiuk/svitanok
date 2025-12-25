

import { useEffect } from 'react';

interface ProductStructuredData {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  category?: string;
  sku?: string;
}

interface OrganizationStructuredData {
  name: string;
  url: string;
  logo?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    areaServed: string;
  };
}

interface BreadcrumbStructuredData {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function ProductStructuredData({ product }: { product: ProductStructuredData }) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: Array.isArray(product.image) ? product.image : [product.image],
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'UAH',
        availability: `https://schema.org/${product.availability || 'InStock'}`,
        url: window.location.href,
      },
      ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
      ...(product.category && { category: product.category }),
      ...(product.sku && { sku: product.sku }),
    };

    addStructuredData(structuredData, 'product-structured-data');
  }, [product]);

  return null;
}

export function OrganizationStructuredData({ organization }: { organization: OrganizationStructuredData }) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organization.name,
      url: organization.url,
      ...(organization.logo && { logo: organization.logo }),
      ...(organization.contactPoint && {
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: organization.contactPoint.telephone,
          contactType: organization.contactPoint.contactType,
          areaServed: organization.contactPoint.areaServed,
        },
      }),
    };

    addStructuredData(structuredData, 'organization-structured-data');
  }, [organization]);

  return null;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredData) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    addStructuredData(structuredData, 'breadcrumb-structured-data');
  }, [items]);

  return null;
}

function addStructuredData(data: object, id: string) {
  
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}



