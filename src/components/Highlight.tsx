import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { differentials, services } from '../data/site';
import { snapshot, assetUrl } from '../admin/demoStore';




/** Carrossel público: usa somente exemplos e alterações temporárias da aba. */
const AUTOPLAY_MS = 5500;


const serviceImage = (id: string) => {
  const { items: projects, covers } = snapshot();
  const cover = covers[id];
  if (cover) return { src: cover.src, alt: '' };
  const photo = projects.find((p) => p.serviceId === id);
  return photo ? { src: photo.image.src, alt: photo.image.alt } : { src: `demo/${id}.svg`, alt: '' };
};

export function Highlight() {
  const trackRef = useRef<HTMLUListElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [pages, setPages] = useState(1);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Mede quantos cartões cabem e qual está no início da faixa.
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || !track.children.length) return;
    const card = track.children[0] as HTMLElement;
    const step = card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
    const perView = Math.max(1, Math.round(track.clientWidth / step));
    setPages(Math.max(1, services.length - perView + 1));
    setIndex(Math.round(track.scrollLeft / step));
  }, []);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    track?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      track?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [measure]);

  const go = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[0] as HTMLElement;
    const step = card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
    track.scrollTo({ left: i * step, behavior: reduced ? 'auto' : 'smooth' });
  }, [reduced]);

  const next = useCallback(() => go(index + 1 >= pages ? 0 : index + 1), [go, index, pages]);
  const prev = () => go(index - 1 < 0 ? pages - 1 : index - 1);

  // Só roda sozinho quando a seção está visível, sem o mouse/foco em cima.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const autoplay = !reduced && !paused && inView && pages > 1;
  useEffect(() => {
    if (!autoplay) return;
    const t = window.setTimeout(next, AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [autoplay, next, index]);

  return (
    <section
      id="destaque"
      ref={sectionRef}
      className="highlight"
      aria-labelledby="destaque-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="band-bg" data-parallax="0.2" aria-hidden="true" />
      <div className="container highlight__inner">
        <header className="highlight__head reveal">
          <p className="highlight__eyebrow">Nossos serviços</p>
          <h2 id="destaque-title" className="highlight__title">
            Do projeto à instalação, <span>sob medida</span> para o seu imóvel.
          </h2>
        </header>

        <div className="carousel" role="region" aria-roledescription="carrossel" aria-label="Serviços">
          <button type="button" className="carousel__arrow carousel__arrow--prev" onClick={prev} aria-label="Serviço anterior">
            <span aria-hidden="true">↗</span>
          </button>

          <ul ref={trackRef} className="carousel__track">
            {services.map((s, i) => {
              const img = serviceImage(s.id);
              return (
                <li
                  key={s.id}
                  className={`svc-card${i >= index && i < index + (services.length - pages + 1) ? ' is-visible' : ''}`}
                  style={{ '--i': i } as CSSProperties}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} de ${services.length}: ${s.title}`}
                >
                  <div className="svc-card__media">
                    <img src={assetUrl(img.src)} alt={img.alt} width={1200} height={900} loading="lazy" decoding="async" />
                    <span className="svc-card__badge" aria-hidden="true">
                      <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                  <div className="svc-card__body">
                    <h3 className="svc-card__title">{s.title}</h3>
                    <p className="svc-card__text">{s.description}</p>
                    <a
                      className="svc-card__link"
                      href="#painel"

                      rel="noopener noreferrer"
                    >
                      Explorar painel <span aria-hidden="true">↗</span>

                    </a>
                  </div>
                </li>
              );
            })}
          </ul>

          <button type="button" className="carousel__arrow carousel__arrow--next" onClick={next} aria-label="Próximo serviço">
            <span aria-hidden="true">↗</span>
          </button>

          <div className="carousel__nav">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className="carousel__dot"
                aria-label={`Ir para o grupo ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => go(i)}
              >
                {i === index && autoplay && (
                  <span key={index} className="carousel__progress" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="highlight__cta reveal">
          <ul className="highlight__checks">
            {differentials.map((d) => (
              <li key={d.title}>
                <span className="highlight__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {d.title}
              </li>
            ))}
          </ul>
          <a className="adm-btn adm-btn--primary" href="#painel">Experimentar painel</a>
        </div>
      </div>
    </section>
  );
}
