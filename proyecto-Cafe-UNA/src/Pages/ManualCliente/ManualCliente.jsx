import { ManualContenido } from "../../Components/Manual/ManualContenido";
import { PerfilClienteLayout } from "../../Components/Perfil/PerfilClienteLayout";
import { SECCIONES_MANUAL_CLIENTE } from "../../lib/manualCliente";

export default function ManualCliente() {
  return (
    <PerfilClienteLayout>
      <ManualContenido
        secciones={SECCIONES_MANUAL_CLIENTE}
        carpetaFotos="cliente"
        lead="Guía rápida para comprar, enviar solicitudes y administrar tu cuenta."
        buscarPlaceholder="Buscar en la ayuda (por ejemplo: comprar, donar, contraseña)"
      />
    </PerfilClienteLayout>
  );
}
