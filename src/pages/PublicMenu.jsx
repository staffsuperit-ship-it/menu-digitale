import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Wine, Check, Search, X, Mail, Phone, MessageCircle, Star } from 'lucide-react';

function PublicMenu() {
  const { slug } = useParams();
  const [locale, setLocale] = useState(null);
  const [tuttiVini, setTuttiVini] = useState([]);
  const [viniGruppati, setViniGruppati] = useState({});
  const [piattiGruppati, setPiattiGruppati] = useState({});
  const [tab, setTab] = useState('vini');
  const [subTabVino, setSubTabVino] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const viniRefs = useRef({});

  useEffect(() => { fetchMenu(); }, [slug]);

  const fetchMenu = async () => {
    setLoading(true);
    const { data: loc } = await supabase.from('wl_locali').select('*').eq('slug', slug).single();
    if (!loc) return setLoading(false);
    setLocale(loc);

    const { data: vData } = await supabase.from('wl_vini')
      .select('*, wl_vini_master(*, wl_regioni(nome, ordine)), wl_categorie_vini(nome, ordine)');

    const sortedVini = (vData || []).filter(v => v.locale_id === loc.id).sort((a, b) => {
        const catA = a.wl_categorie_vini?.ordine || 99;
        const catB = b.wl_categorie_vini?.ordine || 99;
        if (catA !== catB) return catA - catB;
        const regA = a.wl_vini_master?.wl_regioni?.ordine || 999;
        const regB = b.wl_vini_master?.wl_regioni?.ordine || 999;
        if (regA !== regB) return regA - regB;
        return (a.wl_vini_master?.cantina || '').localeCompare(b.wl_vini_master?.cantina || '');
    });

    const { data: pData } = await supabase.from('wl_piatti')
      .select(`*, wl_categorie_piatti(nome), wl_vini(id, wl_vini_master(nome_vino), wl_categorie_vini(nome))`)
      .eq('locale_id', loc.id).eq('disponibile', true).order('categoria_id');

    setTuttiVini(sortedVini);

    const gV = sortedVini.reduce((acc, v) => {
      const cat = v.wl_categorie_vini?.nome || 'Carta Vini';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(v);
      return acc;
    }, {});

    const gP = (pData || []).reduce((acc, p) => {
      const cat = p.wl_categorie_piatti?.nome || 'Menù';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});

    setViniGruppati(gV); setPiattiGruppati(gP);
    const categorie = Object.keys(gV);
    if (categorie.length > 0) setSubTabVino(categorie[0]);
    setLoading(false);
  };

  const viniFiltrati = tuttiVini.filter(v => {
    const s = searchTerm.toLowerCase();
    const m = v.wl_vini_master;
    return m?.nome_vino?.toLowerCase().includes(s) || m?.cantina?.toLowerCase().includes(s) || m?.wl_regioni?.nome?.toLowerCase().includes(s);
  });

  const scrollToWine = (id, categoria) => {
    setTab('vini');
    setSubTabVino(categoria);
    setSearchTerm('');
    setTimeout(() => viniRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  };

  if (loading) return <div style={{textAlign:'center', padding:'100px', color:'#992235'}}>WineLink sta preparando la tavola...</div>;

  const pColor = locale.colore_primario || '#992235';
  const sColor = locale.colore_secondario || '#EEB336';

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: '"Playfair Display", serif', color: '#333' }}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', padding: '50px 20px 30px' }}>
        {locale.logo_url && <img src={locale.logo_url} alt="Logo" style={{ maxHeight: '110px', marginBottom: '20px', objectFit: 'contain' }} />}
        <h1 style={{ margin: 0, fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '2px', color: pColor }}>{locale.nome}</h1>
        <div style={{ width: '40px', height: '2px', background: sColor, margin: '20px auto' }}></div>
      </header>

      {/* TABS PRINCIPALI */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
        <button onClick={() => setTab('vini')} style={{ border: 'none', padding: '12px 25px', borderRadius: '5px', background: tab === 'vini' ? pColor : '#f2f2f2', color: tab === 'vini' ? 'white' : '#666', fontWeight:'bold', cursor:'pointer' }}>CARTA VINI</button>
        {Object.keys(piattiGruppati).length > 0 && (
            <button onClick={() => setTab('piatti')} style={{ border: 'none', padding: '12px 25px', borderRadius: '5px', background: tab === 'piatti' ? pColor : '#f2f2f2', color: tab === 'piatti' ? 'white' : '#666', fontWeight:'bold', cursor:'pointer' }}>MENÙ PIATTI</button>
        )}
      </div>

      {/* RICERCA & SOTTO-TABS */}
      {tab === 'vini' && (
        <div style={{ maxWidth: '500px', margin: '0 auto 20px', padding: '0 20px' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={18} style={{position:'absolute', left:'15px', top:'12px', color:'#999'}}/>
            <input type="text" placeholder="Cerca un vino o una cantina..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{width:'100%', padding:'12px 45px', borderRadius:'30px', border:'1px solid #eee', background:'#f9f9f9', boxSizing:'border-box', outline:'none'}} />
          </div>
          {!searchTerm && Object.keys(viniGruppati).length > 1 && (
            <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px', justifyContent: 'center', borderBottom: '1px solid #f2f2f2' }}>
              {Object.keys(viniGruppati).map(cat => (
                <button key={cat} onClick={() => setSubTabVino(cat)} style={{ border: 'none', padding: '8px 18px', borderRadius: '20px', fontSize: '0.8rem', background: subTabVino === cat ? '#333' : '#f4f4f4', color: subTabVino === cat ? 'white' : '#888', whiteSpace:'nowrap', fontWeight:'bold', cursor:'pointer' }}>{cat.toUpperCase()}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <main style={{ maxWidth: '550px', margin: '0 auto', padding: '20px' }}>
        {tab === 'vini' && (searchTerm ? viniFiltrati : viniGruppati[subTabVino])?.map(v => {
          const vm = v.wl_vini_master;
          return (
            <div key={v.id} ref={el => viniRefs.current[v.id] = el} style={{ padding: '50px 0', borderBottom: '1px solid #f2f2f2', textAlign: 'center', opacity: v.disponibile ? 1 : 0.6, position:'relative' }}>
              
              {!v.disponibile && <div style={{ color: '#992235', fontWeight: 'bold', letterSpacing:'2px', marginBottom: '15px' }}>— MOMENTANEAMENTE ESAURITO —</div>}
              
              {/* WINELINK SELECTION BADGE */}
              {v.winelink_selection && (
                <div style={{ position:'absolute', top:'20px', right:'0', background: '#D5E0A0', color: pColor, padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}>
                   <Star size={12} fill={pColor} /> WINELINK SELECTION
                </div>
              )}

              {vm?.immagine_url && <img src={vm.immagine_url} style={{ maxHeight: '300px', width: 'auto', marginBottom: '25px', filter: v.disponibile ? 'none' : 'grayscale(1) opacity(0.5)' }} alt="vino" />}
              
              <h3 style={{ margin: 0, color: pColor, fontSize: '1.7rem' }}>{vm?.nome_vino}</h3>
              <p style={{ margin: '5px 0', fontSize:'1.1rem', color:'#555' }}>{vm?.cantina}</p>
              
              <div style={{ marginTop: '12px' }}>
                <span style={{ background: sColor, color: 'white', padding: '5px 18px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing:'1px' }}>{vm?.wl_regioni?.nome}</span>
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '20px 0', color: '#111' }}>€ {v.prezzo}</div>

              <div style={{ textAlign: 'left', fontSize: '0.9rem', color: '#666', fontFamily: 'sans-serif', lineHeight: '1.6', background: '#fafafa', padding: '20px', borderRadius: '10px' }}>
                {vm?.denominazione && <p style={{margin:'4px 0'}}><Check size={16} color={pColor} style={{verticalAlign:'middle'}}/> <b>Denominazione:</b> {vm.denominazione}</p>}
                {vm?.uvaggio && <p style={{margin:'4px 0'}}><Check size={16} color={pColor} style={{verticalAlign:'middle'}}/> <b>Uve:</b> {vm.uvaggio}</p>}
                {vm?.affinamento && <p style={{margin:'4px 0'}}><Check size={16} color={pColor} style={{verticalAlign:'middle'}}/> <b>Affinamento:</b> {vm.affinamento}</p>}
                {vm?.gradazione && <p style={{margin:'4px 0'}}><Check size={16} color={pColor} style={{verticalAlign:'middle'}}/> <b>Gradazione:</b> {vm.gradazione}</p>}
                {vm?.olfatto && <div style={{marginTop:'15px', color:'#444', fontStyle:'italic', borderLeft:`3px solid ${sColor}`, paddingLeft:'10px'}}>👃 {vm.olfatto}</div>}
                {vm?.gusto && <div style={{marginTop:'10px', color:'#444', fontStyle:'italic', borderLeft:`3px solid ${sColor}`, paddingLeft:'10px'}}>👄 {vm.gusto}</div>}
              </div>
            </div>
          );
        })}

        {tab === 'piatti' && Object.keys(piattiGruppati).map(cat => (
          <div key={cat}>
            <h2 style={{ color: pColor, borderBottom: `2px solid ${pColor}11`, marginTop: '50px', paddingBottom: '10px', fontSize:'1.4rem' }}>{cat.toUpperCase()}</h2>
            {piattiGruppati[cat].map(p => (
              <div key={p.id} style={{ padding: '30px 0', borderBottom: '1px solid #f2f2f2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{p.nome_piatto}</h3>
                    <span style={{ fontWeight: 'bold', color: pColor, fontSize:'1.2rem' }}>€ {p.prezzo}</span>
                </div>
                <p style={{ margin: '10px 0', color: '#666', fontFamily: 'sans-serif', fontSize: '1rem', lineHeight: '1.5' }}>{p.descrizione}</p>
                {p.vino_consigliato_id && (
                  <button onClick={() => scrollToWine(p.vino_consigliato_id, p.wl_vini?.wl_categorie_vini?.nome)} style={{ background: 'none', border: `1px solid ${pColor}`, color: pColor, padding: '10px 18px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display:'flex', alignItems:'center', gap:'8px', marginTop:'15px' }}>
                    <Wine size={16} /> CONSIGLIATO: {p.wl_vini?.wl_vini_master?.nome_vino}
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </main>

      {/* FOOTER PREMIUM - SFONDO CHIARO */}
      <footer style={{ marginTop: '100px', padding: '60px 20px', background: '#fcfcfc', borderTop: '1px solid #eee', textAlign: 'center' }}>
        <img src="https://www.winelink.info/wp-content/uploads/2026/02/logo-orizzontale_wine_link.png" style={{ maxHeight: '50px', marginBottom: '20px' }} alt="winelink" />
        <p style={{ margin: '0', fontSize: '0.95rem', color:'#444' }}>Un progetto <b>SuPeR horeca edition</b></p>
        <a href="https://www.winelink.info" target="_blank" style={{ color: pColor, textDecoration: 'none', fontSize: '0.9rem', display:'block', marginTop:'5px' }}>www.winelink.info</a>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '35px', marginTop: '40px' }}>
          <a href="mailto:info@superstart.it" style={{ color: '#333' }}><Mail size={26} /></a>
          <a href="tel:+393934533500" style={{ color: '#333' }}><Phone size={26} /></a>
          <a href="https://wa.me/393934533500" style={{ color: '#25D366' }}><MessageCircle size={30} /></a>
        </div>
        <p style={{ marginTop: '50px', fontSize: '10px', opacity: 0.4, letterSpacing: '2px', textTransform:'uppercase' }}>Connessioni di Gusto - Lazio Innova</p>
      </footer>
    </div>
  );
}
export default PublicMenu;