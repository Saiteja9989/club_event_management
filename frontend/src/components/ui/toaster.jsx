import { useToast } from "./useToast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={`w-[320px] rounded-lg border p-4 shadow-lg bg-white dark:bg-gray-900 ${
            variant === "destructive"
              ? "border-red-500"
              : "border-border"
          }`}
        >
          <div className="flex justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{title}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(id)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
