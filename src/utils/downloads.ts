export async function downloadBlobFromGet(url: string, filename: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
    },
  });
  if (!res.ok) throw new Error("No se pudo descargar el archivo.");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
