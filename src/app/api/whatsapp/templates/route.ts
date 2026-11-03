import { NextResponse } from "next/server";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import { createCustomMetaTemplate, fetchMetaWabaTemplates } from "@/lib/whatsapp-api";
import { SequenceStage, ShowUpTemplate } from "@/lib/types";

export async function GET() {
  try {
    const { tenant } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();

    // If tenant has a live WABA token, sync status from Meta Graph API
    if (
      tenant.waba_id &&
      tenant.access_token &&
      !tenant.access_token.startsWith("demo_")
    ) {
      try {
        const metaTemplates = await fetchMetaWabaTemplates(
          tenant.waba_id,
          tenant.access_token
        );

        const db = readLocalDb();
        for (const remote of metaTemplates) {
          const bodyComp = remote.components?.find(
            (c: { type: string }) => c.type === "BODY"
          );
          const existingIdx = db.templates.findIndex((t) => t.name === remote.name);
          const mappedStatus: "APPROVED" | "PENDING" | "REJECTED" =
            remote.status === "APPROVED"
              ? "APPROVED"
              : remote.status === "REJECTED"
                ? "REJECTED"
                : "PENDING";

          if (existingIdx >= 0) {
            db.templates[existingIdx].status = mappedStatus;
            db.templates[existingIdx].meta_template_id = remote.id;
          } else if (bodyComp?.text) {
            db.templates.push({
              id: `tpl-meta-${remote.id}`,
              tenant_id: tenant.id,
              meta_template_id: remote.id,
              name: remote.name,
              category: remote.category === "MARKETING" ? "MARKETING" : "UTILITY",
              language: remote.language || "en",
              status: mappedStatus,
              stage_default: "custom",
              body_text: bodyComp.text,
              button_type: "NONE",
              variables_schema: [],
              is_system_default: false,
              created_at: new Date().toISOString(),
            });
          }
        }
        writeLocalDb(db);
      } catch (syncErr) {
        console.warn("Could not sync live WABA templates, returning cached list:", syncErr);
      }
    }

    if (supabaseReady && supabase) {
      const { data } = await supabase
        .from("showup_templates")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true });
      return NextResponse.json({ templates: data || [] });
    }

    const db = readLocalDb();
    return NextResponse.json({ templates: db.templates });
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

    const { tenant } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();

    const cleanName = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_");

    let metaId = `local_${Date.now()}`;
    let status: "APPROVED" | "PENDING" | "REJECTED" = "APPROVED";

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
        exampleValues,
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
    db.templates.push(newTemplate);
    writeLocalDb(db);

    return NextResponse.json({ template: newTemplate, submittedToMeta: metaId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed creating template" },
      { status: 500 }
    );
  }
}

