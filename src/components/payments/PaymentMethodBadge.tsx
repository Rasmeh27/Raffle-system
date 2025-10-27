import type { PaymentMethod } from "../../utils/types";

export default function PaymentMethodBadge({ m } : { m: PaymentMethod }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <span className="font-medium">{m.label}</span>
            <span className="text-xs text-gray-500">{m.type}</span>
            {m.monedas_aceptadas?.length ? (
                <span className="ml-2 text-xs text-gray-400">. {m.monedas_aceptadas.join("/")}</span>
            ) : null}
        </div>
    );
}