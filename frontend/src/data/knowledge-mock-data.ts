import { Folder, FileItem, Note, WebSource, NoteFolder } from '@/types/knowledge-types';

// Simplified folder structure without root folder
export const fileStructure: Folder[] = [
  {
    id: 'documents',
    name: 'Documents',
    type: 'folder',
    children: [
      {
        id: 'documents-technical',
        name: 'Technical',
        type: 'folder',
        children: [
          {
            id: '1',
            name: 'Product Manual.pdf',
            type: 'file',
            fileType: 'document',
            size: '2.4 MB',
            uploadedAt: '2024-01-15T10:00:00Z',
            folderId: 'documents-technical',
            status: 'embedded',
            tags: ['product', 'manual', 'documentation']
          }
        ]
      },
      {
        id: 'documents-business',
        name: 'Business',
        type: 'folder',
        children: [
          {
            id: '2',
            name: 'API Documentation.docx',
            type: 'file',
            fileType: 'document',
            size: '1.8 MB',
            uploadedAt: '2024-01-14T15:30:00Z',
            folderId: 'documents-business',
            status: 'embedded',
            tags: ['api', 'documentation', 'technical']
          }
        ]
      }
    ]
  },
  {
    id: 'images',
    name: 'Images',
    type: 'folder',
    children: [
      {
        id: 'images-screenshots',
        name: 'Screenshots',
        type: 'folder',
        children: [
          {
            id: '3',
            name: 'screenshot.png',
            type: 'file',
            fileType: 'image',
            size: '1.2 MB',
            uploadedAt: '2024-01-14T15:30:00Z',
            folderId: 'images-screenshots',
            status: 'uploaded',
            tags: ['screenshot', 'ui']
          }
        ]
      }
    ]
  },
  {
    id: 'policies',
    name: 'Company Policies',
    type: 'folder',
    children: [
      {
        id: '4',
        name: 'Company Policies.pdf',
        type: 'file',
        fileType: 'document',
        size: '3.2 MB',
        uploadedAt: '2024-01-13T09:15:00Z',
        folderId: 'policies',
        status: 'processing',
        tags: ['policies', 'hr', 'company']
      }
    ]
  }
];

// Hierarchical note folders structure
export const notesFolders: NoteFolder[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    type: 'folder',
    children: [
      {
        id: 'meeting-notes-quarterly',
        name: 'Quarterly',
        type: 'folder',
        children: [
          {
            id: '1',
            title: 'Q1 Planning Meeting',
            content: 'Discussed Q1 goals and strategies for the upcoming quarter...',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            status: 'embedded',
            tags: ['meeting', 'planning', 'q1'],
            folderId: 'meeting-notes-quarterly'
          }
        ]
      },
      {
        id: 'meeting-notes-weekly',
        name: 'Weekly',
        type: 'folder',
        children: [
          {
            id: '2',
            title: 'Weekly Team Sync',
            content: 'Weekly team synchronization meeting notes...',
            createdAt: '2024-01-14T15:30:00Z',
            updatedAt: '2024-01-14T15:30:00Z',
            status: 'draft',
            tags: ['meeting', 'weekly', 'sync'],
            folderId: 'meeting-notes-weekly'
          }
        ]
      }
    ]
  },
  {
    id: 'technical-notes',
    name: 'Technical Notes',
    type: 'folder',
    children: [
      {
        id: 'technical-notes-architecture',
        name: 'Architecture',
        type: 'folder',
        children: [
          {
            id: '3',
            title: 'System Architecture Decisions',
            content: 'System architecture decisions and implementation notes...',
            createdAt: '2024-01-14T15:30:00Z',
            updatedAt: '2024-01-14T15:30:00Z',
            status: 'draft',
            tags: ['technical', 'architecture'],
            folderId: 'technical-notes-architecture'
          }
        ]
      },
      {
        id: 'technical-notes-api',
        name: 'API',
        type: 'folder',
        children: [
          {
            id: '4',
            title: 'API Design Patterns',
            content: 'Notes on API design patterns and best practices...',
            createdAt: '2024-01-13T12:00:00Z',
            updatedAt: '2024-01-13T12:00:00Z',
            status: 'embedded',
            tags: ['technical', 'api', 'design'],
            folderId: 'technical-notes-api'
          }
        ]
      }
    ]
  },
  {
    id: 'ideas-concepts',
    name: 'Ideas & Concepts',
    type: 'folder',
    children: [
      {
        id: '5',
        title: 'AI Integration Ideas',
        content: 'Ideas for integrating AI features into the platform...',
        createdAt: '2024-01-13T12:00:00Z',
        updatedAt: '2024-01-13T12:00:00Z',
        status: 'draft',
        tags: ['ai', 'ideas', 'integration'],
        folderId: 'ideas-concepts'
      },
      {
        id: '6',
        title: 'Product Feature Ideas',
        content: 'New product feature ideas and concepts...',
        createdAt: '2024-01-12T09:00:00Z',
        updatedAt: '2024-01-12T09:00:00Z',
        status: 'draft',
        tags: ['product', 'features', 'ideas'],
        folderId: 'ideas-concepts'
      }
    ]
  },
  {
    id: 'research',
    name: 'Research',
    type: 'folder',
    children: [
      {
        id: 'research-market',
        name: 'Market Research',
        type: 'folder',
        children: [
          {
            id: '7',
            title: 'Market Research Summary',
            content: 'Summary of recent market research findings...',
            createdAt: '2024-01-12T09:00:00Z',
            updatedAt: '2024-01-12T09:00:00Z',
            status: 'embedded',
            tags: ['research', 'market', 'analysis'],
            folderId: 'research-market'
          }
        ]
      },
      {
        id: 'research-competitor',
        name: 'Competitor Analysis',
        type: 'folder',
        children: [
          {
            id: '8',
            title: 'Competitor Analysis',
            content: 'Analysis of competitor products and strategies...',
            createdAt: '2024-01-11T14:00:00Z',
            updatedAt: '2024-01-11T14:00:00Z',
            status: 'embedded',
            tags: ['research', 'competitor', 'analysis'],
            folderId: 'research-competitor'
          }
        ]
      }
    ]
  }
];

// Legacy notes array for backward compatibility (can be removed later)
export const notes: Note[] = [
  {
    id: '1',
    title: 'Q1 Planning Meeting',
    content: 'Discussed Q1 goals and strategies for the upcoming quarter...',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    status: 'embedded',
    tags: ['meeting', 'planning', 'q1'],
    folderId: 'meeting-notes-quarterly'
  },
  {
    id: '2',
    title: 'Weekly Team Sync',
    content: 'Weekly team synchronization meeting notes...',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    status: 'draft',
    tags: ['meeting', 'weekly', 'sync'],
    folderId: 'meeting-notes-weekly'
  },
  {
    id: '3',
    title: 'System Architecture Decisions',
    content: 'System architecture decisions and implementation notes...',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    status: 'draft',
    tags: ['technical', 'architecture'],
    folderId: 'technical-notes-architecture'
  },
  {
    id: '4',
    title: 'API Design Patterns',
    content: 'Notes on API design patterns and best practices...',
    createdAt: '2024-01-13T12:00:00Z',
    updatedAt: '2024-01-13T12:00:00Z',
    status: 'embedded',
    tags: ['technical', 'api', 'design'],
    folderId: 'technical-notes-api'
  },
  {
    id: '5',
    title: 'AI Integration Ideas',
    content: 'Ideas for integrating AI features into the platform...',
    createdAt: '2024-01-13T12:00:00Z',
    updatedAt: '2024-01-13T12:00:00Z',
    status: 'draft',
    tags: ['ai', 'ideas', 'integration'],
    folderId: 'ideas-concepts'
  },
  {
    id: '6',
    title: 'Product Feature Ideas',
    content: 'New product feature ideas and concepts...',
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z',
    status: 'draft',
    tags: ['product', 'features', 'ideas'],
    folderId: 'ideas-concepts'
  },
  {
    id: '7',
    title: 'Market Research Summary',
    content: 'Summary of recent market research findings...',
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z',
    status: 'embedded',
    tags: ['research', 'market', 'analysis'],
    folderId: 'research-market'
  },
  {
    id: '8',
    title: 'Competitor Analysis',
    content: 'Analysis of competitor products and strategies...',
    createdAt: '2024-01-11T14:00:00Z',
    updatedAt: '2024-01-11T14:00:00Z',
    status: 'embedded',
    tags: ['research', 'competitor', 'analysis'],
    folderId: 'research-competitor'
  }
];

export const webSources: WebSource[] = [
  {
    id: '1',
    url: 'https://example.com/docs',
    title: 'External Documentation',
    lastSync: '2024-01-15T08:00:00Z',
    status: 'active'
  },
  {
    id: '2',
    url: 'https://api.example.com',
    title: 'API Reference',
    lastSync: '2024-01-14T16:00:00Z',
    status: 'active'
  }
];
