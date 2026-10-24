import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { PagoVentaPresencial } from "./PagoVentaPresencial";

const METODOS = ["Efectivo", "efectivo", "Tarjeta", "SINPE Móvil", "Transferencia"];

function Harness({ total = 3000, metodoInicial = "Efectivo" }) {
  const [metodo, setMetodo] = useState(metodoInicial);
  const [monto, setMonto] = useState("");
  return (
    <PagoVentaPresencial
      metodos={METODOS}
      metodoPago={metodo}
      onMetodoPago={setMetodo}
      total={total}
      montoRecibido={monto}
      onMontoRecibido={setMonto}
    />
  );
}

function abrirMetodos() {
  fireEvent.click(screen.getByRole("button", { name: "Método de Pago" }));
}

describe("PagoVentaPresencial", () => {
  it("muestra cada método habilitado una sola vez y sin opciones ajenas al catálogo", () => {
    render(<Harness />);
    abrirMetodos();
    const opciones = screen.getAllByRole("option").map((opcion) => opcion.textContent);
    expect(opciones).toEqual([
      "Efectivo",
      "Tarjeta de débito / crédito",
      "SINPE Móvil",
      "Transferencia bancaria",
    ]);
    expect(opciones).not.toContain("Comprobante");
  });

  it("calcula vuelto cero cuando el efectivo es exacto", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Monto recibido"), { target: { value: "3000" } });
    expect(screen.getByText("₡0")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calcula el vuelto cuando el monto supera el total", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Monto recibido"), { target: { value: "5000.5" } });
    expect(screen.getByText("Vuelto").closest("p").textContent.replace(/\D/g, "")).toBe("2001");
  });

  it("avisa y no ofrece vuelto si el efectivo no alcanza", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Monto recibido"), { target: { value: "1000" } });
    expect(screen.getByRole("alert")).toHaveTextContent("El monto recibido es menor que el total.");
    expect(screen.queryByText("Vuelto")).not.toBeInTheDocument();
  });

  it.each(["Tarjeta", "SINPE Móvil", "Transferencia"])(
    "no pide monto recibido para %s",
    (metodo) => {
      render(<Harness metodoInicial={metodo} />);
      expect(screen.queryByLabelText("Monto recibido")).not.toBeInTheDocument();
    },
  );
});
