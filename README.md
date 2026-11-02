# Pereba — demonstração de portfólio

Galeria de serviços e painel de fotos em React, TypeScript e CSS. O projeto demonstra organização por categorias, edição de descrições, ordenação de imagens, seleção de capas e carrossel responsivo.

## Sobre esta edição

O ZIP recebido continha uma atualização de sete arquivos, e não o site completo. Esta edição preserva e adapta os componentes de painel e carrossel e adiciona a estrutura mínima necessária para uma demonstração independente. Não é uma cópia integral do site original.

Os textos e ilustrações incluídos são demonstrativos. Nenhum telefone, endereço, contato comercial, credencial, fotografia de cliente ou dado real é necessário.

## Executar

Requer Node.js 22.12 ou superior e npm. No Windows, extraia tudo e abra `ABRIR-PROJETO.bat`. Na primeira execução ele instala as dependências, o que requer internet.

```sh
npm ci
npm run dev
```

Abra o endereço mostrado no terminal e clique em **Abrir demonstração**.

## Como funciona a demonstração

- As alterações existem apenas na memória da aba e desaparecem ao recarregar.
- Fotos selecionadas são processadas no navegador, sem upload para servidor.
- É possível editar, ordenar e excluir exemplos, além de trocar capas.
- Volte à apresentação para visualizar as capas alteradas na mesma aba.
- Não existe autenticação real: o painel é uma simulação pública.

## Privacidade

A API original de administração foi retirada. Esta edição não contém banco, endpoints administrativos, gravação de arquivos no servidor, cookies de sessão ou armazenamento persistente no navegador. Não há integração de WhatsApp nem contato real. O servidor do Vite é apenas uma ferramenta de desenvolvimento e escuta no computador local.

Publique somente esta pasta; não misture o projeto original, configurações privadas ou fotos de clientes. O `.gitignore` reduz inclusões acidentais, mas não remove dados que já foram publicados em um histórico Git.

## Build e publicação

```sh
npm run build
npm run preview
```

O build produz um site estático em `dist/`, sem backend. Envie o código deste pacote ao GitHub; para hospedar o site, publique o conteúdo de `dist/` em uma hospedagem estática. A configuração usa caminhos relativos para aceitar subpastas.

## Estrutura

- `src/admin/`: painel e simulação em memória.
- `src/components/Highlight.tsx`: carrossel de serviços.
- `src/data/`: exemplos fictícios.
- `public/demo/`: ilustrações locais, sem fotos reais.

Este pacote não altera um site ou servidor já existente e não revoga acessos do sistema original.
