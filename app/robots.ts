import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/pricing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/employee", "/api"],
      },
    ],
    sitemap: `${COMPANY.url}/sitemap.xml`,
  };
}
