import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppError } from './AppError';

type State = { error: Error | null };

// Captura cualquier error de render en el subárbol y lo reemplaza con AppError.
// Sin esto, un throw en cualquier componente vacía toda la página.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <AppError
          title="La página tuvo un problema"
          detail={
            <>
              Algo se rompió cargando esta vista. Puede ser una caída temporal del servidor o
              un error del sitio. Volvé a intentar en un minuto; si sigue, escribinos.
            </>
          }
          hint={
            <>
              <b>Detalle técnico:</b> {this.state.error.message}
            </>
          }
        />
      );
    }
    return this.props.children;
  }
}
