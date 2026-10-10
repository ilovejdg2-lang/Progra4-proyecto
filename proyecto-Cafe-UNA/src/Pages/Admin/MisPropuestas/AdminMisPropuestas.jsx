import { useParams } from "@tanstack/react-router";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { MisPropuestasContent } from "../../Productores/MisPropuestas";
import { AdminLayout } from "../layouts/AdminLayout";

export default function AdminMisPropuestas() {
  const { propuestaId = "" } = useParams({ strict: false });
  const ruta = propuestaId ? `/admin/mis-propuestas/${propuestaId}` : "/admin/mis-propuestas";
  const { showLoading, loadingMessage } = useAdminPageGate(ruta, true);
  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <MisPropuestasContent variant="admin" propuestaId={propuestaId} />
      </AdminLayout>
    </AdminPageGate>
  );
}
