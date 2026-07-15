'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { store } from '@/lib/store';
import { api, isEnabled } from '@/lib/api';
import { login as authLogin, logout as authLogout, onChange, SPID_PROVIDERS } from '@/lib/auth';
import { asset, BASE } from '@/lib/config';

const STEPS = ['Categoria', 'Dove', 'Cosa', 'Chi', 'Riepilogo'];
const STATUSES = ['Ricevuta', 'In lavorazione', 'Risolta'];
const OFFICES = ['URP - Il Faro', 'Manutenzioni', 'Polizia Municipale', 'Ambiente', 'Servizi cimiteriali'];

const statusClass = (s) => s.toLowerCase().replaceAll(' ', '-');
const formatDate = (iso) => new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
const mapEmbed = (q) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=17&hl=it&output=embed`;
const mapsHref = (q) => `https://www.google.com/maps?q=${encodeURIComponent(q)}`;

function Timeline({ report }) {
  const steps = report.history?.length ? report.history : [{ status: report.status, at: report.createdAt, note: '' }];
  return (
    <ol className="timeline">
      {steps.map((h, i) => (
        <li key={i} className={`tl-${statusClass(h.status)}`}>
          <span>{h.status}</span>
          <small>{formatDate(h.at)}{h.note ? ` — ${h.note}` : ''}</small>
        </li>
      ))}
    </ol>
  );
}

export default function Portal() {
  const [session, setSession] = useState(null);
  const [reports, setReports] = useState([]);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null); // {lat,lng}
  const [mapQuery, setMapQuery] = useState('');
  const [geoLabel, setGeoLabel] = useState('📍 Usa la mia posizione');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Ordinaria');
  const [photo, setPhoto] = useState(null); // {name,url}
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const [loginOpen, setLoginOpen] = useState(false);
  const [idpOpen, setIdpOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const [adminRole, setAdminRole] = useState(OFFICES[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState(undefined); // undefined=none, null=notfound, obj=found

  const segnalaRef = useRef(null);
  const addrTimer = useRef(null);

  const refresh = useCallback(async () => {
    try { setReports(await store.listReports()); } catch { /* noop */ }
  }, []);

  useEffect(() => onChange(setSession), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register(`${BASE}/sw.js`).catch(() => {});
    }
  }, []);

  const stats = useMemo(() => ({
    total: reports.length,
    resolved: reports.filter((r) => r.status === 'Risolta').length
  }), [reports]);

  const board = useMemo(() => {
    const by = {};
    reports.forEach((r) => { (by[r.category] = by[r.category] || []).push(r); });
    return Object.entries(by);
  }, [reports]);

  const adminReports = useMemo(
    () => (statusFilter ? reports.filter((r) => r.status === statusFilter) : reports),
    [reports, statusFilter]
  );
  const mineReports = useMemo(
    () => (session ? reports.filter((r) => r.ownerId === session.id) : []),
    [reports, session]
  );

  const scrollToForm = () => segnalaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  function selectCategory(cat) {
    setCategory(cat.label); setCategoryId(cat.id); setSubcategory(cat.subs[0]);
  }

  function geolocate() {
    if (!navigator.geolocation) { setFormMsg('Geolocalizzazione non disponibile: inserisci l\'indirizzo.'); return; }
    setGeoLabel('⏳ Rilevamento posizione…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setCoords({ lat, lng });
        setMapQuery(`${lat},${lng}`);
        if (!address.trim()) setAddress(`Posizione GPS (${lat}, ${lng})`);
        setGeoLabel('✅ Posizione presa — tocca per aggiornare');
      },
      () => setGeoLabel('📍 Riprova · oppure scrivi l\'indirizzo'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function onAddress(v) {
    setAddress(v);
    if (coords) return;
    clearTimeout(addrTimer.current);
    if (v.trim().length >= 4) addrTimer.current = setTimeout(() => setMapQuery(`${v}, Canicattì`), 600);
  }

  function onPhoto(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setPhoto({ name: file.name, url: URL.createObjectURL(file) });
    else setPhoto(null);
  }

  function validateStep(n) {
    setFormMsg('');
    if (n === 1 && !category) { setFormMsg('Seleziona una categoria per continuare.'); return false; }
    if (n === 2 && address.trim().length < 4) { setFormMsg('Indica un indirizzo o usa la geolocalizzazione.'); return false; }
    if (n === 3 && description.trim().length < 20) { setFormMsg('La descrizione deve avere almeno 20 caratteri.'); return false; }
    if (n === 4) {
      if (!session && guestEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guestEmail)) { setFormMsg('Inserisci un\'email valida.'); return false; }
      if (!privacy) { setFormMsg('È necessario accettare l\'informativa privacy.'); return false; }
    }
    return true;
  }

  function goStep(n, scroll) {
    setStep(n);
    if (scroll) scrollToForm();
  }
  const next = () => { if (validateStep(step)) goStep(Math.min(step + 1, 5), true); };
  const prev = () => goStep(Math.max(step - 1, 1), true);

  async function submit(e) {
    e.preventDefault();
    if (!validateStep(4)) { goStep(4, true); return; }
    const data = {
      category, subcategory, address,
      lat: coords?.lat || null, lng: coords?.lng || null,
      description, priority, attachmentName: photo?.name || '',
      name: session ? session.displayName : (guestName || 'Cittadino'),
      email: session ? session.email : guestEmail,
      ownerId: session ? session.id : null
    };
    try {
      const report = await store.createReport(data);
      setFormMsg(`✅ Segnalazione inviata. Codice pratica: ${report.id}`);
      // reset
      setCategory(''); setCategoryId(''); setSubcategory(''); setAddress(''); setCoords(null);
      setMapQuery(''); setGeoLabel('📍 Usa la mia posizione'); setDescription(''); setPriority('Ordinaria');
      setPhoto(null); setGuestName(''); setGuestEmail(''); setPrivacy(false);
      setStep(1);
      await refresh();
    } catch (err) {
      setFormMsg(`Errore nell'invio: ${err.message}`);
    }
  }

  async function changeStatus(id, value) {
    await store.updateStatus(id, value, adminRole);
    await refresh();
  }
  async function assign(id) {
    await store.assign(id, adminRole);
    await refresh();
  }

  async function doLogin(method, idp) {
    setLoginLoading(true);
    const s = await authLogin(method, idp);
    if (isEnabled()) { try { await api.saveSession(s); } catch { /* noop */ } }
    setLoginLoading(false); setLoginOpen(false); setIdpOpen(false);
  }

  async function track(e) {
    e.preventDefault();
    const r = await store.getReport(trackCode.trim());
    setTrackResult(r || null);
  }

  const openLogin = () => { setLoginOpen(true); setIdpOpen(false); };

  return (
    <>
      <a className="skip-link" href="#segnala">Salta al contenuto</a>

      <div className="gov-bar">
        <div className="gov-bar-inner">
          <span className="gov-bar-brand"><span className="gov-dot" aria-hidden="true" /> Portale civico di Canicattì</span>
          <span className="gov-bar-note">Ambiente dimostrativo · progetto Controcorrente</span>
        </div>
      </div>

      <header className="cc-header">
        <a className="cc-brand" href="#home" aria-label="Il Faro 1 di Canicattì — Controcorrente">
          <img src={asset('/icons/logo02.png')} alt="" width="48" height="48" />
          <span><strong>Il Faro 1</strong><small>di Canicattì • Controcorrente</small></span>
        </a>
        <button className="cc-menu" type="button" aria-label="Apri menu" aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}>☰</button>
        <nav className={`cc-nav${navOpen ? ' open' : ''}`} aria-label="Navigazione principale" onClick={() => setNavOpen(false)}>
          <a href="#segnala">Segnala</a>
          <a href="#mappa">Mappa</a>
          <a href="#pratiche">Le mie segnalazioni</a>
          <a href="#traccia">Traccia pratica</a>
          <div className="cc-auth">
            {session ? (
              <div className="user-chip">
                <span className="user-avatar" aria-hidden="true">{session.name[0]}{session.familyName[0]}</span>
                <span className="user-name">{session.displayName}</span>
                <button className="user-logout" type="button" onClick={() => authLogout()} aria-label="Esci">Esci</button>
              </div>
            ) : (
              <button className="button button-spid" type="button" onClick={openLogin}>
                <span className="spid-glyph" aria-hidden="true">✦</span> Accedi con SPID / CIE
              </button>
            )}
          </div>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">Lottare x Restare • Centro Segnalazioni</p>
            <h1>Accendiamo un faro sulle segnalazioni della città.</h1>
            <p>Il portale civico di Canicattì per inviare disservizi, anomalie e proposte in pochi passaggi. Accedi con SPID o CIE, allega foto, indica il punto sulla mappa e segui la tua pratica fino alla risoluzione.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#segnala">Invia una segnalazione</a>
              <a className="button button-ghost" href="#traccia">Traccia una pratica</a>
            </div>
            <dl className="hero-stats" aria-label="Indicatori del portale">
              <div><dt>Pratiche gestite</dt><dd>{stats.total}</dd></div>
              <div><dt>Risolte</dt><dd>{stats.resolved}</dd></div>
              <div><dt>Uffici collegati</dt><dd>5</dd></div>
            </dl>
          </div>
          <figure className="hero-figure">
            <img src={asset('/icons/logo02.png')} alt="Logo Controcorrente — Il Faro 1 di Canicattì" width="320" height="320" />
          </figure>
        </section>

        <section className="section howto" aria-labelledby="howto-title">
          <div className="section-heading">
            <p className="kicker">Come funziona</p>
            <h2 id="howto-title">Segnalare è semplice e tracciabile.</h2>
          </div>
          <ol className="howto-grid">
            <li><span className="howto-num">1</span><strong>Accedi</strong><p>Entra con SPID o CIE per firmare la segnalazione e ritrovarla sempre nel tuo fascicolo.</p></li>
            <li><span className="howto-num">2</span><strong>Descrivi e localizza</strong><p>Scegli la categoria, aggiungi foto e indica il punto preciso sulla mappa o con la geolocalizzazione.</p></li>
            <li><span className="howto-num">3</span><strong>Segui la pratica</strong><p>Ricevi un codice pratica e controlla lo stato di avanzamento fino alla risoluzione.</p></li>
          </ol>
        </section>

        {/* WIZARD */}
        <section id="segnala" className="section report-panel" aria-labelledby="form-title" ref={segnalaRef}>
          <div className="section-heading">
            <p className="kicker">Nuova segnalazione</p>
            <h2 id="form-title">Raccontaci cosa non va.</h2>
            <p>Un percorso guidato in cinque passi. Puoi completarlo anche da smartphone.</p>
          </div>

          <ol className="wizard-steps" aria-label="Avanzamento segnalazione">
            {STEPS.map((label, i) => {
              const n = i + 1;
              return <li key={n} className={n === step ? 'is-active' : n < step ? 'is-done' : ''}>{label}</li>;
            })}
          </ol>

          <form className="wizard" onSubmit={submit} noValidate>
            {step === 1 && (
              <fieldset className="wizard-panel is-active">
                <legend>Che cosa vuoi segnalare?</legend>
                <div className="category-grid" role="radiogroup" aria-label="Categoria della segnalazione">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} type="button" role="radio" aria-checked={categoryId === c.id}
                      className={`category-card${categoryId === c.id ? ' is-selected' : ''}`} onClick={() => selectCategory(c)}>
                      <span aria-hidden="true">{c.icon}</span>
                      <strong>{c.label}</strong>
                      <small>{c.subs.slice(0, 2).join(' • ')}…</small>
                    </button>
                  ))}
                </div>
                {categoryId && (
                  <div className="sub-wrap">
                    <label>Dettaglio
                      <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                        {CATEGORIES.find((c) => c.id === categoryId).subs.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                )}
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="wizard-panel is-active">
                <legend>Dove si trova il problema?</legend>
                <p className="step-help">Sei sul posto? Tocca il pulsante: prendiamo la tua posizione GPS e la mostriamo sulla mappa.</p>
                <button className="button button-primary geo-cta" type="button" onClick={geolocate}>{geoLabel}</button>
                <div className="map-preview" aria-live="polite">
                  {mapQuery ? (
                    <iframe title="Mappa della posizione" src={mapEmbed(mapQuery)} loading="lazy" />
                  ) : (
                    <div className="map-empty">
                      <span aria-hidden="true">🗺️</span>
                      <p>La mappa apparirà qui dopo aver preso la posizione o inserito l'indirizzo.</p>
                    </div>
                  )}
                </div>
                {mapQuery && <a className="maps-link" href={mapsHref(mapQuery)} target="_blank" rel="noopener">Apri in Google Maps ↗</a>}
                <label className="wide">Indirizzo o riferimento
                  <input value={address} onChange={(e) => onAddress(e.target.value)} placeholder="Via, civico, contrada o punto di riferimento" />
                </label>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="wizard-panel is-active">
                <legend>Descrivi la situazione</legend>
                <div className="photo-field">
                  <label className="photo-drop" htmlFor="attachment">
                    <span className="photo-icon" aria-hidden="true">📷</span>
                    <span className="photo-text">Scatta o carica una foto</span>
                    <small>Una foto aiuta a capire e risolvere più in fretta</small>
                  </label>
                  <input id="attachment" type="file" accept="image/*" capture="environment" onChange={onPhoto} />
                  {photo && (
                    <figure className="photo-preview">
                      <img src={photo.url} alt="Anteprima della foto allegata" />
                      <button type="button" className="photo-remove" aria-label="Rimuovi foto" onClick={() => setPhoto(null)}>✕</button>
                    </figure>
                  )}
                </div>
                <label className="wide">Descrizione
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={20}
                    placeholder="Descrivi il problema, il punto preciso e ogni dettaglio utile (almeno 20 caratteri)" />
                </label>
                <label>Priorità
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option>Ordinaria</option><option>Alta</option><option>Urgente</option>
                  </select>
                </label>
              </fieldset>
            )}

            {step === 4 && (
              <fieldset className="wizard-panel is-active">
                <legend>I tuoi dati</legend>
                {session ? (
                  <div className="identity-box">
                    <div className="identity-card">
                      <span className="identity-badge">{session.method === 'cie' ? '🪪 CIE' : '✦ SPID'}</span>
                      <div>
                        <strong>{session.displayName}</strong>
                        <small>{session.fiscalNumber} • {session.email}</small>
                        <small className="identity-provider">Autenticato con {session.provider} • {session.level}</small>
                      </div>
                    </div>
                    <p className="identity-note">La segnalazione sarà firmata con la tua identità digitale e la ritroverai nel tuo fascicolo.</p>
                  </div>
                ) : (
                  <div className="identity-box">
                    <div className="identity-guest">
                      <p>Accedi con <strong>SPID</strong> o <strong>CIE</strong> per firmare la segnalazione e seguirla nel tuo fascicolo, oppure prosegui come ospite.</p>
                      <button className="button button-spid" type="button" onClick={openLogin}><span className="spid-glyph" aria-hidden="true">✦</span> Accedi con SPID / CIE</button>
                    </div>
                    <div className="two-col">
                      <label>Nome e cognome<input value={guestName} onChange={(e) => setGuestName(e.target.value)} autoComplete="name" placeholder="Mario Rossi" /></label>
                      <label>Email<input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} type="email" autoComplete="email" placeholder="nome@email.it" /></label>
                    </div>
                  </div>
                )}
                <label className="consent">
                  <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
                  <span>Ho letto l'informativa privacy e autorizzo il trattamento dei dati per la gestione della segnalazione.</span>
                </label>
              </fieldset>
            )}

            {step === 5 && (
              <fieldset className="wizard-panel is-active">
                <legend>Controlla e invia</legend>
                <div className="summary" aria-live="polite">
                  <div><dt>Categoria</dt><dd>{category}{subcategory ? ` — ${subcategory}` : ''}</dd></div>
                  <div><dt>Indirizzo</dt><dd>{address}</dd></div>
                  <div><dt>Coordinate</dt><dd>{coords ? `${coords.lat}, ${coords.lng}` : 'Non indicate'}</dd></div>
                  <div><dt>Descrizione</dt><dd>{description}</dd></div>
                  <div><dt>Priorità</dt><dd>{priority}</dd></div>
                  <div><dt>Allegato</dt><dd>{photo?.name || 'Nessuno'}</dd></div>
                  <div><dt>Segnalante</dt><dd>{session ? session.displayName : (guestName || 'Cittadino')}{(session?.email || guestEmail) ? ` • ${session?.email || guestEmail}` : ''}</dd></div>
                </div>
              </fieldset>
            )}

            <div className="wizard-nav">
              {step > 1 && <button className="button button-ghost dark" type="button" onClick={prev}>Indietro</button>}
              {step < 5 && <button className="button button-primary" type="button" onClick={next}>Continua</button>}
              {step === 5 && <button className="button button-primary" type="submit">Invia segnalazione</button>}
            </div>
          </form>
          {formMsg && <p className="form-message" role="status">{formMsg}</p>}
        </section>

        {/* MAPPA / BOARD */}
        <section id="mappa" className="section map-section" aria-labelledby="map-title">
          <div className="section-heading">
            <p className="kicker">Sulla mappa</p>
            <h2 id="map-title">Le segnalazioni della città.</h2>
            <p>Una panoramica delle pratiche aperte per categoria. La mappa interattiva georeferenziata arriverà con l'integrazione PostGIS.</p>
          </div>
          <div className="city-board" aria-live="polite">
            {board.length ? board.map(([cat, list]) => {
              const cfg = CATEGORIES.find((c) => c.label === cat) || { icon: '📌' };
              const open = list.filter((r) => r.status !== 'Risolta').length;
              return (
                <article key={cat} className="board-card">
                  <span className="board-icon" aria-hidden="true">{cfg.icon}</span>
                  <strong>{cat}</strong>
                  <span className="board-count">{list.length}</span>
                  <small>{open} aperte • {list.length - open} risolte</small>
                </article>
              );
            }) : <p className="empty-state light">Ancora nessuna segnalazione.</p>}
          </div>
        </section>

        {/* LE MIE SEGNALAZIONI */}
        <section id="pratiche" className="section mine-panel" aria-labelledby="mine-title">
          <div className="section-heading">
            <p className="kicker">Fascicolo cittadino</p>
            <h2 id="mine-title">Le mie segnalazioni.</h2>
            <p>Accedi con SPID o CIE per vedere le pratiche che hai inviato e il loro stato.</p>
          </div>
          <div className="mine-list" aria-live="polite">
            {!session ? (
              <div className="gate">
                <p>Accedi per consultare le tue segnalazioni.</p>
                <button className="button button-spid" type="button" onClick={openLogin}><span className="spid-glyph" aria-hidden="true">✦</span> Accedi con SPID / CIE</button>
              </div>
            ) : mineReports.length ? mineReports.map((r) => (
              <article key={r.id} className="mine-card">
                <header><span className="code">{r.id}</span><span className={`badge ${statusClass(r.status)}`}>{r.status}</span></header>
                <h3>{r.category}{r.subcategory ? ` — ${r.subcategory}` : ''}</h3>
                <p>{r.description}</p>
                <small className="mine-meta">{r.address} • inviata il {formatDate(r.createdAt)}</small>
                <Timeline report={r} />
              </article>
            )) : <p className="empty-state light">Ciao {session.name}, non hai ancora inviato segnalazioni. <a href="#segnala">Aprine una ora</a>.</p>}
          </div>
        </section>

        {/* TRACCIA */}
        <section id="traccia" className="section track-panel" aria-labelledby="track-title">
          <div className="section-heading">
            <p className="kicker">Stato pratica</p>
            <h2 id="track-title">Traccia una segnalazione.</h2>
            <p>Hai un codice pratica? Controlla lo stato senza effettuare l'accesso.</p>
          </div>
          <form className="track-form" onSubmit={track}>
            <label className="wide">Codice pratica
              <input value={trackCode} onChange={(e) => setTrackCode(e.target.value)} placeholder="Es. FARO-2026-001" required />
            </label>
            <button className="button button-primary" type="submit">Cerca</button>
          </form>
          <div className="track-result" aria-live="polite">
            {trackResult === null && <p className="track-miss">Nessuna pratica trovata con quel codice. Controlla e riprova.</p>}
            {trackResult && (
              <article className="mine-card">
                <header><span className="code">{trackResult.id}</span><span className={`badge ${statusClass(trackResult.status)}`}>{trackResult.status}</span></header>
                <h3>{trackResult.category}{trackResult.subcategory ? ` — ${trackResult.subcategory}` : ''}</h3>
                <p>{trackResult.description}</p>
                <small className="mine-meta">{trackResult.address} • {trackResult.office} • inviata il {formatDate(trackResult.createdAt)}</small>
                <Timeline report={trackResult} />
              </article>
            )}
          </div>
        </section>

        {/* BACK OFFICE */}
        <section id="fascicolo" className="section admin-panel" aria-labelledby="admin-title">
          <div className="section-heading">
            <p className="kicker">Back office comunale</p>
            <h2 id="admin-title">Gestione multiutente delle pratiche.</h2>
            <p>Demo per operatori e amministratori: filtra per stato, assegna all'ufficio competente e aggiorna l'avanzamento.</p>
          </div>
          <div className="admin-tools">
            <label>Ufficio
              <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)}>{OFFICES.map((o) => <option key={o}>{o}</option>)}</select>
            </label>
            <label>Stato
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Tutte</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <div className="counter"><span>{reports.length}</span><small>pratiche</small></div>
          </div>
          <div className="reports-list" aria-live="polite">
            {adminReports.length ? adminReports.map((r) => (
              <article key={r.id} className="report-card">
                <div>
                  <span className="code">{r.id}</span>
                  <h3>{r.category}</h3>
                  <p>{r.description}</p>
                  <dl>
                    <div><dt>Luogo</dt><dd>{r.address}</dd></div>
                    <div><dt>Priorità</dt><dd>{r.priority}</dd></div>
                    <div><dt>Ufficio</dt><dd>{r.office}</dd></div>
                    <div><dt>Allegato</dt><dd>{r.attachmentName || 'Non presente'}</dd></div>
                  </dl>
                </div>
                <div className="report-actions">
                  <span className={`badge ${statusClass(r.status)}`}>{r.status}</span>
                  <select aria-label={`Aggiorna stato ${r.id}`} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="secondary-action" type="button" onClick={() => assign(r.id)}>Assegna a {adminRole}</button>
                </div>
              </article>
            )) : <p className="empty-state">Nessuna segnalazione corrisponde al filtro selezionato.</p>}
          </div>
        </section>
      </main>

      {/* LOGIN MODAL */}
      {loginOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="loginTitle" onClick={(e) => { if (e.target === e.currentTarget) setLoginOpen(false); }}>
          <div className={`modal-card${loginLoading ? ' is-loading' : ''}`}>
            <button className="modal-close" type="button" aria-label="Chiudi" onClick={() => setLoginOpen(false)}>✕</button>
            <p className="kicker">Accesso al portale</p>
            <h2 id="loginTitle">Entra con la tua identità digitale</h2>
            <div className="login-methods">
              <button className="login-method spid" type="button" onClick={() => setIdpOpen((v) => !v)}>
                <span className="lm-title"><span className="spid-glyph" aria-hidden="true">✦</span> Entra con SPID</span>
                <span className="lm-desc">Sistema Pubblico di Identità Digitale</span>
              </button>
              {idpOpen && (
                <div className="idp-list">
                  {SPID_PROVIDERS.map((p) => (
                    <button key={p.id} className="idp" type="button" onClick={() => doLogin('spid', p.id)}>
                      <span className="idp-mark">{p.mark}</span>{p.name}
                    </button>
                  ))}
                </div>
              )}
              <button className="login-method cie" type="button" onClick={() => doLogin('cie')}>
                <span className="lm-title">🪪 Entra con CIE</span>
                <span className="lm-desc">Carta di Identità Elettronica</span>
              </button>
            </div>
            <p className="login-note">Ambiente dimostrativo: nessuna credenziale reale viene richiesta o trasmessa. In produzione il flusso userà gli Identity Provider accreditati AgID.</p>
          </div>
        </div>
      )}

      <nav className="mobile-tabbar" aria-label="Navigazione mobile">
        <a href="#home">Home</a>
        <a href="#segnala">Segnala</a>
        <a href="#pratiche">Pratiche</a>
        <a href="#traccia">Traccia</a>
      </nav>

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={asset('/icons/logo02.png')} alt="" width="52" height="52" />
            <div>
              <strong>Il Faro 1 di Canicattì</strong>
              <span>Portale civico per le segnalazioni dei cittadini. Identità Controcorrente — Lottare x Restare.</span>
            </div>
          </div>
          <nav className="footer-cols" aria-label="Link del portale">
            <div>
              <h3>Il portale</h3>
              <a href="#segnala">Invia una segnalazione</a>
              <a href="#mappa">Mappa delle segnalazioni</a>
              <a href="#pratiche">Le mie segnalazioni</a>
              <a href="#traccia">Traccia una pratica</a>
            </div>
            <div>
              <h3>Informazioni</h3>
              <a href="#home">Come funziona</a>
              <a href="#segnala">Accessibilità</a>
              <a href="#traccia">Privacy e trattamento dati</a>
              <a href="#fascicolo">Area operatori</a>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Il Faro 1 di Canicattì</span>
          <span className="footer-demo">Ambiente dimostrativo — i dati inseriti restano su questo dispositivo.</span>
        </div>
      </footer>
    </>
  );
}
