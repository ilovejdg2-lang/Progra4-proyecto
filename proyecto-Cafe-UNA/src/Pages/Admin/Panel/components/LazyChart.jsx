import { Component, lazy, Suspense, useState } from "react";

import { textoIdioma } from "../../../../lib/idioma";

class ChartBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("No se pudo cargar un gráfico del panel:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section
        role="alert"
        className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      >
        <p>{textoIdioma("No se pudo cargar el gráfico.")}</p>
        <button
          type="button"
          onClick={this.props.onRetry}
          className="rounded-full bg-[#7a1f2b] px-3 py-1 text-xs font-semibold text-white"
        >
          {textoIdioma("Reintentar")}
        </button>
      </section>
    );
  }
}

/**
 * Lazy chart with a per-card error boundary. A rejected lazy() is cached by
 * React, so retry builds a fresh lazy component, which calls import() again.
 */
export function LazyChart({ load, fallback, ...props }) {
  const [Chart, setChart] = useState(() => lazy(load));
  const [attempt, setAttempt] = useState(0);
  const retry = () => {
    setChart(() => lazy(load));
    setAttempt((n) => n + 1);
  };

  return (
    <ChartBoundary key={attempt} onRetry={retry}>
      <Suspense fallback={fallback}>
        <Chart {...props} />
      </Suspense>
    </ChartBoundary>
  );
}
