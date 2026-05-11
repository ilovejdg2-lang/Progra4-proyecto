import { useState } from "react";
import "./SolicitarVoluntariado.css";

const SolicitarVoluntariado = () => {
    const [form, setForm] = useState({
        nombre: "",
        email: "",
        telefono: "",
        tipoActividad: "",
        disponibilidad: "",
        documentos: ""
    });

    const [mensaje, setMensaje] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const nuevaSolicitud = {
            ...form,
            estado: "pendiente"
        };

        const solicitudesGuardadas =
            JSON.parse(localStorage.getItem("solicitudes")) || [];

        localStorage.setItem(
            "solicitudes",
            JSON.stringify([...solicitudesGuardadas, nuevaSolicitud])
        );

        setMensaje("Solicitud enviada correctamente ✅");

        setForm({
            nombre: "",
            email: "",
            telefono: "",
            tipoActividad: "",
            disponibilidad: "",
            documentos: ""
        });
    };

    return (
        <div className="voluntariado-page">
            <div className="voluntariado-card">
                <h2>Solicitud de Voluntariado</h2>

                <form className="voluntariado-form" onSubmit={handleSubmit}>
                    <label>Nombre completo</label>
                    <input
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                    />

                    <label>Correo electrónico</label>
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Teléfono</label>
                    <input
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                    />

                    <label>Tipo de actividad</label>
                    <input
                        name="tipoActividad"
                        value={form.tipoActividad}
                        onChange={handleChange}
                    />

                    <label>Disponibilidad</label>
                    <input
                        name="disponibilidad"
                        value={form.disponibilidad}
                        onChange={handleChange}
                    />

                    <label>Documentos</label>
                    <input
                        name="documentos"
                        value={form.documentos}
                        onChange={handleChange}
                    />

                    {mensaje && <div className="voluntariado-success">{mensaje}</div>}

                    <button type="submit" className="voluntariado-button">
                        Enviar solicitud
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SolicitarVoluntariado;