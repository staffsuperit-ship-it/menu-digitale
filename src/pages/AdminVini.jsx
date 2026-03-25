import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminVini() {
  const [viniLocale, setViniLocale] = useState([]);
  const [catalogoMaster, setCatalogoMaster] = useState([]);
  const [associazioni, setAssociazioni] = useState({}); // Tiene traccia di dove sono i vini
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
    
    // Recuperiamo tutte le associazioni esistenti per sapere dove sono i vini
    const { data: AllVini } = await supabase.from('wl_vini').select('vini_master_id, wl_locali(nome)');
    const mapping = (AllVini || []).reduce((acc, item) => {
        const id = item.vini_master_id;
        if (!acc[id]) acc[id] = [];
        acc[id].push(item.wl_locali?.nome);
        return acc;
    }, {});

    setLocali(L || []); setCatalogoMaster(M || []); setRegioni(R || []); setCategorie(C || []);
    setAssociazioni(mapping);
    if (localeSelezionato) fetchViniLocale(localeSelezionato);
  };

  const fetchViniLocale = async (id) => {
    if(!id) return;
    const { data } = await supabase.from('wl_vini').select('*, wl_vini_master(*), wl_categorie_vini(nome)').eq('locale_id', id);
    setViniLocale(data || []);
  };

  const saveMaster = async (e) => {
    e.preventDefault();
    if (editMasterId) await supabase.from('wl_vini_master').update(masterForm).eq('id', editMasterId);
    else await supabase.from('wl_vini_master').insert([masterForm]);
    setMasterForm(initialMaster); setEditMasterId(null); setShowMaster(false); fetchDati();
  };

  const deleteMaster = async (id) => {
    if (associazioni[id] && associazioni[id].length > 0) {
        alert(`Impossibile eliminare: questo vino è presente in carta presso: ${associazioni[id].join(', ')}. Rimuovilo prima dalle carte dei locali.`);
        return;
    }
    if (window.confirm("Sei sicuro di voler eliminare definitivamente questo vino dal catalogo globale?")) {
        await supabase.from('wl_vini_master').delete().eq('id', id);
        fetchDati();
    }
  };

  const linkVino = async (e) => {
    e.preventDefault();
    await supabase.from('wl_vini').insert([{ ...linkForm, locale_id: localeSelezionato, disponibile: true }]);
    setLinkForm({ vini_master_id: '', categoria_id: '', prezzo: '', winelink_selection: false });
    fetchViniLocale(localeSelezionato);
  };

  const startEditMaster = (v) => {
    setEditMasterId(v.id); setMasterForm(v); setShowMaster(true); window.scrollTo(0,0);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{color: '#992235'}}>🍾 Gestione WineLink Cockpit</h2>
      
      <div style={{ background: '#333', color: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <select value={localeSelezionato} onChange={e => {setLocaleSelezionato(e.target.value); fetchViniLocale(e.target.value);}}>
          <option value="">-- Seleziona Locale --</option>
          {locali.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <section>
          <button onClick={() => {setShowMaster(!showMaster); setEditMasterId(null); setMasterForm(initialMaster);}} style={{marginBottom:'10px', background:'#EEB336', border:'none', padding:'10px', borderRadius:'5px', fontWeight:'bold', cursor:'pointer'}}>
            {showMaster ? "Annulla" : "🆕 Nuovo Vino nel Catalogo Master"}
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
                <input placeholder="Uve" value={masterForm.uvaggio} onChange={e => setMasterForm({...masterForm, uvaggio: e.target.value})} />
                <input placeholder="Affinamento" value={masterForm.affinamento} onChange={e => setMasterForm({...masterForm, affinamento: e.target.value})} />
                <input placeholder="Gradazione" value={masterForm.gradazione} onChange={e => setMasterForm({...masterForm, gradazione: e.target.value})} />
                <input placeholder="Link Immagine" value={masterForm.immagine_url} onChange={e => setMasterForm({...masterForm, immagine_url: e.target.value})} />
              </div>
              <textarea placeholder="Olfatto" value={masterForm.olfatto} onChange={e => setMasterForm({...masterForm, olfatto: e.target.value})} style={{width:'98%', marginTop:'10px', height:'40px'}} />
              <textarea placeholder="Gusto" value={masterForm.gusto} onChange={e => setMasterForm({...masterForm, gusto: e.target.value})} style={{width:'98%', marginTop:'5px', height:'40px'}} />
              <button type="submit" style={{width:'100%', marginTop:'10px', background:'#333', color:'#fff', padding:'10px', cursor:'pointer'}}>{editMasterId ? "AGGIORNA" : "SALVA"}</button>
            </form>
          ) : (
            <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', border:'1px solid #ddd' }}>
              <form onSubmit={linkVino}>
                <select value={linkForm.vini_master_id} onChange={e => setLinkForm({...linkForm, vini_master_id: e.target.value})} required style={{width:'100%', padding:'10px', marginBottom:'10px'}}>
                    <option value="">-- Seleziona dal Catalogo --</option>
                    {catalogoMaster.map(m => <option key={m.id} value={m.id}>{m.nome_vino} ({m.cantina})</option>)}
                </select>
                <select value={linkForm.categoria_id} onChange={e => setLinkForm({...linkForm, categoria_id: e.target.value})} required style={{width:'100%', padding:'10px', marginBottom:'10px'}}>
                    <option value="">-- Categoria in carta --</option>
                    {categorie.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <input type="number" step="0.01" value={linkForm.prezzo} onChange={e => setLinkForm({...linkForm, prezzo: e.target.value})} required placeholder="Prezzo Locale (€)" style={{width:'96%', padding:'10px', marginBottom:'10px'}} />
                <label style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', fontWeight:'bold', color:'#992235'}}><input type="checkbox" checked={linkForm.winelink_selection} onChange={e => setLinkForm({...linkForm, winelink_selection: e.target.checked})} /> ⭐ WineLink Selection</label>
                <button type="submit" disabled={!localeSelezionato} style={{width:'100%', background: localeSelezionato ? '#992235' : '#ccc', color:'#fff', padding:'12px', border:'none', cursor:'pointer', fontWeight:'bold', borderRadius:'5px'}}>METTI IN CARTA</button>
              </form>
            </div>
          )}

          <div style={{marginTop:'30px'}}>
            <h4>Anagrafe Catalogo Master (Modifica & Elimina)</h4>
            <div style={{maxHeight:'400px', overflowY:'auto', background:'#fff', border:'1px solid #eee', borderRadius:'5px'}}>
              <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#eee'}}><th style={{textAlign:'left', padding:'8px'}}>Vino</th><th style={{textAlign:'left'}}>Locali</th><th>Azioni</th></tr></thead>
                <tbody>
                  {catalogoMaster.map(m => (
                    <tr key={m.id} style={{borderBottom:'1px solid #eee'}}>
                        <td style={{padding:'8px'}}><b>{m.nome_vino}</b><br/>{m.cantina}</td>
                        <td style={{color:'#666'}}>{associazioni[m.id]?.join(', ') || 'Nessuno'}</td>
                        <td style={{textAlign:'center', whiteSpace:'nowrap'}}>
                            <button onClick={() => startEditMaster(m)} style={{marginRight:'5px', cursor:'pointer'}}>M</button>
                            <button onClick={() => deleteMaster(m.id)} style={{color:'red', cursor:'pointer'}}>E</button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h3>📋 Carta Attuale Locale</h3>
          {viniLocale.map(v => (
            <div key={v.id} style={{ padding: '12px', border: '1px solid #eee', borderRadius:'8px', marginBottom:'5px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'white' }}>
              <div><strong>{v.wl_vini_master?.nome_vino}</strong> {v.winelink_selection && '⭐'}<br/><small>{v.wl_categorie_vini?.nome} - {v.prezzo}€</small></div>
              <div style={{display:'flex', gap:'5px'}}>
                <button onClick={async () => { await supabase.from('wl_vini').update({disponibile: !v.disponibile}).eq('id', v.id); fetchViniLocale(localeSelezionato); }} style={{fontSize:'10px', padding:'5px', borderRadius:'4px', cursor:'pointer', background: v.disponibile ? '#D5E0A0' : '#ff4444'}}>{v.disponibile ? "In Carta" : "Esaurito"}</button>
                <button onClick={async () => { if(window.confirm("Rimuovere dalla carta di questo locale?")) { await supabase.from('wl_vini').delete().eq('id', v.id); fetchViniLocale(localeSelezionato); } }} style={{background:'none', border:'none', color:'red', cursor:'pointer'}}>🗑️</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
export default AdminVini;