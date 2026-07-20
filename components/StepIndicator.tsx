const STEPS = ["Size", "Your Info", "Contract", "Payment", "Location"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mx-auto mb-8 flex max-w-2xl items-center">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-red text-white"
                    : isActive
                      ? "bg-navy text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                className={`hidden text-[11px] font-medium sm:block ${
                  isActive ? "text-navy" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {stepNum < STEPS.length && (
              <div
                className={`mx-1.5 h-0.5 flex-1 sm:mx-2.5 ${isDone ? "bg-red" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
