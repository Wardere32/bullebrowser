'use client';

// Client-side translation for a statically exported site.
//
// The locale lives in localStorage (written by TranslationMenu) rather than in
// the URL, because `output: 'export'` gives us no server to negotiate a locale
// per request. A provider re-renders the tree when it changes.
//
// Brand and product names are deliberately absent from these dictionaries:
// "BulleBrowser", "Bulle Consulting" and the skill names are what the product
// is called in every language, so translating them would make the site harder
// to talk about, not easier to read.

import { createContext, useContext, useEffect, useState } from 'react';

export const LOCALES = ['en', 'fr', 'ar', 'es-419', 'pt-PT'] as const;
export type Locale = (typeof LOCALES)[number];
export const STORAGE_KEY = 'bullebrowser:lang';

type Dict = Record<string, string>;

const en: Dict = {
  // nav
  'nav.home': 'Home',
  'nav.workflows': 'Workflows',
  'nav.guides': 'Guides',
  'nav.download': 'Download',
  'nav.translation': 'Translation',
  'nav.chooseLanguage': 'Choose a language',
  // footer
  'footer.rights': 'All rights reserved.',
  'footer.tagline': 'The browser that navigates for you',
  // home hero
  'home.badge': 'Agentic AI · By',
  'home.h1': 'The browser that navigates for you.',
  'home.sub':
    'An AI agent that reads pages, completes browser tasks, and works whatever else you ask, right inside your browser.',
  // home skills
  'home.skills.eyebrow': 'Agentic skills',
  'home.skills.h2': 'Native intelligence, built into the browser.',
  'home.skills.body':
    'Not a chatbot bolted onto a sidebar. It is purpose-built for general browser automation. Three flagship skills lead the way, and the agent takes on much more on request.',
  'home.skills.explore': 'Explore the features',
  'skill.page.title': 'Page assistant',
  'skill.page.lede': 'Read and summarize what is on screen.',
  'skill.page.body':
    'Ask it to read a page, lift the important points, and give you a concise answer with citations.',
  'skill.nav.title': 'Site navigator',
  'skill.nav.lede': 'Handle a task inside a live website.',
  'skill.nav.body':
    'Tell it where to go and what to do. It opens the page, finds the control, and completes the action.',
  'skill.flow.title': 'Workflow automator',
  'skill.flow.lede': 'Coordinate multi-step browser tasks.',
  'skill.flow.body':
    'Use it for repeatable sequences across tabs: compare pages, gather details, and return a clean summary.',
  // home privacy
  'home.privacy.h2': 'Your data stays yours.',
  'home.privacy.body':
    'Bring your own key if you want external synthesis. Prompts go directly through your configured AI provider account from your device. History and conversations stay on your device. No telemetry.',
};

const fr: Dict = {
  'nav.home': 'Accueil',
  'nav.workflows': 'Flux de travail',
  'nav.guides': 'Guides',
  'nav.download': 'Télécharger',
  'nav.translation': 'Traduction',
  'nav.chooseLanguage': 'Choisir une langue',
  'footer.rights': 'Tous droits réservés.',
  'footer.tagline': 'Le navigateur qui navigue pour vous',
  'home.badge': 'IA agentique · Par',
  'home.h1': 'Le navigateur qui navigue pour vous.',
  'home.sub':
    "Un agent IA qui lit les pages, accomplit les tâches du navigateur et fait tout ce que vous lui demandez, directement dans votre navigateur.",
  'home.skills.eyebrow': 'Compétences agentiques',
  'home.skills.h2': "Une intelligence native, intégrée au navigateur.",
  'home.skills.body':
    "Pas un agent conversationnel greffé sur un panneau latéral. Il est conçu pour l'automatisation générale du navigateur. Trois compétences phares ouvrent la voie, et l'agent en assume bien davantage sur demande.",
  'home.skills.explore': 'Découvrir les fonctionnalités',
  'skill.page.title': 'Assistant de page',
  'skill.page.lede': "Lire et résumer ce qui est à l'écran.",
  'skill.page.body':
    'Demandez-lui de lire une page, d’en extraire les points essentiels et de vous donner une réponse concise avec ses sources.',
  'skill.nav.title': 'Navigateur de site',
  'skill.nav.lede': 'Accomplir une tâche sur un site en direct.',
  'skill.nav.body':
    "Indiquez-lui où aller et quoi faire. Il ouvre la page, trouve le contrôle et accomplit l'action.",
  'skill.flow.title': 'Automatisation de flux',
  'skill.flow.lede': 'Coordonner des tâches en plusieurs étapes.',
  'skill.flow.body':
    'Utilisez-le pour des séquences répétables entre onglets : comparer des pages, réunir des informations et renvoyer un résumé clair.',
  'home.privacy.h2': 'Vos données restent les vôtres.',
  'home.privacy.body':
    "Utilisez votre propre clé si vous souhaitez une synthèse externe. Les requêtes passent directement par le compte de votre fournisseur d'IA, depuis votre appareil. L'historique et les conversations restent sur votre appareil. Aucune télémétrie.",
};

const ar: Dict = {
  'nav.home': 'الرئيسية',
  'nav.workflows': 'سير العمل',
  'nav.guides': 'الأدلة',
  'nav.download': 'تنزيل',
  'nav.translation': 'الترجمة',
  'nav.chooseLanguage': 'اختر لغة',
  'footer.rights': 'جميع الحقوق محفوظة.',
  'footer.tagline': 'المتصفح الذي يتصفح نيابة عنك',
  'home.badge': 'ذكاء اصطناعي وكيل · من',
  'home.h1': 'المتصفح الذي يتصفح نيابة عنك.',
  'home.sub':
    'وكيل ذكاء اصطناعي يقرأ الصفحات، وينجز مهام المتصفح، وينفذ كل ما تطلبه، داخل متصفحك مباشرة.',
  'home.skills.eyebrow': 'المهارات الوكيلة',
  'home.skills.h2': 'ذكاء أصيل مدمج داخل المتصفح.',
  'home.skills.body':
    'ليس روبوت محادثة مُلحقًا بشريط جانبي. إنه مصمم خصيصًا لأتمتة المتصفح بشكل عام. ثلاث مهارات رئيسية تتصدر العمل، والوكيل ينفذ ما هو أكثر عند الطلب.',
  'home.skills.explore': 'استكشف الميزات',
  'skill.page.title': 'مساعد الصفحة',
  'skill.page.lede': 'قراءة وتلخيص ما يظهر على الشاشة.',
  'skill.page.body':
    'اطلب منه قراءة صفحة، واستخلاص النقاط المهمة، وتقديم إجابة موجزة مع ذكر المصادر.',
  'skill.nav.title': 'متصفح المواقع',
  'skill.nav.lede': 'إنجاز مهمة داخل موقع نشط.',
  'skill.nav.body':
    'أخبره إلى أين يذهب وماذا يفعل. يفتح الصفحة، ويجد عنصر التحكم، وينفذ الإجراء.',
  'skill.flow.title': 'أتمتة سير العمل',
  'skill.flow.lede': 'تنسيق مهام متعددة الخطوات.',
  'skill.flow.body':
    'استخدمه لتسلسلات متكررة عبر عدة تبويبات: مقارنة الصفحات، وجمع التفاصيل، وإعادة ملخص واضح.',
  'home.privacy.h2': 'بياناتك تبقى ملكك.',
  'home.privacy.body':
    'استخدم مفتاحك الخاص إذا أردت تحليلًا خارجيًا. تمر الطلبات مباشرة عبر حساب مزود الذكاء الاصطناعي الذي أعددته، من جهازك. يبقى السجل والمحادثات على جهازك. بلا تتبع.',
};

const es419: Dict = {
  'nav.home': 'Inicio',
  'nav.workflows': 'Flujos de trabajo',
  'nav.guides': 'Guías',
  'nav.download': 'Descargar',
  'nav.translation': 'Traducción',
  'nav.chooseLanguage': 'Elegir un idioma',
  'footer.rights': 'Todos los derechos reservados.',
  'footer.tagline': 'El navegador que navega por ti',
  'home.badge': 'IA con agentes · Por',
  'home.h1': 'El navegador que navega por ti.',
  'home.sub':
    'Un agente de IA que lee páginas, completa tareas del navegador y hace todo lo demás que le pidas, directamente en tu navegador.',
  'home.skills.eyebrow': 'Habilidades del agente',
  'home.skills.h2': 'Inteligencia nativa, integrada en el navegador.',
  'home.skills.body':
    'No es un chatbot añadido a una barra lateral. Está diseñado para la automatización general del navegador. Tres habilidades principales marcan el camino, y el agente asume mucho más cuando se lo pides.',
  'home.skills.explore': 'Explorar las funciones',
  'skill.page.title': 'Asistente de página',
  'skill.page.lede': 'Leer y resumir lo que está en pantalla.',
  'skill.page.body':
    'Pídele que lea una página, extraiga los puntos importantes y te dé una respuesta concisa con sus fuentes.',
  'skill.nav.title': 'Navegador de sitios',
  'skill.nav.lede': 'Realizar una tarea dentro de un sitio activo.',
  'skill.nav.body':
    'Dile a dónde ir y qué hacer. Abre la página, encuentra el control y completa la acción.',
  'skill.flow.title': 'Automatizador de flujos',
  'skill.flow.lede': 'Coordinar tareas de varios pasos.',
  'skill.flow.body':
    'Úsalo para secuencias repetibles entre pestañas: comparar páginas, reunir detalles y devolver un resumen claro.',
  'home.privacy.h2': 'Tus datos siguen siendo tuyos.',
  'home.privacy.body':
    'Usa tu propia clave si quieres síntesis externa. Las solicitudes pasan directamente por la cuenta del proveedor de IA que configuraste, desde tu dispositivo. El historial y las conversaciones permanecen en tu dispositivo. Sin telemetría.',
};

const ptPT: Dict = {
  'nav.home': 'Início',
  'nav.workflows': 'Fluxos de trabalho',
  'nav.guides': 'Guias',
  'nav.download': 'Transferir',
  'nav.translation': 'Tradução',
  'nav.chooseLanguage': 'Escolher um idioma',
  'footer.rights': 'Todos os direitos reservados.',
  'footer.tagline': 'O navegador que navega por si',
  'home.badge': 'IA com agentes · Por',
  'home.h1': 'O navegador que navega por si.',
  'home.sub':
    'Um agente de IA que lê páginas, executa tarefas no navegador e faz tudo o que lhe pedir, diretamente no seu navegador.',
  'home.skills.eyebrow': 'Competências do agente',
  'home.skills.h2': 'Inteligência nativa, integrada no navegador.',
  'home.skills.body':
    'Não é um chatbot acrescentado a uma barra lateral. Foi concebido para a automatização geral do navegador. Três competências principais abrem caminho, e o agente assume muito mais quando lhe for pedido.',
  'home.skills.explore': 'Explorar as funcionalidades',
  'skill.page.title': 'Assistente de página',
  'skill.page.lede': 'Ler e resumir o que está no ecrã.',
  'skill.page.body':
    'Peça-lhe que leia uma página, retire os pontos essenciais e lhe dê uma resposta concisa com as fontes.',
  'skill.nav.title': 'Navegador de sites',
  'skill.nav.lede': 'Executar uma tarefa num site ativo.',
  'skill.nav.body':
    'Diga-lhe para onde ir e o que fazer. Abre a página, encontra o controlo e conclui a ação.',
  'skill.flow.title': 'Automatização de fluxos',
  'skill.flow.lede': 'Coordenar tarefas de vários passos.',
  'skill.flow.body':
    'Utilize-o para sequências repetíveis entre separadores: comparar páginas, reunir detalhes e devolver um resumo claro.',
  'home.privacy.h2': 'Os seus dados continuam seus.',
  'home.privacy.body':
    'Use a sua própria chave se quiser síntese externa. Os pedidos passam diretamente pela conta do fornecedor de IA que configurou, a partir do seu dispositivo. O histórico e as conversas permanecem no seu dispositivo. Sem telemetria.',
};

const DICTS: Record<Locale, Dict> = { en, fr, ar, 'es-419': es419, 'pt-PT': ptPT };

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: 'en',
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && (LOCALES as readonly string[]).includes(saved)) setLocaleState(saved);
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Locale>).detail;
      if (next) setLocaleState(next);
    };
    window.addEventListener('bullebrowser:locale', onChange);
    return () => window.removeEventListener('bullebrowser:locale', onChange);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** Translate a key, falling back to English then to the key itself. */
export function useT() {
  const { locale } = useLocale();
  return (key: string): string => DICTS[locale]?.[key] ?? en[key] ?? key;
}
