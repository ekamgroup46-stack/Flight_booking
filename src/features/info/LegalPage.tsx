import { useLocation } from 'react-router'
import { LineBundle } from '@/components/brand/Brand'
import { LEGAL_DOCS, type LegalDoc } from '@/content/legal'
import { useDocumentTitle } from '@/hooks'
import { formatDate } from '@/lib/format'
import s from './Info.module.css'

const BY_PATH: Record<string, LegalDoc['slug']> = { '/policies/booking': 'booking', '/terms': 'terms', '/privacy': 'privacy' }

export default function LegalPage() {
  const { pathname } = useLocation()
  const doc = LEGAL_DOCS[BY_PATH[pathname] ?? 'terms']
  useDocumentTitle(doc.title)
  return (
    <article className="container">
      <header className={s.docHead}>
        <p className="eyebrow">
          {doc.eyebrow} · Updated {formatDate(doc.updated, 'long')}
        </p>
        <h1 className={s.docTitle}>{doc.title}</h1>
        <p className={s.docIntro}>{doc.intro}</p>
        <LineBundle thickness={2} gap={2} className={s.docBundle} />
      </header>
      <div className={s.docGrid}>
        <nav className={s.toc} aria-label="On this page">
          <p className="eyebrow">On this page</p>
          <ol>
            {doc.sections.map((sec) => (
              <li key={sec.id}>
                <a href={`#${sec.id}`}>{sec.heading}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className={s.docBody}>
          {doc.sections.map((sec, i) => (
            <section key={sec.id} id={sec.id} className={s.docSection}>
              <h2>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                {sec.heading}
              </h2>
              {sec.body.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </section>
          ))}
          <p className={s.docNote}>This is template content for the design phase and should be reviewed by legal counsel before launch.</p>
        </div>
      </div>
    </article>
  )
}
