# File Upload & Embedding Feature

**Status:** 🔄 In Progress  
**Priority:** High  
**Estimated Effort:** 3-4 days  

## Overview

Enable users to upload files (PDF, DOCX, TXT, etc.) to the knowledge base with automatic text extraction, chunking, and embedding generation for RAG retrieval.

## Goals

1. Support popular document formats for knowledge base upload
2. Extract text content from uploaded files
3. Chunk and embed file content for vector search
4. Display file sources in chat citations
5. Integrate with existing folder organization

---

## Supported File Types

| Format | Extension | Library | Priority |
|--------|-----------|---------|----------|
| Plain Text | `.txt`, `.md` | Built-in | Phase 1 |
| PDF | `.pdf` | `pypdf` or `pdfplumber` | Phase 1 |
| Word | `.docx` | `python-docx` | Phase 1 |
| Word (Legacy) | `.doc` | `antiword` or `textract` | Phase 2 |
| HTML | `.html`, `.htm` | `beautifulsoup4` | Phase 2 |
| Rich Text | `.rtf` | `striprtf` | Phase 2 |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.webp` | `pytesseract` + `Pillow` / OpenAI Vision | **Phase 2** |
| Spreadsheet | `.xlsx`, `.csv` | `openpyxl`, `pandas` | Phase 3 |
| Presentation | `.pptx` | `python-pptx` | Phase 3 |

### Image Processing Strategy

Images use a **hybrid approach** for maximum knowledge extraction:

| Method | Use Case | Library | Cost |
|--------|----------|---------|------|
| OCR | Text-heavy images (screenshots, scanned docs) | `pytesseract` + `Pillow` | Free |
| Vision LLM | Rich content (diagrams, photos, charts) | OpenAI GPT-4 Vision | ~$0.01/image |

**Auto-detection logic:**
1. Run OCR first
2. If OCR extracts >50 characters → use OCR result
3. If OCR extracts <50 characters → call Vision LLM for description
4. Combine both for comprehensive extraction

---

## Implementation Plan

### Phase 1: Core File Upload & Processing (2 days)

#### 1.1 File Model & Storage

```python
# backend/app/models/knowledge_file.py
class KnowledgeFile(BaseModel, UserOwnedMixin, WorkspaceMixin):
    __tablename__ = "knowledge_files"
    
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=False)  # bytes
    
    # Storage
    storage_path = Column(String(1000), nullable=False)  # S3/MinIO path
    storage_provider = Column(String(50), default="minio")
    
    # Processing status
    status = Column(Enum(FileStatus), default=FileStatus.PENDING)
    # PENDING -> PROCESSING -> PROCESSED -> FAILED
    
    # Content extraction
    extracted_text = Column(Text, nullable=True)  # Full extracted text
    character_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    page_count = Column(Integer, nullable=True)
    
    # Embedding stats
    embedding_stats = Column(JSON, nullable=True)
    
    # Organization
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    tags = Column(Text, nullable=True)  # JSON array
```

#### 1.2 File Upload API

```python
# backend/app/api/v1/knowledge_files.py

@router.post("/files/upload")
async def upload_file(
    file: UploadFile,
    folder_id: Optional[str] = None,
    workspace_id: str = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file to knowledge base.
    Triggers async processing for text extraction and embedding.
    """
    pass

@router.get("/files/{file_id}")
async def get_file(file_id: str, ...):
    """Get file metadata and processing status"""
    pass

@router.delete("/files/{file_id}")
async def delete_file(file_id: str, ...):
    """Delete file and associated embeddings"""
    pass

@router.post("/files/{file_id}/reprocess")
async def reprocess_file(file_id: str, ...):
    """Re-extract and re-embed file content"""
    pass
```

#### 1.3 Text Extraction Service

```python
# backend/app/services/file_processing_service.py

class FileProcessingService:
    """Extract text content from various file formats"""
    
    EXTRACTORS = {
        "txt": TextExtractor,
        "md": TextExtractor,
        "pdf": PDFExtractor,
        "docx": DocxExtractor,
        "png": ImageExtractor,
        "jpg": ImageExtractor,
        "jpeg": ImageExtractor,
        "webp": ImageExtractor,
    }
    
    async def extract_text(self, file_path: str, file_type: str) -> ExtractionResult:
        """Extract text from file based on type"""
        extractor = self.EXTRACTORS.get(file_type)
        if not extractor:
            raise UnsupportedFileTypeError(file_type)
        return await extractor.extract(file_path)

class ExtractionResult:
    text: str
    metadata: Dict[str, Any]  # page_count, author, etc.
    success: bool
    error: Optional[str]
```

#### 1.3.1 Image Extractor (Hybrid OCR + Vision)

```python
# backend/app/services/extractors/image_extractor.py

class ImageExtractor:
    """Extract knowledge from images using OCR and/or Vision LLM"""
    
    OCR_THRESHOLD = 50  # Min characters to consider OCR successful
    
    async def extract(self, file_path: str) -> ExtractionResult:
        """
        Hybrid extraction strategy:
        1. Run OCR first (fast, free)
        2. If OCR yields < 50 chars, call Vision LLM
        3. Combine results for rich content
        """
        # Step 1: OCR extraction
        ocr_text = await self._extract_with_ocr(file_path)
        
        # Step 2: Check if OCR is sufficient
        if len(ocr_text.strip()) >= self.OCR_THRESHOLD:
            return ExtractionResult(
                text=ocr_text,
                metadata={"extraction_method": "ocr"},
                success=True
            )
        
        # Step 3: Use Vision LLM for rich content
        vision_text = await self._extract_with_vision(file_path)
        
        # Combine OCR + Vision if both have content
        combined = f"{vision_text}\n\n[OCR Text]: {ocr_text}" if ocr_text else vision_text
        
        return ExtractionResult(
            text=combined,
            metadata={"extraction_method": "vision_llm"},
            success=True
        )
    
    async def _extract_with_ocr(self, file_path: str) -> str:
        """Extract text using Tesseract OCR"""
        from PIL import Image
        import pytesseract
        
        image = Image.open(file_path)
        return pytesseract.image_to_string(image)
    
    async def _extract_with_vision(self, file_path: str) -> str:
        """Extract description using OpenAI Vision API"""
        import base64
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI()
        
        with open(file_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # or gpt-4-vision-preview
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Describe this image in detail for knowledge base indexing. Include any text, diagrams, charts, or visual elements. Be comprehensive."
                    },
                    {
                        "type": "image_url",
                        "url": {"url": f"data:image/png;base64,{image_data}"}
                    }
                ]
            }],
            max_tokens=1000
        )
        
        return response.choices[0].message.content
```

#### 1.4 File Embedding Service

```python
# backend/app/services/file_embedding_service.py

class FileEmbeddingService:
    """Generate embeddings for uploaded files using chunking"""
    
    async def embed_file(self, file: KnowledgeFile) -> Dict[str, Any]:
        """
        1. Get extracted text from file
        2. Chunk text using TextChunker
        3. Generate embeddings for each chunk
        4. Store in Qdrant with file metadata
        5. Update file embedding_stats
        """
        chunker = TextChunker(chunk_size=1000, chunk_overlap=200)
        chunks = chunker.chunk_text(
            text=file.extracted_text,
            source_id=file.id,
            source_type="file",
            metadata={
                "title": file.original_filename,
                "file_type": file.file_type,
                "folder_id": file.folder_id,
            }
        )
        
        # Embed each chunk
        for chunk in chunks:
            await embedding_service.generate_and_store_vector(
                content=chunk.content,
                source_type="file_chunk",
                source_id=chunk.chunk_id,
                metadata={
                    "parent_id": file.id,
                    "chunk_index": chunk.chunk_index,
                    ...
                }
            )
```

### Phase 2: Frontend Integration (1 day)

#### 2.1 File Upload Component

```tsx
// frontend/src/components/features/knowledge-base/file-upload.tsx

interface FileUploadProps {
  folderId?: string;
  onUploadComplete: (file: KnowledgeFile) => void;
}

export function FileUpload({ folderId, onUploadComplete }: FileUploadProps) {
  // Drag & drop zone
  // File type validation
  // Upload progress indicator
  // Processing status polling
}
```

#### 2.2 Knowledge Files List

```tsx
// frontend/src/components/features/knowledge-base/knowledge-files-list.tsx

export function KnowledgeFilesList({ folderId }: { folderId?: string }) {
  // List uploaded files
  // Show processing status (pending, processing, done, failed)
  // Actions: view, delete, reprocess
  // Embedding status indicator
}
```

#### 2.3 File Viewer

```tsx
// frontend/src/components/features/knowledge-base/file-viewer.tsx

export function FileViewer({ fileId }: { fileId: string }) {
  // Display file metadata
  // Show extracted text preview
  // Embedding stats
  // Download original file
}
```

### Phase 3: RAG Integration (0.5 days)

#### 3.1 Update Knowledge Base Tool

The existing `search_knowledge_base` tool already handles `file_chunk` source_type. Ensure:

- File results include proper source metadata
- Frontend citations link to file viewer
- File title shows in citations

#### 3.2 Source Citations Update

```tsx
// Update source-citations.tsx to handle file sources

const getSourceUrl = (source: KnowledgeSource) => {
  const baseType = source.source.type.replace('_chunk', '');
  const id = source.source.parentId || source.sourceId;
  
  if (baseType === 'note') {
    return `/notes/${id}`;
  }
  if (baseType === 'file') {
    return `/knowledge/files/${id}`;  // NEW
  }
  return `/files/${id}`;
};
```

---

## Database Migration

```python
# alembic/versions/XXX_add_knowledge_files.py

def upgrade():
    op.create_table(
        'knowledge_files',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('storage_path', sa.String(1000), nullable=False),
        sa.Column('storage_provider', sa.String(50), default='minio'),
        sa.Column('status', sa.Enum(FileStatus), default='pending'),
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('character_count', sa.Integer(), default=0),
        sa.Column('word_count', sa.Integer(), default=0),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('embedding_stats', sa.JSON(), nullable=True),
        sa.Column('folder_id', sa.String(), sa.ForeignKey('folders.id')),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.String(), sa.ForeignKey('workspaces.id')),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), onupdate=datetime.utcnow),
        sa.Column('is_deleted', sa.Boolean(), default=False),
    )
```

---

## Dependencies

### Python Packages

```txt
# requirements.txt additions
pypdf>=4.0.0          # PDF text extraction
python-docx>=0.8.11   # DOCX text extraction
Pillow>=10.0.0        # Image processing
pytesseract>=0.3.10   # OCR text extraction from images
beautifulsoup4>=4.12  # HTML parsing (Phase 2)
striprtf>=0.0.26      # RTF parsing (Phase 2)
python-magic>=0.4.27  # MIME type detection
```

### System Dependencies (for OCR)

```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# Windows
# Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/knowledge/files/upload` | Upload file |
| GET | `/api/v1/knowledge/files` | List files (with filters) |
| GET | `/api/v1/knowledge/files/{id}` | Get file details |
| DELETE | `/api/v1/knowledge/files/{id}` | Delete file |
| POST | `/api/v1/knowledge/files/{id}/reprocess` | Re-extract & re-embed |
| GET | `/api/v1/knowledge/files/{id}/download` | Download original |

---

## File Processing Flow

```
┌─────────────┐
│   Upload    │
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Validate   │────▶│   Store     │
│  File Type  │     │   in MinIO  │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Create    │
                    │ DB Record   │
                    │ (PENDING)   │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Background Task      │
              │   (Celery/FastAPI BG)  │
              └───────────┬────────────┘
                          │
       ┌──────────────────┴──────────────────┐
       │                                      │
       ▼                                      ▼
┌─────────────┐                        ┌─────────────┐
│   Extract   │                        │   Update    │
│    Text     │                        │   Status    │
│  (PROCESSING)                        │   (FAILED)  │
└──────┬──────┘                        └─────────────┘
       │
       ▼
┌─────────────┐
│   Chunk     │
│   Text      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Generate   │
│ Embeddings  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Store     │
│  in Qdrant  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Update    │
│   Status    │
│ (PROCESSED) │
└─────────────┘
```

---

## Testing Checklist

### Documents
- [ ] Upload TXT file - text extracted correctly
- [ ] Upload PDF file - text extracted from all pages
- [ ] Upload DOCX file - text extracted, formatting stripped
- [ ] Large file (>10MB) - chunking works correctly
- [ ] Invalid file type - rejected with clear error
- [ ] Corrupted file - fails gracefully

### Images
- [ ] Upload PNG with text - OCR extracts text correctly
- [ ] Upload JPG screenshot - OCR extracts visible text
- [ ] Upload diagram/chart - Vision LLM describes content
- [ ] Upload photo (no text) - Vision LLM provides description
- [ ] Hybrid extraction - OCR + Vision combined when needed

### Embedding & Search
- [ ] Embedding generation - chunks stored in Qdrant
- [ ] Search returns file results with proper citations
- [ ] Search returns image content correctly
- [ ] Delete file - removes embeddings from Qdrant
- [ ] Re-process - clears old embeddings, generates new

---

## Success Criteria

1. Users can upload PDF, DOCX, TXT, and image files
2. Files are processed and embedded within 30 seconds (for <5MB)
3. Images with text use OCR; rich images use Vision LLM
4. Agent can retrieve and cite file/image content in responses
5. Files appear in folder structure alongside notes
6. Clear status indication (processing, done, failed)
