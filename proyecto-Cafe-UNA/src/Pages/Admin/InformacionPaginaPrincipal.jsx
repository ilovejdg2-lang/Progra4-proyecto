import { AdminLayout } from "../../layouts/AdminLayout";

const AdminInformacionPaginaPrincipal = () => {
  return (
    <AdminLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Informacion pagina principal</h1>
        <p className="mt-4 text-slate-600">Esta es la pagina de informacion pagina principal.</p>
      </section>
    </AdminLayout>
  );
};

export default AdminInformacionPaginaPrincipal;
