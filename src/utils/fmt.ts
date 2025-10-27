export const money = (v: string | number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(
    typeof v === "string" ? parseFloat(v) : v
  );
