import { tv, type VariantProps } from "tailwind-variants";

export const popoverVariants = tv({
  slots: {
    base: "popover app-overlay-surface",
    dialog: "popover__dialog",
    heading: "popover__heading",
    trigger: "popover__trigger",
  },
});

export type PopoverVariants = VariantProps<typeof popoverVariants>;
