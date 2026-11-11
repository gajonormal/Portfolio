'use strict';

// Public repository documentation is the source for project details and credits.
const portfolio = {
  name: 'Bernardo Maia',
  birthDate: { year: 2004, month: 12, day: 30 },
  role: 'Computer Science graduate',
  education: 'Bachelor’s degree in Computer Engineering · ESTCB / IPCB',
  summary: 'I’m Bernardo Maia, a recent Computer Science graduate. I build web, mobile, and desktop applications and enjoy exploring how architectural decisions affect the people who use them.',
  github: 'https://github.com/gajonormal',
  email: 'bernamaia12@gmail.com',
  linkedin: 'https://www.linkedin.com/in/bernardo-maia-bpm/',
  technologies: [
    { label: 'Languages', items: ['Dart', 'Rust', 'JavaScript', 'TypeScript', 'Python'] },
    { label: 'Frameworks and libraries', items: ['Flutter', 'Tauri', 'React', 'Three.js', 'Flask'] },
    { label: 'Cloud and tools', items: ['Firebase', 'Azure', 'Docker', 'Bicep', 'GitHub Actions'] }
  ],
  projects: [
    {
      id: 'visitar',
      title: 'VisitAR',
      type: 'mobile',
      category: 'Mobile',
      file: 'assets/projects/visitar-logo.svg',
      icon: 'assets/projects/visitar-icon.svg',
      subtitle: 'Interactive tourism at Parque do Barrocal',
      summary: 'A final-year project for exploring Parque do Barrocal with 360° panoramas, personalized routes, and a location-based digital passport. The app works offline after visitors download the content.',
      stack: ['Dart', 'Flutter', 'Firebase', 'OSRM'],
      repo: 'https://github.com/gajonormal/VisitAR',
      credit: 'Final-year project with Leonardo Martins, supervised by Professor Pedro Silva.',
      flow: ['Firebase sync', 'Local content', 'Offline visit'],
      features: [
        'Gyroscope-controlled 360° panoramas.',
        'Digital passport and content unlocked near points of interest.',
        'Personalized routes and content available in Portuguese and English.'
      ],
      process:[
        {
          title: 'From augmented reality to 360° panoramas',
          text: 'The project started with augmented reality. Tests in the park showed that marker recognition was unreliable outdoors. The team switched to 360° panoramas to preserve immersion and make the experience more predictable.'
        },
        {
          title: 'Exploring without a connection',
          text: 'Firebase syncs the content before the visit. In the park, all 34 points of interest, media, and proximity checks work on the device. Sequential downloads let visitors track progress.'
        },
        {
          title: 'Geolocation and validation',
          text: 'The app uses the Haversine formula to detect points of interest within 50 meters. The team validated the experience through manual field tests. Accuracy depends on the GPS signal.'
        }
      ]
    },
    {
      id: 'nethergate',
      title: 'Nethergate',
      type: 'desktop',
      category: 'Desktop',
      file: 'assets/projects/nethergate-logo.svg',
      icon: 'assets/projects/nethergate-icon.svg',
      subtitle: 'Minecraft Java server manager',
      summary: 'A desktop application that brings Minecraft Java server setup, console access, player management, mods, and backups together. Worlds stay on the user’s computer, with optional external services.',
      stack: ['Rust', 'Tauri', 'React', 'Node.js'],
      repo: 'https://github.com/gajonormal/Nethergate',
      credit: 'Personal open-source project under GPL-3.0.',
      flow: ['React interface', 'Tauri window', 'Rust core and CLI'],
      features: [
        'Paper and Fabric server setup and Java version management.',
        'Mod and plugin installation with dependency resolution.',
        'Manual and scheduled backups with guided restoration.'
      ],
      process: [
        {
          title: 'Separating the core from the interface',
          text: 'The Rust core manages servers and exposes a command-line interface. Tauri hosts the desktop window, and React handles the controls and interface state.'
        },
        {
          title: 'Protecting worlds',
          text: 'Restoration can resume after an interruption. Upgrades run on a copy of the server to preserve the original world.'
        },
        {
          title: 'Validation and distribution',
          text: 'The repository includes Cargo checks, tests, and a build process for the installer. The desktop preview targets Windows x64.'
        }
      ]
    },
    {
      id: 'abisso',
      title: 'ABISSO',
      type: 'web',
      category: 'Web 3D',
      file: 'assets/projects/abisso-icon.svg',
      icon: 'assets/projects/abisso-icon.svg',
      subtitle: 'Procedurally generated 3D aquariums',
      summary: 'A web experience for creating, observing, and customizing 3D aquariums. Text, an image, or a random choice provides the starting point for generating creatures and environments.',
      stack: ['JavaScript', 'Three.js', 'WebGL', 'GitHub Pages'],
      repo: 'https://github.com/gajonormal/ABISSO',
      demo: 'https://gajonormal.github.io/ABISSO/',
      credit: 'Personal project hosted on GitHub Pages.',
      flow: ['Text or image', 'Seed-based generation', 'Three.js 3D scene'],
      features: [
        'Locally generated anatomy, patterns, and behavior.',
        'Customizable creatures, plants, and environments.',
        'Export to PNG, JSON, or a standalone HTML widget.'
      ],
      process: [
        {
          title: 'Reproducible generation',
          text: 'The input generates a seed that shapes the environment and creature anatomy. Images provide color palettes and a visual signature. The same input produces the same starting aquarium.'
        },
        {
          title: 'Browser-based 3D engine',
          text: 'The engine separates anatomy, movement, habitats, and rendering. Three.js and shaders draw the scene, and collections are stored on the device.'
        },
        {
          title: 'Sharing without a server',
          text: 'Share links store the aquarium state. The exported widget includes the data and engine needed to run as standalone HTML in a WebGL browser.'
        }
      ]
    },
    {
      id: 'oportunia',
      title: 'Oportunia',
      type: 'web',
      category: 'Web and cloud',
      file: 'assets/projects/oportunia-logo.svg',
      icon: 'assets/projects/oportunia-icon.svg',
      subtitle: 'Career opportunity aggregator',
      summary: 'A team project that aggregates jobs, internships, and training opportunities. The application combines automated data collection with recommendations based on the user’s profile.',
      stack: ['Python', 'Flask', 'Azure Functions', 'Cosmos DB', 'Docker', 'Bicep'],
      repo: 'https://github.com/gajonormal/Oportunia',
      upstream: 'https://github.com/goncalonunes23/Oportunia',
      credit: 'Cloud Computing project with Leonardo Martins and Gonçalo Nunes, supervised by Professor Osvaldo Santos.',
      flow: ['Azure Functions', 'Cosmos DB', 'Flask on App Service'],
      features: [
        'Scheduled collection of opportunities from multiple sources.',
        'REST API and dashboard for the aggregated data.',
        'Semantic recommendations using Azure OpenAI Service.'
      ],
      process: [
        {
          title: 'Data collection independent of web traffic',
          text: 'Azure Functions collects data on a schedule. The Flask application queries Cosmos DB without waiting for requests to external sources.'
        },
        {
          title: 'Data and infrastructure',
          text: 'The document model accommodates different listing formats. Bicep infrastructure configuration lets the team recreate the environment consistently.'
        },
        {
          title: 'Deployment and limitations',
          text: 'The application uses Docker and Azure App Service, with GitHub Actions in the deployment workflow. Validation was manual. Matching depends on Azure OpenAI availability.'
        }
      ]
    },
    {
      id: 'ipod',
      title: 'iPod Classic Revamped',
      type: 'web',
      category: 'Web player',
      file: 'assets/icons/ipod-classic.png',
      icon: 'assets/icons/ipod-classic.png',
      subtitle: 'An iPod Classic you can try in your browser',
      summary: 'On my fork’s demo site, you can try the player, change its finish, and see how it looks inside a page or as a floating player.',
      stack: ['React', 'TypeScript', 'Next.js', 'Styled Components'],
      repo: 'https://github.com/gajonormal/ipod-classic-revamped',
      upstream: 'https://github.com/tvillarete/ipod-classic-js',
      demo: 'https://ipod-classic-revamped.vercel.app/',
      forkChanges: 'I adapted Tanner Villarete’s simulator so it can be reused as a React component. I added support for custom playlists and an embed for other sites, which is what powers the iPod on this portfolio’s desktop.'
    }
  ]
};
