import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { getActiveTenant } from "@/lib/store";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      toPhone,
      recipientName = "Brian",
      eventTitle = "Nairobi Real Estate & Passive Income Masterclass",
      templateName = "event_registration_confirmed",
    } = body;

    const normalized = normalizeKenyanPhone(toPhone);
    if (!normalized) {
      return NextResponse.json(
        { error: "Please enter a valid Kenyan phone number (e.g. 0712 345 678)" },
        { status: 400 }
      );
    }

    const { tenant } = await getActiveTenant();

    const sharedPhoneId = process.env.SHOWUP_SHARED_PHONE_NUMBER_ID || "";
    const sharedToken = process.env.SHOWUP_SHARED_ACCESS_TOKEN || "";

    const effectivePhoneNumberId =
      tenant.phone_number_id || sharedPhoneId || "demo_phone_id";
    const effectiveAccessToken =
      tenant.access_token || sharedToken || "demo_access_token";

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
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 400 });
    }

    const previewText = `Hi ${recipientName} 👋 You're confirmed for *${eventTitle}*, Sat 7:00 PM EAT.\n\nI'll remind you before we start and drop your direct join link right here on WhatsApp. Reply 1 to confirm you're coming!`;

    return NextResponse.json({
      success: true,
      toPhoneE164: normalized,
      wamid: result.wamid,
      simulated: result.simulated,
      previewText,
      senderLabel:
        tenant.waba_status === "connected" && tenant.display_phone_number
          ? tenant.display_phone_number
          : "ShowUp Verified Number (+254 712 345 678)",
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

