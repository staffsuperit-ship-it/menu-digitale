import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Wine, Check, Search, X, Mail, Phone, MessageCircle } from 'lucide-react';

function PublicMenu() {
  const { slug } = useParams();
  const [locale, setLocale] = useState(null);
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
      .select('*, wl_vini_master(*, wl_regioni(nome, ordine)), wl_categorie_vini(nome, ordine)')
      .eq('locale_id', loc.id); // Prendiamo tutto, anche non disponibili

    const sortedVini = (vData || []).sort((a, b) => {
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

    const gV = sortedVini.reduce((acc, v) => {
      const cat = v.wl_categorie_vini?.nome || 'In Carta';
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

  const scrollToWine = (id, categoria) => {
    setTab('vini');
    setSubTabVino(categoria);
    setTimeout(() => viniRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  };

  if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Caricamento...</div>;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'serif' }}>
      <header style={{ textAlign: 'center', padding: '30px' }}>
        {locale.logo_url && <img src={locale.logo_url} style={{ maxHeight: '90px' }} alt="logo" />}
        <h1 style={{ color: locale.colore_primario, textTransform: 'uppercase' }}>{locale.nome}</h1>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setTab('vini')} style={{ border: 'none', padding: '10px 20px', borderRadius: '5px', background: tab === 'vini' ? locale.colore_primario : '#eee', color: tab === 'vini' ? 'white' : '#666', fontWeight:'bold' }}>CARTA VINI</button>
        {Object.keys(piattiGruppati).length > 0 && <button onClick={() => setTab('piatti')} style={{ border: 'none', padding: '10px 20px', borderRadius: '5px', background: tab === 'piatti' ? locale.colore_primario : '#eee', color: tab === 'piatti' ? 'white' : '#666', fontWeight:'bold' }}>MENÙ PIATTI</button>}
      </div>

      {tab === 'vini' && (
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px', justifyContent: 'center', borderBottom: '1px solid #eee' }}>
          {Object.keys(viniGruppati).map(cat => (
            <button key={cat} onClick={() => setSubTabVino(cat)} style={{ border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.8rem', background: subTabVino === cat ? '#333' : '#f4f4f4', color: subTabVino === cat ? 'white' : '#888', whiteSpace:'nowrap' }}>{cat.toUpperCase()}</button>
          ))}
        </div>
      )}

      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
        {tab === 'vini' && viniGruppati[subTabVino]?.map(v => {
          const vm = v.wl_vini_master;
          return (
            <div key={v.id} ref={el => viniRefs.current[v.id] = el} style={{ padding: '40px 0', borderBottom: '1px solid #f2f2f2', textAlign: 'center', opacity: v.disponibile ? 1 : 0.6 }}>
              {!v.disponibile && <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px', textTransform:'uppercase' }}>— Non Disponibile —</div>}
              {vm.immagine_url && <img src={vm.immagine_url} style={{ maxHeight: '250px', marginBottom: '20px', filter: v.disponibile ? 'none' : 'grayscale(1)' }} alt="vino" />}
              <h3 style={{ margin: 0, color: locale.colore_primario, fontSize: '1.5rem' }}>{vm.nome_vino}</h3>
              <p style={{ margin: '5px 0' }}>{vm.cantina}</p>
              <div style={{ marginTop: '8px' }}><span style={{ background: locale.colore_secondario, color: 'white', padding: '4px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>{vm.wl_regioni?.nome}</span></div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '15px 0' }}>€ {v.prezzo}</div>
              <div style={{ textAlign: 'left', fontSize: '0.85rem', color: '#666', fontFamily: 'sans-serif' }}>
                {vm.denominazione && <p style={{margin:'4px 0'}}><Check size={14} color={locale.colore_primario}/> <b>Denominazione:</b> {vm.denominazione}</p>}
                {vm.uvaggio && <p style={{margin:'4px 0'}}><Check size={14} color={locale.colore_primario}/> <b>Uve:</b> {vm.uvaggio}</p>}
                {vm.affinamento && <p style={{margin:'4px 0'}}><Check size={14} color={locale.colore_primario}/> <b>Affinamento:</b> {vm.affinamento}</p>}
                {vm.gradazione && <p style={{margin:'4px 0'}}><Check size={14} color={locale.colore_primario}/> <b>Gradazione:</b> {vm.gradazione}</p>}
                {vm.olfatto && <div style={{fontStyle:'italic', marginTop:'10px', color:'#444'}}>👃 {vm.olfatto}</div>}
                {vm.gusto && <div style={{fontStyle:'italic', marginTop:'5px', color:'#444'}}>👄 {vm.gusto}</div>}
              </div>
            </div>
          );
        })}

        {tab === 'piatti' && Object.keys(piattiGruppati).map(cat => (
          <div key={cat}>
            <h2 style={{ color: locale.colore_primario, borderBottom: '2px solid #f2f2f2', marginTop: '40px', fontSize:'1.2rem' }}>{cat.toUpperCase()}</h2>
            {piattiGruppati[cat].map(p => (
              <div key={p.id} style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>{p.nome_piatto}</h3><b>€ {p.prezzo}</b></div>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{p.descrizione}</p>
                {p.vino_consigliato_id && (
                  <button onClick={() => scrollToWine(p.vino_consigliato_id, p.wl_vini?.wl_categorie_vini?.nome)} style={{ background: 'none', border: `1px solid ${locale.colore_primario}`, color: locale.colore_primario, padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    🍷 CONSIGLIATO: {p.wl_vini?.wl_vini_master?.nome_vino}
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </main>

      <footer style={{ marginTop: '60px', padding: '50px 20px', background: '#222', color: 'white', textAlign: 'center' }}>
        <img src="https://www.winelink.info/wp-content/uploads/2026/02/logo-orizzontale_wine_link.png" style={{ maxHeight: '40px', filter: 'invert(1)' }} alt="winelink" />
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '30px' }}>
          <a href="mailto:info@superstart.it" style={{ color: 'white' }}><Mail size={22} /></a>
          <a href="tel:+393934533500" style={{ color: 'white' }}><Phone size={22} /></a>
          <a href="https://wa.me/393934533500" style={{ color: '#25D366' }}><MessageCircle size={28} /></a>
        </div>
      </footer>
    </div>
  );
}
export default PublicMenu;