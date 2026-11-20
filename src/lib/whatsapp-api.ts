import { DEFAULT_WEBINAR_TEMPLATES } from "./default-templates";
import { SenderMode, ShowUpTenant } from "./types";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface SendTemplateMessageInput {
  phoneNumberId: string;
  accessToken: string;
  toPhoneE164: string;
  templateName: string;
  languageCode?: string;
  bodyVariables?: string[];
  namedVariables?: Record<string, string>;
  buttonUrlSuffix?: string;
}

export interface SendTemplateMessageResult {
  success: boolean;
  wamid?: string;
  simulated?: boolean;
  error?: string;
  metaErrorCode?: number;
  metaErrorSubcode?: number;
  raw?: unknown;
}

/**
 * 1. Exchange OAuth authorization code from Meta Embedded Signup for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  raw: unknown;
}> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "Missing NEXT_PUBLIC_META_APP_ID or META_APP_SECRET in .env.local. Add them to complete live OAuth code exchange."
    );
  }

  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(data?.error?.message || "Failed to exchange Meta authorization code for token");
  }

  return {
    accessToken: data.access_token as string,
    raw: data,
  };
}

/**
 * 2. Subscribe our Tech Provider App to the client's WABA webhooks
 */
export async function subscribeAppToWaba(wabaId: string, accessToken: string) {
  const res = await fetch(`${GRAPH_BASE}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

/**
 * 3. Register the client's WhatsApp Phone Number on Cloud API
 */
export async function registerPhoneNumber(
  phoneNumberId: string,
  accessToken: string,
  pin = "123456"
) {
  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin,
    }),
  });
  return res.json();
}

/**
 * 4. Fetch display phone number details from Meta Graph API
 */
export async function fetchPhoneNumberDetails(phoneNumberId: string, accessToken: string) {
  try {
    const res = await fetch(
      `${GRAPH_BASE}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 5. Auto-provision the 5 Standardized Webinar Templates into the client's WABA
 */
export async function provisionDefaultTemplatesInMeta(wabaId: string, accessToken: string) {
  const results: Array<{ name: string; status: string; metaId?: string; error?: string }> = [];

  for (const tpl of DEFAULT_WEBINAR_TEMPLATES) {
    try {
      const components: Array<Record<string, unknown>> = [
        {
          type: "BODY",
          text: tpl.body_text,
          example: {
            body_text: [tpl.example_values],
          },
        },
      ];

      if (tpl.button_type === "QUICK_REPLY" && tpl.button_text) {
        components.push({
          type: "BUTTONS",
          buttons: [
            {
              type: "QUICK_REPLY",
              text: tpl.button_text,
            },
          ],
        });
      }

      const res = await fetch(`${GRAPH_BASE}/${wabaId}/message_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tpl.name,
          category: tpl.category,
          language: tpl.language,
          components,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        results.push({
          name: tpl.name,
          status: data.status || "PENDING",
          metaId: data.id,
        });
      } else {
        results.push({
          name: tpl.name,
          status: "EXISTING_OR_PENDING",
          error: data?.error?.message,
        });
      }
    } catch (err: unknown) {
      results.push({
        name: tpl.name,
        status: "ERROR",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * 6. Sync all message templates from the client's WABA
 */
export async function fetchMetaWabaTemplates(wabaId: string, accessToken: string) {
  const res = await fetch(
    `${GRAPH_BASE}/${wabaId}/message_templates?fields=id,name,status,category,language,components&limit=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to fetch templates from Meta WABA");
  }
  return data.data || [];
}

/**
 * 7. Submit a new custom template from Template Studio to Meta WABA
 */
export async function createCustomMetaTemplate(params: {
  wabaId: string;
  accessToken: string;
  name: string;
  category: "UTILITY" | "MARKETING";
  language: string;
  bodyText: string;
  exampleValues: string[];
}) {
  const cleanName = params.name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_");

  const components: Array<Record<string, unknown>> = [
    {
      type: "BODY",
      text: params.bodyText,
      ...(params.exampleValues.length > 0
        ? { example: { body_text: [params.exampleValues] } }
        : {}),
    },
  ];

  const res = await fetch(`${GRAPH_BASE}/${params.wabaId}/message_templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: cleanName,
      category: params.category,
      language: params.language || "en",
      components,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Meta rejected custom template creation");
  }
  return {
    id: data.id as string,
    status: (data.status as "APPROVED" | "PENDING" | "REJECTED") || "PENDING",
    cleanName,
  };
}

/**
 * 8. Send a WhatsApp Template Message via Meta Cloud API
 */
export async function sendWhatsAppTemplateMessage(
  input: SendTemplateMessageInput
): Promise<SendTemplateMessageResult> {
  // If tenant hasn't connected a real token yet or is using demo mode, simulate cleanly
  if (
    !input.phoneNumberId ||
    !input.accessToken ||
    input.accessToken.startsWith("demo_") ||
    input.phoneNumberId.startsWith("demo_")
  ) {
    return {
      success: true,
      simulated: true,
      wamid: `wamid.SIMULATED_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  const components: Array<Record<string, unknown>> = [];

  if (input.namedVariables && Object.keys(input.namedVariables).length > 0) {
    components.push({
      type: "body",
      parameters: Object.entries(input.namedVariables).map(([paramName, val]) => ({
        type: "text",
        parameter_name: paramName,
        text: String(val),
      })),
    });
  } else if (input.bodyVariables && input.bodyVariables.length > 0) {
    components.push({
      type: "body",
      parameters: input.bodyVariables.map((val) => ({
        type: "text",
        text: String(val),
      })),
    });
  }

  if (input.buttonUrlSuffix) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        {
          type: "text",
          text: input.buttonUrlSuffix,
        },
      ],
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: input.toPhoneE164,
    type: "template",
    template: {
      name: input.templateName,
      language: {
        code: input.languageCode || "en",
      },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  try {
    const res = await fetch(`${GRAPH_BASE}/${input.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message || `Meta API HTTP ${res.status}`,
        metaErrorCode:
          typeof data?.error?.code === "number" ? data.error.code : undefined,
        metaErrorSubcode:
          typeof data?.error?.error_subcode === "number"
            ? data.error.error_subcode
            : undefined,
        raw: data,
      };
    }

    const wamid = data?.messages?.[0]?.id;
    return {
      success: true,
      simulated: false,
      wamid,
      raw: data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error calling Meta Graph API",
    };
  }
}

function isTemplateUnavailableError(res: SendTemplateMessageResult): boolean {
  const code = res.metaErrorCode;
  if (code === 132001 || code === 131058 || code === 132015) return true;
  const msg = res.error?.toLowerCase() || "";
  return (
    msg.includes("132001") ||
    msg.includes("131058") ||
    msg.includes("does not exist") ||
    msg.includes("template is paused")
  );
}

/**
 * 9. Send a 6-digit Host Login OTP via Meta's official AUTHENTICATION template
 * on the verified shared Eris Engineering WhatsApp number.
 * Never falls back to unrelated utility/marketing templates.
 */
export async function sendWhatsAppOtpMessage(params: {
  toPhoneE164: string;
  otpCode: string;
  templateName?: string;
  languageCode?: string;
}): Promise<SendTemplateMessageResult> {
  const sharedPhoneId =
    process.env.SHOWUP_SHARED_PHONE_NUMBER_ID || "1017704028092663";
  const sharedToken =
    process.env.SHOWUP_SHARED_ACCESS_TOKEN || "demo_access_token";
  const templateName =
    params.templateName ||
    process.env.SHOWUP_OTP_TEMPLATE_NAME ||
    "showup_host_otp";
  const languageCode = params.languageCode || "en";

  return sendWhatsAppTemplateMessage({
    phoneNumberId: sharedPhoneId,
    accessToken: sharedToken,
    toPhoneE164: params.toPhoneE164,
    templateName,
    languageCode,
    bodyVariables: [params.otpCode],
  });
}

export interface SmartDispatchInput {
  tenant: ShowUpTenant;
  senderMode?: SenderMode;
  toPhoneE164: string;
  templateName: string;
  languageCode?: string;
  bodyVariables?: string[];
  namedVariables?: Record<string, string>;
  buttonUrlSuffix?: string;
  recipientFirstName?: string;
}

export interface SmartDispatchResult extends SendTemplateMessageResult {
  senderUsed: "own_waba" | "shared_showup";
  fellBackFromOwnWaba?: boolean;
  ownWabaError?: string;
}

/**
 * 10. Smart Hybrid WhatsApp Router:
 * - Attempts Host's Own WABA first when `senderMode === 'own_waba'` and WABA is connected.
 * - Falls back to Verified Shared ShowUp Number (Eris Engineering) ONLY when the host's
 *   own template is still PENDING/missing in Meta (not on invalid recipient or token/billing errors).
 * - Never silently substitutes unrelated templates.
 */
export async function dispatchSmartWhatsAppMessage(
  input: SmartDispatchInput
): Promise<SmartDispatchResult> {
  const {
    tenant,
    senderMode = "shared_showup",
    toPhoneE164,
    templateName,
    languageCode = "en",
    bodyVariables,
    namedVariables,
    buttonUrlSuffix,
  } = input;

  const sharedPhoneId =
    process.env.SHOWUP_SHARED_PHONE_NUMBER_ID || "1017704028092663";
  const sharedToken =
    process.env.SHOWUP_SHARED_ACCESS_TOKEN || "demo_access_token";

  const wantsOwnWaba =
    senderMode === "own_waba" &&
    tenant.waba_status === "connected" &&
    Boolean(tenant.phone_number_id) &&
    Boolean(tenant.access_token) &&
    !tenant.access_token?.startsWith("demo_");

  let ownWabaError: string | undefined;

  // 1. Try Host's Own WABA first if selected & connected
  if (wantsOwnWaba && tenant.phone_number_id && tenant.access_token) {
    const ownRes = await sendWhatsAppTemplateMessage({
      phoneNumberId: tenant.phone_number_id,
      accessToken: tenant.access_token,
      toPhoneE164,
      templateName,
      languageCode,
      bodyVariables,
      namedVariables,
      buttonUrlSuffix,
    });

    if (ownRes.success) {
      return {
        ...ownRes,
        senderUsed: "own_waba",
      };
    }

    // Only fall back to Shared ShowUp Number if the host's template isn't approved yet.
    // Surface token expiry, billing errors, or invalid recipient errors directly.
    if (!isTemplateUnavailableError(ownRes)) {
      return {
        ...ownRes,
        senderUsed: "own_waba",
        ownWabaError: ownRes.error,
      };
    }

    ownWabaError = ownRes.error;
  }

  // 2. Dispatch via Verified Shared ShowUp Number (Eris Engineering)
  const sharedRes = await sendWhatsAppTemplateMessage({
    phoneNumberId: sharedPhoneId,
    accessToken: sharedToken,
    toPhoneE164,
    templateName,
    languageCode,
    bodyVariables,
    namedVariables,
    buttonUrlSuffix,
  });

  return {
    ...sharedRes,
    senderUsed: "shared_showup",
    fellBackFromOwnWaba: wantsOwnWaba,
    ownWabaError,
  };
}


