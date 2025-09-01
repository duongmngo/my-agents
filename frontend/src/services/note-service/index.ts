import { apiClient } from '../api-client';
import { Note } from '@/types/knowledge-types';

export interface CreateNoteRequest {
  title: string;
  content: string;
  workspaceId: string;
  folderId: string; // Required - notes must be stored in a folder
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folderId?: string; // Optional for updates
  isPinned?: boolean;
  isArchived?: boolean;
  isPublic?: boolean;
  tags?: string[];
  category?: string;
}

export interface NoteResponse {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  format?: string;
  wordCount?: number;
  characterCount?: number;
  isPinned: boolean;
  isArchived?: boolean;
  isPublic?: boolean;
  isPublished?: boolean;
  isTemplate?: boolean;
  tags?: string[];
  category?: string;
  workspaceId: string;
  folderId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  // Embedding fields
  isEmbedded?: boolean;
  lastEmbeddedAt?: string;
  embeddingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface NoteListResponse {
  notes: NoteResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface NoteCreateResponse {
  note: NoteResponse;
}

export interface NoteDeleteResponse {
  message: string;
}

export class NoteService {
  private static instance: NoteService;
  private readonly baseUrl = '/api/v1/notes';

  private constructor() {}

  public static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService();
    }
    return NoteService.instance;
  }

  /**
   * Create a new note
   */
  async createNote(data: CreateNoteRequest): Promise<NoteCreateResponse> {
    return apiClient.post<NoteCreateResponse>(this.baseUrl, data);
  }

  /**
   * Get notes for a workspace
   */
  async getNotes(
    workspaceId: string,
    folderId?: string,
    skip: number = 0,
    limit: number = 20
  ): Promise<NoteListResponse> {
    const params = new URLSearchParams({
      workspaceId,
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (folderId) {
      params.append('folderId', folderId);
    }

    return apiClient.get<NoteListResponse>(`${this.baseUrl}/?${params.toString()}`);
  }

  /**
   * Get a specific note by ID
   */
  async getNote(noteId: string): Promise<NoteResponse> {
    return apiClient.get<NoteResponse>(`${this.baseUrl}/${noteId}`);
  }

  /**
   * Update a note
   */
  async updateNote(noteId: string, data: UpdateNoteRequest): Promise<NoteResponse> {
    return apiClient.put<NoteResponse>(`${this.baseUrl}/${noteId}`, data);
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<NoteDeleteResponse> {
    return apiClient.delete<NoteDeleteResponse>(`${this.baseUrl}/${noteId}`);
  }

  /**
   * Trigger embedding for a note
   */
  async triggerEmbedding(noteId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`${this.baseUrl}/${noteId}/embed`);
  }
}

// Export a singleton instance
export const noteService = NoteService.getInstance();
