import { PublicShell } from './public-shell';
import { project } from '@/config/project';
import s from './legal.module.scss';
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PublicShell>
      <main id="main" className={s.document}>
        <span className={s.eyebrow}>{project.name} · Документы сервиса</span>
        <h1>{title}</h1>
        <p className={s.date}>
          Редакция от <time dateTime={project.documentDateIso}>{project.documentDate}</time>
        </p>
        {project.website && (
          <p>
            Сайт сервиса: <a href={project.website}>{project.website}</a>
          </p>
        )}
        <div className={s.text}>{children}</div>
      </main>
    </PublicShell>
  );
}
