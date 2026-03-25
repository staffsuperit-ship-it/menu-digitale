import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminConfig() {
  const [regioni, setRegioni] = useState([]);
  const [catVini, setCatVini] = useState([]);
  const [catPiatti, setCatPiatti] = useState([]);
  const [inputs, setInputs] = useState({ regione: '', catVino: '', catPiatto: '' });

  useEffect(() => { fetchDati(); }, []);

  const fetchDati = async () => {
    const r = await supabase.from('wl_regioni').select('*').order('nome');
    const cv = await supabase.from('wl_categorie_vini').select('*').order('ordine');
    const cp = await supabase.from('wl_categorie_piatti').select('*').order('ordine');
    setRegioni(r.data || []); setCatVini(cv.data || []); setCatPiatti(cp.data || []);
  };

  const add = async (table, value, field = 'nome') => {
    if (!value) return;
    await supabase.from(table).insert([{ [field]: value, ordine: 99 }]);
    setInputs({ ...inputs, [table === 'wl_regioni' ? 'regione' : table === 'wl_categorie_vini' ? 'catVino' : 'catPiatto']: '' });
    fetchDati();
  };

  const remove = async (table, id) => {
    if (window.confirm("Eliminare?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchDati();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>⚙️ Configurazione Tabelle</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        <section style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
          <h3>🌍 Regioni</h3>
          <input value={inputs.regione} onChange={e => setInputs({...inputs, regione: e.target.value})} />
          <button onClick={() => add('wl_regioni', inputs.regione)}>Aggiungi</button>
          <ul style={{maxHeight:'200px', overflowY:'auto'}}>{regioni.map(x => <li key={x.id}>{x.nome} <button onClick={() => remove('wl_regioni', x.id)}>x</button></li>)}</ul>
        </section>

        <section style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
          <h3>🍷 Categorie Vini</h3>
          <input value={inputs.catVino} onChange={e => setInputs({...inputs, catVino: e.target.value})} />
          <button onClick={() => add('wl_categorie_vini', inputs.catVino)}>Aggiungi</button>
          <ul>{catVini.map(x => <li key={x.id}>{x.nome} <button onClick={() => remove('wl_categorie_vini', x.id)}>x</button></li>)}</ul>
        </section>

        <section style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
          <h3>🍽️ Sezioni Menù Piatti</h3>
          <input value={inputs.catPiatto} onChange={e => setInputs({...inputs, catPiatto: e.target.value})} />
          <button onClick={() => add('wl_categorie_piatti', inputs.catPiatto)}>Aggiungi</button>
          <ul>{catPiatti.map(x => <li key={x.id}>{x.nome} <button onClick={() => remove('wl_categorie_piatti', x.id)}>x</button></li>)}</ul>
        </section>

      </div>
    </div>
  );
}
export default AdminConfig;