import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminVini() {
  const [viniLocale, setViniLocale] = useState([]);
  const [catalogoMaster, setCatalogoMaster] = useState([]);
  const [locali, setLocali] = useState([]);
  const [regioni, setRegioni] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [localeSelezionato, setLocaleSelezionato] = useState('');
  const [showMaster, setShowMaster] = useState(false);
  const [editMasterId, setEditMasterId] = useState(null);

  const initialMaster = { nome_vino: '', cantina: '', regione_id: '', denominazione: '', uvaggio: '', affinamento: '', gradazione: '', olfatto: '', gusto: '', immagine_url: '' };
  const [masterForm, setMasterForm] = useState(initialMaster);
  const [linkForm, setLinkForm] = useState({ vini_master_id: '', categoria_id: '', prezzo: '', winelink_selection: false });

  useEffect(() => { fetchDati(); }, []);

  const fetchDati = async () => {
    const { data: L } = await supabase.from('wl_locali').select('*').order('nome');
    const { data: M } = await supabase.from('wl_vini_master').select('*').order('nome_vino');
    const { data: R } = await supabase.from('wl_regioni').select('*').order('ordine');
    const { data: C } = await supabase.from('wl_categorie_vini').select('*').order('ordine');
    setLocali(L || []); setCatalogoMaster(M || []); setRegioni(R || []); setCategorie(C || []);
    if (localeSelezionato) fetchViniLocale(localeSelezionato);
  };

  const fetchViniLocale = async (id) => {
    const { data } = await supabase.from('wl_vini').select('*, wl_vini_master(*), wl_categorie_vini(nome)').eq('locale_id', id);
    setViniLocale(data || []);
  };

  const saveMaster = async (e) => {
    e.preventDefault();
    if (editMasterId) await supabase.from('wl_vini_master').update(masterForm).eq('id', editMasterId);
    else await supabase.from('wl_vini_master').insert([masterForm]);
    setMasterForm(initialMaster); setEditMasterId(null); setShowMaster(false); fetchDati();
  };

  const linkVino = async (e) => {
    e.preventDefault();
    await supabase.from('wl_vini').insert([{ ...linkForm, locale_id: localeSelezionato, disponibile: true }]);
    setLinkForm({ vini_master_id: '', categoria_id: '', prezzo: '', winelink_selection: false });
    fetchViniLocale(localeSelezionato);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>🍾 Gestione Vini</h2>
      <div style={{ background: '#333', color: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <select value={localeSelezionato} onChange={e => {setLocaleSelezionato(e.target.value); fetchViniLocale(e.target.value);}}>
          <option value="">-- Seleziona Locale --</option>
          {locali.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        <section>
          <button onClick={() => {setShowMaster(!showMaster); setEditMasterId(null); setMasterForm(initialMaster);}} style={{marginBottom:'10px', background:'#EEB336', border:'none', padding:'10px', borderRadius:'5px', fontWeight:'bold'}}>
            {showMaster ? "Annulla" : "Crea Nuovo Vino Master"}
          </button>

          {showMaster ? (
            <form onSubmit={saveMaster} style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border:'1px solid #EEB336' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input placeholder="Nome Vino" value={masterForm.nome_vino} onChange={e => setMasterForm({...masterForm, nome_vino: e.target.value})} required />
                <input placeholder="Cantina" value={masterForm.cantina} onChange={e => setMasterForm({...masterForm, cantina: e.target.value})} required />
                <select value={masterForm.regione_id} onChange={e => setMasterForm({...masterForm, regione_id: e.target.value})} required>
                    <option value="">-- Regione --</option>
                    {regioni.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
                <input placeholder="Denominazione" value={masterForm.denominazione} onChange={e => setMasterForm({...masterForm, denominazione: e.target.value})} />
                <input placeholder="Uvaggio" value={masterForm.uvaggio} onChange={e => setMasterForm({...masterForm, uvaggio: e.target.value})} />
                <input placeholder="Affinamento" value={masterForm.affinamento} onChange={e => setMasterForm({...masterForm, affinamento: e.target.value})} />
                <input placeholder="Gradazione" value={masterForm.gradazione} onChange={e => setMasterForm({...masterForm, gradazione: e.target.value})} />
                <input placeholder="Link Immagine" value={masterForm.immagine_url} onChange={e => setMasterForm({...masterForm, immagine_url: e.target.value})} />
              </div>
              <textarea placeholder="Olfatto" value={masterForm.olfatto} onChange={e => setMasterForm({...masterForm, olfatto: e.target.value})} style={{width:'98%', marginTop:'10px'}} />
              <textarea placeholder="Gusto" value={masterForm.gusto} onChange={e => setMasterForm({...masterForm, gusto: e.target.value})} style={{width:'98%', marginTop:'5px'}} />
              <button type="submit" style={{width:'100%', marginTop:'10px', background:'#333', color:'#fff', padding:'10px'}}>SALVA NEL CATALOGO MASTER</button>
            </form>
          ) : (
            <form onSubmit={linkVino} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
              <select value={linkForm.vini_master_id} onChange={e => setLinkForm({...linkForm, vini_master_id: e.target.value})} required style={{width:'100%', padding:'10px', marginBottom:'10px'}}>
                <option value="">-- Scegli Vino Master --</option>
                {catalogoMaster.map(m => <option key={m.id} value={m.id}>{m.nome_vino} ({m.cantina})</option>)}
              </select>
              <select value={linkForm.categoria_id} onChange={e => setLinkForm({...linkForm, categoria_id: e.target.value})} required style={{width:'100%', padding:'10px', marginBottom:'10px'}}>
                <option value="">-- Seleziona Categoria --</option>
                {categorie.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <input type="number" step="0.01" value={linkForm.prezzo} onChange={e => setLinkForm({...linkForm, prezzo: e.target.value})} required placeholder="Prezzo (€)" style={{width:'96%', padding:'10px', marginBottom:'10px'}} />
              <button type="submit" disabled={!localeSelezionato} style={{width:'100%', background:'#992235', color:'#fff', padding:'10px', border:'none', cursor:'pointer'}}>METTI IN CARTA</button>
            </form>
          )}

          <div style={{marginTop:'20px', maxHeight:'300px', overflowY:'auto'}}>
            <h4>Modifica Catalogo Master</h4>
            {catalogoMaster.map(m => (
              <div key={m.id} style={{padding:'5px', borderBottom:'1px solid #eee', fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                {m.nome_vino} <button onClick={() => {setEditMasterId(m.id); setMasterForm(m); setShowMaster(true); window.scrollTo(0,0);}}>Modifica</button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>📋 Carta del Locale</h3>
          {viniLocale.map(v => (
            <div key={v.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius:'8px', marginBottom:'5px', display:'flex', justifyContent:'space-between', alignItems:'center', opacity: v.disponibile ? 1 : 0.5 }}>
              <div><strong>{v.wl_vini_master?.nome_vino}</strong><br/><small>{v.prezzo}€</small></div>
              <div style={{display:'flex', gap:'5px'}}>
                <button onClick={async () => { await supabase.from('wl_vini').update({disponibile: !v.disponibile}).eq('id', v.id); fetchViniLocale(localeSelezionato); }} style={{fontSize:'10px', background: v.disponibile ? '#D5E0A0' : '#ff4444'}}>{v.disponibile ? "In Carta" : "Esaurito"}</button>
                <button onClick={async () => { if(window.confirm("Rimuovere?")) { await supabase.from('wl_vini').delete().eq('id', v.id); fetchViniLocale(localeSelezionato); } }} style={{background:'none', border:'none', color:'red', cursor:'pointer'}}>🗑️</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
export default AdminVini;