import { MetadataRoute } from "next";
import { problems } from "@/data/problems";
import { contests } from "@/data/contests";
import { topics } from "@/data/community";

const BASE_URL = "https://logicofthecosmos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE_URL}/problems`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/contests`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/community`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  const problemPages = problems.map((p) => ({
    url: `${BASE_URL}/problems/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const contestPages = contests.map((c) => ({
    url: `${BASE_URL}/contests/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const topicPages = topics.map((t) => ({
    url: `${BASE_URL}/community/${t.id}`,
    lastModified: new Date(t.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...problemPages, ...contestPages, ...topicPages];
}
