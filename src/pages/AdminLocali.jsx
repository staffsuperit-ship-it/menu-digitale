import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminLocali() {
  const [locali, setLocali] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const initialForm = { nome: '', slug: '', logo_url: '', colore_primario: '#992235', colore_secondario: '#EEB336', colore_sfondo: '#ffffff' };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchLocali(); }, []);

  const fetchLocali = async () => {
    const { data } = await supabase.from('wl_locali').select('*').order('nome');
    setLocali(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('wl_locali').update(form).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('wl_locali').insert([form]);
    }
    setForm(initialForm);
    fetchLocali();
  };

  const startEdit = (l) => {
    setEditingId(l.id);
    setForm(l);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{editingId ? "🎨 Modifica Locale" : "🏢 Gestione Locali"}</h2>
      
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '10px', display: 'grid', gap: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input placeholder="Nome Locale" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
          <input placeholder="Slug (es: enoteca-rossi)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
        </div>
        <input placeholder="URL Logo" value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})} />
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '5px' }}>
          <label>Primario (Rosso): <input type="color" value={form.colore_primario} onChange={e => setForm({...form, colore_primario: e.target.value})} /></label>
          <label>Secondario (Giallo): <input type="color" value={form.colore_secondario} onChange={e => setForm({...form, colore_secondario: e.target.value})} /></label>
          <label>Sfondo: <input type="color" value={form.colore_sfondo} onChange={e => setForm({...form, colore_sfondo: e.target.value})} /></label>
        </div>

        <button type="submit" style={{ background: '#992235', color: '#fff', padding: '10px', border: 'none', cursor: 'pointer' }}>
          {editingId ? "SALVA MODIFICHE" : "CREA LOCALE"}
        </button>
        {editingId && <button onClick={() => {setEditingId(null); setForm(initialForm);}}>Annulla</button>}
      </form>

      <h3 style={{ marginTop: '30px' }}>Locali Registrati</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {locali.map(l => (
          <div key={l.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <strong>{l.nome}</strong> <small>(/{l.slug})</small>
               <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <div style={{ width: '20px', height: '10px', background: l.colore_primario }}></div>
                  <div style={{ width: '20px', height: '10px', background: l.colore_secondario }}></div>
               </div>
            </div>
            <button onClick={() => startEdit(l)} style={{ padding: '5px 15px' }}>Modifica Colori & Info</button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default AdminLocali;