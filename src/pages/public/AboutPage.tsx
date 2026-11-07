export function AboutPage() {
  return (
    <div className="page-shell">
      <div className="container narrow">
        <span className="eyebrow">La emisora</span>
        <h1>Una radio cerca de la comunidad</h1>
        <p className="lead">
          Radio 99.7 FM busca ser un espacio para la actualidad, la información y las voces de su audiencia.
        </p>
      </div>
      <section className="container about-grid">
        <article className="info-card">
          <span className="eyebrow">Periodismo</span>
          <h2>Información con contexto</h2>
          <p>Un espacio pensado para informar con claridad, contrastar fuentes y conversar con respeto.</p>
        </article>
        <article className="info-card">
          <span className="eyebrow">Deportes</span>
          <h2>Pasión que conecta</h2>
          <p>La cobertura deportiva pone en primer plano las historias y la participación de la comunidad.</p>
        </article>
        <p className="demo-note">
          La misión, ubicación y datos institucionales deben ser confirmados por la emisora antes de publicarse.
        </p>
      </section>
    </div>
  )
}
