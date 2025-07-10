import React, { useEffect, useState } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

// Theme and color palette
const COLORS = {
  accent: '#fbc02d',
  primary: '#1976d2',
  secondary: '#424242',
};

// Simple unique ID generator for optimistic updates (not used with Supabase IDs, but for local)
const uuid = () => '_' + Math.random().toString(36).substr(2, 9);

// PUBLIC_INTERFACE
function App() {
  // UI State
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editorMode, setEditorMode] = useState(null); // 'new', 'edit', or null
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // For light theme (force light as per requirements)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Fetch notes from Supabase
  useEffect(() => {
    fetchNotes();
  }, []);

  // PUBLIC_INTERFACE
  async function fetchNotes() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error) setNotes(data ?? []);
    else setError('Failed to fetch notes');
    setLoading(false);
  }

  // PUBLIC_INTERFACE
  async function handleNewNote() {
    setNoteForm({ title: '', content: '' });
    setEditorMode('new');
    setSelectedId(null);
  }

  // PUBLIC_INTERFACE
  async function handleEditNote(note) {
    setNoteForm({ title: note.title, content: note.content });
    setEditorMode('edit');
    setSelectedId(note.id);
  }

  // PUBLIC_INTERFACE
  async function handleDeleteNote(noteId) {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (!error) {
      setNotes(notes => notes.filter(note => note.id !== noteId));
      setSelectedId(null);
      setEditorMode(null);
    } else setError('Delete failed');
    setLoading(false);
  }

  // PUBLIC_INTERFACE
  async function handleFormSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!noteForm.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }
    // Edit Note
    if (editorMode === 'edit' && selectedId) {
      const { error, data } = await supabase
        .from('notes')
        .update({ title: noteForm.title, content: noteForm.content })
        .eq('id', selectedId)
        .select();
      if (!error) {
        setNotes(notes =>
          notes.map(n => (n.id === selectedId ? { ...data[0] } : n))
        );
        setEditorMode(null);
      } else {
        setError('Update failed');
      }
      setLoading(false);
      return;
    }
    // New Note
    if (editorMode === 'new') {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          { title: noteForm.title, content: noteForm.content },
        ])
        .select();
      if (!error && data[0]) {
        setNotes(notes => [data[0], ...notes]);
        setEditorMode(null);
      } else {
        setError('Create failed');
      }
      setLoading(false);
      return;
    }
  }

  // PUBLIC_INTERFACE
  function handleNoteSelect(note) {
    setSelectedId(note.id);
    setEditorMode(null);
  }

  // PUBLIC_INTERFACE
  function handleInputChange(e) {
    setNoteForm(f => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  }

  function getSelectedNote() {
    return notes.find(n => n.id === selectedId);
  }

  return (
    <div className="App" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{
        height: 64,
        background: COLORS.primary,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        boxShadow: '0 1px 8px rgba(60,60,100,0.07)',
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}>
        <div style={{ fontSize: 28, letterSpacing: '0.01em' }}>
          📝 Notes App
        </div>
        <div style={{
          padding: '6px 16px',
          borderRadius: 8,
          fontSize: 16,
          color: COLORS.primary,
          background: COLORS.accent,
          fontWeight: 600,
          opacity: 0.93,
        }}>
          Modern, Light Theme
        </div>
      </header>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Sidebar Navigation */}
        <aside style={{
          width: 240,
          background: COLORS.secondary,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem 0.75rem',
          boxShadow: '2px 0 7px 0 rgba(50,50,50,.04)',
        }}>
          <button
            onClick={handleNewNote}
            style={{
              background: COLORS.accent,
              color: '#222',
              fontWeight: 600,
              fontSize: 16,
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              marginBottom: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(30,30,60,0.07)',
              transition: 'background 0.2s',
            }}
          >+ New Note</button>

          <div className="notes-list" style={{flex: 1, overflowY: 'auto', marginTop: 6}}>
            {loading &&
              <div style={{ color: COLORS.accent, margin: 12, fontWeight: 600 }}>Loading...</div>
            }
            {notes.length === 0 && !loading && <div style={{ color: '#eee' }}>No notes yet</div>}
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => handleNoteSelect(note)}
                style={{
                  borderRadius: 7,
                  background: (selectedId === note.id ? COLORS.primary : 'rgba(255,255,255,0.03)'),
                  color: (selectedId === note.id ? '#fff' : '#eee'),
                  margin: '4px 0',
                  padding: '10px 12px 10px 16px',
                  cursor: 'pointer',
                  fontWeight: (selectedId === note.id ? 700 : 400),
                  borderLeft: `5px solid ${selectedId===note.id ? COLORS.accent : 'transparent'}`,
                  boxShadow: selectedId===note.id ? '0 2px 8px rgba(30,30,60,0.04)' : undefined,
                  transition: 'all 0.17s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 120 }}>{note.title}</span>
                <span
                  title="Delete"
                  onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}
                  style={{
                    color: '#ffd54f',
                    fontWeight: 700,
                    fontSize: 17,
                    marginLeft: 10,
                    cursor: 'pointer',
                    padding: 3,
                    transition: 'color 0.18s'
                  }}
                >✕</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Workspace */}
        <main style={{
          flex: 1,
          background: 'var(--bg-secondary)',
          padding: '32px 36px 32px 36px',
          minWidth: 0,
          overflowY: 'auto',
          position: 'relative'
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              margin: '8px 0 20px 0', color: '#d32f2f', background: '#fff3e0',
              border: `1.5px solid ${COLORS.accent}`,
              borderRadius: 6,
              padding: 10,
              fontWeight: 500,
              fontSize: 15,
              maxWidth: 460,
            }}>
              {error}
            </div>
          )}

          {/* Editor for new/edit */}
          {(editorMode === 'new' || editorMode === 'edit') && (
            <form 
              onSubmit={handleFormSubmit}
              style={{
                border: `2px solid ${COLORS.primary}`,
                borderRadius: 10,
                padding: 30,
                background: '#fff',
                maxWidth: 480,
                margin: '24px auto',
                boxShadow: '0 4px 12px 0 rgba(34,69,130,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{fontSize: 22, fontWeight: 700, color: COLORS.primary, textAlign: 'left'}}>
                {editorMode === 'edit' ? 'Edit Note' : 'New Note'}
              </div>
              <input
                name="title"
                value={noteForm.title}
                onChange={handleInputChange}
                placeholder="Title"
                maxLength={100}
                required
                style={{
                  fontSize: 18,
                  padding: 10,
                  borderRadius: 7,
                  border: `1.6px solid ${COLORS.accent}`,
                  outline: 'none',
                  color: COLORS.primary,
                  background: '#f5f7fd',
                  fontWeight: 500,
                }}
              />
              <textarea
                name="content"
                value={noteForm.content}
                onChange={handleInputChange}
                placeholder="Write your note here..."
                rows={8}
                maxLength={4096}
                style={{
                  fontSize: 16,
                  padding: 10,
                  borderRadius: 7,
                  border: `1.5px solid ${COLORS.accent}`,
                  background: '#f8fbff',
                  resize: 'vertical',
                  minHeight: 96,
                  color: COLORS.secondary,
                  fontFamily: 'inherit'
                }}
              />
              <div style={{display: 'flex', gap: 12, marginTop: 8}}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: COLORS.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 7,
                    fontWeight: 700,
                    padding: '10px 22px',
                    fontSize: 16,
                    opacity: loading ? 0.7 : 1,
                    cursor: 'pointer',
                  }}
                >Save</button>
                <button
                  type="button"
                  onClick={() => { setEditorMode(null); setError(''); }}
                  style={{
                    background: '#eeeaf2',
                    color: COLORS.secondary,
                    border: `1.5px solid ${COLORS.secondary}`,
                    borderRadius: 7,
                    fontWeight: 600,
                    padding: '10px 20px',
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >Cancel</button>
              </div>
            </form>
          )}

          {/* Note Details */}
          {(!editorMode && selectedId && getSelectedNote()) && (
            <section style={{
              border: `2.5px solid ${COLORS.accent}`,
              borderRadius: 12,
              background: '#fff',
              maxWidth: 620,
              margin: '0 auto',
              padding: '38px 36px 30px 36px',
              boxShadow: '0 4px 16px 0 rgba(50,50,90,0.08)',
              textAlign: 'left',
              position: 'relative'
            }}>
              <h2 style={{margin:0, color: COLORS.primary, fontSize: 27, letterSpacing: '0.005em'}}>
                {getSelectedNote().title}
              </h2>
              <div style={{
                margin: '18px 0 0 0',
                fontSize: 16.5,
                color: COLORS.secondary,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                minHeight: 70,
              }}>
                {getSelectedNote().content || <i style={{color: COLORS.accent}}>No content.</i>}
              </div>
              <div style={{
                marginTop: 32,
                display: 'flex', gap: 12,
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={() => handleEditNote(getSelectedNote())}
                  style={{
                    background: COLORS.primary,
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 7,
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}>Edit</button>
                <button
                  onClick={() => handleDeleteNote(getSelectedNote().id)}
                  style={{
                    background: '#fff8e1',
                    color: COLORS.accent,
                    border: `1.3px solid ${COLORS.accent}`,
                    borderRadius: 7,
                    fontWeight: 600,
                    fontSize: 15,
                    padding: '8px 18px',
                    cursor: 'pointer',
                  }}>Delete</button>
              </div>
            </section>
          )}

          {/* Empty state */}
          {(!editorMode && !selectedId && notes.length > 0) && (
            <div style={{
              color: COLORS.secondary,
              textAlign: 'center',
              fontSize: 21,
              fontWeight: 500,
              marginTop: 90
            }}>
              Select a note to view details.
            </div>
          )}

          {/* Totally empty state */}
          {(notes.length === 0 && !editorMode && !loading) && (
            <div style={{
              color: COLORS.primary,
              textAlign: 'center',
              fontSize: 23,
              fontWeight: 500,
              marginTop: 110,
            }}>
              No notes found. <br />
              <span style={{ color: COLORS.accent, fontWeight:700 }}>Create your first note!</span>
            </div>
          )}
        </main>
      </div>
      <footer style={{
        background: COLORS.secondary,
        color: '#eee',
        textAlign: 'right',
        fontSize: 13,
        height: 32,
        lineHeight: '32px',
        padding: '0 16px',
        letterSpacing: '0.01em',
        boxShadow: '0 -2px 6px rgba(42,34,42,0.05)',
      }}>
        Powered by React • Supabase • Kavia
      </footer>
    </div>
  );
}

export default App;
