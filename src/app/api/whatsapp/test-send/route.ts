export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { getActiveTenant } from "@/lib/store";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp-api";
import {
  checkGlobalDailyCap,
  checkIpRateLimit,
  checkPhoneRateLimit,
  verifyTurnstileToken,
} from "@/lib/rate-limiter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      toPhone,
      recipientName = "Brian",
      eventTitle = "Nairobi Real Estate & Passive Income Masterclass",
      templateName = "event_registration_confirmed",
      turnstileToken,
    } = body;

    const normalized = normalizeKenyanPhone(toPhone);
    if (!normalized) {
      return NextResponse.json(
        { error: "Please enter a valid Kenyan phone number (e.g. 0712 345 678)" },
        { status: 400 }
      );
    }

    const { tenant } = await getActiveTenant();

    // 1. Extract Real Client IP (from Cloudflare or proxy headers)
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1";

    // 2. Cloudflare Turnstile Invisible Bot Challenge Verification
    const turnstileCheck = await verifyTurnstileToken(
      turnstileToken,
      clientIp
    );
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { error: turnstileCheck.error || "Bot verification failed" },
        { status: 403 }
      );
    }

    // 3. Strict IP Rate Limit: Max 3 test requests per hour per IP
    const ipCheck = await checkIpRateLimit(clientIp);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many test requests from your network. Please try again in an hour or proceed to set up your webinar.",
        },
        { status: 429 }
      );
    }

    const previewText = `Hi ${recipientName} 👋 You're confirmed for *${eventTitle}*, Sat 7:00 PM EAT.\n\nI'll remind you before we start and drop your direct join link right here on WhatsApp. Reply 1 to confirm you're coming!`;
    const senderLabel =
      tenant.waba_status === "connected" && tenant.display_phone_number
        ? tenant.display_phone_number
        : "+254 727 838624 (Eris Engineering)";

    // 4. Per-Phone Capping: Max 1 message per phone number per 24 hours
    const phoneCheck = await checkPhoneRateLimit(normalized);
    if (!phoneCheck.allowed) {
      return NextResponse.json({
        success: true,
        toPhoneE164: normalized,
        wamid: `wamid.CAPPED_24H_${Date.now()}`,
        simulated: true,
        capped: true,
        previewText,
        senderLabel,
        message: `You already received a live test on +${normalized} today! Here is your interactive preview:`,
      });
    }

    // 5. Global Daily Safety Cap: Max 50 live test messages per day system-wide
    const dailyCapCheck = await checkGlobalDailyCap();
    if (!dailyCapCheck.allowed) {
      return NextResponse.json({
        success: true,
        toPhoneE164: normalized,
        wamid: `wamid.GLOBAL_CAP_REACHED_${Date.now()}`,
        simulated: true,
        globalCapReached: true,
        previewText,
        senderLabel,
        message: `Today's free live demonstration limit has been reached (50/50 sent). Showing your interactive preview below:`,
      });
    }

    // 6. Proceed to send live WhatsApp message
    const sharedPhoneId =
      process.env.SHOWUP_SHARED_PHONE_NUMBER_ID || "1017704028092663";
    const sharedToken = process.env.SHOWUP_SHARED_ACCESS_TOKEN || "";

    const hasOwnLiveToken =
      tenant.waba_status === "connected" &&
      Boolean(tenant.phone_number_id) &&
      Boolean(tenant.access_token) &&
      !tenant.access_token?.startsWith("demo_");

    const effectivePhoneNumberId =
      (hasOwnLiveToken ? tenant.phone_number_id : null) ||
      sharedPhoneId ||
      "demo_phone_id";
    const effectiveAccessToken =
      (hasOwnLiveToken ? tenant.access_token : null) ||
      sharedToken ||
      "demo_access_token";

    const bodyVariables =
      templateName === "hello_world"
        ? []
        : [recipientName, eventTitle, "Saturday, 14 Nov", "7:00 PM"];

    const result = await sendWhatsAppTemplateMessage({
      phoneNumberId: effectivePhoneNumberId,
      accessToken: effectiveAccessToken,
      toPhoneE164: normalized,
      templateName,
      languageCode: templateName === "hello_world" ? "en_US" : "en",
      bodyVariables,
    });

    if (!result.success) {
      const isPending =
        result.metaErrorCode === 132001 ||
        result.metaErrorCode === 131058 ||
        result.error?.includes("132001") ||
        result.error?.includes("does not exist");

      if (isPending) {
        return NextResponse.json(
          {
            error: `Template '${templateName}' is still awaiting Meta approval on Eris Engineering (+254 727 838624). Please retry in a few minutes.`,
            metaErrorCode: result.metaErrorCode,
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: result.error || "Meta Cloud API rejected test send", raw: result.raw },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      toPhoneE164: normalized,
      wamid: result.wamid,
      simulated: result.simulated,
      previewText,
      senderLabel,
      message: result.simulated
        ? `Test reminder sent to +${normalized} via ShowUp Verified Number`
        : `Live WhatsApp reminder delivered to +${normalized} via Meta Cloud API!`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Test send failed" },
      { status: 500 }
    );
  }
}

