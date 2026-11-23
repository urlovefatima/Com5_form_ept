import type { BudgetType } from "./types";

export function budgetLabel(type: BudgetType, amount?: string | null) {
  switch (type) {
    case "none": return "Sans budget";
    case "unknown": return "Je ne sais pas";
    case "amount": return amount ? `${amount} FCFA` : "Montant non précisé";
    default: return "Non renseigné";
  }
}

export function formatDate(iso: string | Date, withTime = true) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Dakar",
  }).format(d);
}

export function authorLabel(p: { isAnonymous: boolean; fullName: string | null }) {
  return p.isAnonymous || !p.fullName ? "Contribution anonyme" : p.fullName;
}
