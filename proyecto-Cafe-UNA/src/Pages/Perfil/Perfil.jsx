import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PerfilClienteLayout } from "../../Components/Perfil/PerfilClienteLayout";
import { PerfilContent } from "../../Components/Perfil/PerfilContent";
import { getActiveSessionUser } from "../../services/sessionService";

function Perfil() {
  const navigate = useNavigate();
  const sessionUser = getActiveSessionUser();

  useEffect(() => {
    if (!sessionUser) {
      sessionStorage.setItem("postLoginRedirect", "/perfil");
      navigate({ to: "/login" });
      return;
    }

    if (sessionUser.role === "admin") {
      navigate({ to: "/admin/perfil", replace: true });
    }
  }, [navigate, sessionUser]);

  if (!sessionUser || sessionUser.role === "admin") {
    return null;
  }

  return (
    <PerfilClienteLayout>
      <PerfilContent variant="standalone" />
    </PerfilClienteLayout>
  );
}

export default Perfil;
