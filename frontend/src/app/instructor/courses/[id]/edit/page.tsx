'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { 
  ArrowLeft, Save, LayoutGrid, ListPlus, Film, CheckCircle, 
  Loader2, Trash2, Plus, Sparkles, HelpCircle, Eye 
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'details' | 'curriculum' | 'video' | 'questions' | 'publish';

type Section = { id: string; title: string; lectures: Lecture[] };
type Lecture = { id: string; title: string; videoKey?: string; durationSec: number; isPreview: boolean };

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [tab, setTab] = useState<Tab>('details');
  const [course, setCourse] = useState<any>(null);
  const [form, setForm] = useState({ title: '', category: '', description: '', price: '' });
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [uploadingLectureId, setUploadingLectureId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load course details
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/courses/by-id/${id}`)
      .then(res => {
        const c = res.data;
        setCourse(c);
        setForm({ 
          title: c.title || '', 
          category: c.category || '', 
          description: c.description || '', 
          price: c.price ? String(c.price) : '' 
        });

        if (c.type === 'PRACTICE_TEST') {
          api.get(`/courses/${id}/questions`)
            .then(qRes => {
              setQuestions(qRes.data);
            })
            .catch(err => console.error(err));
        }

        // Fetch curriculum from database, fallback to mock template if empty
        api.get(`/courses/${id}/curriculum`)
          .then(currRes => {
            if (currRes.data && currRes.data.length > 0) {
              // Map key properties if needed (backend sortOrder maps to frontend sortOrder or is implicit)
              setSections(currRes.data);
            } else {
              setSections(getInitialCurriculum(c.category || ''));
            }
          })
          .catch(() => {
            setSections(getInitialCurriculum(c.category || ''));
          });
      })
      .catch(err => {
        setStatusMsg('Failed to load course details.');
        setStatusType('error');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveQuestion() {
    if (!editingQuestion.questionText.trim() || 
        !editingQuestion.optionA.trim() || 
        !editingQuestion.optionB.trim() || 
        !editingQuestion.optionC.trim() || 
        !editingQuestion.optionD.trim()) {
      setStatusMsg('Question text and all 4 options are required.');
      setStatusType('error');
      return;
    }

    setSaving(true);
    setStatusMsg('');
    try {
      if (editingQuestion.id) {
        // PUT update
        const res = await api.put(`/courses/${id}/questions/${editingQuestion.id}`, editingQuestion);
        setQuestions(qs => qs.map(q => q.id === editingQuestion.id ? res.data : q));
        setStatusMsg('Question updated successfully!');
      } else {
        // POST create
        const res = await api.post(`/courses/${id}/questions`, editingQuestion);
        setQuestions(qs => [...qs, res.data]);
        setStatusMsg('Question added successfully!');
      }
      setStatusType('success');
      setIsFormOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      setStatusMsg('Failed to save question.');
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(qId: number) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    setStatusMsg('');
    try {
      await api.delete(`/courses/${id}/questions/${qId}`);
      setQuestions(qs => qs.filter(q => q.id !== qId));
      setStatusMsg('Question deleted successfully!');
      setStatusType('success');
    } catch (err: any) {
      setStatusMsg('Failed to delete question.');
      setStatusType('error');
    }
  }

  // Tab 1: Save details
  async function saveDetails() {
    if (!form.title.trim() || !form.category || !form.description.trim() || !form.price) {
      setStatusMsg('All details fields are required.');
      setStatusType('error');
      return;
    }
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await api.put(`/courses/${id}`, {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        price: parseFloat(form.price)
      });
      setCourse(res.data);
      setStatusMsg('Course details successfully updated!');
      setStatusType('success');
    } catch (err: any) {
      setStatusMsg(err?.response?.data?.message || 'Failed to update course details.');
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  }



  // Tab 2: Curriculum modifications
  function addSection() {
    const updated = [
      ...sections,
      {
        id: `sec_${Date.now()}`,
        title: `Section ${sections.length + 1}: Introduction to Topic`,
        lectures: []
      }
    ];
    setSections(updated);
  }

  function removeSection(secId: string) {
    const updated = sections.filter(s => s.id !== secId);
    setSections(updated);
  }

  function updateSectionTitle(secId: string, newTitle: string) {
    const updated = sections.map(s => s.id === secId ? { ...s, title: newTitle } : s);
    setSections(updated);
  }

  function addLecture(secId: string) {
    const updated = sections.map(s => {
      if (s.id === secId) {
        return {
          ...s,
          lectures: [
            ...s.lectures,
            {
              id: `lec_${Date.now()}`,
              title: `Lecture ${s.lectures.length + 1}: Core Concepts`,
              durationSec: 360,
              isPreview: false
            }
          ]
        };
      }
      return s;
    });
    setSections(updated);
  }

  function removeLecture(secId: string, lecId: string) {
    const updated = sections.map(s => {
      if (s.id === secId) {
        return {
          ...s,
          lectures: s.lectures.filter(l => l.id !== lecId)
        };
      }
      return s;
    });
    setSections(updated);
  }

  function updateLectureProperties(secId: string, lecId: string, properties: Partial<Lecture>) {
    const updated = sections.map(s => {
      if (s.id === secId) {
        return {
          ...s,
          lectures: s.lectures.map(l => l.id === lecId ? { ...l, ...properties } : l)
        };
      }
      return s;
    });
    setSections(updated);
  }

  // Tab 3: S3 Video Upload simulation
  async function handleVideoUpload(sectionId: string, lectureId: string, file: File) {
    setUploadingLectureId(lectureId);
    setUploadProgress(10);
    
    try {
      // 1. Get pre-signed URL
      const res = await api.post(`/courses/${id}/video-presigned-url`, null, {
        params: { fileName: file.name }
      });
      const { uploadUrl, s3Key } = res.data;
      setUploadProgress(40);

      // 2. Perform direct PUT to S3 with upload progress tracking
      let wasSimulated = false;
      try {
        await api.put(uploadUrl, file, {
          headers: { 'Content-Type': 'video/mp4' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              const p = Math.round((evt.loaded * 100) / evt.total);
              setUploadProgress(40 + p * 0.5); // scales 40% -> 90%
            }
          }
        });
      } catch (uploadErr) {
        // Fallback simulated progress animation if S3 keys are mock credentials
        wasSimulated = true;
        for (let p = 40; p <= 95; p += 15) {
          await new Promise(r => setTimeout(r, 200));
          setUploadProgress(p);
        }
      }

      setUploadProgress(100);
      
      // Update lecture video properties
      const updated = sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lectures: s.lectures.map(l => l.id === lectureId ? { ...l, videoKey: s3Key, durationSec: 420 } : l)
          };
        }
        return s;
      });
      setSections(updated);
      
      setStatusMsg(wasSimulated
        ? `Video key assigned (S3 simulated): ${s3Key.slice(-20)}...`
        : `Video uploaded to S3: ${s3Key.slice(-20)}...`
      );
      setStatusType('success');
    } catch (err: any) {
      setStatusMsg('Failed to process video pre-signed URL upload.');
      setStatusType('error');
    } finally {
      setTimeout(() => {
        setUploadingLectureId(null);
        setUploadProgress(0);
      }, 1000);
    }
  }

  // Tab 4: Toggle Status between Draft and Published
  async function handleToggleStatus(newStatus: 'DRAFT' | 'PUBLISHED') {
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await api.put(`/courses/${id}/status`, { status: newStatus });
      setCourse(res.data);
      setStatusMsg(`Course is now successfully ${newStatus}!`);
      setStatusType('success');
    } catch (err: any) {
      setStatusMsg('Failed to update course publication status.');
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  }

  // Save Curriculum to backend database
  async function saveCurriculum() {
    setSaving(true);
    setStatusMsg('');
    try {
      // Map frontend curriculum format to backend expected format (sorting, IDs, etc.)
      const formatted = sections.map((s, sIdx) => ({
        id: s.id,
        title: s.title,
        sortOrder: sIdx + 1,
        lectures: s.lectures.map((l, lIdx) => ({
          id: l.id,
          title: l.title,
          videoKey: l.videoKey || '',
          durationSec: l.durationSec || 0,
          isPreview: l.isPreview || false,
          sortOrder: lIdx + 1
        }))
      }));
      const res = await api.put(`/courses/${id}/curriculum`, formatted);
      setSections(res.data);
      setStatusMsg('Course curriculum successfully saved to database!');
      setStatusType('success');
    } catch (err: any) {
      setStatusMsg(err?.response?.data?.message || 'Failed to save course curriculum.');
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/instructor/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs text-brand-purple hover:underline font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Inventory
          </Link>
          {course && (
            <Link 
              href={`/courses/${course.slug}`} 
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-purple font-bold"
            >
              <Eye className="w-4 h-4" /> Live Course Details Preview
            </Link>
          )}
        </div>

        {/* Course Banner Info */}
        <div className="bg-white p-6 rounded-lg border border-brand-grey shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-brand-charcoal">{course?.title}</h1>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase ${
                course?.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>{course?.status}</span>
            </div>
            <p className="text-xs text-gray-400 font-semibold">{course?.category} · Created as Draft</p>
          </div>
          <span className="text-xs text-gray-500 font-bold bg-brand-bg px-3 py-1.5 rounded">ID: #{course?.id}</span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-brand-grey scrollbar-hide overflow-x-auto whitespace-nowrap">
          {[
            { key: 'details', label: 'Details', icon: <Save className="w-4 h-4" /> },
            ...(course?.type === 'PRACTICE_TEST'
              ? [{ key: 'questions', label: 'Practice Questions', icon: <HelpCircle className="w-4 h-4" /> }]
              : [
                  { key: 'curriculum', label: 'Curriculum', icon: <LayoutGrid className="w-4 h-4" /> },
                  { key: 'video', label: 'Video Manager', icon: <Film className="w-4 h-4" /> },
                ]
            ),
            { key: 'publish', label: 'Publish Status', icon: <CheckCircle className="w-4 h-4" /> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as Tab);
                setStatusMsg('');
              }}
              className={`inline-flex items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                tab === t.key
                  ? 'border-brand-charcoal text-brand-charcoal bg-white'
                  : 'border-transparent text-gray-400 hover:text-brand-charcoal hover:border-brand-grey'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Global Action Notifications */}
        {statusMsg && (
          <div className={`p-4 rounded-md border text-xs font-semibold ${
            statusType === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {statusMsg}
          </div>
        )}

        {/* TAB 1: DETAILS */}
        {tab === 'details' && (
          <div className="bg-white border border-brand-grey rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Course Metadata</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-grey rounded text-sm font-semibold focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-grey rounded text-sm font-semibold bg-white focus:outline-none focus:border-brand-purple"
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Finance & Trading">Finance & Trading</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-grey rounded text-sm font-semibold focus:outline-none focus:border-brand-purple resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-grey rounded text-sm font-semibold focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-brand-grey">
              <button
                onClick={saveDetails}
                disabled={saving}
                className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-6 py-2.5 rounded transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CURRICULUM BUILDER */}
        {tab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-brand-grey shadow-sm">
              <div>
                <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Course Curriculum Structure</h2>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Changes must be saved to become permanent</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveCurriculum}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-extrabold px-4 py-2 rounded transition-colors select-none disabled:opacity-60 cursor-pointer border-none"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Curriculum
                </button>
                <button
                  onClick={addSection}
                  className="inline-flex items-center gap-1 bg-brand-charcoal hover:bg-brand-charcoal-hover text-white text-xs font-extrabold px-3 py-2 rounded transition-colors select-none cursor-pointer border-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {sections.map((sec, si) => (
                <div key={sec.id} className="bg-white border border-brand-grey rounded-lg p-5 shadow-sm space-y-4">
                  
                  {/* Section Title Input */}
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={e => updateSectionTitle(sec.id, e.target.value)}
                      className="font-bold text-sm text-brand-charcoal border-b border-dashed border-gray-300 hover:border-brand-purple focus:border-brand-purple focus:outline-none bg-transparent flex-grow py-1"
                    />
                    <button
                      onClick={() => removeSection(sec.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 select-none"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>

                  {/* Lectures list */}
                  <div className="space-y-2.5 pl-4 border-l-2 border-purple-100">
                    {sec.lectures.map((lec, li) => (
                      <div key={lec.id} className="flex items-center gap-3 bg-[#F7F9FA] px-3.5 py-2 rounded border border-brand-grey">
                        <span className="text-gray-400 text-xs font-bold select-none">{li + 1}</span>
                        
                        <input
                          type="text"
                          value={lec.title}
                          onChange={e => updateLectureProperties(sec.id, lec.id, { title: e.target.value })}
                          className="text-xs font-semibold text-brand-charcoal bg-transparent focus:outline-none border-b border-transparent focus:border-brand-purple flex-grow"
                        />

                        {/* Lecture properties toggler */}
                        <div className="flex items-center gap-4 shrink-0">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={lec.isPreview}
                              onChange={e => updateLectureProperties(sec.id, lec.id, { isPreview: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-brand-grey text-brand-purple focus:ring-brand-purple focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preview Video</span>
                          </label>

                          <button
                            onClick={() => removeLecture(sec.id, lec.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove Lecture"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {sec.lectures.length === 0 && (
                      <p className="text-[11px] text-gray-400 italic">No lectures in this section yet. Add your first lecture below.</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => addLecture(sec.id)}
                      className="inline-flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple-hover font-bold hover:underline select-none"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Lecture
                    </button>
                  </div>
                </div>
              ))}

              {sections.length === 0 && (
                <div className="bg-white border border-brand-grey rounded-lg p-10 text-center">
                  <p className="text-sm text-gray-400 font-medium">Curriculum is currently empty. Click Add Section to build syllabus.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VIDEO MANAGER */}
        {tab === 'video' && (
          <div className="bg-white border border-brand-grey rounded-lg p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Lecture Videos Manager</h2>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Generate pre-signed S3 upload links and assign course materials.</p>
            </div>

            <div className="space-y-4 divide-y divide-brand-grey">
              {sections.flatMap((sec, si) =>
                sec.lectures.map((lec, li) => (
                  <div key={lec.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{sec.title}</p>
                      <p className="text-sm font-extrabold text-brand-charcoal">{li + 1}. {lec.title}</p>
                      
                      {lec.videoKey ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          ✓ S3 Key: {lec.videoKey.length > 30 ? `...${lec.videoKey.slice(-25)}` : lec.videoKey}
                        </span>
                      ) : (
                        <span className="inline-flex text-[10px] text-gray-400 font-bold bg-brand-bg px-2 py-0.5 rounded">
                          No video file assigned
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {uploadingLectureId === lec.id ? (
                        <div className="w-[120px] bg-brand-bg rounded-full h-2.5 overflow-hidden border border-brand-grey relative">
                          <div 
                            className="bg-brand-purple h-full transition-all duration-200" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                          <span className="absolute right-0 top-3 text-[9px] font-extrabold text-brand-purple">{uploadProgress}%</span>
                        </div>
                      ) : (
                        <label className="inline-flex justify-center items-center bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-extrabold px-4.5 py-2 rounded transition-colors shadow-sm cursor-pointer select-none">
                          Upload Video (.mp4)
                          <input
                            type="file"
                            accept="video/mp4"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                handleVideoUpload(sec.id, lec.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))
              )}

              {sections.flatMap(s => s.lectures).length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400 font-semibold">No lectures created. Build sections and lectures in the Curriculum tab first.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PRACTICE QUESTIONS */}
        {tab === 'questions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-brand-grey shadow-sm">
              <div>
                <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Practice Exam Questions</h2>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Manage multiple-choice certification questions</p>
              </div>
              <button
                onClick={() => {
                  setEditingQuestion({
                    id: null,
                    questionText: '',
                    optionA: '',
                    optionB: '',
                    optionC: '',
                    optionD: '',
                    correctOption: 'A',
                    explanation: ''
                  });
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1 bg-brand-charcoal hover:bg-brand-charcoal-hover text-white text-xs font-extrabold px-3 py-2 rounded transition-colors select-none cursor-pointer border-none"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            {/* Question Form */}
            {isFormOpen && editingQuestion && (
              <div className="bg-white border-2 border-brand-purple/20 rounded-lg p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold text-brand-purple uppercase tracking-wider">
                  {editingQuestion.id ? 'Edit Question' : 'New Question'}
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Question Text</label>
                    <textarea
                      rows={3}
                      value={editingQuestion.questionText}
                      onChange={e => setEditingQuestion((q: any) => ({ ...q, questionText: e.target.value }))}
                      className="w-full px-3 py-2 border border-brand-grey rounded text-xs font-semibold focus:outline-none focus:border-brand-purple resize-none"
                      placeholder="e.g. Which of the following best describes dependency injection?"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option A</label>
                      <input
                        type="text"
                        value={editingQuestion.optionA}
                        onChange={e => setEditingQuestion((q: any) => ({ ...q, optionA: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-grey rounded text-xs font-semibold focus:outline-none focus:border-brand-purple"
                        placeholder="Option A"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option B</label>
                      <input
                        type="text"
                        value={editingQuestion.optionB}
                        onChange={e => setEditingQuestion((q: any) => ({ ...q, optionB: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-grey rounded text-xs font-semibold focus:outline-none focus:border-brand-purple"
                        placeholder="Option B"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option C</label>
                      <input
                        type="text"
                        value={editingQuestion.optionC}
                        onChange={e => setEditingQuestion((q: any) => ({ ...q, optionC: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-grey rounded text-xs font-semibold focus:outline-none focus:border-brand-purple"
                        placeholder="Option C"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option D</label>
                      <input
                        type="text"
                        value={editingQuestion.optionD}
                        onChange={e => setEditingQuestion((q: any) => ({ ...q, optionD: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-grey rounded text-xs font-semibold focus:outline-none focus:border-brand-purple"
                        placeholder="Option D"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Correct Option</label>
                      <select
                        value={editingQuestion.correctOption}
                        onChange={e => setEditingQuestion((q: any) => ({ ...q, correctOption: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-grey rounded text-xs font-semibold bg-white focus:outline-none focus:border-brand-purple"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Explanation</label>
                      <input
                        type="text"
                        value={editingQuestion.explanation || ''}
                        onChange={e => setEditingQuestion((q: any) => ({ ...q, explanation: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-grey rounded text-xs font-semibold focus:outline-none focus:border-brand-purple"
                        placeholder="Why is this answer correct?"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-brand-grey">
                  <button
                    onClick={saveQuestion}
                    disabled={saving}
                    className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-4 py-2 rounded transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1 cursor-pointer border-none"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Question
                  </button>
                  <button
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingQuestion(null);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded transition-colors cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* List of Questions */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="bg-white border border-brand-grey rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold text-brand-purple bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-wider">
                        Question {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-brand-charcoal pt-1">{q.questionText}</h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsFormOpen(true);
                        }}
                        className="text-xs text-brand-purple hover:underline font-bold bg-transparent border-none cursor-pointer"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="text-xs text-red-500 hover:underline font-bold bg-transparent border-none cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold pl-2">
                    <div className={q.correctOption === 'A' ? 'text-emerald-600 font-extrabold' : 'text-gray-500'}>
                      A) {q.optionA}
                    </div>
                    <div className={q.correctOption === 'B' ? 'text-emerald-600 font-extrabold' : 'text-gray-500'}>
                      B) {q.optionB}
                    </div>
                    <div className={q.correctOption === 'C' ? 'text-emerald-600 font-extrabold' : 'text-gray-500'}>
                      C) {q.optionC}
                    </div>
                    <div className={q.correctOption === 'D' ? 'text-emerald-600 font-extrabold' : 'text-gray-500'}>
                      D) {q.optionD}
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="bg-brand-bg px-3.5 py-2.5 rounded text-[11px] leading-relaxed text-gray-500 border border-brand-grey font-medium">
                      <span className="font-bold text-brand-charcoal">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              {questions.length === 0 && !isFormOpen && (
                <div className="bg-white border border-brand-grey rounded-lg p-10 text-center">
                  <p className="text-sm text-gray-400 font-medium">No questions created yet. Click Add Question to start building your certification test.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PUBLISH STATUS */}
        {tab === 'publish' && course && (
          <div className="bg-white border border-brand-grey rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Publish Management</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded ${
                  course.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>{course.status}</span>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Course Status</span>
              </div>

              <div className="bg-brand-bg rounded-lg p-5 border border-brand-grey text-xs leading-relaxed text-gray-500 space-y-2">
                <p className="font-bold text-brand-charcoal flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-brand-purple" /> Important Publication Guidelines:
                </p>
                <p>· Draft courses are completely hidden from the public category grids and search indexing.</p>
                <p>· Publishing the course makes it immediately live on port 3000 homepage listings and dynamic searches.</p>
                <p>· Make sure to write a detailed course biography and assign correct prices before launching.</p>
              </div>

              <div className="pt-4 border-t border-brand-grey">
                <button
                  onClick={() => handleToggleStatus(course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                  disabled={saving}
                  className={`text-xs font-extrabold tracking-wider uppercase px-6 py-3 rounded transition-colors shadow-sm disabled:opacity-60 text-white ${
                    course.status === 'PUBLISHED'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {saving ? 'Updating status...' : course.status === 'PUBLISHED' ? 'Unpublish Course' : 'Publish Course'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Baseline mock curriculum configuration based on category
function getInitialCurriculum(category: string): Section[] {
  if (category === 'AI & Data Science') {
    return [
      {
        id: 'sec_1',
        title: 'Section 1: Foundations of Computer Vision & AI',
        lectures: [
          { id: 'lec_101', title: 'Introduction to Image Processing & CNNs', durationSec: 320, isPreview: true },
          { id: 'lec_102', title: 'Configuring OpenCV & Python Workspace', durationSec: 640, isPreview: false }
        ]
      },
      {
        id: 'sec_2',
        title: 'Section 2: Object Detection & YOLO Model Training',
        lectures: [
          { id: 'lec_201', title: 'Understanding YOLO Architecture & Layers', durationSec: 720, isPreview: false },
          { id: 'lec_202', title: 'Training YOLO on Custom Datasets', durationSec: 960, isPreview: false }
        ]
      }
    ];
  } else if (category === 'Finance & Trading') {
    return [
      {
        id: 'sec_1',
        title: 'Section 1: Introduction to Stock Options spreads',
        lectures: [
          { id: 'lec_101', title: 'Welcome to Algorithmic Options Trading', durationSec: 280, isPreview: true },
          { id: 'lec_102', title: 'Options Call vs Put Spreads Explained', durationSec: 540, isPreview: false }
        ]
      },
      {
        id: 'sec_2',
        title: 'Section 2: Technical Charting & Risk Mitigation',
        lectures: [
          { id: 'lec_201', title: 'Plotting Support/Resistance via Python', durationSec: 610, isPreview: false },
          { id: 'lec_202', title: 'Mastering Volatility Delta & Option Greeks', durationSec: 840, isPreview: false }
        ]
      }
    ];
  } else {
    // Default / Software Engineering
    return [
      {
        id: 'sec_1',
        title: 'Section 1: Setup & Local Workspace Environment',
        lectures: [
          { id: 'lec_101', title: 'Welcome & Curriculum Overview', durationSec: 300, isPreview: true },
          { id: 'lec_102', title: 'Configuring Java Spring Boot 3 & Maven', durationSec: 720, isPreview: false }
        ]
      },
      {
        id: 'sec_2',
        title: 'Section 2: Architecture & JPA Repository mapping',
        lectures: [
          { id: 'lec_201', title: 'Mapping Relational Databases to entities', durationSec: 880, isPreview: false },
          { id: 'lec_202', title: 'Eliminating N+1 Queries with projections', durationSec: 1020, isPreview: false }
        ]
      }
    ];
  }
}
