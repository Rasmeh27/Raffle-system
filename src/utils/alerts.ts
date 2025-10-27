import Swal from 'sweetalert2';

const baseConfig = {
  background: '#1f2937', // gris oscuro
  color: '#fff',         // texto blanco
  confirmButtonColor: '#ef4444', // rojo (tailwind: red-500)
  cancelButtonColor: '#6b7280',  // gris (tailwind: gray-500)
};

export function showSuccess(message: string) {
  Swal.fire({
    title: '¡Éxito!',
    text: message,
    icon: 'success',
    ...baseConfig
  });
}

export function showError(message: string) {
  Swal.fire({
    title: 'Error',
    text: message,
    icon: 'error',
    ...baseConfig
  });
}

export function showLoading(message: string) {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading(null);
    },
    ...baseConfig
  });
}
