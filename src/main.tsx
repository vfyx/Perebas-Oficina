import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './admin/AdminApp';
import { Highlight } from './components/Highlight';
import './admin/admin.css';
import './styles.css';
function App() {
 const [panel, setPanel] = useState(location.hash === '#painel');
 useEffect(() => { const update = () => setPanel(location.hash === '#painel'); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
 return <><aside className="demo-banner">PORTFÓLIO · Conteúdo fictício · Sem backend · Alterações temporárias nesta aba</aside>{panel ? <AdminApp /> : <><header className="portfolio-header"><strong>PEREBA / PORTFÓLIO</strong><a className="adm-btn adm-btn--primary" href="#painel">Abrir demonstração</a></header><section className="hero"><p>REACT · TYPESCRIPT · CSS</p><h1>Projetos em destaque.<br/>Imagens bem organizadas.</h1><p>Uma demonstração de galeria e gerenciamento visual de serviços. Experimente organizar fotos e trocar capas, sem acessar sistemas reais.</p><a className="adm-btn adm-btn--primary" href="#painel">Explorar o painel →</a></section><Highlight /></>}</>;
}
createRoot(document.getElementById('root')!).render(<App />);
