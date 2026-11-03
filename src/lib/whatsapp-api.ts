import { DEFAULT_WEBINAR_TEMPLATES } from "./default-templates";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface SendTemplateMessageInput {
  phoneNumberId: string;
  accessToken: string;
  toPhoneE164: string;
  templateName: string;
  languageCode?: string;
  bodyVariables: string[];
  buttonUrlSuffix?: string;
}

export interface SendTemplateMessageResult {
  success: boolean;
  wamid?: string;
  simulated?: boolean;
  error?: string;
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

  if (input.bodyVariables.length > 0) {
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

