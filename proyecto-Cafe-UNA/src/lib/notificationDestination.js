export function resolveProposalNotificationDestination(rawLink) {
  const link = String(rawLink || "");
  const inventoryRequest = link.match(/^\/admin\/salidas-inventario#(solicitud-\d+)$/);
  if (inventoryRequest) {
    return {
      to: "/admin/salidas-inventario",
      hash: inventoryRequest[1],
    };
  }

  const id = link.split("/").filter(Boolean).pop()?.split(/[?#]/, 1)[0];
  if (!id) return null;

  if (link.startsWith("/admin/propuestas/")) {
    return { to: "/admin/propuestas/$propuestaId", params: { propuestaId: id } };
  }

  return { to: "/perfil/propuestas/$propuestaId", params: { propuestaId: id } };
}

export function partitionNotificationsByFeature(notifications) {
  return (Array.isArray(notifications) ? notifications : []).reduce(
    (groups, notification) => {
      const type = String(notification?.tipo || "").toLowerCase();
      if (type === "salida_solicitud" || type === "salida_estado") {
        groups.inventoryExits.push(notification);
      } else {
        groups.producers.push(notification);
      }
      return groups;
    },
    { inventoryExits: [], producers: [] },
  );
}
