import { useCallback, useRef, useState } from "react";

type Props = {
  /** Tipos aceptados (por defecto: cualquier imagen) */
  accept?: string;
  /** Permitir múltiples archivos (por defecto: false) */
  multiple?: boolean;
  /** Callback cuando hay archivo(s) */
  onFile: (file: File | File[]) => void;
  /** Texto opcional del botón */
  buttonLabel?: string;
  /** Texto de ayuda opcional */
  hint?: string;
};

export default function FileDropzone({
  accept = "image/*",
  multiple = false,
  onFile,
  buttonLabel = "Examinar",
  hint = "Selecciona o arrastra una imagen (JPG, PNG, WEBP, HEIC, GIF, etc.)",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const arr = Array.from(files);
      setFileName(arr[0]?.name ?? "");
      onFile(multiple ? arr : arr[0]);
    },
    [multiple, onFile]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={onDrop}
      className="rounded border border-dashed p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-gray-600">
          {hint}
          {fileName && (
            <div className="mt-1 text-gray-800">
              <span className="font-medium">{fileName}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
