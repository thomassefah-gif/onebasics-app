import { useRef, useState } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileUploadInputProps {
  /** Target Supabase Storage bucket */
  bucket: 'passport-photos' | 'national-ids' | 'certificates' | 'documents'
  /**
   * Comma-separated list of accepted MIME types, e.g.
   * `'image/jpeg,image/png,image/webp'`
   */
  accept: string
  /** Maximum allowed file size in megabytes (e.g. 5 for 5 MB) */
  maxSizeMb: number
  /** Human-readable label shown above the input */
  label: string
  /** Called with the public URL after a successful upload */
  onUploadComplete: (publicUrl: string) => void
  /** Called with a human-readable message when validation or upload fails */
  onError: (message: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a comma-separated `accept` prop into an array of MIME-type strings. */
function parseAccept(accept: string): string[] {
  return accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

/** Returns true when the file's MIME type is in the allowed list. */
function isMimeAllowed(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type.toLowerCase())
}

/** Returns true when the file is within the allowed size ceiling. */
function isSizeAllowed(file: File, maxSizeMb: number): boolean {
  return file.size <= maxSizeMb * 1024 * 1024
}

/**
 * Generates a unique storage path for a file so that concurrent uploads
 * never collide.  Uses a timestamp + random suffix + sanitised filename.
 */
function buildStoragePath(file: File): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${timestamp}_${random}_${safeName}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `FileUploadInput` — a self-contained file-picker that:
 *
 * 1. Validates the selected file's MIME type against the `accept` list.
 * 2. Validates the file size against `maxSizeMb`.
 * 3. Shows a thumbnail preview for images or a filename chip for PDFs.
 * 4. Uploads the file to the specified Supabase Storage `bucket`.
 * 5. Calls `onUploadComplete` with the public URL on success, or `onError`
 *    on any validation / upload failure.
 *
 * Requirements: 7.4, 7.5, 7.6, 10.6, 13.1–13.5
 */
export function FileUploadInput({
  bucket,
  accept,
  maxSizeMb,
  label,
  onUploadComplete,
  onError,
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Local state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const allowedTypes = parseAccept(accept)

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleClick() {
    inputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset previous state
    setValidationError(null)
    setPreviewUrl(null)
    setPreviewName(null)
    setIsPdf(false)

    // Step 1 — MIME type validation (Requirements 13.1, 13.2)
    if (!isMimeAllowed(file, allowedTypes)) {
      const allowed = allowedTypes
        .map((t) => t.split('/')[1].toUpperCase())
        .join(', ')
      const message = `Invalid file type. Only ${allowed} files are accepted.`
      setValidationError(message)
      onError(message)
      // Reset so the same file can be re-selected after the user fixes it
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // Step 2 — Size validation (Requirements 13.4)
    if (!isSizeAllowed(file, maxSizeMb)) {
      const message = `File is too large. Maximum allowed size is ${maxSizeMb} MB.`
      setValidationError(message)
      onError(message)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // Step 3 — Preview (Requirements 13.5)
    if (file.type === 'application/pdf') {
      setIsPdf(true)
      setPreviewName(file.name)
    } else {
      // Image preview via object URL
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setPreviewName(file.name)
    }

    // Step 4 — Upload to Supabase Storage (Requirements 7.5, 7.6, 10.6)
    setIsUploading(true)
    try {
      const path = buildStoragePath(file)

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file)

      if (uploadError) {
        const message = `Upload failed: ${uploadError.message}`
        setValidationError(message)
        onError(message)
        // Clear preview on upload failure
        setPreviewUrl(null)
        setPreviewName(null)
        setIsPdf(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      onUploadComplete(urlData.publicUrl)
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemove() {
    setPreviewUrl(null)
    setPreviewName(null)
    setIsPdf(false)
    setValidationError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const hasPreview = previewUrl !== null || (isPdf && previewName !== null)

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {/* Drop-zone / picker button */}
      {!hasPreview && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-purple-400 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Upload ${label}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-purple-600" />
              <span>
                Click to upload&nbsp;
                <span className="font-medium text-purple-600">
                  {allowedTypes
                    .map((t) => t.split('/')[1].toUpperCase())
                    .join(', ')}
                </span>
              </span>
              <span className="text-xs text-gray-400">
                Max {maxSizeMb} MB
              </span>
            </>
          )}
        </button>
      )}

      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleFileChange}
        aria-label={label}
      />

      {/* Preview area */}
      {hasPreview && (
        <div className="relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          {isPdf ? (
            /* PDF — show filename chip */
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="h-8 w-8 flex-shrink-0 text-purple-600" />
              <span className="max-w-[200px] truncate font-medium">
                {previewName}
              </span>
            </div>
          ) : (
            /* Image — show thumbnail */
            <img
              src={previewUrl!}
              alt="Preview"
              className="h-16 w-16 flex-shrink-0 rounded object-cover"
              onLoad={() => {
                // Revoke the object URL once the browser has decoded the image
                // to free memory.  We keep previewUrl in state so we can still
                // revoke it here; setting it to null after revoke is fine since
                // the img element has already loaded the blob.
                if (previewUrl) URL.revokeObjectURL(previewUrl)
              }}
            />
          )}

          {/* Uploading overlay on the preview */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}

          {/* Remove button */}
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="ml-auto flex-shrink-0 rounded p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Validation / upload error message */}
      {validationError && (
        <p
          role="alert"
          className="text-sm text-red-600"
          data-testid="file-upload-error"
        >
          {validationError}
        </p>
      )}
    </div>
  )
}
