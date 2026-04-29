import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getQuoteById } from "@/lib/db/quote-redis";
import { getCompanySettings } from "@/lib/db/settings-redis";
import { getRedis } from "@/lib/db/redis";
import { keys } from "@/lib/db/redis-keys";
import { attachQuoteDocument } from "@/lib/engine/quote-document";
import type { EngineQuote } from "@/lib/engine/types";
import { PrintToolbar } from "./print-toolbar";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const dateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const paymentTermsLabel: Record<string, string> = {
  due_on_receipt: "Due on receipt",
  net15: "Net 15",
  net30: "Net 30",
  net45: "Net 45",
  net60: "Net 60",
};

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const row = await getQuoteById(id, userId);
  if (!row || !row.enginePayload) notFound();

  let engineQuote: EngineQuote;
  try {
    engineQuote = attachQuoteDocument(JSON.parse(row.enginePayload) as EngineQuote);
  } catch {
    notFound();
  }

  const [settings, companyHash] = await Promise.all([
    getCompanySettings(userId),
    getRedis().hgetall<Record<string, string>>(keys.company(userId)),
  ]);

  const businessName =
    settings.general.businessName ||
    companyHash?.name ||
    "Your Business";
  const logoDataUrl = companyHash?.logoDataUrl || "";
  const taxRate = Number(settings.quotes.taxRate || 0);
  const taxAmount = engineQuote.subtotal * (taxRate / 100);
  const totalWithTax = engineQuote.subtotal + taxAmount;
  const expiresAt =
    row.expiresAt ||
    new Date(
      new Date(row.createdAt).getTime() +
        settings.quotes.expiryDays * 86400000
    ).toISOString();

  return (
    <>
      <style>{printCss}</style>
      <PrintToolbar />
      <main className="quote-doc">
        <header className="quote-header">
          <div className="quote-header__brand">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt={businessName} className="quote-logo" />
            ) : (
              <div className="quote-logo-placeholder">
                {businessName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="quote-business-name">{businessName}</div>
              {settings.general.businessAddress && (
                <div className="quote-business-meta">{settings.general.businessAddress}</div>
              )}
              <div className="quote-business-meta">
                {[settings.general.businessEmail, settings.general.businessPhone]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
          <div className="quote-meta">
            <div className="quote-meta__label">Quote</div>
            <div className="quote-meta__id">#{row.id}</div>
            <div className="quote-meta__row">
              <span>Issued</span>
              <span>{dateLong(row.createdAt)}</span>
            </div>
            <div className="quote-meta__row">
              <span>Valid until</span>
              <span>{dateLong(expiresAt)}</span>
            </div>
            <div className="quote-meta__row">
              <span>Status</span>
              <span className="quote-status">{row.status}</span>
            </div>
          </div>
        </header>

        <section className="quote-section quote-billto">
          <div>
            <div className="quote-section__label">Prepared for</div>
            <div className="quote-billto__name">{row.clientName}</div>
            {engineQuote.projectType && (
              <div className="quote-billto__project">
                {engineQuote.projectType} project
                {engineQuote.positioning ? ` · ${engineQuote.positioning} tier` : ""}
              </div>
            )}
          </div>
          {engineQuote.document?.summary && (
            <div className="quote-summary">{engineQuote.document.summary}</div>
          )}
        </section>

        <section className="quote-section">
          <table className="quote-table">
            <thead>
              <tr>
                <th className="quote-th-num">#</th>
                <th>Item</th>
                <th className="quote-th-num">Qty</th>
                <th className="quote-th-num">Unit</th>
                <th className="quote-th-num">Total</th>
              </tr>
            </thead>
            <tbody>
              {engineQuote.items.map((item, idx) => (
                <tr key={`${item.productId}-${idx}`}>
                  <td className="quote-td-num">{idx + 1}</td>
                  <td>
                    <div className="quote-item-name">{item.name}</div>
                    <div className="quote-item-meta">
                      SKU {item.sku} · {item.vendor} · {item.tier} tier
                    </div>
                  </td>
                  <td className="quote-td-num">{item.quantity}</td>
                  <td className="quote-td-num">{money(item.sellPrice)}</td>
                  <td className="quote-td-num">{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="quote-totals">
          <div className="quote-totals__row">
            <span>Subtotal</span>
            <span>{money(engineQuote.subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div className="quote-totals__row">
              <span>Tax ({taxRate.toFixed(2)}%)</span>
              <span>{money(taxAmount)}</span>
            </div>
          )}
          <div className="quote-totals__row quote-totals__total">
            <span>Total</span>
            <span>{money(totalWithTax)}</span>
          </div>
        </section>

        {engineQuote.document?.scopeOfWork?.length ? (
          <section className="quote-section quote-terms">
            <h2>Scope of work</h2>
            <ul>
              {engineQuote.document.scopeOfWork.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {engineQuote.document?.commercialTerms?.length ? (
          <section className="quote-section quote-terms">
            <h2>Commercial terms</h2>
            <ul>
              {engineQuote.document.commercialTerms.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
              <li>
                Payment terms: {paymentTermsLabel[settings.quotes.paymentTerms] ?? "Net 30"}
              </li>
            </ul>
          </section>
        ) : null}

        {engineQuote.assumptions?.length ? (
          <section className="quote-section quote-terms">
            <h2>Assumptions</h2>
            <ul>
              {engineQuote.assumptions.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {engineQuote.document?.exclusions?.length ? (
          <section className="quote-section quote-terms">
            <h2>Exclusions</h2>
            <ul>
              {engineQuote.document.exclusions.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="quote-acceptance">
          <h2>Acceptance</h2>
          <p>
            {engineQuote.document?.acceptance ??
              "Sign and return this quote to confirm acceptance."}
          </p>
          <div className="quote-sign-grid">
            <div className="quote-sign-block">
              <div className="quote-sign-line" />
              <div className="quote-sign-label">Authorized signature</div>
            </div>
            <div className="quote-sign-block">
              <div className="quote-sign-line" />
              <div className="quote-sign-label">Date</div>
            </div>
          </div>
        </section>

        <footer className="quote-footer">
          {businessName} · Generated by Biz-Fix
        </footer>
      </main>
    </>
  );
}

const printCss = `
  @page { size: A4; margin: 18mm 16mm; }
  html, body { background: #f4f4f5; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #18181b; }
  .print-hide { }
  @media print {
    html, body { background: #ffffff; }
    .print-hide { display: none !important; }
    .quote-doc { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
    .quote-section, .quote-totals, .quote-terms, .quote-acceptance { page-break-inside: avoid; }
    .quote-table thead { display: table-header-group; }
    .quote-table tr { page-break-inside: avoid; }
  }
  .quote-doc {
    max-width: 880px;
    margin: 32px auto;
    padding: 56px 56px 64px;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 24px 48px -24px rgba(15, 23, 42, 0.18);
    line-height: 1.55;
  }
  .quote-header {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    align-items: flex-start;
    border-bottom: 1px solid #e4e4e7;
    padding-bottom: 28px;
  }
  .quote-header__brand { display: flex; gap: 16px; align-items: center; min-width: 0; }
  .quote-logo { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; background: #f4f4f5; }
  .quote-logo-placeholder {
    width: 56px; height: 56px; border-radius: 12px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-weight: 700; letter-spacing: 0.04em;
  }
  .quote-business-name { font-size: 18px; font-weight: 700; color: #09090b; }
  .quote-business-meta { font-size: 12px; color: #71717a; margin-top: 2px; }
  .quote-meta { text-align: right; min-width: 220px; }
  .quote-meta__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #71717a; }
  .quote-meta__id { font-size: 22px; font-weight: 700; color: #09090b; margin-top: 2px; }
  .quote-meta__row {
    display: flex; justify-content: space-between; gap: 16px;
    font-size: 12px; color: #3f3f46; margin-top: 6px;
  }
  .quote-status { text-transform: capitalize; font-weight: 600; color: #2563eb; }

  .quote-section { margin-top: 32px; }
  .quote-section__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #71717a; margin-bottom: 6px; }
  .quote-billto { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; }
  .quote-billto__name { font-size: 20px; font-weight: 700; color: #09090b; }
  .quote-billto__project { font-size: 13px; color: #52525b; margin-top: 2px; }
  .quote-summary { max-width: 380px; font-size: 13px; color: #3f3f46; text-align: right; }

  .quote-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .quote-table thead th {
    text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    color: #71717a; padding: 10px 12px; border-bottom: 1px solid #e4e4e7;
  }
  .quote-th-num { text-align: right; }
  .quote-table tbody td { padding: 14px 12px; border-bottom: 1px solid #f4f4f5; vertical-align: top; }
  .quote-td-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .quote-item-name { font-weight: 600; color: #18181b; }
  .quote-item-meta { font-size: 12px; color: #71717a; margin-top: 2px; }

  .quote-totals { margin-top: 24px; margin-left: auto; max-width: 320px; }
  .quote-totals__row {
    display: flex; justify-content: space-between; padding: 8px 0;
    font-size: 14px; color: #3f3f46;
  }
  .quote-totals__total {
    border-top: 2px solid #18181b; margin-top: 8px; padding-top: 14px;
    font-size: 18px; font-weight: 700; color: #09090b;
  }

  .quote-terms h2, .quote-acceptance h2 {
    font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;
    color: #71717a; margin-bottom: 10px; font-weight: 600;
  }
  .quote-terms ul { margin: 0; padding-left: 20px; font-size: 13px; color: #3f3f46; }
  .quote-terms li { margin-bottom: 6px; }

  .quote-acceptance { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e4e4e7; }
  .quote-acceptance p { font-size: 13px; color: #3f3f46; margin: 0 0 24px; }
  .quote-sign-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; }
  .quote-sign-line { border-bottom: 1px solid #18181b; height: 36px; }
  .quote-sign-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-top: 6px; }

  .quote-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #f4f4f5; font-size: 11px; color: #a1a1aa; text-align: center; }
`;
