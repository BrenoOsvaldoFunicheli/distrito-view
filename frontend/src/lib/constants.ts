export const ROLE_COLORS: Record<string, string> = {
  "Engenharia AI": "bg-purple-100 text-purple-800",
  "Engenharia AI FC": "bg-violet-100 text-violet-800",
  "Engenharia Dados": "bg-blue-100 text-blue-800",
  "Engenharia Software": "bg-green-100 text-green-800",
  "Engenharia Software FC": "bg-emerald-100 text-emerald-800",
  "Arquiteto Solucoes": "bg-orange-100 text-orange-800",
  "Ciencia de Dados": "bg-cyan-100 text-cyan-800",
  "Designer": "bg-pink-100 text-pink-800",
  "Product Management": "bg-amber-100 text-amber-800",
};

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export const CLIENT_COLORS = [
  "#4F46E5",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#2563EB",
  "#DB2777",
  "#0891B2",
  "#65A30D",
  "#EA580C",
  "#4338CA",
  "#0D9488",
  "#CA8A04",
  "#9333EA",
  "#E11D48",
  "#0284C7",
  "#16A34A",
  "#C2410C",
  "#6D28D9",
  "#0E7490",
];

export function getClientColor(clientName: string): string {
  let hash = 0;
  for (let i = 0; i < clientName.length; i++) {
    hash = clientName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}
