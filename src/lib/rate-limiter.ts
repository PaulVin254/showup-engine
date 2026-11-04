import { checkSupabaseMigrationStatus, supabase } from "./store";

interface MemoryLimitRecord {
  count: number;
  expiresAt: number;
}

// In-memory fallback cache (per container process)
const memoryStore = new Map<string, MemoryLimitRecord>();

function cleanExpiredMemoryRecords() {
  const now = Date.now();
  memoryStore.forEach((record, key) => {
    if (record.expiresAt < now) {
      memoryStore.delete(key);
    }
  });
}

/**
 * Validates Cloudflare Turnstile token if TURNSTILE_SECRET_KEY is configured.
 * If keys are not configured, gracefully permits the request.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  clientIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // Graceful rollout: if keys aren't configured yet, bypass
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: "Missing bot verification token. Please refresh the page.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        error: "Bot verification challenge failed. Please reload and try again.",
      };
    }

    return { success: true };
  } catch {
    // If Cloudflare verify endpoint fails, permit gracefully
    return { success: true };
  }
}

/**
 * Checks and increments a rate limit key.
 * Returns { allowed: boolean, count: number, remaining: number }
 */
async function checkAndIncrementLimit(params: {
  key: string;
  maxCount: number;
  windowMs: number;
}): Promise<{ allowed: boolean; count: number }> {
  const now = Date.now();
  const expiresAtDate = new Date(now + params.windowMs);
  cleanExpiredMemoryRecords();

  const supabaseReady = await checkSupabaseMigrationStatus();

  if (supabaseReady && supabase) {
    try {
      const { data: existing } = await supabase
        .from("showup_rate_limits")
        .select("count, expires_at")
        .eq("key", params.key)
        .maybeSingle();

      if (existing) {
        const isExpired = new Date(existing.expires_at).getTime() < now;
        if (isExpired) {
          // Reset window
          await supabase
            .from("showup_rate_limits")
            .update({
              count: 1,
              window_start: new Date(now).toISOString(),
              expires_at: expiresAtDate.toISOString(),
            })
            .eq("key", params.key);
          return { allowed: true, count: 1 };
        }

        if (existing.count >= params.maxCount) {
          return { allowed: false, count: existing.count };
        }

        // Increment count
        const newCount = existing.count + 1;
        await supabase
          .from("showup_rate_limits")
          .update({
            count: newCount,
          })
          .eq("key", params.key);
        return { allowed: true, count: newCount };
      }

      // First time insert
      await supabase.from("showup_rate_limits").insert({
        key: params.key,
        count: 1,
        window_start: new Date(now).toISOString(),
        expires_at: expiresAtDate.toISOString(),
      });
      return { allowed: true, count: 1 };
    } catch {
      // Fallback to memoryStore below
    }
  }

  // In-memory sliding window fallback
  const record = memoryStore.get(params.key);
  if (record && record.expiresAt > now) {
    if (record.count >= params.maxCount) {
      return { allowed: false, count: record.count };
    }
    record.count += 1;
    return { allowed: true, count: record.count };
  }

  memoryStore.set(params.key, {
    count: 1,
    expiresAt: now + params.windowMs,
  });
  return { allowed: true, count: 1 };
}

/**
 * 1. IP Rate Limit: Max 3 test sends per hour per IP.
 */
export async function checkIpRateLimit(
  clientIp: string
): Promise<{ allowed: boolean }> {
  const cleanIp = clientIp.replace(/[^a-zA-Z0-9.:_-]/g, "").slice(0, 45);
  const key = `ip_limit:${cleanIp}`;
  const res = await checkAndIncrementLimit({
    key,
    maxCount: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  });
  return { allowed: res.allowed };
}

/**
 * 2. Per-Phone Capping: Max 1 message per phone number per 24 hours.
 */
export async function checkPhoneRateLimit(
  phoneE164: string
): Promise<{ allowed: boolean }> {
  const key = `phone_limit:${phoneE164}`;
  const res = await checkAndIncrementLimit({
    key,
    maxCount: 1,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  });
  return { allowed: res.allowed };
}

/**
 * 3. Global Daily Safety Cap: Max 50 live messages per day system-wide.
 */
export async function checkGlobalDailyCap(): Promise<{ allowed: boolean }> {
  // Day key in East Africa Time (UTC+3)
  const eatDate = new Date(Date.now() + 3 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const key = `global_daily_cap:${eatDate}`;
  const res = await checkAndIncrementLimit({
    key,
    maxCount: 50,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  });
  return { allowed: res.allowed };
}
