import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/pricing";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/commercial", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/commercial/login", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${COMPANY.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
