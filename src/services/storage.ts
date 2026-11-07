import { Project, UserVaultData, IndicLanguage, NotePage, Chapter } from '../types';

const VAULT_STORAGE_KEY = 'lipiscript_user_vault_v1';

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-marathi-history',
    title: 'इतिहास व राज्यशास्त्र — स्वातंत्र्य चळवळ',
    author: 'प्रा. विठ्ठल जोशी',
    subject: 'आधुनिक भारताचा इतिहास व समाजसुधारणा',
    language: 'Marathi',
    category: 'study_notes',
    description: 'हस्तलिखित नोट्स: १८५७ चा उठाव, सत्यशोधक समाज, आणि संयुक्त महाराष्ट्र चळवळ.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: [
      {
        id: 'chap-1',
        title: 'प्रकरण १: आधुनिक महाराष्ट्राची जडणघडण',
        synopsis: 'एकोणिसाव्या शतकातील समाज प्रबोधन आणि शैक्षणिक क्रांती.',
        order: 1,
        pageIds: ['p-101', 'p-102'],
      },
      {
        id: 'chap-2',
        title: 'प्रकरण २: संयुक्त महाराष्ट्र चळवळ व भाषावार रचना',
        synopsis: 'मुंबईसह संयुक्त महाराष्ट्राचा लढा आणि सीमाप्रश्न.',
        order: 2,
        pageIds: ['p-103'],
      },
    ],
    pages: [
      {
        id: 'p-101',
        pageNumber: 1,
        title: 'सत्यशोधक समाज व फुले दाम्पत्य',
        imageBase64: '/api/benchmark/image/GT-01',
        imageFileName: 'GT-01_Mahatma_Phule_Notes.svg',
        text: `# सत्यशोधक समाज व शिक्षण प्रसार

महात्मा जोतीराव फुले यांनी २४ सप्टेंबर १८७३ रोजी पुणे येथे सत्यशोधक समाजाची स्थापना केली.
सर्वसाक्षी जगत्पती । त्याला नकोच मध्यस्थी । हे सत्यशोधक समाजाचे ब्रीदवाक्य होते.

- स्त्रिया व शूद्रातिशूद्रांसाठी पहिली शाळा भिडे वाड्यात १ जानेवारी १८४८ रोजी सुरू झाली.
- सावित्रीबाई फुले यांनी पहिल्या भारतीय शिक्षिका व मुख्याध्यापिका म्हणून [illegible] कार्य केले.
- ग्रंथ संपदा: गुलामगिरी (१८७३), शेतकऱ्याचा असूड (१८८३), सार्वजनिक सत्यधर्म (१८८९).

महाराष्ट्र शासन, उच्च व तंत्र शिक्षण विभाग यांच्या द्वारे या विचारांचा गौरव करण्यात आला आहे.`,
        status: 'reviewed',
        chapterId: 'chap-1',
        illegibleCount: 1,
        charCount: 462,
        wordCount: 78,
        ocrLatencyMs: 1240,
        ocrTokens: { input: 820, output: 145 },
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p-102',
        pageNumber: 2,
        title: 'न्यायमूर्ती रानडे व प्रार्थना समाज',
        imageBase64: '/api/benchmark/image/GT-02',
        imageFileName: 'GT-02_Prarthana_Samaj.svg',
        text: `## प्रार्थना समाज आणि सामाजिक सुधारणा

न्यायमूर्ती महादेव गोविंद रानडे यांनी पुण्यात वसंत व्याख्यानमाला सुरू केली.
प्रार्थना समाजाची स्थापना ३१ मार्च १८६७ रोजी मुंबई येथे आत्माराम पांडुरंग यांच्या अध्यक्षतेखाली झाली.

प्रमुख उद्दिष्टे:
१) मूर्तिपूजेस विरोध व एकेश्वरवाद.
२) बालविवाहास विरोध व विधवा पुनर्विवाहास पाठिंबा.
३) स्त्री शिक्षणाचा प्रसार.

[illegible] सामाजिक परिषदेची स्थापना १८८७ मध्ये काँग्रेसच्या अधिवेशनासोबत करण्यात आली होती.`,
        status: 'reviewed',
        chapterId: 'chap-1',
        illegibleCount: 1,
        charCount: 395,
        wordCount: 65,
        ocrLatencyMs: 1180,
        ocrTokens: { input: 810, output: 128 },
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p-103',
        pageNumber: 3,
        title: 'संयुक्त महाराष्ट्र आंदोलन',
        imageBase64: '/api/benchmark/image/GT-03',
        imageFileName: 'GT-03_Samyukta_Maharashtra.svg',
        text: `# संयुक्त महाराष्ट्र आंदोलन व हुतात्मा स्मारक

१०५ हुतात्म्यांच्या बलिदानाने १ मे १९६० रोजी महाराष्ट्र राज्य अस्तित्वात आले.
यशवंतराव चव्हाण महाराष्ट्राचे पहिले मुख्यमंत्री झाले.

- संयुक्त महाराष्ट्र समितीची स्थापना ६ फेब्रुवारी १९५६ रोजी पुण्यात झाली.
- अध्यक्ष: भाई श्रीपाद अमृत डांगे
- उपाध्यक्ष: डॉ. त्र्यं. रा. नरवणे
- सरचिटणीस: एस. एम. जोशी

मुंबई, बेळगाव, कारवार, निपाणीसह संयुक्त महाराष्ट्र झालाच पाहिजे ही घोषणा संपूर्ण राज्यात घुमली होती.`,
        status: 'transcribed',
        chapterId: 'chap-2',
        illegibleCount: 0,
        charCount: 412,
        wordCount: 68,
        ocrLatencyMs: 1350,
        ocrTokens: { input: 840, output: 132 },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'proj-mixed-physics',
    title: 'Physics & Applied Mathematics Notes',
    author: 'Aishwarya Pawar',
    subject: 'Thermodynamics, Gravitation & Vector Calculus',
    language: 'Mixed',
    category: 'study_notes',
    description: 'Bilingual Marathi + English Class Notes with mathematical equations and diagrams.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: [
      {
        id: 'pchap-1',
        title: 'प्रकरण १: गुरुत्वाकर्षण व न्यूटनचे नियम (Gravitation)',
        synopsis: 'Newton\'s Universal Law of Gravitation, Kepler\'s Planetary Laws, and Orbital Velocity.',
        order: 1,
        pageIds: ['p-201'],
      },
    ],
    pages: [
      {
        id: 'p-201',
        pageNumber: 1,
        title: 'Newtonian Gravitation & Kepler Laws',
        imageBase64: '/api/benchmark/image/GT-06',
        imageFileName: 'GT-06_Physics_Gravitation.svg',
        text: `# Gravitation & Planetary Motion (गुरुत्वाकर्षण)

न्यूटनचा वैश्विक गुरुत्वाकर्षणाचा सिद्धांत (Newton's Universal Law of Gravitation):
विश्वातील कोणतीही दोन वस्तू एकमेकांना आकर्षित करतात. हे आकर्षण बल त्यांच्या वस्तुमानाच्या गुणाकाराशी समप्रमाणात आणि त्यांच्या अंतराच्या वर्गाशी व्यस्त प्रमाणात असते.

$$F = G \\frac{m_1 m_2}{r^2}$$

येथे:
- $G$ = वैश्विक गुरुत्वाकर्षण स्थिरांक ($6.674 \\times 10^{-11} \\text{ N m}^2/\\text{kg}^2$)
- $m_1, m_2$ = वस्तुमान (Mass in kg)
- $r$ = दोन वस्तूंमधील अंतर (Distance in meters)

### Diagram Labels
- Orbit: लंबवर्तुळाकार कक्षा (Elliptical Orbit)
- Focus $S$: सूर्य (Sun located at focus)
- Perihelion: जवळचे स्थान, Aphelion: दूरचे स्थान`,
        status: 'reviewed',
        chapterId: 'pchap-1',
        illegibleCount: 0,
        charCount: 654,
        wordCount: 96,
        ocrLatencyMs: 1420,
        ocrTokens: { input: 890, output: 190 },
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
];

export class VaultStorageService {
  private static loadVault(): UserVaultData {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read user vault from localStorage, initializing fresh vault:', err);
    }

    const initialVault: UserVaultData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeProjectId: DEFAULT_PROJECTS[0].id,
      projects: DEFAULT_PROJECTS,
    };
    VaultStorageService.saveVault(initialVault);
    return initialVault;
  }

  private static saveVault(vault: UserVaultData): void {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    } catch (err) {
      console.error('Failed to write vault to localStorage:', err);
    }
  }

  public static getProjects(): Project[] {
    const vault = this.loadVault();
    return vault.projects;
  }

  public static getProject(id: string): Project | undefined {
    const vault = this.loadVault();
    return vault.projects.find((p) => p.id === id);
  }

  public static getActiveProjectId(): string {
    const vault = this.loadVault();
    return vault.activeProjectId || vault.projects[0]?.id || '';
  }

  public static setActiveProjectId(id: string): void {
    const vault = this.loadVault();
    vault.activeProjectId = id;
    this.saveVault(vault);
  }

  public static createProject(title: string, author: string, language: IndicLanguage, subject?: string, category: Project['category'] = 'study_notes'): Project {
    const vault = this.loadVault();
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      author: author.trim() || 'LipiScript Author',
      language,
      subject: subject?.trim(),
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: `chap-${Date.now()}-1`,
          title: 'प्रकरण १: सामान्य परिचय (Chapter 1)',
          synopsis: 'प्रारंभिक नोट्स व प्रस्तावना',
          order: 1,
          pageIds: [],
        },
      ],
      pages: [],
    };

    vault.projects.unshift(newProject);
    vault.activeProjectId = newProject.id;
    this.saveVault(vault);
    return newProject;
  }

  public static updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const vault = this.loadVault();
    const index = vault.projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    vault.projects[index] = {
      ...vault.projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveVault(vault);
    return vault.projects[index];
  }

  public static deleteProject(id: string): boolean {
    const vault = this.loadVault();
    const filtered = vault.projects.filter((p) => p.id !== id);
    if (filtered.length === vault.projects.length) return false;

    vault.projects = filtered;
    if (vault.activeProjectId === id) {
      vault.activeProjectId = vault.projects[0]?.id || '';
    }
    this.saveVault(vault);
    return true;
  }

  // Page operations
  public static addPageToProject(projectId: string, pageData: Omit<NotePage, 'id' | 'createdAt' | 'updatedAt'>): NotePage {
    const vault = this.loadVault();
    const project = vault.projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');

    const newPage: NotePage = {
      ...pageData,
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    project.pages.push(newPage);

    // Assign to active chapter or first chapter
    if (project.chapters.length > 0) {
      const targetChap = project.chapters.find((c) => c.id === newPage.chapterId) || project.chapters[0];
      newPage.chapterId = targetChap.id;
      if (!targetChap.pageIds.includes(newPage.id)) {
        targetChap.pageIds.push(newPage.id);
      }
    }

    project.updatedAt = new Date().toISOString();
    this.saveVault(vault);
    return newPage;
  }

  public static updatePage(projectId: string, pageId: string, updates: Partial<NotePage>): NotePage | undefined {
    const vault = this.loadVault();
    const project = vault.projects.find((p) => p.id === projectId);
    if (!project) return undefined;

    const pageIndex = project.pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return undefined;

    project.pages[pageIndex] = {
      ...project.pages[pageIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    project.updatedAt = new Date().toISOString();
    this.saveVault(vault);
    return project.pages[pageIndex];
  }

  public static deletePage(projectId: string, pageId: string): boolean {
    const vault = this.loadVault();
    const project = vault.projects.find((p) => p.id === projectId);
    if (!project) return false;

    project.pages = project.pages.filter((p) => p.id !== pageId);
    project.chapters.forEach((c) => {
      c.pageIds = c.pageIds.filter((id) => id !== pageId);
    });

    project.updatedAt = new Date().toISOString();
    this.saveVault(vault);
    return true;
  }

  // Chapter operations
  public static addChapter(projectId: string, title: string, synopsis?: string): Chapter {
    const vault = this.loadVault();
    const project = vault.projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');

    const newChap: Chapter = {
      id: `chap-${Date.now()}`,
      title: title.trim(),
      synopsis: synopsis?.trim(),
      order: project.chapters.length + 1,
      pageIds: [],
    };

    project.chapters.push(newChap);
    project.updatedAt = new Date().toISOString();
    this.saveVault(vault);
    return newChap;
  }

  public static updateChapter(projectId: string, chapterId: string, updates: Partial<Chapter>): Chapter | undefined {
    const vault = this.loadVault();
    const project = vault.projects.find((p) => p.id === projectId);
    if (!project) return undefined;

    const cIdx = project.chapters.findIndex((c) => c.id === chapterId);
    if (cIdx === -1) return undefined;

    project.chapters[cIdx] = {
      ...project.chapters[cIdx],
      ...updates,
    };

    project.updatedAt = new Date().toISOString();
    this.saveVault(vault);
    return project.chapters[cIdx];
  }

  public static deleteChapter(projectId: string, chapterId: string): boolean {
    const vault = this.loadVault();
    const project = vault.projects.find((p) => p.id === projectId);
    if (!project) return false;

    project.chapters = project.chapters.filter((c) => c.id !== chapterId);
    project.pages.forEach((p) => {
      if (p.chapterId === chapterId) {
        p.chapterId = project.chapters[0]?.id || undefined;
      }
    });

    project.updatedAt = new Date().toISOString();
    this.saveVault(vault);
    return true;
  }

  // Export & Import Vault
  public static exportVaultToJson(): string {
    const vault = this.loadVault();
    vault.exportedAt = new Date().toISOString();
    return JSON.stringify(vault, null, 2);
  }

  public static importVaultFromJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.projects)) {
        throw new Error('Invalid vault structure');
      }
      this.saveVault(data);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }

  public static resetToDefaultVault(): void {
    const initialVault: UserVaultData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeProjectId: DEFAULT_PROJECTS[0].id,
      projects: DEFAULT_PROJECTS,
    };
    this.saveVault(initialVault);
  }
}
