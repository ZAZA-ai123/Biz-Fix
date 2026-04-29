import type { EngineQuote } from "./types";

type QuoteDocumentInput = Omit<EngineQuote, "document">;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function leadTimeSummary(quote: QuoteDocumentInput): string {
  if (quote.items.length === 0) {
    return "Lead times to be confirmed once approved product lines are finalized.";
  }

  const maxLeadTime = quote.items.reduce(
    (longest, item) => Math.max(longest, item.leadTimeDays),
    0
  );

  return maxLeadTime > 0
    ? `Estimated lead time is up to ${maxLeadTime} business days from order release, subject to vendor confirmation.`
    : "Lead times are subject to vendor confirmation at order release.";
}

export function buildQuoteDocument(quote: QuoteDocumentInput) {
  const projectLabel = quote.projectType
    ? `${quote.projectType} project`
    : "proposed project";
  const clientLabel = quote.customerName?.trim() || "the client";

  const scopeOfWork =
    quote.items.length > 0
      ? quote.items.map(
          (item) =>
            `Supply ${item.quantity} x ${item.name} (${item.sku}) from ${item.vendor} at ${formatCurrency(item.sellPrice)} per unit.`
        )
      : ["No priced line items have been approved yet."];

  const commercialTerms = [
    `Quoted subtotal: ${formatCurrency(quote.subtotal)} across ${quote.items.length} line item${quote.items.length === 1 ? "" : "s"}.`,
    leadTimeSummary(quote),
    "Pricing excludes taxes, freight, installation, site prep, and permit-related costs unless explicitly stated.",
    "Final procurement remains subject to product availability and written approval of any substitutions.",
  ];

  const assumptions =
    quote.assumptions.length > 0
      ? quote.assumptions
      : ["Pricing is based on the current catalog and standard commercial assumptions."];

  return {
    title: `Quote Proposal - ${clientLabel}`,
    summary: `Commercial proposal for ${clientLabel} covering the ${projectLabel}.`,
    scopeOfWork,
    commercialTerms,
    assumptions,
    exclusions: [
      "Any on-site labor, installation, demolition, or disposal services not expressly listed.",
      "Permit, inspection, engineering, and compliance fees unless specifically included.",
      "Scope changes requested after approval may require repricing and schedule updates.",
    ],
    acceptance:
      "Acceptance of this quote confirms the commercial scope above and authorizes the team to proceed with final order coordination.",
  };
}

export function attachQuoteDocument(quote: QuoteDocumentInput): EngineQuote {
  return {
    ...quote,
    document: buildQuoteDocument(quote),
  };
}
