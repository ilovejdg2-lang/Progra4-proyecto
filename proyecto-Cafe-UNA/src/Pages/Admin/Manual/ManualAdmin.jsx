import { useMemo } from "react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { ManualContenido } from "../../../Components/Manual/ManualContenido";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { SECCIONES_MANUAL } from "../../../lib/manualAdmin";
import { rolesDeUsuario } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";
import { AdminLayout } from "../layouts/AdminLayout";

export default function ManualAdmin() {
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/ajustes/manual", true);

  const secciones = useMemo(() => {
    const roles = rolesDeUsuario(getActiveSessionUser());
    return SECCIONES_MANUAL.filter((s) => s.visible(roles));
  }, []);

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <ManualContenido
          secciones={secciones}
          carpetaFotos="admin"
          lead="Guía rápida de cada parte del panel. Solo aparecen los módulos a los que tenés acceso."
          buscarPlaceholder="Buscar en la ayuda (por ejemplo: categoría, venta, permisos)"
        />
      </AdminLayout>
    </AdminPageGate>
  );
}
