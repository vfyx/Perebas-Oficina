import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { company, services } from '../data/site';
import type { Project } from '../data/projects';

import {call, assetUrl} from './demoStore';

/* ---------------- Preparação da imagem no navegador ---------------- */
const MAX_SIDE = 1600;

interface Prepared {
  data: string;
  mime: string;
  width: number;
  height: number;
}

/** Corrige a rotação, reduz para no máximo 1600 px e comprime (WebP, ou JPEG se não houver suporte). */
async function prepareImage(file: File): Promise<Prepared> {
  if (file.size > 12 * 1024 * 1024) throw new Error('Use uma imagem de até 12 MB.');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.82));
  let blob = await toBlob('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
  if (!blob) throw new Error(`Não foi possível ler "${file.name}".`);

  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { data: btoa(bin), mime: blob.type, width, height };
}

/* ---------------- Componentes ---------------- */
const serviceTitle = (id: string) => services.find((s) => s.id === id)?.title ?? id;

interface Pending {
  key: string;
  file: File;
  preview: string;
  title: string;
  description: string;
}

type Status = { kind: 'ok' | 'error' | 'info'; text: string } | null;

export function AdminApp() {
  const [list, setList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [serviceId, setServiceId] = useState('');
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('todos');
  const [panel, setPanel] = useState<'galeria' | 'servicos'>('galeria');

  const load = useCallback(async () => {
    try {
      setList(await call<Project[]>('/projects'));
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
    if (accepted.length < files.length) setStatus({ kind: 'error', text: 'Alguns arquivos foram ignorados. Use fotos JPG, PNG ou WebP.' });
    const title = serviceId ? serviceTitle(serviceId) : '';
    setPending((p) => [
      ...p,
      ...accepted.map((file) => ({
        key: `${file.name}-${file.size}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        title,
        description: '',
      })),
    ]);
  };

  const removePending = (key: string) =>
    setPending((p) => {
      const item = p.find((x) => x.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return p.filter((x) => x.key !== key);
    });

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!serviceId) return setStatus({ kind: 'error', text: 'Escolha o serviço antes de enviar.' });
    if (!pending.length) return setStatus({ kind: 'error', text: 'Escolha pelo menos uma foto.' });
    setBusy(true);
    let sent = 0;
    try {
      for (const item of pending) {
        setStatus({ kind: 'info', text: `Preparando ${sent + 1} de ${pending.length}…` });
        const img = await prepareImage(item.file);
        const title = item.title.trim() || serviceTitle(serviceId);
        await call<Project>('/upload', {
          method: 'POST',
          body: JSON.stringify({ ...img, serviceId, title, description: item.description, alt: `${title} — ${company.name}` }),
        });
        sent++;
        removePending(item.key);
      }
      setStatus({ kind: 'ok', text: `${sent} ${sent === 1 ? 'foto adicionada à demonstração' : 'fotos adicionada à demonstraçãos'} para ${serviceTitle(serviceId)}.` });
    } catch (err) {
      setStatus({ kind: 'error', text: `${sent} adicionada à demonstração(s). Erro: ${(err as Error).message}` });
    } finally {
      setBusy(false);
      load();
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    list.forEach((p) => (c[p.serviceId] = (c[p.serviceId] ?? 0) + 1));
    return c;
  }, [list]);

  const shown = filter === 'todos' ? list : list.filter((p) => p.serviceId === filter);

  const move = async (id: string, dir: -1 | 1) => {
    // Move dentro da lista exibida, trocando de posição com a foto vizinha.
    const idx = shown.findIndex((p) => p.id === id);
    const other = shown[idx + dir];
    if (!other) return;
    const ids = list.map((p) => p.id);
    const a = ids.indexOf(id);
    const b = ids.indexOf(other.id);
    [ids[a], ids[b]] = [ids[b], ids[a]];
    try {
      setList(await call<Project[]>('/order', { method: 'POST', body: JSON.stringify({ ids }) }));
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    }
  };

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-wrap adm-top__inner">
          <div>
            <p className="adm-kicker">{company.name}</p>
            <h1>Painel de fotos</h1>
          </div>
          <a className="adm-btn adm-btn--ghost" href="#inicio">
            Ver apresentação
          </a>
        </div>
      </header>

      <main className="adm-wrap adm-main">
        <p className="adm-note">Demonstração de portfólio. As alterações e imagens ficam apenas na memória desta aba. Nada é enviado ou salvo; recarregar a página restaura os exemplos.</p>

        <div className="adm-status" role="status" aria-live="polite">
          {status && <p className={`adm-msg adm-msg--${status.kind}`}>{status.text}</p>}
        </div>

        <div className="adm-tabs" role="tablist" aria-label="O que você quer editar">
          <button type="button" role="tab" aria-selected={panel === 'galeria'} className="adm-tab" onClick={() => setPanel('galeria')}>
            Galeria de fotos
            <span>{list.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={panel === 'servicos'} className="adm-tab" onClick={() => setPanel('servicos')}>
            Nossos serviços (carrossel)
          </button>
        </div>

        {panel === 'servicos' ? (
          <CoversPanel gallery={list} onStatus={setStatus} />
        ) : (
        <>
        <section className="adm-card" aria-labelledby="add-title">
          <h2 id="add-title">Adicionar fotos</h2>
          <p className="adm-help">
            As fotos aparecem na Galeria do site, separadas por serviço. Enquanto nenhuma foto for cadastrada, o site
            mostra imagens de demonstração.
          </p>
          <form onSubmit={upload} className="adm-form">
            <label className="adm-field">
              <span>Serviço</span>
              <select id="adm-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
                <option value="">Escolha o serviço…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>

            <label
              className="adm-drop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <input
                id="adm-files"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <strong>Escolher fotos</strong>
              <span>ou arraste para cá. JPG, PNG ou WebP. Elas são reduzidas e otimizadas antes de salvar.</span>
            </label>

            {pending.length > 0 && (
              <ul className="adm-pending">
                {pending.map((p) => (
                  <li key={p.key} className="adm-pending__item">
                    <img src={p.preview} alt="" />
                    <div className="adm-pending__fields">
                      <label className="adm-field">
                        <span>Título</span>
                        <input
                          value={p.title}
                          placeholder={serviceId ? serviceTitle(serviceId) : 'Ex.: Portão residencial'}
                          onChange={(e) => setPending((all) => all.map((x) => (x.key === p.key ? { ...x, title: e.target.value } : x)))}
                        />
                      </label>
                      <label className="adm-field">
                        <span>Descrição (opcional)</span>
                        <input
                          value={p.description}
                          placeholder="Ex.: Fabricado sob medida e instalado em Itanhaém"
                          onChange={(e) =>
                            setPending((all) => all.map((x) => (x.key === p.key ? { ...x, description: e.target.value } : x)))
                          }
                        />
                      </label>
                    </div>
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => removePending(p.key)}>
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
              {busy ? 'Preparando…' : pending.length > 1 ? `Enviar ${pending.length} fotos` : 'Enviar foto'}
            </button>
          </form>
        </section>

        <section className="adm-card" aria-labelledby="list-title">
          <div className="adm-card__head">
            <h2 id="list-title">Fotos cadastradas ({list.length})</h2>
            <label className="adm-field adm-field--inline">
              <span>Mostrar</span>
              <select id="adm-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="todos">Todos os serviços</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({counts[s.id] ?? 0})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <p className="adm-empty">Carregando…</p>
          ) : shown.length === 0 ? (
            <p className="adm-empty">Nenhuma foto {filter === 'todos' ? 'cadastrada ainda' : 'neste serviço'}.</p>
          ) : (
            <ul className="adm-grid">
              {shown.map((p, i) => (
                <PhotoEditor
                  key={p.id}
                  item={p}
                  first={i === 0}
                  last={i === shown.length - 1}
                  onMove={(dir) => move(p.id, dir)}
                  onSaved={(msg) => {
                    setStatus({ kind: 'ok', text: msg });
                    load();
                  }}
                  onError={(msg) => setStatus({ kind: 'error', text: msg })}
                />
              ))}
            </ul>
          )}
        </section>
        </>
        )}
      </main>
    </div>
  );
}

function PhotoEditor({
  item,
  first,
  last,
  onMove,
  onSaved,
  onError,
}: {
  item: Project;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [serviceId, setServiceId] = useState(item.serviceId);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [confirming, setConfirming] = useState(false);
  const dirty = serviceId !== item.serviceId || title !== item.title || description !== item.description;

  const save = async () => {
    try {
      const t = title.trim() || serviceTitle(serviceId);
      await call(`/projects/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ serviceId, title: t, description, alt: `${t} — ${company.name}` }),
      });
      onSaved('Alterações aplicadas apenas nesta aba.');
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const remove = async () => {
    try {
      await call(`/projects/${item.id}`, { method: 'DELETE' });
      onSaved('Foto excluída.');
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <li className="adm-photo">
      <img src={assetUrl(item.image.src)} alt={item.image.alt} width={item.image.width} height={item.image.height} loading="lazy" />
      <div className="adm-photo__body">
        <label className="adm-field">
          <span>Serviço</span>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Descrição</span>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="adm-photo__actions">
          <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" disabled={!dirty} onClick={save}>
            Salvar
          </button>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={first} onClick={() => onMove(-1)} aria-label="Mover para antes">
            ↑
          </button>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={last} onClick={() => onMove(1)} aria-label="Mover para depois">
            ↓
          </button>
          {confirming ? (
            <>
              <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={remove}>
                Confirmar exclusão
              </button>
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setConfirming(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--del" onClick={() => setConfirming(true)}>
              Excluir
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/* ---------------- Fotos dos cartões "Nossos serviços" ---------------- */
type Covers = Record<string, { src: string; width: number; height: number }>;

function CoversPanel({ gallery, onStatus }: { gallery: Project[]; onStatus: (s: Status) => void }) {
  const [covers, setCovers] = useState<Covers>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    call<Covers>('/covers')
      .then(setCovers)
      .catch((e) => onStatus({ kind: 'error', text: (e as Error).message }));
  }, [onStatus]);

  const upload = async (serviceId: string, file: File | undefined) => {
    if (!file) return;
    setBusy(serviceId);
    try {
      onStatus({ kind: 'info', text: `Preparando foto de ${serviceTitle(serviceId)}…` });
      const img = await prepareImage(file);
      setCovers(await call<Covers>(`/covers/${serviceId}`, { method: 'POST', body: JSON.stringify(img) }));
      onStatus({ kind: 'ok', text: `Foto de ${serviceTitle(serviceId)} atualizada no carrossel.` });
    } catch (e) {
      onStatus({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const reset = async (serviceId: string) => {
    try {
      setCovers(await call<Covers>(`/covers/${serviceId}`, { method: 'DELETE' }));
      onStatus({ kind: 'ok', text: `${serviceTitle(serviceId)} voltou a usar a foto automática.` });
    } catch (e) {
      onStatus({ kind: 'error', text: (e as Error).message });
    }
  };

  return (
    <section className="adm-card" aria-labelledby="covers-title">
      <h2 id="covers-title">Fotos dos cartões “Nossos serviços”</h2>
      <p className="adm-help">
        Escolha a foto que aparece em cada cartão do carrossel. Sem foto escolhida, o cartão usa automaticamente a
        primeira foto daquele serviço na galeria, ou a imagem de demonstração.
      </p>
      <ul className="adm-covers">
        {services.map((s) => {
          const own = covers[s.id];
          const fromGallery = gallery.find((p) => p.serviceId === s.id);
          const src = own ? own.src : fromGallery ? fromGallery.image.src : `demo/${s.id}.svg`;
          const origin = own ? 'Foto escolhida' : fromGallery ? 'Automática (da galeria)' : 'Demonstração';
          return (
            <li key={s.id} className="adm-cover">
              <div className="adm-cover__img">
                <img src={assetUrl(src)} alt="" loading="lazy" />
                <span className={`adm-cover__tag${own ? ' adm-cover__tag--own' : ''}`}>{origin}</span>
              </div>
              <div className="adm-cover__body">
                <strong>{s.title}</strong>
                <div className="adm-photo__actions">
                  <label className={`adm-btn adm-btn--primary adm-btn--sm adm-file${busy === s.id ? ' is-busy' : ''}`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy !== null}
                      onChange={(e) => {
                        upload(s.id, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                    {busy === s.id ? 'Preparando…' : own ? 'Trocar foto' : 'Escolher foto'}
                  </label>
                  {own && (
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => reset(s.id)}>
                      Usar automática
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
