# 🐱 Mike's TodoFlow

Uma aplicação de lista de tarefas moderna, responsiva e elegante — batizada em homenagem ao Mike, o gato laranja da casa.

![Mike's TodoFlow](mike.svg)

## ✨ Funcionalidades

- **Login com Google** — autenticação segura via Firebase Auth
- **Sincronização em nuvem** — tarefas salvas no Firestore e acessíveis em qualquer dispositivo
- **Adicionar tarefas** com Enter ou clicando no botão
- **Categorias** — Pessoal, Trabalho, Estudo, Saúde e Outro, cada uma com cor e ícone próprios
- **Marcar como concluída** com checkbox personalizado
- **Editar** tarefas diretamente na lista (inline, sem modal)
- **Excluir** tarefas com animação de saída
- **Filtros por status** — Todas / Ativas / Concluídas
- **Filtros por categoria** com chips clicáveis
- **Barra de progresso** dinâmica no cabeçalho
- **Contadores** em tempo real em cada aba
- **Limpar concluídas** de uma só vez
- **Notificações toast** para cada ação
- **Data atual** exibida no cabeçalho
- **Totalmente responsivo** para mobile e desktop

## 🚀 Demo

Acesse a aplicação em produção: **[mikes-todoflow.vercel.app](https://mikes-todoflow.vercel.app)**

## 🛠️ Tecnologias

- **HTML5** — estrutura semântica
- **CSS3** — variáveis CSS, flexbox, animações, media queries
- **JavaScript (ES Modules)** — vanilla JS puro, sem frameworks
- **Firebase Auth** — autenticação com conta Google
- **Cloud Firestore** — banco de dados NoSQL em tempo real
- **Font Awesome 6** — ícones via CDN
- **Vercel** — hospedagem e deploy contínuo

## 🏗️ Arquitetura

```
Usuário
  │
  ├── Não logado → Tela de Login (Firebase Auth / Google)
  │
  └── Logado → App principal
                  │
                  └── Firestore: users/{uid}/tasks
                        ├── Leitura em tempo real (onSnapshot)
                        ├── Criar (addDoc)
                        ├── Editar (updateDoc)
                        └── Deletar (deleteDoc)
```

Cada usuário tem suas tarefas isoladas no Firestore — ninguém vê as tarefas de outro.

## 📁 Estrutura

```
mikes-todoflow/
├── index.html   # Estrutura da aplicação + tela de login
├── style.css    # Estilos, responsividade e tela de login
├── app.js       # Lógica, Firebase Auth e Firestore
└── mike.svg     # Ícone do Mike em estilo anime
```

## 💻 Como rodar localmente

> Atenção: por usar ES Modules e Firebase, o projeto precisa ser servido via servidor HTTP (não funciona abrindo o arquivo diretamente pelo sistema de arquivos).

```bash
# Clone o repositório
git clone https://github.com/Morbidoom/mikes-todoflow.git

# Entre na pasta
cd mikes-todoflow

# Sirva com qualquer servidor estático, ex:
npx serve .
# ou
python -m http.server 8080
```

Acesse `http://localhost:8080` no navegador.

## 📱 Responsividade

A interface se adapta a qualquer tamanho de tela:
- **Desktop** — layout completo com hover effects
- **Mobile** — campos empilhados, botões maiores para toque fácil, nome do usuário oculto para economizar espaço

---

Feito com carinho (e muita supervisão felina) 🐾
