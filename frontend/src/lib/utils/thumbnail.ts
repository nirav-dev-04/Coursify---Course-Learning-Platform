// Helper to resolve highly-relevant, specific category-themed stock photos from Unsplash for realistic course thumbnails.

const getSlugHash = (slug: string): number => {
  let hash = 0;
  const s = slug || '';
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const IMAGES_PYTHON = [
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
  'https://images.unsplash.com/photo-1605379399642-870262d3d051',
  'https://images.unsplash.com/photo-1649180556628-9ba704115795'
];

const IMAGES_JAVA = [
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713'
];

const IMAGES_REACT = [
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
  'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8'
];

const IMAGES_DEVOPS = [
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3',
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935',
  'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9',
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935'
];

const IMAGES_CYBERSECURITY = [
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3',
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'
];

const IMAGES_CLOUD = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8',
  'https://images.unsplash.com/photo-1518770660439-4636190af475',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6'
];

const IMAGES_AI = [
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
  'https://images.unsplash.com/photo-1507146426996-ef05306b995a',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
  'https://images.unsplash.com/photo-1527474305487-b87b222841cc'
];

const IMAGES_FINANCE = [
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44'
];

const IMAGES_DESIGN = [
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',
  'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c',
  'https://images.unsplash.com/photo-1558655146-d09347e92766',
  'https://images.unsplash.com/photo-1626785774573-4b799315345d'
];

const IMAGES_MOBILE = [
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
  'https://images.unsplash.com/photo-1551650975-87deedd944c3',
  'https://images.unsplash.com/photo-1523206489230-c012c64b2b48',
  'https://images.unsplash.com/photo-1565688534245-05d6b5be184a'
];

const IMAGES_BUSINESS = [
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f'
];

const IMAGES_PHOTOGRAPHY = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e',
  'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
];

const IMAGES_MUSIC = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745'
];

const IMAGES_ENGLISH = [
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754'
];

const IMAGES_DEFAULT = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1'
];

export const getCourseThumbnail = (
  category: string,
  slug: string,
  title?: string,
  width = 640,
  height = 400
): string => {
  const normCategory = (category || '').toLowerCase();
  const normSlug = (slug || '').toLowerCase();
  const normTitle = (title || '').toLowerCase();
  const hash = getSlugHash(slug);
  
  let list = IMAGES_DEFAULT;

  if (
    normSlug.includes('python') || 
    normTitle.includes('python') ||
    normSlug.includes('django') || 
    normTitle.includes('django') ||
    normSlug.includes('flask') || 
    normTitle.includes('flask') ||
    normSlug.includes('fastapi') || 
    normTitle.includes('fastapi')
  ) {
    list = IMAGES_PYTHON;
  } else if (
    normSlug.includes('java') || 
    normTitle.includes('java') || 
    normSlug.includes('spring') || 
    normTitle.includes('spring') ||
    normSlug.includes('microservice') ||
    normTitle.includes('microservice')
  ) {
    list = IMAGES_JAVA;
  } else if (
    normSlug.includes('react') || 
    normTitle.includes('react') || 
    normSlug.includes('nextjs') || 
    normTitle.includes('next.js') || 
    normSlug.includes('vue') || 
    normTitle.includes('vue.js') || 
    normSlug.includes('svelte') || 
    normTitle.includes('svelte') ||
    normSlug.includes('typescript') ||
    normTitle.includes('typescript') ||
    normSlug.includes('javascript') ||
    normTitle.includes('javascript') ||
    normSlug.includes('tailwind') ||
    normTitle.includes('tailwind')
  ) {
    list = IMAGES_REACT;
  } else if (
    normSlug.includes('docker') || 
    normTitle.includes('docker') || 
    normSlug.includes('kubernetes') || 
    normTitle.includes('kubernetes') || 
    normSlug.includes('devops') || 
    normTitle.includes('devops') ||
    normSlug.includes('jenkins') ||
    normTitle.includes('jenkins') ||
    normSlug.includes('git') ||
    normTitle.includes('git')
  ) {
    list = IMAGES_DEVOPS;
  } else if (
    normSlug.includes('cyber') || 
    normTitle.includes('cyber') || 
    normSlug.includes('security') || 
    normTitle.includes('security') || 
    normSlug.includes('penetration') || 
    normTitle.includes('penetration')
  ) {
    list = IMAGES_CYBERSECURITY;
  } else if (
    normSlug.includes('aws') || 
    normTitle.includes('aws') || 
    normSlug.includes('cloud') || 
    normTitle.includes('cloud') || 
    normSlug.includes('gcp') || 
    normTitle.includes('gcp') ||
    normSlug.includes('azure') ||
    normTitle.includes('azure') ||
    normSlug.includes('terraform') ||
    normTitle.includes('terraform')
  ) {
    list = IMAGES_CLOUD;
  } else if (
    normSlug.includes('ai') || 
    normTitle.includes('ai') || 
    normSlug.includes('deep-learning') || 
    normTitle.includes('deep learning') || 
    normSlug.includes('pytorch') || 
    normTitle.includes('pytorch') || 
    normSlug.includes('machine-learning') || 
    normTitle.includes('machine learning') || 
    normSlug.includes('llm') || 
    normTitle.includes('llm') ||
    normSlug.includes('intelligence') ||
    normTitle.includes('intelligence')
  ) {
    list = IMAGES_AI;
  } else if (
    normSlug.includes('trading') || 
    normTitle.includes('trading') || 
    normSlug.includes('stock') || 
    normTitle.includes('stock') || 
    normSlug.includes('market') || 
    normTitle.includes('market') ||
    normSlug.includes('finance') ||
    normTitle.includes('finance')
  ) {
    list = IMAGES_FINANCE;
  } else if (
    normSlug.includes('ui-ux') || 
    normTitle.includes('ui/ux') || 
    normSlug.includes('figma') || 
    normTitle.includes('figma') || 
    normSlug.includes('design') || 
    normTitle.includes('design') ||
    normSlug.includes('graphic') ||
    normTitle.includes('graphic')
  ) {
    list = IMAGES_DESIGN;
  } else if (
    normSlug.includes('mobile') || 
    normTitle.includes('mobile') || 
    normSlug.includes('flutter') || 
    normTitle.includes('flutter') || 
    normSlug.includes('android') || 
    normTitle.includes('android') ||
    normSlug.includes('ios') ||
    normTitle.includes('ios')
  ) {
    list = IMAGES_MOBILE;
  } else if (
    normSlug.includes('photography') || 
    normTitle.includes('photography') ||
    normSlug.includes('camera') || 
    normTitle.includes('camera')
  ) {
    list = IMAGES_PHOTOGRAPHY;
  } else if (
    normSlug.includes('music') || 
    normTitle.includes('music') ||
    normSlug.includes('piano') || 
    normTitle.includes('piano') ||
    normSlug.includes('guitar') || 
    normTitle.includes('guitar')
  ) {
    list = IMAGES_MUSIC;
  } else if (
    normSlug.includes('english') || 
    normTitle.includes('english') ||
    normSlug.includes('grammar') || 
    normTitle.includes('grammar') ||
    normSlug.includes('language') || 
    normTitle.includes('language')
  ) {
    list = IMAGES_ENGLISH;
  } else if (
    normCategory.includes('business') || 
    normSlug.includes('business') ||
    normTitle.includes('business') ||
    normCategory.includes('marketing') ||
    normSlug.includes('marketing') ||
    normTitle.includes('marketing') ||
    normCategory.includes('personal') ||
    normSlug.includes('personal') ||
    normTitle.includes('personal')
  ) {
    list = IMAGES_BUSINESS;
  }

  const baseUrl = list[hash % list.length];
  return `${baseUrl}?q=80&w=${width}&h=${height}&auto=format&fit=crop&sig=${hash}`;
};
