// API service for connecting to the mock backend

const API_BASE_URL = 'http://localhost:5001/api';

// Generic fetch function with error handling
async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Grades API
export interface Grade {
  id: number;
  name: string;
  description?: string;
}

export const gradesApi = {
  getAll: () => fetchApi<Grade[]>('/grades'),
  getById: (id: number) => fetchApi<Grade>(`/grades/${id}`),
  create: (grade: Omit<Grade, 'id'>) => 
    fetchApi<Grade>('/grades', {
      method: 'POST',
      body: JSON.stringify(grade),
    }),
  update: (id: number, grade: Partial<Omit<Grade, 'id'>>) => 
    fetchApi<Grade>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grade),
    }),
  delete: (id: number) => 
    fetchApi<{ message: string }>(`/grades/${id}`, {
      method: 'DELETE',
    }),
};

// Classes API
export interface Class {
  id: number;
  name: string;
  grade_id: number;
}

export const classesApi = {
  getAll: () => fetchApi<Class[]>('/classes'),
  getById: (id: number) => fetchApi<Class>(`/classes/${id}`),
  create: (classItem: Omit<Class, 'id'>) => 
    fetchApi<Class>('/classes', {
      method: 'POST',
      body: JSON.stringify(classItem),
    }),
  update: (id: number, classItem: Partial<Omit<Class, 'id'>>) => 
    fetchApi<Class>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classItem),
    }),
  delete: (id: number) => 
    fetchApi<{ message: string }>(`/classes/${id}`, {
      method: 'DELETE',
    }),
};

// Committee Members API
export interface CommitteeMember {
  id: number;
  name: string;
  class_id: number;
  role?: string;
}

export const committeeMembersApi = {
  getAll: () => fetchApi<CommitteeMember[]>('/committee-members'),
  getById: (id: number) => fetchApi<CommitteeMember>(`/committee-members/${id}`),
  create: (member: Omit<CommitteeMember, 'id'>) => 
    fetchApi<CommitteeMember>('/committee-members', {
      method: 'POST',
      body: JSON.stringify(member),
    }),
  update: (id: number, member: Partial<Omit<CommitteeMember, 'id'>>) => 
    fetchApi<CommitteeMember>(`/committee-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    }),
  delete: (id: number) => 
    fetchApi<{ message: string }>(`/committee-members/${id}`, {
      method: 'DELETE',
    }),
};

// Libraries API
export interface Library {
  id: number;
  name: string;
  location?: string;
  capacity?: number;
  is_active: boolean;
}

export const librariesApi = {
  getAll: () => fetchApi<Library[]>('/libraries'),
  getById: (id: number) => fetchApi<Library>(`/libraries/${id}`),
  create: (library: Omit<Library, 'id'>) => 
    fetchApi<Library>('/libraries', {
      method: 'POST',
      body: JSON.stringify(library),
    }),
  update: (id: number, library: Partial<Omit<Library, 'id'>>) => 
    fetchApi<Library>(`/libraries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(library),
    }),
  delete: (id: number) => 
    fetchApi<{ message: string }>(`/libraries/${id}`, {
      method: 'DELETE',
    }),
};

// Schedules API
export interface Schedule {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
}

export const schedulesApi = {
  getAll: () => fetchApi<Schedule[]>('/schedules'),
  getById: (id: number) => fetchApi<Schedule>(`/schedules/${id}`),
  create: (schedule: Omit<Schedule, 'id'>) => 
    fetchApi<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    }),
  update: (id: number, schedule: Partial<Omit<Schedule, 'id'>>) => 
    fetchApi<Schedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    }),
  delete: (id: number) => 
    fetchApi<{ message: string }>(`/schedules/${id}`, {
      method: 'DELETE',
    }),
};

// Schedule Assignments API
export interface ScheduleAssignment {
  id: number;
  schedule_id: number;
  library_id: number;
  date: string;
  time_slot: string;
  assigned_committee_members?: CommitteeMember[];
}

export const scheduleAssignmentsApi = {
  create: (assignment: Omit<ScheduleAssignment, 'id'> & { assigned_committee_member_ids: number[] }) => 
    fetchApi<ScheduleAssignment>('/schedule-assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    }),
  update: (id: number, assignment: Partial<Omit<ScheduleAssignment, 'id'>> & { assigned_committee_member_ids?: number[] }) => 
    fetchApi<ScheduleAssignment>(`/schedule-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignment),
    }),
  delete: (id: number) => 
    fetchApi<{ message: string }>(`/schedule-assignments/${id}`, {
      method: 'DELETE',
    }),
};

const api = {
  grades: gradesApi,
  classes: classesApi,
  committeeMembers: committeeMembersApi,
  libraries: librariesApi,
  schedules: schedulesApi,
  scheduleAssignments: scheduleAssignmentsApi,
};

export default api;
