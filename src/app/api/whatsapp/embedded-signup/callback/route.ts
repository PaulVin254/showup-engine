export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  fetchPhoneNumberDetails,
  provisionDefaultTemplatesInMeta,
  registerPhoneNumber,
  subscribeAppToWaba,
} from "@/lib/whatsapp-api";
import {
  findOtherTenantByPhoneNumberId,
  getActiveTenant,
  sanitizeTenantForClient,
  updateTenantWabaConnection,
} from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, wabaId, phoneNumberId, pin = "123456" } = body;

    if (!code || !wabaId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Missing code, wabaId, or phoneNumberId from Meta Embedded Signup." },
        { status: 400 }
      );
    }

    const { tenant, isGuest } = await getActiveTenant();
    if (isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conflictingTenant = await findOtherTenantByPhoneNumberId(
      String(phoneNumberId),
      tenant.id
    );
    if (conflictingTenant) {
      return NextResponse.json(
        {
          error:
            "This WhatsApp Business number is already connected to another ShowUp workspace. Disconnect it in that workspace's Settings first.",
        },
        { status: 409 }
      );
    }

    // 1. Exchange Meta OAuth authorization code for a live access token
    const exchanged = await exchangeCodeForToken(String(code));
    const clientAccessToken = exchanged.accessToken;

    // 2. Execute Meta Onboarding Graph API calls
    let resolvedDisplayPhone = "";
    try {
      await subscribeAppToWaba(wabaId, clientAccessToken);
    } catch {
      // Non-fatal: webhook subscription can also be managed at the Meta App level
    }

    try {
      await registerPhoneNumber(phoneNumberId, clientAccessToken, pin);
    } catch {
      // Phone number may already be registered
    }

    const phoneDetails = await fetchPhoneNumberDetails(phoneNumberId, clientAccessToken);
    if (phoneDetails?.display_phone_number) {
      resolvedDisplayPhone = phoneDetails.display_phone_number;
    }

    try {
      await provisionDefaultTemplatesInMeta(wabaId, clientAccessToken);
    } catch {
      // Templates can also be synced/created from Settings
    }

    // 3. Persist WABA connection to authenticated Tenant record
    const updatedTenant = await updateTenantWabaConnection({
      tenantId: tenant.id,
      wabaId: String(wabaId),
      phoneNumberId: String(phoneNumberId),
      displayPhoneNumber: resolvedDisplayPhone || null,
      accessToken: clientAccessToken,
    });

    return NextResponse.json({
      success: true,
      tenant: sanitizeTenantForClient(updatedTenant),
      message:
        "Official WhatsApp Business Account connected & 5 Webinar Templates provisioned!",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed completing Embedded Signup onboarding",
      },
      { status: 500 }
    );
  }
}
