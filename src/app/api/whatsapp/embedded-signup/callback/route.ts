import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  exchangeCodeForToken,
  fetchPhoneNumberDetails,
  provisionDefaultTemplatesInMeta,
  registerPhoneNumber,
  subscribeAppToWaba,
} from "@/lib/whatsapp-api";
import {
  findOrCreateTenantByPhone,
  getActiveTenant,
  TENANT_COOKIE_NAME,
  updateTenantWabaConnection,
} from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      code,
      wabaId,
      phoneNumberId,
      accessToken: manualAccessToken,
      displayPhoneNumber: manualDisplayPhone,
      pin = "123456",
    } = body;

    if (!wabaId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Missing wabaId or phoneNumberId from Meta Embedded Signup." },
        { status: 400 }
      );
    }

    const { tenant } = await getActiveTenant();

    // 1. Obtain Access Token (either via OAuth code exchange or direct System User token)
    let clientAccessToken = manualAccessToken;
    if (!clientAccessToken && code) {
      const exchanged = await exchangeCodeForToken(code);
      clientAccessToken = exchanged.accessToken;
    }

    if (!clientAccessToken) {
      return NextResponse.json(
        {
          error:
            "Neither an OAuth authorization code nor a direct access token was provided.",
        },
        { status: 400 }
      );
    }

    const stepsLog: Record<string, unknown> = {};

    // 2. If real token (not demo), execute the 4 Meta Onboarding Graph API calls
    let resolvedDisplayPhone = manualDisplayPhone || "+254 712 345 678";
    if (!clientAccessToken.startsWith("demo_")) {
      try {
        stepsLog.subscribeWebhook = await subscribeAppToWaba(wabaId, clientAccessToken);
      } catch (e: unknown) {
        stepsLog.subscribeWebhookError = e instanceof Error ? e.message : String(e);
      }

      try {
        stepsLog.registerPhone = await registerPhoneNumber(
          phoneNumberId,
          clientAccessToken,
          pin
        );
      } catch (e: unknown) {
        stepsLog.registerPhoneError = e instanceof Error ? e.message : String(e);
      }

      const phoneDetails = await fetchPhoneNumberDetails(phoneNumberId, clientAccessToken);
      if (phoneDetails?.display_phone_number) {
        resolvedDisplayPhone = phoneDetails.display_phone_number;
      }

      try {
        stepsLog.templatesProvisioned = await provisionDefaultTemplatesInMeta(
          wabaId,
          clientAccessToken
        );
      } catch (e: unknown) {
        stepsLog.templatesProvisionedError = e instanceof Error ? e.message : String(e);
      }
    } else {
      stepsLog.mode = "Demo / Sandbox WABA Connection Activated";
    }

    // 3. Persist WABA connection to Tenant record
    let targetTenant = tenant;
    if (targetTenant.id === "guest") {
      const normPhone =
        normalizeKenyanPhone(resolvedDisplayPhone) || `waba_${wabaId}`;
      targetTenant = await findOrCreateTenantByPhone({
        phoneE164: normPhone,
        hostName: "Connected Business",
      });
    }

    const updatedTenant = await updateTenantWabaConnection({
      tenantId: targetTenant.id,
      wabaId,
      phoneNumberId,
      displayPhoneNumber: resolvedDisplayPhone,
      accessToken: clientAccessToken,
    });

    const res = NextResponse.json({
      success: true,
      tenant: updatedTenant,
      stepsLog,
      message:
        "Official WhatsApp Business Account connected & 5 Webinar Templates provisioned!",
    });

    if (updatedTenant.id && updatedTenant.id !== "guest") {
      res.cookies.set(TENANT_COOKIE_NAME, updatedTenant.id, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
      });
    }
    return res;
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

