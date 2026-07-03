'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Course } from '../../../lib/types';
import { useAuth } from '../../../hooks/useAuth';
import LearnNavbar from '../../../components/LearnNavbar';
import VideoPlayer from '../../../components/VideoPlayer';
import { LearnPageSkeleton } from '../../../components/skeletons';
import { PlayCircle, CheckCircle2, ChevronRight, Loader2, MessageCircle, Send, Clock, Code2, Play, X, HelpCircle, XCircle } from 'lucide-react';

function transpilePythonToJS(pythonCode: string): string {
  const lines = pythonCode.split('\n');
  const jsLines: string[] = [];
  const indentStack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      jsLines.push(line.replace(/#/g, '//'));
      continue;
    }

    const indentMatch = line.match(/^(\s*)/);
    const currentIndent = indentMatch ? indentMatch[1].length : 0;

    while (indentStack.length > 0 && currentIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push(' '.repeat(indentStack.length * 4) + '}');
    }

    let jsLine = line;

    if (trimmed.startsWith('print(')) {
      jsLine = line.replace(/print\(/, 'console.log(');
    } else if (trimmed.startsWith('print ')) {
      const expr = trimmed.substring(6);
      jsLine = ' '.repeat(currentIndent) + `console.log(${expr});`;
    }

    const forRangeMatch = trimmed.match(/^for\s+(\w+)\s+in\s+range\(([^)]+)\)\s*:/);
    if (forRangeMatch) {
      const varName = forRangeMatch[1];
      const rangeArgs = forRangeMatch[2].split(',').map(a => a.trim());
      let start = '0';
      let end = '0';
      if (rangeArgs.length === 1) {
        end = rangeArgs[0];
      } else if (rangeArgs.length === 2) {
        start = rangeArgs[0];
        end = rangeArgs[1];
      }
      jsLine = ' '.repeat(currentIndent) + `for (let ${varName} = ${start}; ${varName} < ${end}; ${varName}++) {`;
      indentStack.push(currentIndent + 4);
    } else {
      const forInMatch = trimmed.match(/^for\s+(\w+)\s+in\s+([^:]+)\s*:/);
      if (forInMatch) {
        const varName = forInMatch[1];
        const listName = forInMatch[2].trim();
        jsLine = ' '.repeat(currentIndent) + `for (let ${varName} of ${listName}) {`;
        indentStack.push(currentIndent + 4);
      }
    }

    const ifMatch = trimmed.match(/^if\s+([^:]+)\s*:/);
    if (ifMatch) {
      let cond = ifMatch[1];
      cond = cond.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
      jsLine = ' '.repeat(currentIndent) + `if (${cond}) {`;
      indentStack.push(currentIndent + 4);
    }
    const elifMatch = trimmed.match(/^elif\s+([^:]+)\s*:/);
    if (elifMatch) {
      let cond = elifMatch[1];
      cond = cond.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
      jsLine = ' '.repeat(currentIndent) + `else if (${cond}) {`;
      indentStack.push(currentIndent + 4);
    }
    if (trimmed === 'else:') {
      jsLine = ' '.repeat(currentIndent) + `else {`;
      indentStack.push(currentIndent + 4);
    }

    const whileMatch = trimmed.match(/^while\s+([^:]+)\s*:/);
    if (whileMatch) {
      let cond = whileMatch[1];
      cond = cond.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
      jsLine = ' '.repeat(currentIndent) + `while (${cond}) {`;
      indentStack.push(currentIndent + 4);
    }

    const defMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
    if (defMatch) {
      const funcName = defMatch[1];
      const args = defMatch[2];
      jsLine = ' '.repeat(currentIndent) + `function ${funcName}(${args}) {`;
      indentStack.push(currentIndent + 4);
    }

    const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const rest = assignMatch[2];
      const reserved = ['return', 'break', 'continue', 'pass', 'import', 'from'];
      if (!reserved.includes(varName) && !jsCodeContainsDeclaration(jsLines, varName)) {
        jsLine = ' '.repeat(currentIndent) + `let ${varName} = ${rest}`;
      }
    }

    if (trimmed === 'pass') {
      jsLine = ' '.repeat(currentIndent) + '// pass';
    }

    if (trimmed.includes('.append(')) {
      jsLine = jsLine.replace(/\.append\(/g, '.push(');
    }

    jsLine = jsLine.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');

    const endingWithBlock = jsLine.trim().endsWith('{') || jsLine.trim().endsWith('}') || jsLine.trim().startsWith('//');
    if (!endingWithBlock && jsLine.trim().length > 0 && !jsLine.trim().endsWith(';')) {
      jsLine = jsLine + ';';
    }

    jsLines.push(jsLine);
  }

  while (indentStack.length > 0) {
    indentStack.pop();
    jsLines.push(' '.repeat(indentStack.length * 4) + '}');
  }

  return jsLines.join('\n');
}

function jsCodeContainsDeclaration(existingLines: string[], varName: string): boolean {
  const regex = new RegExp(`\\b(let|var|const|function)\\s+${varName}\\b`);
  return existingLines.some(line => regex.test(line));
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { courseId } = params;
  const { user } = useAuth();
  
  const [activeLectureId, setActiveLectureId] = useState<number | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isMobileCurriculumOpen, setIsMobileCurriculumOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'qa'>('content');
  
  // Code Playground state
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundCode, setPlaygroundCode] = useState('// Write your code here\nconsole.log("Hello EduFlow!");\n');
  const [playgroundOutput, setPlaygroundOutput] = useState('');
  const [playgroundLang, setPlaygroundLang] = useState('javascript');
  const [isHtmlPreview, setIsHtmlPreview] = useState(false);

  // Q&A state
  const [showNewThread, setShowNewThread] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [expandedThread, setExpandedThread] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Track last flushed percentage in memory to throttle duplicate API calls
  const lastFlushedPercent = useRef<number>(-1);
  const lastFlushTime = useRef<number>(Date.now());

  // 1. Fetch Course Structure (curriculum) directly by ID
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['learnCourse', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/by-id/${courseId}`);
      return response.data;
    },
    enabled: !!courseId
  });

  // Fetch Course curriculum from database
  const { data: dbCurriculum } = useQuery<any[]>({
    queryKey: ['courseCurriculum', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}/curriculum`);
      return response.data;
    },
    enabled: !!courseId
  });

  // 2. Fetch User progress map for this course (Record<string, number> for Jackson compatibility)
  const { data: progressMap, refetch: refetchProgress } = useQuery<Record<string, number>>({
    queryKey: ['courseProgress', courseId],
    queryFn: async () => {
      const response = await api.get(`/progress/${courseId}`);
      return response.data;
    },
    enabled: !!courseId
  });

  // Practice Test states
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 mins
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [submittingTest, setSubmittingTest] = useState<boolean>(false);

  // Load questions and latest attempt if it's a practice test
  useEffect(() => {
    if (!course || course.type !== 'PRACTICE_TEST') return;
    
    // Fetch Questions
    api.get(`/courses/${courseId}/questions`)
      .then(res => {
        setQuestions(res.data);
      })
      .catch(err => console.error(err));

    // Fetch Latest Attempt
    api.get(`/courses/${courseId}/attempts/latest`)
      .then(res => {
        if (res.data) {
          setTestResult(res.data);
          setIsSubmitted(true);
        }
      })
      .catch(err => console.error(err));
  }, [course, courseId]);

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0 || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          submitTestDirectly();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, isSubmitted]);

  async function submitTestDirectly() {
    setSubmittingTest(true);
    setIsTimerActive(false);
    setIsSubmitted(true);

    const payload = Object.entries(selectedAnswers).map(([qId, opt]) => ({
      questionId: Number(qId),
      selectedOption: opt
    }));

    try {
      const res = await api.post(`/courses/${courseId}/attempts`, payload);
      setTestResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['courseProgress', courseId] });
    } catch (err) {
      console.error('Failed to submit test', err);
    } finally {
      setSubmittingTest(false);
    }
  }

  function startTest() {
    setSelectedAnswers({});
    setActiveQuestionIdx(0);
    setTimeLeft(1800);
    setIsSubmitted(false);
    setTestResult(null);
    setIsTimerActive(true);
  }

  // 3. Fetch Q&A discussion threads for this course
  const { data: threads, isLoading: threadsLoading } = useQuery<any[]>({
    queryKey: ['discussions', courseId, activeLectureId],
    queryFn: async () => {
      const params: any = {};
      if (activeLectureId) params.lectureId = activeLectureId;
      const response = await api.get(`/discussions/course/${courseId}`, { params });
      return response.data;
    },
    enabled: !!courseId && activeTab === 'qa'
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: { courseId: number; lectureId: number | null; title: string; content: string; videoTimestamp: number }) => {
      const response = await api.post('/discussions/threads', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId] });
      setShowNewThread(false);
      setThreadTitle('');
      setThreadContent('');
    }
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (data: { threadId: number; content: string }) => {
      const response = await api.post('/discussions/replies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId] });
      setReplyContent('');
    }
  });

  // Dynamic curriculum generator based on course category
  const getCurriculum = (cId: number, category: string) => {
    if (category === 'AI & Data Science') {
      return [
        {
          id: 1,
          title: 'Foundations of Computer Vision & AI',
          lectures: [
            { id: cId * 1000 + 101, title: 'Introduction to Image Processing & CNNs', durationSec: 320, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=101' },
            { id: cId * 1000 + 102, title: 'Configuring OpenCV & Python Workspace', durationSec: 640, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=102' }
          ]
        },
        {
          id: 2,
          title: 'Object Detection & YOLO Model Training',
          lectures: [
            { id: cId * 1000 + 201, title: 'Understanding YOLO Architecture & Layers', durationSec: 720, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=201' },
            { id: cId * 1000 + 202, title: 'Training YOLO on Custom Datasets', durationSec: 960, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=202' }
          ]
        }
      ];
    } else if (category === 'Finance & Trading') {
      return [
        {
          id: 1,
          title: 'Market Structure & Trading Tools',
          lectures: [
            { id: cId * 1000 + 101, title: 'Introduction to Financial Asset Volatility', durationSec: 280, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=101' },
            { id: cId * 1000 + 102, title: 'Connecting Python to Broker Terminals', durationSec: 580, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=102' }
          ]
        },
        {
          id: 2,
          title: 'Volatility Strategies & Risk Models',
          lectures: [
            { id: cId * 1000 + 201, title: 'Leveraging Weekly Credit Spreads & Iron Condors', durationSec: 680, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=201' },
            { id: cId * 1000 + 202, title: 'Constructing Systematic Capital Allocation Models', durationSec: 840, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=202' }
          ]
        }
      ];
    } else {
      return [
        {
          id: 1,
          title: 'Introduction & Architecture Overview',
          lectures: [
            { id: cId * 1000 + 101, title: 'Welcome & System Architecture Review', durationSec: 324, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=101' },
            { id: cId * 1000 + 102, title: 'Configuring Maven & DB Connections', durationSec: 735, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=102' }
          ]
        },
        {
          id: 2,
          title: 'Caching Strategies with Redis',
          lectures: [
            { id: cId * 1000 + 201, title: 'Installing Redis and Connection Pool Config', durationSec: 640, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=201' },
            { id: cId * 1000 + 202, title: 'Building the Write-Back Progress Scheduler', durationSec: 940, src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?lecture=202' }
          ]
        }
      ];
    }
  };

  const resolveVideoUrl = (videoKey?: string) => {
    if (!videoKey) return 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
    if (videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
      return videoKey;
    }
    return 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
  };

  const curriculum = dbCurriculum && dbCurriculum.length > 0
    ? dbCurriculum.map((s: any, sIdx: number) => ({
        id: Number(s.id) || sIdx + 1,
        title: s.title,
        lectures: s.lectures.map((l: any, lIdx: number) => ({
          id: Number(l.id) || (sIdx + 1) * 1000 + lIdx,
          title: l.title,
          durationSec: l.durationSec || 0,
          src: resolveVideoUrl(l.videoKey)
        }))
      }))
    : (course ? getCurriculum(Number(courseId), course.category) : []);

  // Reset active lecture on route/course navigation
  useEffect(() => {
    setActiveLectureId(null);
    setVideoSrc(null);
    lastFlushedPercent.current = -1;
  }, [courseId]);

  // Set first lecture as default active on load or change in curriculum
  useEffect(() => {
    if (curriculum.length > 0 && !activeLectureId) {
      const firstLec = curriculum[0].lectures[0];
      setActiveLectureId(firstLec.id);
      setVideoSrc(firstLec.src);
    }
  }, [curriculum, activeLectureId]);

  const selectLecture = (id: number, src: string) => {
    setActiveLectureId(id);
    setVideoSrc(src);
    lastFlushedPercent.current = -1;
  };

  // Heartbeat progress tracking
  const handleProgressUpdate = async (percent: number) => {
    if (!activeLectureId) return;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastFlushTime.current;
    const percentDelta = Math.abs(percent - lastFlushedPercent.current);
    if (percentDelta >= 10 || (timeDelta >= 10000 && percent !== lastFlushedPercent.current)) {
      lastFlushedPercent.current = percent;
      lastFlushTime.current = currentTime;
      try {
        await api.put(`/progress/${courseId}/${activeLectureId}`, null, { params: { percent } });
        refetchProgress();
      } catch (e) {
        console.error('Failed to log watch progress', e);
      }
    }
  };

  const toggleLectureCompletion = async (e: React.MouseEvent, lectureId: number, currentCompleted: boolean) => {
    e.stopPropagation();
    const targetPercent = currentCompleted ? 0 : 100;
    try {
      await api.put(`/progress/${courseId}/${lectureId}`, null, { params: { percent: targetPercent } });
      refetchProgress();
    } catch (err) {
      console.error('Failed to toggle completion status', err);
    }
  };

  const calculateOverallProgress = () => {
    if (!progressMap || curriculum.length === 0) return 0;
    const lectures = curriculum.flatMap(s => s.lectures);
    if (lectures.length === 0) return 0;
    
    let totalDuration = 0;
    let completedDuration = 0;
    
    lectures.forEach(lec => {
      const duration = lec.durationSec || 0;
      const score = progressMap[String(lec.id)] ?? 0;
      totalDuration += duration;
      completedDuration += (score / 100) * duration;
    });
    
    if (totalDuration === 0) {
      let completedCount = 0;
      lectures.forEach(lec => {
        const score = progressMap[String(lec.id)] ?? 0;
        if (score >= 90) completedCount++;
      });
      return Math.floor((completedCount / lectures.length) * 100);
    }
    
    return Math.floor((completedDuration / totalDuration) * 100);
  };

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Run code in sandbox
  const runPlaygroundCode = () => {
    setPlaygroundOutput('');
    const isHtml = playgroundLang === 'html' || playgroundLang === 'css';
    setIsHtmlPreview(isHtml);

    if (isHtml) {
      let htmlContent = playgroundCode;
      if (playgroundLang === 'css') {
        htmlContent = `<style>${playgroundCode}</style><div style="font-family: sans-serif; padding: 8px;">CSS styles injected! Add HTML code to see them applied.</div>`;
      }
      setPlaygroundOutput(htmlContent);
      return;
    }

    try {
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('ERROR: ' + args.join(' ')),
        warn: (...args: any[]) => logs.push('WARN: ' + args.join(' ')),
        info: (...args: any[]) => logs.push(args.join(' ')),
      };
      const mockPrint = (...args: any[]) => {
        mockConsole.log(...args);
      };

      let codeToRun = playgroundCode;
      if (playgroundLang === 'python') {
        codeToRun = transpilePythonToJS(playgroundCode);
      }

      const sandbox = new Function('console', 'print', codeToRun);
      sandbox(mockConsole, mockPrint);
      setPlaygroundOutput(logs.join('\n') || '(no output)');
    } catch (err: any) {
      setPlaygroundOutput(`Error: ${err.message}`);
    }
  };


  if (isLoading || !course) {
    return <LearnPageSkeleton />;
  }

  const overallProgress = course.type === 'PRACTICE_TEST'
    ? (testResult?.passed ? 100 : 0)
    : calculateOverallProgress();
  const activeLectureName = curriculum.flatMap(s => s.lectures).find(l => l.id === activeLectureId)?.title || '';

  return (
    <div className="flex-grow flex flex-col bg-brand-charcoal text-white min-h-screen">
      
      {/* 1. Cinematic Navbar header */}
      <LearnNavbar courseId={Number(courseId)} courseTitle={course.title} progressPercent={overallProgress} />

      {/* 2. Main cinema workspace */}
      {/* 2. Main cinema workspace */}
      {course.type === 'PRACTICE_TEST' ? (
        <div className="flex-grow flex flex-col lg:flex-row relative">
          {/* Practice Test Simulator Content */}
          <div className="flex-grow flex flex-col p-6 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Header: Timer / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1c1d23] border border-brand-charcoal-hover rounded-lg p-5 gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-white">Certification Practice Test</h2>
                <p className="text-[11px] text-gray-400 font-medium">
                  {questions.length} Questions · Passing score: 70%
                </p>
              </div>

              {!isTimerActive && !isSubmitted ? (
                <button
                  onClick={startTest}
                  className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-6 py-2.5 rounded transition-colors shadow-sm cursor-pointer border-none"
                >
                  Start Exam Simulator
                </button>
              ) : isTimerActive && !isSubmitted ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#2d1b4e] border border-brand-purple/20 px-4 py-2 rounded text-brand-purple font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <button
                    onClick={submitTestDirectly}
                    disabled={submittingTest}
                    className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold px-5 py-2.5 rounded transition-colors cursor-pointer border-none disabled:opacity-50"
                  >
                    {submittingTest ? 'Submitting...' : 'Submit Test'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={startTest}
                  className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-6 py-2.5 rounded transition-colors shadow-sm cursor-pointer border-none flex items-center gap-1.5"
                >
                  Retake Practice Exam
                </button>
              )}
            </div>

            {/* Test Results Screen */}
            {isSubmitted && testResult && (
              <div className="bg-[#1c1d23] border border-brand-charcoal-hover rounded-lg p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-brand-charcoal-hover pb-5">
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">Exam Results</h3>
                    <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                      <span className="text-3xl font-black text-white">{testResult.score?.toFixed(1)}%</span>
                      <span className={`text-xs font-extrabold px-3 py-1 rounded tracking-wide uppercase ${
                        testResult.passed ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {testResult.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                  
                  {testResult.passed ? (
                    <div className="bg-[#10b981]/10 border border-[#10b981]/20 p-4 rounded-lg text-xs leading-relaxed text-[#34d399] max-w-sm">
                      <p className="font-bold flex items-center gap-1 mb-1">✓ Congratulations!</p>
                      <p>You passed the exam requirements and unlocked your completion certificate! Claim your PDF from the navbar download link.</p>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-xs leading-relaxed text-red-400 max-w-sm">
                      <p className="font-bold flex items-center gap-1 mb-1">✗ Enforce Certificate Lock</p>
                      <p>You must score at least 70.0% to pass the test. Study the correct answer explanations below and retake the test to unlock your certificate.</p>
                    </div>
                  )}
                </div>

                {/* Questions Review list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Detailed Exam Review</h4>
                  {questions.map((q, qIdx) => {
                    const selected = selectedAnswers[q.id];
                    const isCorrect = selected && selected.toUpperCase() === q.correctOption.toUpperCase();
                    return (
                      <div key={q.id} className="bg-[#141519] border border-brand-charcoal-hover rounded-lg p-5 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[10px] font-extrabold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded uppercase">
                            Question {qIdx + 1}
                          </span>
                          {selected ? (
                            isCorrect ? (
                              <span className="text-[10px] font-bold text-[#34d399] flex items-center gap-1">✓ Correct</span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">✗ Incorrect</span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">Not Answered</span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-white">{q.questionText}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold pl-2 pt-1">
                          <div className={q.correctOption === 'A' ? 'text-[#34d399] font-extrabold' : (selected === 'A' ? 'text-red-400 font-extrabold' : 'text-gray-500')}>
                            A) {q.optionA}
                          </div>
                          <div className={q.correctOption === 'B' ? 'text-[#34d399] font-extrabold' : (selected === 'B' ? 'text-red-400 font-extrabold' : 'text-gray-500')}>
                            B) {q.optionB}
                          </div>
                          <div className={q.correctOption === 'C' ? 'text-[#34d399] font-extrabold' : (selected === 'C' ? 'text-red-400 font-extrabold' : 'text-gray-500')}>
                            C) {q.optionC}
                          </div>
                          <div className={q.correctOption === 'D' ? 'text-[#34d399] font-extrabold' : (selected === 'D' ? 'text-red-400 font-extrabold' : 'text-gray-500')}>
                            D) {q.optionD}
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="bg-[#1c1d23] px-3.5 py-2.5 rounded text-[11px] leading-relaxed text-gray-400 border border-brand-charcoal-hover">
                            <span className="font-bold text-white">Explanation:</span> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Question Simulator */}
            {isTimerActive && !isSubmitted && questions.length > 0 && (
              <div className="bg-[#1c1d23] border border-brand-charcoal-hover rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-brand-charcoal-hover pb-4">
                  <span className="text-xs font-extrabold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded uppercase">
                    Question {activeQuestionIdx + 1} of {questions.length}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-white leading-relaxed">
                    {questions[activeQuestionIdx].questionText}
                  </h3>

                  {/* Radio options */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const optionKey = `option${opt}`;
                      const optionText = questions[activeQuestionIdx][optionKey];
                      const qId = questions[activeQuestionIdx].id;
                      const isSelected = selectedAnswers[qId] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setSelectedAnswers(prev => ({ ...prev, [qId]: opt }))}
                          className={`w-full text-left p-4 rounded-lg border text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer bg-transparent ${
                            isSelected
                              ? 'border-brand-purple bg-brand-purple/15 text-white'
                              : 'border-brand-charcoal-hover text-gray-300 hover:bg-brand-charcoal-hover/40'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isSelected ? 'border-brand-purple text-brand-purple bg-white' : 'border-gray-500 text-gray-400'
                          }`}>
                            {opt}
                          </span>
                          <span>{optionText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-brand-charcoal-hover">
                  <button
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx(idx => idx - 1)}
                    className="bg-brand-charcoal-hover hover:bg-brand-charcoal-hover/80 text-white text-xs font-bold px-4 py-2 rounded transition-colors disabled:opacity-40 cursor-pointer border-none"
                  >
                    Previous
                  </button>
                  <button
                    disabled={activeQuestionIdx === questions.length - 1}
                    onClick={() => setActiveQuestionIdx(idx => idx + 1)}
                    className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-5 py-2.5 rounded transition-colors disabled:opacity-40 cursor-pointer border-none"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            )}

            {/* Empty State or instructions */}
            {!isTimerActive && !isSubmitted && (
              <div className="bg-[#1c1d23] border border-brand-charcoal-hover rounded-lg p-10 text-center space-y-4">
                <HelpCircle className="w-12 h-12 text-brand-purple mx-auto animate-pulse" />
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-white">Ready to start the simulation?</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    This test contains multiple-choice questions. You have 30 minutes to complete the exam. You must score 70% or higher to pass and claim your certificate.
                  </p>
                </div>
                <button
                  onClick={startTest}
                  className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-6 py-2.5 rounded transition-colors shadow-sm cursor-pointer border-none inline-flex items-center gap-1.5"
                >
                  Start Exam Simulator
                </button>
              </div>
            )}
          </div>

          {/* Practice Test Sidebar */}
          <aside className="w-full lg:w-[320px] bg-[#1c1d23] lg:bg-brand-charcoal border border-brand-charcoal-hover lg:border-none lg:border-l shrink-0 flex flex-col rounded-lg lg:rounded-none mt-6 lg:mt-0">
            <div className="px-5 py-4 border-b border-brand-charcoal-hover font-bold text-sm select-none">
              <span>Exam Navigation</span>
            </div>
            
            <div className="p-5 flex-grow overflow-y-auto">
              {questions.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {questions.map((q, idx) => {
                    const isAnswered = !!selectedAnswers[q.id];
                    const isActive = idx === activeQuestionIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          if (isTimerActive && !isSubmitted) {
                            setActiveQuestionIdx(idx);
                          }
                        }}
                        disabled={!isTimerActive || isSubmitted}
                        className={`aspect-square rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-colors border-none ${
                          isActive
                            ? 'bg-brand-purple text-white'
                            : isAnswered
                              ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                              : 'bg-brand-charcoal-hover text-gray-400 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic select-none">No questions available.</p>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex-grow flex flex-col lg:flex-row relative">
          
          {/* Left: Video player + Tabs area */}
          <div className="flex-grow flex flex-col">
            
            {/* Video Player */}
            <div className={`flex bg-black justify-center items-center relative ${showPlayground ? 'flex-col lg:flex-row' : ''}`}>
              <div className={`${showPlayground ? 'w-full lg:w-1/2' : 'w-full'} aspect-video relative`}>
                {videoSrc && activeLectureId ? (
                  <VideoPlayer 
                    key={activeLectureId} 
                    src={videoSrc} 
                    onProgress={handleProgressUpdate} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-purple" /> Loading stream source...
                  </div>
                )}
              </div>

              {/* Code Playground (inline split) */}
              {showPlayground && (
                <div className="w-full lg:w-1/2 aspect-video flex flex-col bg-[#1e1e2e] border-l border-brand-charcoal-hover overflow-hidden">
                  {/* Playground Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-b border-[#313244] shrink-0">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-brand-purple" />
                      <span className="text-xs font-bold text-gray-300">Code Playground</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={playgroundLang}
                        onChange={(e) => {
                          const lang = e.target.value;
                          setPlaygroundLang(lang);
                          if (lang === 'python') {
                            setPlaygroundCode('# Write your Python code here\nprint("Hello from Python!")\n\n# Example loop:\nfor i in range(5):\n    print("Count:", i)\n');
                          } else if (lang === 'html') {
                            setPlaygroundCode('<!-- Write your HTML here -->\n<div style="padding: 12px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">\n  <h1 style="color: #166534; font-family: sans-serif; margin: 0 0 8px 0; font-size: 18px;">Hello from HTML!</h1>\n  <p style="margin: 0; color: #15803d; font-size: 13px;">This is a live rendered preview.</p>\n</div>\n');
                          } else if (lang === 'css') {
                            setPlaygroundCode('/* Write your CSS here */\nbody {\n  background: #fdf2f8;\n  padding: 12px;\n}\nh1 {\n  color: #be185d;\n  font-family: Georgia, serif;\n}\n');
                          } else {
                            setPlaygroundCode('// Write your JavaScript code here\nconsole.log("Hello EduFlow!");\n');
                          }
                          setPlaygroundOutput('');
                          setIsHtmlPreview(false);
                        }}
                        className="text-[10px] font-bold bg-[#313244] text-gray-300 border-none rounded px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="python">Python</option>
                      </select>
                      <button 
                        onClick={runPlaygroundCode}
                        className="flex items-center gap-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition-colors cursor-pointer border-none"
                      >
                        <Play className="w-3 h-3" /> Run
                      </button>
                      <button 
                        onClick={() => setShowPlayground(false)}
                        className="text-gray-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    className="flex-grow bg-[#1e1e2e] text-[#cdd6f4] text-xs font-mono p-3 resize-none outline-none border-none leading-relaxed min-h-0"
                    spellCheck={false}
                    placeholder="// Write your code here..."
                  />

                  {/* Output Console */}
                  <div className="bg-[#11111b] border-t border-[#313244] p-3 h-[130px] overflow-y-auto shrink-0">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {isHtmlPreview ? 'Live Preview' : 'Console Output'}
                    </div>
                    {isHtmlPreview ? (
                      <div 
                        className="text-xs bg-white text-black p-3 rounded min-h-[70px] overflow-auto"
                        dangerouslySetInnerHTML={{ __html: playgroundOutput }}
                      />
                    ) : (
                      <pre className="text-xs font-mono text-[#a6e3a1] whitespace-pre-wrap leading-relaxed">
                        {playgroundOutput || 'Click "Run" to see output...'}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tab bar below video */}
            <div className="bg-[#1a1b23] border-b border-brand-charcoal-hover">
              <div className="flex items-center gap-0 px-4">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'content', label: 'Course Content' },
                  { key: 'qa', label: 'Q&A' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer bg-transparent border-none ${
                      activeTab === tab.key 
                        ? 'text-white border-b-2 !border-b-brand-purple' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.key === 'qa' && threads && threads.length > 0 && (
                      <span className="ml-1.5 bg-brand-purple/20 text-brand-purple text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {threads.length}
                      </span>
                    )}
                  </button>
                ))}

                {/* Code Playground Toggle */}
                <div className="ml-auto">
                  <button
                    onClick={() => setShowPlayground(!showPlayground)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded transition-colors cursor-pointer border-none ${
                      showPlayground 
                        ? 'bg-brand-purple text-white' 
                        : 'bg-brand-charcoal-hover text-gray-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Code Editor
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content Panels (visible on mobile or when tabs are selected) */}
            <div className="bg-[#141519] lg:block">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white">{course.title}</h2>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">{course.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium flex-wrap">
                    <span>Category: <span className="text-gray-300 font-bold">{course.category}</span></span>
                    <span>Instructor: <span className="text-gray-300 font-bold">{course.instructor?.name || 'Unknown'}</span></span>
                  </div>
                  <div className="bg-brand-charcoal-hover rounded-[4px] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400">Your Progress</span>
                      <span className="text-brand-purple">{overallProgress}%</span>
                    </div>
                    <div className="w-full bg-black/45 rounded-full h-2 overflow-hidden">
                      <div className="bg-brand-purple h-full rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tab (Mobile only — desktop uses the sidebar) */}
              {activeTab === 'content' && (
                <div className="divide-y divide-brand-charcoal-hover lg:hidden">
                  {curriculum.map((section: any) => (
                    <div key={section.id} className="space-y-1">
                      <div className="px-4 py-3 bg-[#1F2937]/50 text-xs font-bold text-gray-400 flex items-center gap-1.5 select-none">
                        <ChevronRight className="w-3.5 h-3.5" />
                        {section.title}
                      </div>
                      <div className="divide-y divide-brand-charcoal-hover">
                        {section.lectures.map((lecture: any) => {
                          const score = progressMap ? (progressMap[String(lecture.id)] ?? 0) : 0;
                          const isCompleted = score >= 90;
                          const isActive = activeLectureId === lecture.id;
                          return (
                            <button
                              key={lecture.id}
                              onClick={() => selectLecture(lecture.id, lecture.src)}
                              className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                                isActive ? 'bg-brand-charcoal-hover border-l-4 border-brand-purple' : 'hover:bg-brand-charcoal-hover/40'
                              }`}
                            >
                              <div className="flex-grow text-xs space-y-1 min-w-0">
                                <p className={`font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{lecture.title}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                  <PlayCircle className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                                  <span>{Math.floor(lecture.durationSec / 60)} min</span>
                                </div>
                              </div>
                              <div onClick={(e) => toggleLectureCompletion(e, lecture.id, isCompleted)} className="shrink-0 cursor-pointer p-1 rounded hover:bg-white/10 transition-colors" title={isCompleted ? "Mark as incomplete" : "Mark as complete"}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-500 hover:border-brand-purple flex items-center justify-center transition-colors" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Q&A Tab */}
              {activeTab === 'qa' && (
                <div className="p-4 space-y-4 max-w-3xl">
                  {/* New Question button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-brand-purple" />
                      Discussion Forum
                    </h3>
                    <button
                      onClick={() => setShowNewThread(!showNewThread)}
                      className="text-[10px] font-bold bg-brand-purple hover:bg-brand-purple-hover text-white px-3 py-1.5 rounded-[4px] transition-colors cursor-pointer border-none"
                    >
                      {showNewThread ? 'Cancel' : '+ Ask Question'}
                    </button>
                  </div>

                  {/* New Thread Form */}
                  {showNewThread && (
                    <div className="bg-brand-charcoal-hover rounded-[4px] p-4 space-y-3 border border-brand-purple/20">
                      <input
                        type="text"
                        value={threadTitle}
                        onChange={(e) => setThreadTitle(e.target.value)}
                        placeholder="Question title..."
                        className="w-full bg-[#0d0e12] text-white text-xs font-medium px-3 py-2.5 rounded-[4px] border border-[#313244] outline-none focus:border-brand-purple placeholder:text-gray-600"
                      />
                      <textarea
                        value={threadContent}
                        onChange={(e) => setThreadContent(e.target.value)}
                        placeholder="Describe your question in detail..."
                        rows={3}
                        className="w-full bg-[#0d0e12] text-white text-xs font-medium px-3 py-2.5 rounded-[4px] border border-[#313244] outline-none focus:border-brand-purple placeholder:text-gray-600 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-medium">
                          Posting for: <span className="text-brand-purple font-bold">{activeLectureName}</span>
                        </span>
                        <button
                          onClick={() => {
                            if (threadTitle.trim() && threadContent.trim()) {
                              createThreadMutation.mutate({
                                courseId: Number(courseId),
                                lectureId: activeLectureId,
                                title: threadTitle,
                                content: threadContent,
                                videoTimestamp: 0
                              });
                            }
                          }}
                          disabled={createThreadMutation.isPending || !threadTitle.trim() || !threadContent.trim()}
                          className="flex items-center gap-1.5 text-[10px] font-bold bg-brand-purple hover:bg-brand-purple-hover text-white px-4 py-2 rounded-[4px] transition-colors cursor-pointer border-none disabled:opacity-50"
                        >
                          {createThreadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Post Question
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Thread List */}
                  {threadsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-purple" />
                    </div>
                  ) : threads && threads.length > 0 ? (
                    <div className="space-y-3">
                      {threads.map((thread: any) => (
                        <div key={thread.id} className="bg-brand-charcoal-hover rounded-[4px] overflow-hidden border border-[#313244]/50">
                          <button
                            onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                            className="w-full text-left p-4 hover:bg-[#1F2937]/30 transition-colors cursor-pointer bg-transparent border-none"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-full bg-brand-purple/20 flex items-center justify-center shrink-0 text-brand-purple text-[10px] font-bold">
                                {thread.authorName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="flex-grow min-w-0 space-y-1">
                                <p className="text-xs font-bold text-white truncate">{thread.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                  <span>{thread.authorName}</span>
                                  <span>·</span>
                                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                                  {thread.videoTimestamp > 0 && (
                                    <>
                                      <span>·</span>
                                      <span className="flex items-center gap-0.5 text-brand-purple">
                                        <Clock className="w-3 h-3" />
                                        {formatTimestamp(thread.videoTimestamp)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-500 bg-[#0d0e12] px-2 py-0.5 rounded shrink-0">
                                {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                              </span>
                            </div>
                          </button>

                          {/* Expanded Thread Content */}
                          {expandedThread === thread.id && (
                            <div className="px-4 pb-4 space-y-3 border-t border-[#313244]/50">
                              <p className="text-xs text-gray-300 font-medium leading-relaxed pt-3">{thread.content}</p>
                              
                              {/* Replies */}
                              {thread.replies?.map((reply: any) => (
                                <div key={reply.id} className="ml-6 pl-3 border-l-2 border-brand-purple/20 space-y-1">
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                    <span className="font-bold text-gray-400">{reply.authorName}</span>
                                    <span>·</span>
                                    <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-gray-300 font-medium leading-relaxed">{reply.content}</p>
                                </div>
                              ))}

                              {/* Reply input */}
                              <div className="flex gap-2 pt-2">
                                <input
                                  type="text"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && replyContent.trim()) {
                                      createReplyMutation.mutate({ threadId: thread.id, content: replyContent });
                                    }
                                  }}
                                  placeholder="Write a reply..."
                                  className="flex-grow bg-[#0d0e12] text-white text-xs font-medium px-3 py-2 rounded-[4px] border border-[#313244] outline-none focus:border-brand-purple placeholder:text-gray-600"
                                />
                                <button
                                  onClick={() => {
                                    if (replyContent.trim()) {
                                      createReplyMutation.mutate({ threadId: thread.id, content: replyContent });
                                    }
                                  }}
                                  disabled={createReplyMutation.isPending || !replyContent.trim()}
                                  className="bg-brand-purple hover:bg-brand-purple-hover text-white p-2 rounded-[4px] transition-colors cursor-pointer border-none disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2">
                      <MessageCircle className="w-8 h-8 text-gray-600 mx-auto" />
                      <p className="text-xs text-gray-500 font-medium">No discussions yet for this lecture.</p>
                      <p className="text-[10px] text-gray-600">Be the first to ask a question!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Curriculum sidebar (Desktop only) */}
          <aside className="w-full lg:w-[360px] bg-brand-charcoal border-t lg:border-t-0 lg:border-l border-brand-charcoal-hover shrink-0 flex-col hidden lg:flex">
            <div className="px-5 py-4 border-b border-brand-charcoal-hover select-none font-bold text-sm flex items-center justify-between">
              <span>Course Content</span>
            </div>
            
            <div className="flex-grow overflow-y-auto divide-y divide-brand-charcoal-hover">
              {curriculum.map((section: any) => (
                <div key={section.id} className="space-y-1">
                  <div className="px-4 py-3 bg-[#1F2937]/50 text-xs font-bold text-gray-400 flex items-center gap-1.5 select-none">
                    <ChevronRight className="w-3.5 h-3.5" />
                    {section.title}
                  </div>
                  <div className="divide-y divide-brand-charcoal-hover">
                    {section.lectures.map((lecture: any) => {
                      const score = progressMap ? (progressMap[String(lecture.id)] ?? 0) : 0;
                      const isCompleted = score >= 90;
                      const isActive = activeLectureId === lecture.id;
                      return (
                        <button
                          key={lecture.id}
                          onClick={() => selectLecture(lecture.id, lecture.src)}
                          className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                            isActive ? 'bg-brand-charcoal-hover border-l-4 border-brand-purple' : 'hover:bg-brand-charcoal-hover/40'
                          }`}
                        >
                          <div className="flex-grow text-xs space-y-1 min-w-0">
                            <p className={`font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{lecture.title}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                              <PlayCircle className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                              <span>{Math.floor(lecture.durationSec / 60)} min</span>
                            </div>
                            <div className="space-y-1 mt-2">
                              <div className="w-full bg-black/45 rounded-full h-1 overflow-hidden">
                                <div className="bg-brand-purple h-full rounded-full transition-all duration-300" style={{ width: `${score}%` }} />
                              </div>
                              <div className="flex items-center justify-between text-[8px] text-gray-400 font-semibold select-none">
                                <span>{score}% watched</span>
                                <span>{100 - score}% pending</span>
                              </div>
                            </div>
                          </div>
                          <div 
                            onClick={(e) => toggleLectureCompletion(e, lecture.id, isCompleted)}
                            className="shrink-0 cursor-pointer p-1 rounded hover:bg-white/10 transition-colors"
                            title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-500 hover:border-brand-purple flex items-center justify-center transition-colors" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
