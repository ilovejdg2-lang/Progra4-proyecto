import { describe, expect, it } from "vitest";

import {
  partitionNotificationsByFeature,
  resolveProposalNotificationDestination,
} from "./notificationDestination";

describe("resolveProposalNotificationDestination", () => {
  it("routes inventory exit request links to the admin request list and preserves the request anchor", () => {
    expect(resolveProposalNotificationDestination("/admin/salidas-inventario#solicitud-2")).toEqual({
      to: "/admin/salidas-inventario",
      hash: "solicitud-2",
    });
  });

  it("keeps admin proposal links on the admin proposal detail route", () => {
    expect(resolveProposalNotificationDestination("/admin/propuestas/42")).toEqual({
      to: "/admin/propuestas/$propuestaId",
      params: { propuestaId: "42" },
    });
  });

  it("keeps producer proposal links on the profile proposal detail route", () => {
    expect(resolveProposalNotificationDestination("/perfil/propuestas/42")).toEqual({
      to: "/perfil/propuestas/$propuestaId",
      params: { propuestaId: "42" },
    });
  });
});

describe("partitionNotificationsByFeature", () => {
  it("keeps inventory-exit notifications out of the producer category", () => {
    const inventoryRequest = { id: 2, tipo: "salida_solicitud" };
    const inventoryStatus = { id: 3, tipo: "salida_estado" };
    const producerProposal = { id: 4, tipo: "propuesta_nueva" };

    expect(partitionNotificationsByFeature([inventoryRequest, inventoryStatus, producerProposal])).toEqual({
      inventoryExits: [inventoryRequest, inventoryStatus],
      producers: [producerProposal],
    });
  });
});
