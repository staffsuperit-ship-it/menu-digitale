import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ALLERGENI = ["Glutine", "Crostacei", "Uova", "Pesce", "Arachidi", "Soia", "Latte", "Frutta a guscio", "Sedano", "Senape", "Sesamo", "Anidride solforosa", "Lupini", "Molluschi"];

function AdminPiatti() {
  const [piatti, setPiatti] = useState([]);
  const [locali, setLocali] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [vini, setVini] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = { locale_id: '', categoria_id: '', nome_piatto: '', descrizione: '', prezzo: '', allergeni: [], vino_consigliato_id: '', disponibile: true };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchDati(); }, []);

  const fetchDati = async () => {
    const { data: L } = await supabase.from('wl_locali').select('*').order('nome');
    const { data: C } = await supabase.from('wl_categorie_piatti').select('*').order('ordine');
    const { data: P } = await supabase.from('wl_piatti').select('*, wl_categorie_piatti(nome), wl_vini(id, wl_vini_master(nome_vino))');
    
    setLocali(L || []); 
    setCategorie(C || []); 
    setPiatti(P || []);
  };

  // Carica i vini quando selezioni un locale (per l'abbinamento)
  const handleLocaleChange = async (id) => {
    setForm(prev => ({...prev, locale_id: id}));
    const { data } = await supabase.from('wl_vini')
      .select('id, wl_vini_master(nome_vino)')
      .eq('locale_id', id);
    setVini(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toSave = {...form};
    // Pulizia dati per Supabase
    delete toSave.id; 
    delete toSave.wl_categorie_piatti; 
    delete toSave.wl_vini;
    delete toSave.created_at;

    if (editingId) {
      const { error } = await supabase.from('wl_piatti').update(toSave).eq('id', editingId);
      if (error) alert("Errore modifica: " + error.message);
      else alert("✅ Piatto aggiornato!");
    } else {
      const { error } = await supabase.from('wl_piatti').insert([toSave]);
      if (error) alert("Errore inserimento: " + error.message);
      else alert("✅ Piatto aggiunto!");
    }
    
    setForm(initialForm);
    setEditingId(null);
    fetchDati();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      locale_id: p.locale_id,
      categoria_id: p.categoria_id,
      nome_piatto: p.nome_piatto,
      descrizione: p.descrizione || '',
      prezzo: p.prezzo,
      allergeni: p.allergeni || [],
      vino_consigliato_id: p.vino_consigliato_id || '',
      disponibile: p.disponibile
    });
    handleLocaleChange(p.locale_id); // Carica i vini di quel locale per l'abbinamento
    window.scrollTo(0,0);
  };

  const eliminaPiatto = async (id) => {
    if(window.confirm("Eliminare definitivamente questo piatto?")) {
        await supabase.from('wl_piatti').delete().eq('id', id);
        fetchDati();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{color: '#992235'}}>{editingId ? "📝 Modifica Piatto" : "🍝 Gestione Menù Piatti"}</h2>

      <form onSubmit={handleSubmit} style={{ background: editingId ? '#e3f2fd' : '#f9f9f9', padding: '20px', borderRadius: '10px', border: '1px solid #ddd' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <select value={form.locale_id} onChange={e => handleLocaleChange(e.target.value)} required>
                <option value="">-- Seleziona Locale --</option>
                {locali.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
            </select>
            <select value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})} required>
                <option value="">-- Sezione Menù (Antipasti...) --</option>
                {categorie.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
            </select>
        </div>

        <input placeholder="Nome del Piatto" value={form.nome_piatto} onChange={e => setForm({...form, nome_piatto: e.target.value})} required style={{width:'100%', padding: '10px', boxSizing: 'border-box', marginBottom: '10px'}} />
        
        <textarea placeholder="Descrizione e ingredienti" value={form.descrizione} onChange={e => setForm({...form, descrizione: e.target.value})} style={{width:'100%', padding: '10px', boxSizing: 'border-box', height: '80px', marginBottom: '10px'}} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input type="number" step="0.01" placeholder="Prezzo (€)" value={form.prezzo} onChange={e => setForm({...form, prezzo: e.target.value})} required style={{padding: '10px'}} />
            <select value={form.vino_consigliato_id} onChange={e => setForm({...form, vino_consigliato_id: e.target.value})} style={{padding: '10px'}}>
                <option value="">-- Abbinamento Vino Consigliato --</option>
                {vini.map(v => <option key={v.id} value={v.id}>{v.wl_vini_master?.nome_vino}</option>)}
            </select>
        </div>

        <div style={{margin:'15px 0', background: '#fff', padding: '15px', borderRadius: '5px', border: '1px solid #eee'}}>
          <b style={{fontSize: '0.9rem'}}>Allergeni (Seleziona quelli presenti):</b><br/>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '5px', marginTop: '10px'}}>
            {ALLERGENI.map(a => (
                <label key={a} style={{fontSize:'12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                    <input type="checkbox" checked={form.allergeni.includes(a)} onChange={() => setForm({...form, allergeni: form.allergeni.includes(a) ? form.allergeni.filter(i=>i!==a) : [...form.allergeni, a]})} /> 
                    {a}
                </label>
            ))}
          </div>
        </div>

        <div style={{display: 'flex', gap: '10px'}}>
            <button type="submit" style={{ flex: 2, background: '#992235', color: '#fff', padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                {editingId ? "SALVA MODIFICHE" : "AGGIUNGI AL MENÙ"}
            </button>
            {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setForm(initialForm);}} style={{ flex: 1, background: '#666', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Annulla
                </button>
            )}
        </div>
      </form>

      <h3 style={{marginTop:'30px'}}>Elenco Piatti Caricati</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {piatti.map(p => (
          <div key={p.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', background: p.disponibile ? '#fff' : '#f0f0f0', position: 'relative' }}>
            <div style={{fontSize: '0.7rem', color: '#992235', fontWeight: 'bold', textTransform: 'uppercase'}}>{p.wl_categorie_piatti?.nome}</div>
            <strong style={{fontSize: '1.1rem'}}>{p.nome_piatto}</strong>
            <div style={{color: '#666', fontSize: '0.9rem', margin: '5px 0'}}>{p.descrizione?.substring(0, 60)}...</div>
            <div style={{fontWeight: 'bold'}}>{p.prezzo} €</div>
            
            {p.wl_vini && <div style={{fontSize: '0.8rem', color: '#992235', marginTop: '5px'}}>🍷 {p.wl_vini.wl_vini_master?.nome_vino}</div>}

            <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                <button onClick={() => startEdit(p)} style={{ flex: 1, padding: '5px', fontSize: '0.8rem', cursor: 'pointer' }}>Modifica</button>
                <button onClick={() => eliminaPiatto(p.id)} style={{ flex: 1, padding: '5px', fontSize: '0.8rem', cursor: 'pointer', color: 'red' }}>Elimina</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default AdminPiatti;