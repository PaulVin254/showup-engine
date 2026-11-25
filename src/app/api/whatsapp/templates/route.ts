export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  DEFAULT_WEBINAR_TEMPLATES,
  buildExampleValuesForBody,
  seedSystemTemplatesForTenant,
} from "@/lib/default-templates";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import { createCustomMetaTemplate, fetchMetaWabaTemplates } from "@/lib/whatsapp-api";
import { SequenceStage, ShowUpTemplate } from "@/lib/types";

interface MetaRemoteTemplate {
  id: string;
  name: string;
  status: string;
  category?: string;
  language?: string;
  components?: Array<{ type: string; text?: string }>;
}

function mapMetaStatus(raw: string): "APPROVED" | "PENDING" | "REJECTED" {
  if (raw === "APPROVED") return "APPROVED";
  if (raw === "REJECTED") return "REJECTED";
  return "PENDING";
}

function buildRemoteTemplateInsert(tenantId: string, remote: MetaRemoteTemplate, bodyText: string): ShowUpTemplate {
  const defaultMatch = DEFAULT_WEBINAR_TEMPLATES.find((d) => d.name === remote.name);
  return {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    meta_template_id: remote.id,
    name: remote.name,
    category: remote.category === "MARKETING" ? "MARKETING" : "UTILITY",
    language: remote.language || "en",
    status: mapMetaStatus(remote.status),
    stage_default: defaultMatch?.stage ?? "custom",
    body_text: bodyText,
    button_type: defaultMatch?.button_type ?? "NONE",
    button_text: defaultMatch?.button_text ?? null,
    button_url_pattern: defaultMatch?.button_url_pattern ?? null,
    variables_schema: defaultMatch?.variables_schema ?? [],
    is_system_default: Boolean(defaultMatch),
    created_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const { tenant, isGuest } = await getActiveTenant();
    if (isGuest) {
      return NextResponse.json(
        { error: "Sign in to submit message templates." },
        { status: 401 }
      );
    }
    const supabaseReady = await checkSupabaseMigrationStatus();
    const hasLiveWaba = Boolean(
      tenant.waba_id &&
        tenant.access_token &&
        !tenant.access_token.startsWith("demo_")
    );

    let syncedFromMeta = false;
    let syncError: string | undefined;

    if (supabaseReady && supabase) {
      // Ensure tenant has system templates seeded before syncing Meta statuses
      const { data: existingRows } = await supabase
        .from("showup_templates")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true });

      let currentRows = (existingRows || []) as ShowUpTemplate[];
      if (currentRows.length === 0) {
        const defaults = seedSystemTemplatesForTenant(tenant.id).map(
          ({ id: _unused, ...rest }) => rest
        );
        await supabase
          .from("showup_templates")
          .upsert(defaults, { onConflict: "tenant_id,name,language" });

        const { data: seeded } = await supabase
          .from("showup_templates")
          .select("*")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: true });
        currentRows = (seeded || []) as ShowUpTemplate[];
      }

      if (hasLiveWaba && tenant.waba_id && tenant.access_token) {
        try {
          const metaTemplates = (await fetchMetaWabaTemplates(
            tenant.waba_id,
            tenant.access_token
          )) as MetaRemoteTemplate[];

          for (const remote of metaTemplates) {
            const mappedStatus = mapMetaStatus(remote.status);
            const lang = remote.language || "en";
            const existing = currentRows.find(
              (t) => t.name === remote.name && t.language === lang
            ) || currentRows.find((t) => t.name === remote.name);

            if (existing) {
              await supabase
                .from("showup_templates")
                .update({
                  status: mappedStatus,
                  meta_template_id: remote.id,
                })
                .eq("id", existing.id);
            } else {
              const bodyComp = remote.components?.find((c) => c.type === "BODY");
              if (bodyComp?.text) {
                const newRow = buildRemoteTemplateInsert(tenant.id, remote, bodyComp.text);
                await supabase
                  .from("showup_templates")
                  .upsert(newRow, { onConflict: "tenant_id,name,language" });
              }
            }
          }
          syncedFromMeta = true;
        } catch (err) {
          syncError = err instanceof Error ? err.message : "Could not sync from Meta";
          console.warn("Could not sync live WABA templates to Supabase:", err);
        }
      }

      const { data: refreshed } = await supabase
        .from("showup_templates")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        templates: refreshed || currentRows,
        syncedFromMeta,
        wabaConnected: hasLiveWaba,
        ...(syncError ? { syncError } : {}),
      });
    }

    const db = readLocalDb();
    if (!db.templates.some((t) => t.tenant_id === tenant.id)) {
      db.templates.push(...seedSystemTemplatesForTenant(tenant.id));
      writeLocalDb(db);
    }

    if (hasLiveWaba && tenant.waba_id && tenant.access_token) {
      try {
        const metaTemplates = (await fetchMetaWabaTemplates(
          tenant.waba_id,
          tenant.access_token
        )) as MetaRemoteTemplate[];

        for (const remote of metaTemplates) {
          const bodyComp = remote.components?.find((c) => c.type === "BODY");
          const existingIdx = db.templates.findIndex(
            (t) => t.tenant_id === tenant.id && t.name === remote.name
          );
          const mappedStatus = mapMetaStatus(remote.status);

          if (existingIdx >= 0) {
            db.templates[existingIdx].status = mappedStatus;
            db.templates[existingIdx].meta_template_id = remote.id;
          } else if (bodyComp?.text) {
            db.templates.push(buildRemoteTemplateInsert(tenant.id, remote, bodyComp.text));
          }
        }
        writeLocalDb(db);
        syncedFromMeta = true;
      } catch (err) {
        syncError = err instanceof Error ? err.message : "Could not sync from Meta";
        console.warn("Could not sync live WABA templates, returning cached list:", err);
      }
    }

    return NextResponse.json({
      templates: db.templates.filter((t) => t.tenant_id === tenant.id),
      syncedFromMeta,
      wabaConnected: hasLiveWaba,
      ...(syncError ? { syncError } : {}),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed loading templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      category = "UTILITY",
      language = "en",
      stageDefault = "custom",
      bodyText,
      variablesSchema = [],
      exampleValues = [],
    } = body;

    if (!name || !bodyText) {
      return NextResponse.json(
        { error: "Template name and bodyText are required" },
        { status: 400 }
      );
    }

    const { tenant, isGuest } = await getActiveTenant();
    if (isGuest) {
      return NextResponse.json(
        { error: "Sign in to submit message templates." },
        { status: 401 }
      );
    }
    const supabaseReady = await checkSupabaseMigrationStatus();

    const cleanName = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_");

    const normalizedExamples = buildExampleValuesForBody(
      String(bodyText),
      Array.isArray(exampleValues) ? exampleValues.map(String) : undefined
    );

    let metaId = `local_${Date.now()}`;
    let status: "APPROVED" | "PENDING" | "REJECTED" = "PENDING";

    // Submit to live Meta WABA if connected with real credentials
    if (
      tenant.waba_id &&
      tenant.access_token &&
      !tenant.access_token.startsWith("demo_")
    ) {
      const metaCreated = await createCustomMetaTemplate({
        wabaId: tenant.waba_id,
        accessToken: tenant.access_token,
        name: cleanName,
        category,
        language,
        bodyText,
        exampleValues: normalizedExamples,
      });
      metaId = metaCreated.id;
      status = metaCreated.status;
    }

    const newTemplate: ShowUpTemplate = {
      id: crypto.randomUUID(),
      tenant_id: tenant.id,
      meta_template_id: metaId,
      name: cleanName,
      category: category === "MARKETING" ? "MARKETING" : "UTILITY",
      language,
      status,
      stage_default: stageDefault as SequenceStage | "custom",
      body_text: bodyText,
      button_type: "NONE",
      button_text: null,
      button_url_pattern: null,
      variables_schema: Array.isArray(variablesSchema) ? variablesSchema : [],
      is_system_default: false,
      created_at: new Date().toISOString(),
    };

    if (supabaseReady && supabase) {
      const { data, error } = await supabase
        .from("showup_templates")
        .upsert(newTemplate, { onConflict: "tenant_id,name,language" })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ template: data, submittedToMeta: metaId });
    }

    const db = readLocalDb();
    const existingIdx = db.templates.findIndex(
      (t) => t.tenant_id === tenant.id && t.name === cleanName && t.language === language
    );
    if (existingIdx >= 0) {
      db.templates[existingIdx] = newTemplate;
    } else {
      db.templates.push(newTemplate);
    }
    writeLocalDb(db);

    return NextResponse.json({ template: newTemplate, submittedToMeta: metaId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed creating template" },
      { status: 500 }
    );
  }
}
