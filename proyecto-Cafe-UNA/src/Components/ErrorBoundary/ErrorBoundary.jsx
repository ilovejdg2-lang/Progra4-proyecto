import { Component } from "react";
import { Link } from "@tanstack/react-router";
import "./ErrorBoundary.css";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Error no controlado en la interfaz:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const mensaje =
      this.props.message ||
      "Algo salió mal al mostrar esta sección. Podés recargar o volver al inicio.";

    return (
      <main className="error-boundary site-canvas" role="alert" aria-labelledby="error-boundary-title">
        <p className="error-boundary__eyebrow">Error</p>
        <h1 id="error-boundary-title" className="error-boundary__title">
          No se pudo cargar la página
        </h1>
        <p className="error-boundary__text">{mensaje}</p>
        <div className="error-boundary__actions">
          <button type="button" className="error-boundary__button" onClick={this.handleReload}>
            Recargar
          </button>
          <Link to="/" className="error-boundary__button error-boundary__button--ghost" onClick={this.handleReset}>
            Ir al inicio
          </Link>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
