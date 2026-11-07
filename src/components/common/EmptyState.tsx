type EmptyStateProps = {
  title?: string
  message?: string
}

export function EmptyState({
  title = 'Todavía no hay contenido disponible',
  message = 'Pronto publicaremos nuevas historias y programas.',
}: EmptyStateProps) {
  return (
    <div className="state-panel">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}
