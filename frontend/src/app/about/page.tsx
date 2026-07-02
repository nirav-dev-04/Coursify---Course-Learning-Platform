'use client';

import React from 'react';
import FooterNavbar from '../../components/FooterNavbar';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Video, 
  Zap, 
  ShieldCheck, 
  Database, 
  ShoppingCart, 
  Github, 
  Linkedin, 
  Code, 
  Paintbrush, 
  Terminal, 
  ClipboardCheck,
  Server,
  Layers,
  TableProperties,
  Cpu,
  CheckCircle2
} from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<'system-design' | 'db-schema' | 'tech-stack'>('system-design');
  const [selectedTable, setSelectedTable] = React.useState<'USERS' | 'COURSES' | 'ORDERS' | 'LECTURE_PROGRESS'>('USERS');

  const dbSchema = {
    USERS: {
      description: 'Stores credentials, authentication metadata, and user registration dates for students, instructors, and admins.',
      columns: [
        { name: 'id', type: 'bigint', key: 'PK', nullable: 'NO', description: 'Auto-incrementing primary identifier' },
        { name: 'name', type: 'varchar(255)', key: '-', nullable: 'NO', description: 'Full name' },
        { name: 'email', type: 'varchar(255)', key: 'UK', nullable: 'NO', description: 'Unique user email address' },
        { name: 'password_hash', type: 'varchar(255)', key: '-', nullable: 'NO', description: 'Bcrypt hashed passwords' },
        { name: 'role', type: 'varchar(50)', key: '-', nullable: 'NO', description: 'Access authority role: ROLE_STUDENT, ROLE_INSTRUCTOR, ROLE_ADMIN' },
        { name: 'created_at', type: 'timestamp', key: '-', nullable: 'NO', description: 'Account registration timestamp' }
      ],
      constraints: ['PRIMARY KEY (id)', 'UNIQUE INDEX on email for O(1) credentials lookup']
    },
    COURSES: {
      description: 'Contains course info, pricing details, search vectors, and foreign key references to instructors.',
      columns: [
        { name: 'id', type: 'bigint', key: 'PK', nullable: 'NO', description: 'Primary identifier' },
        { name: 'title', type: 'varchar(255)', key: '-', nullable: 'NO', description: 'Course title' },
        { name: 'slug', type: 'varchar(255)', key: 'UK', nullable: 'NO', description: 'URL-friendly unique course representation' },
        { name: 'category', type: 'varchar(100)', key: '-', nullable: 'NO', description: 'Broad classification category' },
        { name: 'description', type: 'text', key: '-', nullable: 'YES', description: 'HTML formatted descriptive content' },
        { name: 'price', type: 'numeric(10,2)', key: '-', nullable: 'NO', description: 'Course purchase price' },
        { name: 'status', type: 'varchar(50)', key: '-', nullable: 'NO', description: 'Syllabus state: DRAFT, PUBLISHED, DELETED' },
        { name: 'instructor_id', type: 'bigint', key: 'FK', nullable: 'NO', description: 'Reference to USERS.id (ROLE_INSTRUCTOR)' },
        { name: 'search_vector', type: 'tsvector', key: 'Index', nullable: 'YES', description: 'Generated tsvector for Full-Text Search' },
        { name: 'created_at', type: 'timestamp', key: '-', nullable: 'NO', description: 'Creation date' }
      ],
      constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (instructor_id) REFERENCES users(id)', 'GIN INDEX on search_vector column for high-speed fuzzy search']
    },
    ORDERS: {
      description: 'Tracks checkout records, total amount, transaction statuses, and unique idempotency keys.',
      columns: [
        { name: 'id', type: 'bigint', key: 'PK', nullable: 'NO', description: 'Primary identifier' },
        { name: 'user_id', type: 'bigint', key: 'FK', nullable: 'NO', description: 'Reference to USERS.id (ROLE_STUDENT)' },
        { name: 'idempotency_key', type: 'varchar(255)', key: 'UK', nullable: 'NO', description: 'Unique check to prevent double charging' },
        { name: 'razorpay_order_id', type: 'varchar(255)', key: '-', nullable: 'YES', description: 'External Razorpay payment gateway identifier' },
        { name: 'status', type: 'varchar(50)', key: '-', nullable: 'NO', description: 'Checkout states: CREATED, COMPLETED, FAILED' },
        { name: 'total_amount', type: 'numeric(10,2)', key: '-', nullable: 'NO', description: 'Total paid price' },
        { name: 'created_at', type: 'timestamp', key: '-', nullable: 'NO', description: 'Initiation date' }
      ],
      constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (user_id) REFERENCES users(id)', 'UNIQUE INDEX on idempotency_key prevents duplicate enrollment triggers']
    },
    LECTURE_PROGRESS: {
      description: 'Stores student course watch coordinates, synced from Redis cache values.',
      columns: [
        { name: 'id', type: 'bigint', key: 'PK', nullable: 'NO', description: 'Primary identifier' },
        { name: 'user_id', type: 'bigint', key: 'FK', nullable: 'NO', description: 'Reference to USERS.id' },
        { name: 'course_id', type: 'bigint', key: 'FK', nullable: 'NO', description: 'Reference to COURSES.id' },
        { name: 'lecture_id', type: 'bigint', key: 'FK', nullable: 'NO', description: 'Reference to LECTURES.id' },
        { name: 'percent', type: 'int', key: '-', nullable: 'NO', description: 'Watch percentage (0-100)' },
        { name: 'updated_at', type: 'timestamp', key: '-', nullable: 'NO', description: 'Last progress update sync time' }
      ],
      constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (user_id) REFERENCES users(id)', 'FOREIGN KEY (course_id) REFERENCES courses(id)', 'FOREIGN KEY (lecture_id) REFERENCES lectures(id)', 'UNIQUE(user_id, course_id, lecture_id) to avoid record duplication']
    }
  };

  const team = [
    {
      name: 'NIRAV MATHUKIYA',
      role: 'Lead Full-Stack Engineer & Architect',
      image: '/nirav.jpg',
      bio: 'Designed and engineered the entire system architecture, including the Spring Boot API, Postgres DB modeling, Redis watch-progress caching, and the Next.js frontend application.',
      icon: <Terminal className="w-5 h-5 text-brand-purple" />,
      highlights: ['Next.js App Router', 'Spring Boot 3', 'Redis Cache Integration', 'HLS Adaptive Video'],
      layout: 'left', // Image Left, Content Right on desktop
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    },
    {
      name: 'KUNJ PATEL',
      role: 'Frontend & UI/UX Engineer',
      image: '/kunj.jpg',
      bio: 'Designed the premium user interface, customized component themes, ensured layout responsiveness across all devices, and polished the user experience.',
      icon: <Paintbrush className="w-5 h-5 text-[#eb8a2f]" />,
      highlights: ['CSS Layout Systems', 'Component Design', 'Responsive Grids', 'Web Accessibility'],
      layout: 'right', // Content Left, Image Right on desktop
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    },
    {
      name: 'VATSAL MAKAWANA',
      role: 'Backend & Security Specialist',
      image: '/vatsal.jpg',
      bio: 'Engineered robust database migrations, secured API endpoints using JWT authentication, and structured unit test suites for API validation.',
      icon: <Code className="w-5 h-5 text-[#1e6055]" />,
      highlights: ['Spring Security', 'JWT Authentication', 'SQL Migrations', 'API Endpoints'],
      layout: 'left', // Image Left, Content Right on desktop
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    }
  ];


  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-charcoal">
      {/* Sub-navigation menu */}
      <FooterNavbar />

      {/* 1. Hero Section */}
      <section className="max-w-6xl mx-auto w-full py-16 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-xs font-extrabold uppercase text-brand-purple tracking-wider">
            {t('about.subtitle')}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-brand-charcoal select-none">
            {t('about.welcome')}
          </h1>
          <p className="text-gray-600 leading-relaxed text-base">
            EduFlow is a premium, state-of-the-art e-learning marketplace designed and engineered to empower students and instructors worldwide. Modeled after the industry leader Udemy, EduFlow combines beautiful aesthetics with high-performance engineering to provide an unmatched study experience.
          </p>
          <div className="pt-2">
            <Link href="/courses" className="inline-flex h-[44px] px-6 bg-brand-charcoal hover:bg-brand-charcoal-hover text-white font-bold text-xs items-center justify-center transition-colors rounded-[4px]">
              {t('about.explore')}
            </Link>
          </div>
        </div>
        
        {/* Right Image */}
        <div className="relative h-[350px] w-full rounded overflow-hidden shadow-lg select-none">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop" 
            alt="Welcome to EduFlow" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-purple/5 mix-blend-multiply" />
        </div>
      </section>

      {/* 2. Stats Strip */}
      <section className="bg-brand-purple text-white py-16 px-6 text-center select-none">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-4xl font-extrabold">190+</p>
            <p className="text-xs font-semibold text-white/80 mt-1 uppercase tracking-wider">Curated Courses</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">10+</p>
            <p className="text-xs font-semibold text-white/80 mt-1 uppercase tracking-wider">Expert Authors</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">O(1)</p>
            <p className="text-xs font-semibold text-white/80 mt-1 uppercase tracking-wider">Progress Tracking</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">100%</p>
            <p className="text-xs font-semibold text-white/80 mt-1 uppercase tracking-wider">Secure Checkouts</p>
          </div>
        </div>
      </section>

      {/* 3. Meet the Development Team (Alternating Layout) */}
      <section className="py-20 px-6 border-b border-brand-grey bg-white">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase text-brand-purple tracking-widest">
              Who Built EduFlow
            </span>
            <h2 className="text-3xl font-extrabold text-brand-charcoal">
              Meet the Development Team
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              We are a dedicated group of three college collaborators bringing together full-stack architecture, fluid user interfaces, and robust backend security.
            </p>
          </div>

          <div className="space-y-20">
            {team.map((member, index) => {
              const isImageLeft = member.layout === 'left';
              return (
                <div 
                  key={index} 
                  className={`flex flex-col ${isImageLeft ? 'md:flex-row' : 'flex-col-reverse md:flex-row-reverse'} items-center gap-12 md:gap-16`}
                >
                  {/* Image Block */}
                  <div className="w-full md:w-5/12 shrink-0">
                    <div className="relative group/photo overflow-hidden rounded-xl shadow-md border border-brand-grey/55 aspect-[4/5] md:aspect-[3/4] w-full">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover object-top group-hover/photo:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </div>

                  {/* Content Block */}
                  <div className="w-full md:w-7/12 space-y-4">
                    <div className="flex items-center gap-3">
                      {member.icon}
                      <span className="text-xs font-bold uppercase text-brand-purple bg-brand-bg px-2.5 py-1 rounded">
                        {member.role}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-brand-charcoal tracking-tight">
                      {member.name}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      {member.bio}
                    </p>

                    {/* Highlights Tags */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {member.highlights.map((tag, i) => (
                        <span key={i} className="text-[11px] font-semibold text-gray-500 bg-brand-bg px-2.5 py-1 rounded border border-brand-grey/60">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Social links */}
                    <div className="flex items-center gap-3 pt-4 border-t border-brand-grey/50">
                      <a 
                        href={member.github} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2 bg-brand-bg hover:bg-brand-purple/10 text-brand-charcoal hover:text-brand-purple rounded-full transition-colors cursor-pointer"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                      <a 
                        href={member.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2 bg-brand-bg hover:bg-brand-purple/10 text-brand-charcoal hover:text-brand-purple rounded-full transition-colors cursor-pointer"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Technical Architecture & Specifications Dashboard */}
      <section className="py-20 px-6 bg-[#F7F9FA] border-b border-brand-grey">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold uppercase text-brand-purple tracking-widest">
              EduFlow Engineering
            </span>
            <h2 className="text-3xl font-extrabold text-brand-charcoal">
              Technical Architecture & Specifications
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Explore under the hood: how we solved critical industry bottlenecks, modeled the relational schema, and built the technology stack.
            </p>
          </div>

          {/* Tab Selection Navigation Bar */}
          <div className="flex border-b border-brand-grey/65 mb-8 justify-center">
            <div className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('system-design')}
                className={`pb-4 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'system-design' 
                    ? 'border-brand-purple text-brand-purple' 
                    : 'border-transparent text-gray-500 hover:text-brand-charcoal'
                }`}
              >
                System Design Bottlenecks
              </button>
              <button 
                onClick={() => setActiveTab('db-schema')}
                className={`pb-4 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'db-schema' 
                    ? 'border-brand-purple text-brand-purple' 
                    : 'border-transparent text-gray-500 hover:text-brand-charcoal'
                }`}
              >
                Relational DB Schema
              </button>
              <button 
                onClick={() => setActiveTab('tech-stack')}
                className={`pb-4 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'tech-stack' 
                    ? 'border-brand-purple text-brand-purple' 
                    : 'border-transparent text-gray-500 hover:text-brand-charcoal'
                }`}
              >
                Full Tech Stack
              </button>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div>
            {/* Tab 1: System Design Panel */}
            {activeTab === 'system-design' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bottleneck 1 */}
                <div className="bg-white p-6 border border-brand-grey rounded-lg shadow-sm hover:shadow transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-bg rounded-lg">
                      <Layers className="w-5 h-5 text-brand-purple" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-brand-purple bg-brand-bg px-2 py-0.5 rounded">
                        Database Optimization
                      </span>
                      <h3 className="font-bold text-base text-brand-charcoal mt-1">
                        N+1 Query Elimination
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 font-medium">
                      <strong>Problem:</strong> Course catalogs querying reviews/authors trigger N+1 child queries, throttling database bandwidth.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong>Solution:</strong> Implemented JPA Constructor Projections mapping to SQL <code>LEFT JOIN</code> sets directly. Full parent entities are never loaded for read-only course listings.
                    </p>
                  </div>
                  <div className="bg-brand-bg p-3 rounded text-[11px] font-mono text-gray-700 overflow-x-auto border border-brand-grey/50">
                    <pre>{`SELECT new com.eduflow.CourseListDTO(
  c.id, c.title, c.price, i.name, AVG(r.rating)
) FROM Course c 
LEFT JOIN c.instructor i 
LEFT JOIN c.reviews r 
GROUP BY c.id, i.name`}</pre>
                  </div>
                </div>

                {/* Bottleneck 2 */}
                <div className="bg-white p-6 border border-brand-grey rounded-lg shadow-sm hover:shadow transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-bg rounded-lg">
                      <Zap className="w-5 h-5 text-[#eb8a2f]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#eb8a2f] bg-brand-bg px-2 py-0.5 rounded">
                        High-Write Caching
                      </span>
                      <h3 className="font-bold text-base text-brand-charcoal mt-1">
                        Redis Write-Back Cache
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 font-medium">
                      <strong>Problem:</strong> Students fire watch-progress tracking coordinates every 10s, creating massive database write pressure.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong>Solution:</strong> Store progress states in Redis hashes and queue modified user IDs in a Redis set. A scheduled cron pops updates and batch-persists to PostgreSQL every 5 minutes.
                    </p>
                  </div>
                  <div className="bg-brand-bg p-3 rounded text-[11px] font-mono text-gray-700 overflow-x-auto border border-brand-grey/50">
                    <pre>{`// Redis write coordinates
redisTemplate.opsForHash()
  .put("progress:" + userId, lectureId, percent);
redisTemplate.opsForSet().add("dirty:progress", userId);`}</pre>
                  </div>
                </div>

                {/* Bottleneck 3 */}
                <div className="bg-white p-6 border border-brand-grey rounded-lg shadow-sm hover:shadow transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-bg rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-[#1e6055]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#1e6055] bg-brand-bg px-2 py-0.5 rounded">
                        Concurrency Guard
                      </span>
                      <h3 className="font-bold text-base text-brand-charcoal mt-1">
                        Pessimistic Write Locking
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 font-medium">
                      <strong>Problem:</strong> Concurrent payment webhook requests and checkout page redirects can double-enroll users.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong>Solution:</strong> We apply PostgreSQL Pessimistic Write Locking (<code>SELECT ... FOR UPDATE</code>) on transactions combined with unique database constraints on idempotency keys.
                    </p>
                  </div>
                  <div className="bg-brand-bg p-3 rounded text-[11px] font-mono text-gray-700 overflow-x-auto border border-brand-grey/50">
                    <pre>{`@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT e FROM Enrollment e 
        WHERE e.user.id = :userId")
Optional<Enrollment> findWithLock(Long userId);`}</pre>
                  </div>
                </div>

                {/* Bottleneck 4 */}
                <div className="bg-white p-6 border border-brand-grey rounded-lg shadow-sm hover:shadow transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-bg rounded-lg">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 bg-brand-bg px-2 py-0.5 rounded">
                        Media Infrastructure
                      </span>
                      <h3 className="font-bold text-base text-brand-charcoal mt-1">
                        HLS Adaptive Bitrate Streaming
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 font-medium">
                      <strong>Problem:</strong> Storing/playing standard MP4 files results in high bandwidth costs and video lag on slow networks.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong>Solution:</strong> Asynchronously transcode videos using FFMPEG into HLS playlists (index file with 10s segments), served via CloudFront CDN using Signed Cookies.
                    </p>
                  </div>
                  <div className="bg-brand-bg p-3 rounded text-[11px] font-mono text-gray-700 overflow-x-auto border border-brand-grey/50">
                    <pre>{`# FFMPEG segmentation command
ffmpeg -i lecture.mp4 -codec:v libx264 
  -codec:a aac -hls_time 10 
  -hls_playlist_type vod index.m3u8`}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Database Schema Matrix Panel */}
            {activeTab === 'db-schema' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Table List selector */}
                <div className="md:col-span-4 space-y-2 select-none">
                  {(Object.keys(dbSchema) as Array<keyof typeof dbSchema>).map((tbl) => (
                    <button
                      key={tbl}
                      onClick={() => setSelectedTable(tbl)}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
                        selectedTable === tbl
                          ? 'border-brand-purple bg-brand-purple/5 text-brand-purple shadow-sm'
                          : 'border-brand-grey bg-white text-gray-600 hover:border-brand-purple/50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <TableProperties className="w-4 h-4 shrink-0" />
                        {tbl}
                      </span>
                      <span className="text-[10px] font-semibold bg-brand-bg text-gray-400 px-2 py-0.5 rounded border border-brand-grey/50">
                        {dbSchema[tbl].columns.length} Fields
                      </span>
                    </button>
                  ))}
                </div>

                {/* Table schema explorer display */}
                <div className="md:col-span-8 bg-white border border-brand-grey rounded-lg p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-brand-charcoal flex items-center gap-2">
                      <Database className="w-5 h-5 text-brand-purple" />
                      {selectedTable} Schema Definition
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      {dbSchema[selectedTable].description}
                    </p>
                  </div>

                  {/* Schema fields table grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-brand-grey/65 text-[10px] font-extrabold uppercase text-gray-400">
                          <th className="py-2.5">Column Name</th>
                          <th className="py-2.5">Data Type</th>
                          <th className="py-2.5 text-center">Key</th>
                          <th className="py-2.5 text-center">Null</th>
                          <th className="py-2.5 pl-4">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-grey/40 text-xs font-medium text-gray-700">
                        {dbSchema[selectedTable].columns.map((col, index) => (
                          <tr key={index} className="hover:bg-brand-bg/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-brand-charcoal">{col.name}</td>
                            <td className="py-3 font-mono text-gray-500">{col.type}</td>
                            <td className="py-3 text-center">
                              {col.key !== '-' ? (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  col.key === 'PK' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-gold/15 text-[#b4690e]'
                                }`}>
                                  {col.key}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 text-center text-gray-400 font-mono">{col.nullable}</td>
                            <td className="py-3 pl-4 text-gray-500 leading-normal">{col.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Database constraints and index rules */}
                  <div className="pt-4 border-t border-brand-grey/65">
                    <h4 className="text-xs font-bold text-brand-charcoal mb-2">
                      Database Constraint Configurations
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-500">
                      {dbSchema[selectedTable].constraints.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-purple mt-0.5 shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Full Tech Stack Matrix Panel */}
            {activeTab === 'tech-stack' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stack 1 */}
                <div className="bg-white p-6 border border-brand-grey hover:border-brand-purple rounded-lg shadow-sm hover:shadow transition-all flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="p-2.5 bg-brand-bg rounded-lg w-fit">
                      <Paintbrush className="w-5 h-5 text-brand-purple" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-brand-charcoal">
                        Frontend Interface
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Constructed for high performance, smooth animation routing, and full SEO indexing.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {['Next.js 14 (App)', 'React 18', 'TypeScript', 'Tailwind CSS', 'Lucide Icons', 'HLS.js Library'].map((badge) => (
                        <span key={badge} className="text-[10px] font-semibold text-gray-500 bg-brand-bg px-2 py-0.5 rounded border border-brand-grey/40">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stack 2 */}
                <div className="bg-white p-6 border border-brand-grey hover:border-brand-purple rounded-lg shadow-sm hover:shadow transition-all flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="p-2.5 bg-brand-bg rounded-lg w-fit">
                      <Server className="w-5 h-5 text-[#eb8a2f]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-brand-charcoal">
                        Backend API Engine
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Monolithic enterprise engine structuring entity validation, authorization, and commerce.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {['Spring Boot 3', 'Spring MVC REST', 'Spring Data JPA', 'Hibernate ORM', 'Razorpay Gateway', 'Maven Tooling'].map((badge) => (
                        <span key={badge} className="text-[10px] font-semibold text-gray-500 bg-brand-bg px-2 py-0.5 rounded border border-brand-grey/40">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stack 3 */}
                <div className="bg-white p-6 border border-brand-grey hover:border-brand-purple rounded-lg shadow-sm hover:shadow transition-all flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="p-2.5 bg-brand-bg rounded-lg w-fit">
                      <Database className="w-5 h-5 text-[#1e6055]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-brand-charcoal">
                        Databases & Cache
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Dual-layer database engines resolving persistent integrity and watch caching tasks.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {['PostgreSQL 16', 'Redis Stack', 'Flyway DB', 'Postgres GIN Index', 'JPA Projections', 'Write-Back Cache'].map((badge) => (
                        <span key={badge} className="text-[10px] font-semibold text-gray-500 bg-brand-bg px-2 py-0.5 rounded border border-brand-grey/40">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stack 4 */}
                <div className="bg-white p-6 border border-brand-grey hover:border-brand-purple rounded-lg shadow-sm hover:shadow transition-all flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="p-2.5 bg-brand-bg rounded-lg w-fit">
                      <Cpu className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-brand-charcoal">
                        Security & Infrastructure
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Protects transactional requests, streams static items, and segment video assets.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {['JWT Stateless', 'HTTPOnly Cookie', 'SameSite Guard', 'AWS CloudFront', 'FFMPEG Transcode', 'HLS Playlist'].map((badge) => (
                        <span key={badge} className="text-[10px] font-semibold text-gray-500 bg-brand-bg px-2 py-0.5 rounded border border-brand-grey/40">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. CTA Footer Block */}
      <section className="bg-brand-charcoal text-white py-12 px-6 text-center select-none mt-auto">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="font-bold text-lg">Interested in learning more?</h3>
          <p className="text-xs text-gray-400">
            Browse our full catalog of software engineering, web development, data science, and finance courses today.
          </p>
          <div className="pt-2">
            <Link href="/courses" className="inline-flex h-[40px] px-6 bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-xs items-center justify-center transition-colors rounded-[4px]">
              Explore All Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
