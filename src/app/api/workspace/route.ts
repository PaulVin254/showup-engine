export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  getActiveTenant,
  sanitizeTenantForClient,
  updateTenantProfile,
} from "@/lib/store";

export async function PATCH(req: Request) {
  try {
    const { tenant, isGuest } = await getActiveTenant();
    if (isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { businessName, phone } = body as {
      businessName?: unknown;
      phone?: unknown;
    };

    const updates: { business_name?: string; phone_e164?: string } = {};

    if (businessName !== undefined) {
      const cleanName = String(businessName).trim();
      if (!cleanName || cleanName.length > 120) {
        return NextResponse.json(
          { error: "Business / host name must be between 1 and 120 characters." },
          { status: 400 }
        );
      }
      updates.business_name = cleanName;
    }

    if (phone !== undefined) {
      const rawPhone = String(phone).trim();
      if (!rawPhone) {
        updates.phone_e164 = "";
      } else {
        const normalized = normalizeKenyanPhone(rawPhone);
        if (!normalized) {
          return NextResponse.json(
            { error: "Enter a valid Kenyan WhatsApp / M-Pesa phone number (e.g. 0712 345 678)." },
            { status: 400 }
          );
        }
        updates.phone_e164 = normalized;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        tenant: sanitizeTenantForClient(tenant),
      });
    }

    const updated = await updateTenantProfile(tenant.id, updates);
    return NextResponse.json({
      success: true,
      tenant: sanitizeTenantForClient(updated || tenant),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed updating workspace settings" },
      { status: 500 }
    );
  }
}
