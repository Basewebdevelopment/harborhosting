export const PLANS = {
  starter: {
    name: "Starter",
    monthlyPrice: 5.99,
    annualPrice: 59.9,
    storage: "10 GB SSD",
    websites: "1 website",
    features: [
      "10 GB SSD storage",
      "1 website",
      "Free SSL certificate",
      "10 email accounts",
      "Weekly backups",
      "24/7 chat support",
    ],
  },
  growth: {
    name: "Growth",
    monthlyPrice: 14.99,
    annualPrice: 149.9,
    storage: "50 GB SSD",
    websites: "10 websites",
    features: [
      "50 GB SSD storage",
      "10 websites",
      "Free SSL & global CDN",
      "Unlimited email accounts",
      "Daily backups",
      "Free domain for 1 year",
    ],
  },
  business: {
    name: "Business",
    monthlyPrice: 34.99,
    annualPrice: 349.9,
    storage: "200 GB NVMe",
    websites: "Unlimited websites",
    features: [
      "200 GB NVMe storage",
      "Unlimited websites",
      "Free SSL, CDN & firewall",
      "Hourly backups",
      "Dedicated support manager",
      "Staging environments",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
