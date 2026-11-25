export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  disconnectTenantWaba,
  getActiveTenant,
  sanitizeTenantForClient,
} from "@/lib/store";

export async function POST() {
  try {
    const { tenant, isGuest } = await getActiveTenant();
    if (isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await disconnectTenantWaba(tenant.id);
    return NextResponse.json({
      success: true,
      tenant: sanitizeTenantForClient(updated || tenant),
      message: "WhatsApp Business disconnected. Events will use the shared ShowUp number.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed disconnecting WhatsApp Business" },
      { status: 500 }
    );
  }
}
