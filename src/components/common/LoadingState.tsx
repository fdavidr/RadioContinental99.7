type LoadingStateProps = {
  title?: string
  message?: string
}

export function LoadingState({
  title = 'Cargando contenido',
  message = 'Estamos preparando la información para vos.',
}: LoadingStateProps) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}
