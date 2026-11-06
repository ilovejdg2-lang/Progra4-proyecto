import { afterEach, describe, expect, it, vi } from "vitest";

import { createWindowEventSubscribe } from "./windowEventStore";

describe("createWindowEventSubscribe", () => {
  afterEach(() => vi.restoreAllMocks());

  it("registers one window listener per event and removes it with the last subscriber", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const subscribe = createWindowEventSubscribe(["a-event", "b-event"]);

    const unsubscribers = Array.from({ length: 5 }, () => subscribe(() => {}));
    expect(add.mock.calls.filter(([type]) => type === "a-event" || type === "b-event")).toHaveLength(2);

    unsubscribers.slice(0, 4).forEach((off) => off());
    expect(remove.mock.calls.filter(([type]) => type === "a-event")).toHaveLength(0);
    unsubscribers[4]();
    expect(remove.mock.calls.filter(([type]) => type === "a-event")).toHaveLength(1);
  });

  it("runs beforeNotify once, then notifies every subscriber", () => {
    const order = [];
    const subscribe = createWindowEventSubscribe(["c-event"], { beforeNotify: () => order.push("before") });
    const offs = [subscribe(() => order.push("one")), subscribe(() => order.push("two"))];

    window.dispatchEvent(new Event("c-event"));
    expect(order).toEqual(["before", "one", "two"]);

    offs.forEach((off) => off());
    window.dispatchEvent(new Event("c-event"));
    expect(order).toHaveLength(3);
  });
});
