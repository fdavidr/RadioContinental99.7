type ErrorStateProps = {
  title?: string
  message?: string
}

export function ErrorState({
  title = 'No pudimos cargar esta información',
  message = 'Se produjo un problema al consultar los datos. Intenta nuevamente.',
}: ErrorStateProps) {
  return (
    <div className="state-panel state-panel--error" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}
