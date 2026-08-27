"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function DropdownMenu({ modal = false, ...props }) {
  return <DropdownMenuPrimitive.Root modal={modal} {...props} />;
}

export function DropdownMenuTrigger(props) {
  return <DropdownMenuPrimitive.Trigger {...props} />;
}

export function DropdownMenuContent({ className, sideOffset = 8, onCloseAutoFocus, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onCloseAutoFocus?.(event);
        }}
        className={cn(
          "z-[100] min-w-48 rounded-[var(--ui-radius)] border border-neutral-900 bg-white p-1 text-sm text-neutral-950 shadow-lg outline-none",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 outline-none hover:bg-neutral-950 hover:text-white data-[highlighted]:bg-neutral-950 data-[highlighted]:text-white",
        className,
      )}
      {...props}
    />
  );
}
