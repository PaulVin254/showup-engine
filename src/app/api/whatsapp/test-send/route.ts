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

    const bodyVariables =
      templateName === "hello_world"
        ? []
        : [recipientName, eventTitle, "Saturday, 14 Nov", "7:00 PM"];

    const result = await sendWhatsAppTemplateMessage({
      phoneNumberId: tenant.phone_number_id || "demo_phone_id",
      accessToken: tenant.access_token || "demo_access_token",
      toPhoneE164: normalized,
      templateName,
      languageCode: templateName === "hello_world" ? "en_US" : "en",
      bodyVariables,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      toPhoneE164: normalized,
      wamid: result.wamid,
      simulated: result.simulated,
      message: result.simulated
        ? `Simulated WhatsApp template '${templateName}' to +${normalized} (Connect live WABA token to deliver to physical handset)`
        : `Live WhatsApp template '${templateName}' dispatched to +${normalized} via Meta Cloud API!`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Test send failed" },
      { status: 500 }
    );
  }
}

