export interface User {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  createdAt?: string;
  headline?: string;
  biography?: string;
  language?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  avatarUrl?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED';
  instructor: User;
  createdAt?: string;
  type?: string;
}

export interface CourseListDTO {
  id: number;
  title: string;
  slug: string;
  category: string;
  price: number;
  status: string;
  instructorName: string;
  avgRating: number;
}

export interface Section {
  id: number;
  title: string;
  sortOrder: number;
}

export interface Lecture {
  id: number;
  title: string;
  videoKey?: string;
  durationSec: number;
  isPreview: boolean;
  sortOrder: number;
}

export interface Enrollment {
  id: number;
  user: User;
  course: Course;
  paidAmount: number;
  enrolledAt: string;
}

export interface CartItem {
  id: number;
  user: User;
  course: Course;
  addedAt: string;
}
