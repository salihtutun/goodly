import { Helmet } from "react-helmet-async";
import { FRONTEND_URL } from "@/lib/env";

const BASE = (FRONTEND_URL || "https://searchgoodly.com").replace(/\/$/, "");

/**
 * JsonLd — inject JSON-LD structured data into the page <head>.
 * Google uses this for rich results (sitelinks, reviews, FAQs, etc.).
 *
 * Props:
 *   data — the JSON-LD object (will be stringified)
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
}

/* ── Pre-built schemas for common page types ── */

/** Organization schema — use on Landing, About, Contact pages */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Goodly",
    url: BASE,
    logo: `${BASE}/favicon.ico`,
    description:
      "Goodly helps small businesses get found on Google, Google Maps, Instagram, and AI assistants. Free SEO audit in 30 seconds.",
    sameAs: [
      "https://twitter.com/searchgoodly",
      "https://linkedin.com/company/searchgoodly",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@searchgoodly.com",
      contactType: "customer support",
    },
  };
}

/** SoftwareApplication schema — use on Landing, Pricing */
export function softwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Goodly",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan available",
    },
    description:
      "SEO visibility platform for small businesses. Audit your website, Google Business Profile, social media, and AI visibility — all in one place.",
    url: BASE,
  };
}

/** WebApplication schema — use on tool pages */
export function webAppSchema(name, description, url) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description,
    url: `${BASE}${url}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** FAQ schema — use on pages with FAQ sections */
export function faqSchema(questions) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

/** BlogPosting schema — use on individual blog post pages */
export function blogPostSchema({ title, description, datePublished, author, image, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished,
    author: {
      "@type": "Person",
      name: author || "Goodly Team",
    },
    image,
    url: `${BASE}${url}`,
    publisher: {
      "@type": "Organization",
      name: "Goodly",
      logo: {
        "@type": "ImageObject",
        url: `${BASE}/favicon.ico`,
      },
    },
  };
}

/** BreadcrumbList schema — use on nested pages */
export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE}${item.url}`,
    })),
  };
}
