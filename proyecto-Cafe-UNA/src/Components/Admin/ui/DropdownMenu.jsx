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
          "z-[60] min-w-48 rounded-md border border-slate-200 bg-white p-1 text-sm text-slate-900 shadow-lg outline-none",
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
        "flex cursor-pointer items-center gap-2 px-2 py-1.5 outline-none hover:bg-transparent hover:text-slate-950 data-[highlighted]:bg-transparent data-[highlighted]:text-slate-950",
        className,
      )}
      {...props}
    />
  );
}
