"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function DropdownMenu(props) {
  return <DropdownMenuPrimitive.Root {...props} />;
}

export function DropdownMenuTrigger(props) {
  return <DropdownMenuPrimitive.Trigger {...props} />;
}

export function DropdownMenuContent({ className, sideOffset = 8, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[60] min-w-48 rounded-md border border-slate-200 bg-white p-1 text-sm text-slate-900 shadow-lg",
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
        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 outline-none hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
