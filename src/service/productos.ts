import { http } from "./Http";
import type { Producto } from "../utils/types";

export async function productosDisponibles() {
  const { data } = await http.get("/productos/disponibles");
  return data as Producto[];
}

// ADMIN (protegido)
export async function adminCrearProducto(p: {
  nombre: string;
  descripcion?: string;
  imagen: File; // desde dispositivo
}) {
  const fd = new FormData();
  fd.set("nombre", p.nombre);
  if (p.descripcion) fd.set("descripcion", p.descripcion);
  fd.set("imagen", p.imagen);
  const { data } = await http.post("/admin/productos", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as Producto;
}

export async function adminListarProductos() {
  const { data } = await http.get("/admin/productos");
  return data as Producto[];
}

export async function adminActualizarProducto(id: number, p: {
  nombre: string;
  descripcion?: string;
  imagen?: File | null; // opcional
}) {
  const fd = new FormData();
  fd.set("nombre", p.nombre);
  if (p.descripcion) fd.set("descripcion", p.descripcion);
  if (p.imagen) fd.set("imagen", p.imagen);
  const { data } = await http.put(`/admin/productos/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as Producto;
}

export async function adminEliminarProducto(id: number) {
  const { data } = await http.delete(`/admin/productos/${id}`);
  return data as { msg: string };
}
