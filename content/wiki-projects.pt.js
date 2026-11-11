"use strict";

// Portuguese copy for the wiki. URLs, screenshot paths and commands come from the project records.
const wikiProjectsPortuguese = {
  ipod: {
    category: "Leitor web",
    subtitle: "Um iPod Classic para experimentar no navegador",
    summary:
      "No site do meu fork podes experimentar o leitor, mudar a cor do iPod e ver como fica integrado numa página ou como leitor flutuante.",
    forkChanges:
      "Adaptei o simulador de Tanner Villarete para ser reutilizado como componente React. Acrescentei opções para usar listas de reprodução próprias e uma versão para incorporar noutros sites, que é a que uso no ambiente de trabalho deste portfólio.",
  },
  visitar: {
    category: "Aplicação móvel",
    subtitle: "Turismo interativo no Parque do Barrocal",
    summary:
      "Projeto de fim de curso para explorar o Parque do Barrocal com panoramas de 360°, percursos personalizados e um passaporte digital baseado na localização. A aplicação funciona sem ligação depois de descarregar os conteúdos.",
    credit:
      "Projeto de fim de curso com Leonardo Martins, orientado pelo professor Pedro Silva.",
    context:
      "Uma aplicação móvel para visitar o Parque do Barrocal, desenvolvida como projeto de fim de curso de Engenharia Informática na ESTCB/IPCB. A experiência combina a exploração ao ar livre com informação que continua disponível quando a cobertura móvel é fraca.",
    ownership:
      "Projeto de equipa de Bernardo Maia e Leonardo Martins, orientado pelo professor Pedro Silva. As decisões técnicas descritas dizem respeito ao trabalho da equipa.",
    journey: [
      "Explorar os pontos de interesse e filtrar por categoria.",
      "Usar o mapa ou um percurso sugerido ou personalizado para preparar a visita.",
      "Descarregar os conteúdos multimédia antes de entrar numa zona com pouca cobertura.",
      "No parque, recorrer à deteção de proximidade por GPS, ao audioguia e aos panoramas de 360° para explorar os locais.",
      "Acompanhar os locais visitados e os distintivos no passaporte digital.",
    ],
    architecture: [
      {
        title: "Aplicação Flutter",
        text: "Dart e Flutter asseguram a interface, a navegação e a integração com o dispositivo. A aplicação reúne a exploração no mapa, percursos, multimédia, favoritos e o passaporte.",
      },
      {
        title: "Sincronizar antes da visita",
        text: "O Firebase fornece os conteúdos durante a sincronização. As transferências em sequência guardam os ficheiros no dispositivo e permitem mostrar o progresso. Depois de descarregar os conteúdos, a deteção de proximidade e a visita decorrem no dispositivo.",
      },
      {
        title: "Sensores e percursos",
        text: "As posições GPS alimentam o cálculo de distância pela fórmula de Haversine, com um raio de proximidade de 50 metros. A orientação do dispositivo controla o visualizador panorâmico e o OSRM calcula percursos pedonais.",
      },
    ],
    features: [
      "Exploração, pesquisa e filtragem de pontos de interesse.",
      "Mapa, percursos sugeridos e itinerários personalizados.",
      "Panoramas de 360° com controlo por giroscópio e audioguia.",
      "Passaporte digital com locais visitados e distintivos.",
      "Transferência de conteúdos de pontos de interesse e percursos para acesso sem ligação.",
      "Interface em português e inglês.",
    ],
    limitations: [
      "A utilização sem ligação exige descarregar os conteúdos antecipadamente.",
      "A deteção de proximidade depende da precisão do GPS, das permissões e do terreno.",
      "Os conteúdos documentados abrangem 34 pontos de interesse. Outro parque exige novos conteúdos e cartografia.",
    ],
    validation:
      "O repositório contém três testes em test/logic_test.dart que verificam um percurso incompleto, a conclusão e um percurso sem pontos. O relatório inclui validação no terreno e registos da execução dos testes. Como o Flutter não estava disponível neste ambiente, esses testes não foram repetidos. A indicação no README de que não existem testes automatizados está desatualizada.",
    process: [
      {
        title: "Da realidade aumentada aos panoramas",
        text: "A ideia inicial dependia do reconhecimento de marcadores em realidade aumentada, pouco fiável no exterior. Os panoramas de 360° mantiveram a imersão da visita com uma interação mais previsível.",
      },
      {
        title: "Preparar a visita para zonas com pouca cobertura",
        text: "As transferências em sequência facilitam o controlo do progresso e deixam os conteúdos disponíveis no dispositivo. A sincronização prepara a visita, que acontece mais tarde.",
      },
      {
        title: "Documentar a interface implementada",
        text: "A galeria apresenta as capturas da aplicação publicadas no relatório.",
      },
    ],
    screenshots: [
      {
        title: "Explorar o parque",
        caption:
          "Descobre pontos de interesse e filtra os locais por categoria.",
        alt: "Explorar o parque",
      },
      {
        title: "Mapa e navegação",
        caption:
          "Localiza os pontos próximos e planeia um percurso pelo parque.",
        alt: "Mapa e navegação",
      },
      {
        title: "Panorama de 360°",
        caption:
          "Observa um ponto de interesse através de um panorama imersivo.",
        alt: "Panorama de 360°",
      },
      {
        title: "Passaporte digital",
        caption:
          "Acompanha os percursos concluídos, os locais visitados e os distintivos obtidos.",
        alt: "Passaporte digital",
      },
      {
        title: "Transferências para acesso sem ligação",
        caption:
          "Prepara os conteúdos dos pontos de interesse para uma visita sem cobertura móvel.",
        alt: "Transferências para acesso sem ligação",
      },
    ],
    sources: [
      {
        label: "README público do projeto",
      },
      {
        label:
          "Relatório de fim de curso de Bernardo Maia e Leonardo Martins, junho de 2026. Capturas da aplicação e resultados dos testes.",
        note: "Relatório local consultado. Não está publicado no portfólio.",
      },
      {
        label: "Testes unitários do passaporte e do progresso dos percursos",
      },
    ],
    architectureFlows: [
      {
        title: "Preparar a visita com ligação",
        steps: [
          "A aplicação Flutter sincroniza conteúdos e ficheiros multimédia com o Firebase.",
          "As transferências em sequência guardam os ficheiros escolhidos no dispositivo e mostram o progresso.",
          "Os percursos e pontos de interesse podem ser selecionados antes ou durante a visita. O OSRM calcula os percursos pedonais.",
        ],
      },
      {
        title: "Explorar com os conteúdos descarregados",
        steps: [
          "As atualizações do GPS permitem calcular a distância aos pontos de interesse.",
          "A aplicação aplica o raio de proximidade e atualiza o progresso no percurso e no passaporte.",
          "Os panoramas, imagens e áudio descarregados são lidos do armazenamento local. A orientação do dispositivo controla o panorama de 360°.",
          "A sincronização na nuvem e o cálculo externo de percursos são independentes da consulta dos ficheiros descarregados.",
        ],
      },
    ],
    setup: {
      requirements: [
        "Flutter SDK e um dispositivo ou emulador compatível.",
        "Configuração do Firebase e acesso aos ficheiros multimédia a sincronizar.",
        "GPS e sensores de movimento para validar a experiência no exterior.",
      ],
      note: "Valida o GPS, o comportamento em segundo plano e o giroscópio num dispositivo físico. A execução na web ou num computador não confirma que essas funções se comportem da mesma maneira no telemóvel.",
    },
  },
  nethergate: {
    category: "Aplicação de computador",
    subtitle: "Gestor de servidores Minecraft Java",
    summary:
      "Uma aplicação de computador que reúne a configuração de servidores Minecraft Java, a consola, a gestão de jogadores, os mods e as cópias de segurança. Os mundos ficam no computador do utilizador, com serviços externos opcionais.",
    credit: "Projeto pessoal de código aberto sob licença GPL-3.0.",
    context:
      "Gerir um servidor Minecraft Java costuma envolver instalar o Java e o software do servidor, consultar registos, gerir jogadores e proteger os mundos. O Nethergate reúne essas tarefas numa aplicação de computador e mantém a biblioteca sob o controlo do utilizador.",
    ownership:
      "Projeto pessoal de código aberto de Bernardo Maia, distribuído sob a licença GPL-3.0-only. A versão de pré-visualização documentada é a 0.2.0 e destina-se a Windows x64.",
    journey: [
      "Criar ou importar um servidor para a biblioteca local.",
      "Escolher Paper ou Fabric e configurar a versão do Minecraft, a memória e o modo de ligação.",
      "Preparar o ambiente de execução e rever o contrato de licença do Minecraft antes de iniciar o servidor.",
      "Administrar o servidor pela consola e pelos painéis de jogadores, plugins, mods e mundos.",
      "Criar cópias de segurança ou migrar para um perfil separado, preservando o mundo original.",
    ],
    architecture: [
      {
        title: "Interface React e API tipada",
        text: "Os painéis React usam um contrato de ações partilhado em TypeScript. Os hooks de consulta evitam atualizações sobrepostas e ignoram respostas antigas quando o contexto muda. O núcleo em Rust valida os pedidos.",
      },
      {
        title: "Janela nativa e motor independente",
        text: "O Tauri fornece a janela, os diálogos e as notificações. No Windows, a interface comunica com um motor local separado através de loopback e de uma credencial protegida pela conta do utilizador. O motor pode continuar ativo depois de fechar a janela.",
      },
      {
        title: "Dados locais e recuperação",
        text: "O núcleo Rust e a CLI partilham a lógica de gestão de servidores, Java, rede, jogadores, mods, cópias e armazenamento na nuvem. Os manifestos JSON descrevem a biblioteca. Os restauros guardam informação de recuperação e as migrações criam um perfil novo.",
      },
    ],
    features: [
      "Configuração de Paper e Fabric e preparação do ambiente Java.",
      "Consola, opções de jogo, gestão de jogadores e lista de permissões.",
      "Pesquisa no Modrinth, resolução de dependências e importação de ficheiros JAR.",
      "Ligações locais, em rede local e pela internet, com diagnóstico e serviços externos opcionais.",
      "Cópias locais manuais e agendadas, restauro recuperável e migração que preserva o original.",
      "Cópias opcionais para serviços compatíveis com S3, Google Drive e Dropbox, com transferência e recuperação por blocos.",
      "Importação e exportação de servidores e execução em segundo plano.",
    ],
    limitations: [
      "Windows x64 é a plataforma principal. A integração com o sistema e a proteção das credenciais são específicas do Windows.",
      "O instalador de pré-visualização não tem assinatura digital e as atualizações são manuais.",
      "O acesso pela internet depende do router, da firewall, de NAT/CGNAT e do serviço de túnel escolhido. O DuckDNS por si só não abre portas.",
      "As cópias locais automáticas aguardam que o servidor pare. A migração de mundos não permite voltar para uma versão anterior.",
      "A API do motor local não foi concebida como um serviço de administração exposto publicamente.",
    ],
    validation:
      "O repositório inclui verificações de formatação, Clippy e testes Rust, uma compilação TypeScript/Vite e dados de teste para a interface no navegador. Estas verificações foram identificadas no código e na documentação, mas nem todas foram repetidas. As imagens mostram a interface React real com dados isolados e um servidor de demonstração.",
    process: [
      {
        title: "Separar o núcleo da interface",
        text: "O núcleo Rust gere os servidores e disponibiliza uma interface de linha de comandos. O Tauri aloja a janela e o React gere os controlos e o estado da interface.",
      },
      {
        title: "Proteger os mundos",
        text: "Um restauro pode ser retomado depois de uma interrupção. As atualizações são feitas numa cópia do servidor para preservar o mundo original.",
      },
      {
        title: "Validação e distribuição",
        text: "O repositório inclui verificações e testes com Cargo e um processo de compilação do instalador. A pré-visualização destina-se a Windows x64.",
      },
    ],
    screenshots: [
      {
        title: "Biblioteca de servidores",
        caption:
          "Percorre a biblioteca local, consulta a configuração e abre as ferramentas de gestão.",
        alt: "Biblioteca de servidores",
      },
      {
        title: "Consola e navegação do servidor",
        caption:
          "Acompanha a atividade do servidor e acede às definições dos mundos, jogadores, plugins e ligações.",
        alt: "Consola e navegação do servidor",
      },
    ],
    sources: [
      {
        label: "README e instruções de instalação",
      },
      {
        label: "Guia de arquitetura",
      },
      {
        label: "Desenvolvimento e verificações",
      },
    ],
    architectureFlows: [
      {
        title: "Da interface ao servidor",
        steps: [
          "Um painel React envia uma ação pelo contrato partilhado da API em TypeScript.",
          "O Tauri encaminha o pedido ao motor local por uma sessão de loopback autenticada.",
          "O núcleo Rust valida a ação, lê a biblioteca e gere o processo Java ou a operação correspondente.",
          "As consultas atualizam a biblioteca e a consola sem reaproveitar respostas do servidor anteriormente selecionado.",
        ],
      },
      {
        title: "Proteção dos mundos e execução em segundo plano",
        steps: [
          "As cópias escrevem dados e manifestos validados no destino escolhido. Os fornecedores opcionais transferem blocos verificados.",
          "Um restauro interrompido conserva informação de recuperação para que a interface possa orientar a conclusão.",
          "A migração de versão cria um perfil separado e preserva o mundo de origem.",
          "O motor pode continuar a funcionar depois de a janela ser fechada.",
        ],
      },
    ],
    setup: {
      requirements: [
        "Para desenvolver no Windows: Node.js 22, Rust estável, ferramentas de compilação C++ do Visual Studio e WebView2.",
        "Ligação à internet para descarregar o ambiente de execução, o software e usar as integrações opcionais.",
      ],
      note: "Usa npm run package:windows para gerar o instalador do Windows. Para executar um servidor Minecraft, é necessário aceitar o respetivo contrato de licença. Não foi iniciado um servidor para preparar esta documentação.",
    },
  },
  abisso: {
    category: "Web 3D",
    subtitle: "Aquários 3D gerados de forma procedural",
    summary:
      "Uma experiência web para criar, observar e personalizar aquários 3D. Um texto, uma imagem ou uma escolha aleatória serve de ponto de partida para gerar criaturas e ambientes.",
    credit: "Projeto pessoal publicado no GitHub Pages.",
    context:
      "O ABISSO explora como um pequeno ponto de partida se pode tornar numa cena 3D viva. Uma palavra, uma imagem ou uma semente aleatória gera um aquário povoado, que pode ser observado, personalizado e partilhado no navegador.",
    ownership:
      "Projeto pessoal de Bernardo Maia. A aplicação inclui o Three.js com a respetiva licença MIT e está publicada como site estático no GitHub Pages.",
    journey: [
      "Começar com uma palavra, uma imagem ou uma descoberta aleatória.",
      "Observar o aquário gerado e rodar ou ampliar a vista para conhecer os habitantes.",
      "Selecionar uma criatura e editar a anatomia, as cores, os padrões e o comportamento.",
      "Alterar o ambiente, a decoração e a vegetação do aquário.",
      "Guardar na coleção, exportar uma imagem ou JSON, partilhar uma ligação ou exportar um widget HTML autónomo.",
    ],
    architecture: [
      {
        title: "Geração procedural local",
        text: "A semente controla a anatomia, a paleta e a cena inicial. O texto é interpretado com palavras-chave e sementes. A imagem fornece as cores dominantes e uma assinatura visual. A geração é procedural e dispensa IA generativa e reconhecimento de objetos.",
      },
      {
        title: "Motor de renderização no navegador",
        text: "O motor JavaScript separa a genética e a anatomia, o movimento, os habitats e a renderização. O Three.js e os shaders desenham a cena em WebGL, enquanto o editor coordena os controlos.",
      },
      {
        title: "Estado portátil e publicação estática",
        text: "As coleções usam localStorage. O JSON permite transferir aquários entre dispositivos, as ligações codificam o estado no URL e o exportador reúne a cena, o motor e a licença num ficheiro HTML autónomo. A geração dispensa um servidor.",
      },
    ],
    features: [
      "22 espécies com anatomia, padrões, variantes e mutações procedurais.",
      "Temas de recife tropical, abismo e jardim, com aquários clássicos, panorâmicos e verticais.",
      "Criaturas, vegetação e partículas animadas, com alimentação e crescimento.",
      "Personalização das criaturas e do aquário em quatro secções do editor.",
      "Exportação PNG, importação e exportação JSON, coleção local e ligações partilháveis.",
      "Widgets HTML autónomos com opções independentes de rotação e zoom.",
    ],
    limitations: [
      "A renderização e o desempenho dependem do suporte a WebGL e dos recursos gráficos do dispositivo.",
      "As coleções ficam no navegador e dispositivo atuais. Exporta em JSON para transferir os dados.",
      "A aplicação extrai cores da imagem, sem reconhecer objetos nem recriar a fotografia.",
      "Para incorporar widgets, o alojamento precisa de permitir iframes e JavaScript.",
      "A semente reproduz o aquário inicial. A cena animada continua a evoluir.",
    ],
    validation:
      "As capturas foram feitas numa execução local da aplicação com a semente «recife». O repositório inclui verificações e testes Node. A revisão para o portfólio verificou o fluxo visível de criação e personalização.",
    process: [
      {
        title: "Geração reproduzível",
        text: "O ponto de partida gera uma semente que determina o ambiente e a anatomia das criaturas. As imagens fornecem paletas e uma assinatura visual. O mesmo ponto de partida gera o mesmo aquário inicial.",
      },
      {
        title: "Motor 3D no navegador",
        text: "O motor separa anatomia, movimento, habitats e renderização. O Three.js e os shaders desenham a cena, enquanto as coleções ficam guardadas no dispositivo.",
      },
      {
        title: "Partilha sem servidor",
        text: "As ligações de partilha contêm o estado do aquário. O widget exportado inclui os dados e o motor necessários para funcionar como HTML autónomo num navegador com WebGL.",
      },
    ],
    screenshots: [
      {
        title: "Criar um aquário",
        caption:
          "Começa com uma palavra, uma imagem ou uma descoberta aleatória.",
        alt: "Criar um aquário",
      },
      {
        title: "Aquário gerado a partir de «recife»",
        caption:
          "Explora um aquário povoado gerado a partir da palavra «recife».",
        alt: "Aquário gerado a partir de «recife»",
      },
      {
        title: "Personalização de uma criatura",
        caption:
          "Ajusta a anatomia, o aspeto e o comportamento da criatura selecionada.",
        alt: "Personalização de uma criatura",
      },
    ],
    sources: [
      {
        label: "README: geração, partilha e configuração local",
      },
      {
        label: "Código do motor de renderização",
      },
    ],
    architectureFlows: [
      {
        title: "Do ponto de partida à cena",
        steps: [
          "Uma palavra fornece uma semente e uma paleta por palavras-chave. Uma imagem fornece as cores dominantes e uma assinatura visual.",
          "O gerador usa a semente para criar a anatomia, o habitat e a população inicial do aquário.",
          "O Three.js constrói a geometria e os materiais a partir do estado da cena. A lógica de movimento atualiza a animação.",
        ],
      },
      {
        title: "Editar, guardar e partilhar um aquário",
        steps: [
          "Os controlos do editor alteram as propriedades das criaturas e do ambiente no estado partilhado.",
          "O motor de renderização reflete as alterações. As entradas da coleção são guardadas em localStorage.",
          "O JSON preserva os dados da cena, o URL codifica o estado e o PNG regista a imagem renderizada.",
          "O exportador de widgets inclui a cena, o motor e a licença num HTML autónomo.",
        ],
      },
    ],
    setup: {
      requirements: [
        "Node.js 22 ou posterior para o servidor local.",
        "Um navegador moderno com JavaScript e WebGL. O repositório já inclui o Three.js.",
      ],
      note: "Abre http://127.0.0.1:4200/. A aplicação pode ser executada diretamente. O comando npm run build prepara a pasta estática dist para publicação.",
    },
  },
  oportunia: {
    category: "Web e nuvem",
    subtitle: "Agregador de oportunidades profissionais",
    summary:
      "Um projeto de equipa que reúne ofertas de emprego, estágios e formação. A aplicação combina a recolha automática de dados com recomendações baseadas no perfil do utilizador.",
    credit:
      "Projeto de Computação na Nuvem com Leonardo Martins e Gonçalo Nunes, orientado pelo professor Osvaldo Santos.",
    context:
      "O Oportunia é um assistente de carreira para estudantes de Engenharia Informática em Portugal. Reúne ofertas de vários portais e usa o perfil académico, as competências e o currículo do estudante para explicar que vagas são relevantes.",
    ownership:
      "Projeto de equipa de Bernardo Maia, Leonardo Martins e Gonçalo Nunes, orientado pelo professor Osvaldo Santos. O plano atribui a Bernardo o design da interface, o frontend e a integração com a API, assim como o trabalho com Azure OpenAI e a construção de prompts.",
    journey: [
      "Criar uma conta e iniciar sessão.",
      "Preencher o perfil com competências, interesses, localizações e tipos de oportunidade preferidos.",
      "Explorar as ofertas recolhidas e pedir recomendações personalizadas.",
      "Opcionalmente, carregar um currículo em PDF para ajudar a preencher o perfil.",
      "Gerar ou consultar relatórios em PDF na aplicação.",
    ],
    architecture: [
      {
        title: "Aplicação web e API",
        text: "HTML, JavaScript e Tailwind formam a interface no navegador. O Flask serve os modelos Jinja e corre com Gunicorn num contentor Docker no App Service. A mesma aplicação trata das sessões, dos perfis, das recomendações, dos documentos e dos relatórios.",
      },
      {
        title: "Recolha e dados",
        text: "As Azure Functions executam a recolha agendada de forma independente do tráfego web. Os conectores normalizam as vagas e inserem ou atualizam os registos no Cosmos DB através da API do MongoDB. Os perfis e os metadados dos relatórios ficam em coleções separadas.",
      },
      {
        title: "Extração e recomendações com IA",
        text: "O PyPDF2 extrai texto do currículo e o Azure OpenAI estrutura os dados. Para recomendar vagas, o Flask pontua primeiro as ofertas por preferências e envia até vinte candidatas para ordenação e explicação por IA. Guardar o perfil e pedir recomendações são pedidos distintos.",
      },
      {
        title: "Armazenamento e acesso a documentos",
        text: "O Blob Storage guarda currículos, relatórios PDF e ficheiros estáticos. O Cosmos DB guarda referências e metadados. O Flask gere a transferência e eliminação de documentos e o SMTP envia mensagens de recuperação de conta e notificações.",
      },
      {
        title: "Provisionamento e publicação",
        text: "O Bicep declara a infraestrutura Azure e injeta as definições na publicação. O GitHub Actions compila e disponibiliza a imagem Docker. A infraestrutura e a publicação suportam a aplicação em execução.",
      },
    ],
    features: [
      "Registo, início de sessão, recuperação de palavra-passe com validade limitada e gestão do perfil.",
      "Recolha diária e normalização de vagas do ITJobs, Jooble e Remotive, com inserção ou atualização para evitar duplicados.",
      "Recomendações com indicadores de compatibilidade e explicações personalizadas.",
      "Extração de competências, idiomas e projetos a partir do currículo em PDF.",
      "Armazenamento, transferência e eliminação de currículos no Azure Blob Storage.",
      "Relatórios de oportunidades a pedido, histórico e preferências de notificações.",
      "Alojamento com Docker, publicação com GitHub Actions e infraestrutura Azure declarada em Bicep.",
    ],
    limitations: [
      "Uma sessão completa depende da configuração dos serviços na nuvem, das quotas das APIs e da disponibilidade das fontes.",
      "O processo de recomendação envia dados do perfil e conteúdo das vagas selecionadas para o serviço Azure OpenAI configurado.",
      "O pedido à IA é limitado às vinte vagas prioritárias.",
      "Não foi identificada uma suite de testes automatizados na cópia local consultada.",
      "O IEFP, a FCT e o Erasmus+ faziam parte do plano inicial. As restrições de acesso às APIs levaram a equipa a focar a versão entregue no ITJobs, Jooble e Remotive.",
    ],
    validation:
      "O relatório descreve a aplicação publicada, um exemplo de resposta da API, a lista de oportunidades, os fluxos de perfil e currículo e os relatórios. O código Flask consultado inclui as rotas e a lógica de recomendação correspondentes. O relatório documenta a versão entregue. A disponibilidade atual da implementação no Azure não foi verificada.",
    process: [
      {
        title: "Adaptar a recolha às fontes disponíveis",
        text: "O plano inicial incluía fontes institucionais e europeias. As restrições das APIs levaram a equipa a optar pelo ITJobs, Jooble e Remotive. A extração do currículo passou a fornecer mais dados para a comparação com as ofertas.",
      },
      {
        title: "Limitar o trabalho enviado à IA",
        text: "A API pontua as ofertas pela localização e pelo tipo de oportunidade antes de enviar vinte candidatas ao Azure OpenAI. O perfil é guardado separadamente e as recomendações são geradas a pedido da lista de ofertas.",
      },
      {
        title: "Separar os ficheiros dos contentores",
        text: "Os currículos e os relatórios ficam no Blob Storage. O Cosmos DB guarda os metadados e as referências. Os documentos mantêm-se disponíveis quando os contentores reiniciam.",
      },
      {
        title: "Da maquete à implementação",
        text: "O relatório descreve a passagem de maquetes para modelos dinâmicos ligados às rotas Flask. Os ecrãs de oportunidades, perfil, currículo e relatórios dão acesso aos serviços na nuvem.",
      },
    ],
    screenshots: [
      {
        title: "Oportunidades num só lugar",
        caption:
          "Conhece a plataforma e as recomendações profissionais baseadas no perfil.",
        alt: "Oportunidades num só lugar",
      },
      {
        title: "Iniciar sessão",
        caption:
          "Acede à conta de estudante para gerir preferências e recomendações.",
        alt: "Iniciar sessão",
      },
      {
        title: "Perfil do estudante",
        caption:
          "Reúne os dados académicos, as ligações profissionais e as competências técnicas.",
        alt: "Perfil do estudante",
      },
      {
        title: "Currículo e notificações",
        caption:
          "Carrega o currículo para preencher o perfil e define as preferências de email e relatórios.",
        alt: "Currículo e notificações",
      },
      {
        title: "Lista personalizada de oportunidades",
        caption:
          "Compara vagas, indicadores de compatibilidade e a explicação de cada correspondência.",
        alt: "Lista personalizada de oportunidades",
      },
      {
        title: "Detalhes da oportunidade",
        caption:
          "Consulta as responsabilidades, os requisitos e a razão pela qual a vaga corresponde ao perfil.",
        alt: "Detalhes da oportunidade",
      },
      {
        title: "Relatórios de oportunidades",
        caption:
          "Gera um resumo em PDF das oportunidades recomendadas e consulta os relatórios guardados.",
        alt: "Relatórios de oportunidades",
      },
    ],
    sources: [
      {
        label: "Rotas da aplicação e lógica de recomendação",
      },
      {
        label: "Recolha agendada",
      },
      {
        label: "Infraestrutura Azure",
      },
      {
        label: "Repositório da equipa",
      },
      {
        label:
          "Relatório do Oportunia, maio de 2026. Arquitetura, entrega e ecrãs da aplicação.",
      },
    ],
    architectureFlows: [
      {
        title: "Da recolha à lista de oportunidades",
        steps: [
          "Um temporizador diário inicia a Azure Function.",
          "Os conectores recolhem vagas, normalizam os campos e inserem ou atualizam os registos na coleção Vagas.",
          "O navegador pede a lista ao Flask, que consulta o Cosmos DB e devolve JSON.",
        ],
      },
      {
        title: "Do perfil à recomendação",
        steps: [
          "As alterações ao perfil são guardadas na coleção Utilizadores. O currículo é enviado para o Blob Storage e o PyPDF2 extrai o texto.",
          "O Azure OpenAI estrutura a informação extraída. O perfil usa as competências, idiomas e projetos resultantes.",
          "Quando são pedidas recomendações, o Flask ordena as vagas por localização e tipo e envia até vinte candidatas e o perfil ao Azure OpenAI.",
          "Os resultados ordenados e as explicações voltam à lista. A interface mostra a compatibilidade e os motivos de cada correspondência.",
        ],
      },
      {
        title: "Ficheiros e mensagens em segundo plano",
        steps: [
          "A aplicação gera relatórios PDF, carrega-os para o Blob Storage e guarda os metadados no Cosmos DB.",
          "As rotas autenticadas de transferência e eliminação controlam o acesso a currículos e relatórios.",
          "O SMTP envia ligações temporárias de recuperação da palavra-passe. A função de recolha diária também envia notificações a quem as ativou.",
        ],
      },
    ],
    setup: {
      requirements: [
        "Ambiente Python com as dependências de requirements.txt.",
        "Ligação ao Cosmos DB pela API MongoDB, endereço e chave do Azure OpenAI e a implementação configurada no código.",
        "Definições do Azure Blob Storage e de SMTP para documentos e emails.",
        "Ferramentas Azure Functions e configuração separada para a recolha agendada.",
      ],
      note: "Configura o ambiente antes de importar app.py, pois o cliente Azure OpenAI é criado no arranque. Usa .env.example como ponto de partida e consulta as definições adicionais de armazenamento e Azure Functions no código e na configuração de publicação. Guarda as credenciais fora do repositório.",
    },
  },
};
