import { getRedis } from "./redis";
import { keys } from "./redis-keys";

export type GeneralSettings = {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
};

export type QuoteDefaults = {
  expiryDays: number;
  taxRate: number;
  paymentTerms: "due_on_receipt" | "net15" | "net30" | "net45" | "net60";
  quotePrefix: string;
  autoNumbering: boolean;
};

export type NotificationPrefs = {
  accepted: boolean;
  expired: boolean;
  lowStock: boolean;
  vendor: boolean;
  weekly: boolean;
};

export type CompanySettings = {
  general: GeneralSettings;
  quotes: QuoteDefaults;
  notifications: NotificationPrefs;
};

export const DEFAULT_SETTINGS: CompanySettings = {
  general: {
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
  },
  quotes: {
    expiryDays: 30,
    taxRate: 0,
    paymentTerms: "net30",
    quotePrefix: "QT-",
    autoNumbering: true,
  },
  notifications: {
    accepted: true,
    expired: true,
    lowStock: true,
    vendor: false,
    weekly: true,
  },
};

type SettingsHash = {
  general?: string;
  quotes?: string;
  notifications?: string;
  updatedAt?: string;
};

function safeParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...fallback, ...parsed } as T;
  } catch {
    return fallback;
  }
}

export async function getCompanySettings(uid: string): Promise<CompanySettings> {
  const redis = getRedis();
  const raw = await redis.hgetall<SettingsHash>(keys.companySettings(uid));
  if (!raw) return DEFAULT_SETTINGS;
  return {
    general: safeParse(raw.general, DEFAULT_SETTINGS.general),
    quotes: safeParse(raw.quotes, DEFAULT_SETTINGS.quotes),
    notifications: safeParse(raw.notifications, DEFAULT_SETTINGS.notifications),
  };
}

export async function setCompanySettings(
  uid: string,
  partial: Partial<CompanySettings>
): Promise<CompanySettings> {
  const current = await getCompanySettings(uid);
  const merged: CompanySettings = {
    general: { ...current.general, ...(partial.general ?? {}) },
    quotes: { ...current.quotes, ...(partial.quotes ?? {}) },
    notifications: { ...current.notifications, ...(partial.notifications ?? {}) },
  };
  const update: Record<string, string> = { updatedAt: new Date().toISOString() };
  if (partial.general) update.general = JSON.stringify(merged.general);
  if (partial.quotes) update.quotes = JSON.stringify(merged.quotes);
  if (partial.notifications) update.notifications = JSON.stringify(merged.notifications);

  const redis = getRedis();
  await redis.hset(keys.companySettings(uid), update);
  return merged;
}
