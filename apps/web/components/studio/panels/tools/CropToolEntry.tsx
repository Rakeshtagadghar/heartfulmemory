"use client";

export function CropToolEntry({ active }: { active: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white/90">Crop</p>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/55">
          image
        </span>
      </div>
      <p className="mt-1 text-xs leading-4 text-white/55">
        {active ? "Crop mode is active. Use the Crop panel to apply, reset, or cancel." : "Double-click an image or frame-filled image to start cropping."}
      </p>
    </div>
  );
}
