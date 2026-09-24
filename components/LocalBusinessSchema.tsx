import { COMPANY, SERVICE_CITIES, SOCIAL_LINKS } from "@/lib/pricing";

// Server-rendered JSON-LD so Google can attach our phone number, service
// area, and price range directly to search results (and the Maps 3-pack)
// instead of just a blue link.
export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: COMPANY.name,
    url: COMPANY.url,
    telephone: COMPANY.phone,
    description:
      "Fast, affordable dumpster rentals within 75 miles of South Lyon, Michigan. 5 to 30 yard dumpsters and roll-off trailers with 2 tons included and fast delivery & pickup.",
    priceRange: "$150-$600",
    areaServed: SERVICE_CITIES.map((city) => ({
      "@type": "City",
      name: `${city}, MI`,
    })),
    sameAs: Object.values(SOCIAL_LINKS),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
