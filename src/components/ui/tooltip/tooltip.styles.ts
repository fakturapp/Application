import { tv, type VariantProps } from "tailwind-variants";

export const tooltipVariants = tv({
  slots: {
    base: "tooltip app-overlay-surface app-overlay-surface--tooltip",
    trigger: "tooltip__trigger",
  },
});

export type TooltipVariants = VariantProps<typeof tooltipVariants>;
