export interface Project {
 id: string; serviceId: string; title: string; description: string;
 image: {src: string; alt: string; width: number; height: number};
}
export const projects: Project[] = ['portoes', 'grades', 'coberturas'].map((id, i) => ({
 id: `demo-${i}`, serviceId: id, title: `Projeto demonstrativo ${i + 1}`,
 description: 'Ilustração fictícia para apresentação do painel.',
 image: {src: `demo/${id}.svg`, alt: 'Ilustração geométrica de demonstração', width: 1200, height: 900},
}));
