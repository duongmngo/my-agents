import { Folder, FileItem, Note, NoteFolder } from '@/types/knowledge-types';
import { 
  FileText, 
  Image, 
  Video, 
  Archive, 
  StickyNote 
} from 'lucide-react';

export const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image': return Image;
    case 'video': return Video;
    case 'archive': return Archive;
    case 'note': return StickyNote;
    default: return FileText;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'embedded': return 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400';
    case 'processing': return 'bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-400';
    case 'uploaded': return 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400';
    case 'failed': return 'bg-error-100 dark:bg-error-900/20 text-error-800 dark:text-error-400';
    default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'embedded': return 'Embedded';
    case 'processing': return 'Processing';
    case 'uploaded': return 'Uploaded';
    case 'failed': return 'Failed';
    default: return status;
  }
};

export const getAllFiles = (items: (Folder | FileItem)[]): FileItem[] => {
  let files: FileItem[] = [];
  items.forEach(item => {
    if (item.type === 'file') {
      files.push(item);
    } else if (item.children) {
      files = [...files, ...getAllFiles(item.children)];
    }
  });
  return files;
};

export const getFilesInFolder = (folderId: string | null, fileStructure: (Folder | FileItem)[]): FileItem[] => {
  if (!folderId) {
    return getAllFiles(fileStructure);
  }
  
  const findFolder = (items: (Folder | FileItem)[]): Folder | null => {
    for (const item of items) {
      if (item.type === 'folder') {
        if (item.id === folderId) return item;
        if (item.children) {
          const found = findFolder(item.children);
          if (found) return found;
        }
      }
    }
    return null;
  };

  const folder = findFolder(fileStructure);
  if (folder && folder.children) {
    return folder.children.filter(item => item.type === 'file') as FileItem[];
  }
  return [];
};

export const filterFiles = (files: FileItem[], searchTerm: string): FileItem[] => {
  return files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};

// Note utilities for hierarchical structure
export const getAllNotes = (items: (NoteFolder | Note)[]): Note[] => {
  let notes: Note[] = [];
  items.forEach(item => {
    if (!('type' in item) || item.type !== 'folder') {
      notes.push(item as Note);
    } else if (item.children) {
      notes = [...notes, ...getAllNotes(item.children)];
    }
  });
  return notes;
};

export const getNotesInFolder = (folderId: string | null, noteStructure: (NoteFolder | Note)[]): Note[] => {
  if (!folderId) {
    return getAllNotes(noteStructure);
  }
  
  const findFolder = (items: (NoteFolder | Note)[]): NoteFolder | null => {
    for (const item of items) {
      if ('type' in item && item.type === 'folder') {
        if (item.id === folderId) return item;
        if (item.children) {
          const found = findFolder(item.children);
          if (found) return found;
        }
      }
    }
    return null;
  };

  const folder = findFolder(noteStructure);
  if (folder && folder.children) {
    return folder.children.filter(item => !('type' in item) || item.type !== 'folder') as Note[];
  }
  return [];
};

export const filterNotes = (notes: Note[], searchTerm: string, selectedFolder: string | null): Note[] => {
  return notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFolder = selectedFolder ? note.folderId === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });
};

// Legacy function for backward compatibility
export const filterNotesLegacy = (notes: Note[], searchTerm: string, selectedFolder: string | null): Note[] => {
  return notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFolder = selectedFolder ? note.folderId === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });
};
