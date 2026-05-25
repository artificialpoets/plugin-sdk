import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button.js';
import { cn } from '../utils/cn.js';

/**
 * Minimal type shim for the wp.media() API. Avoid pulling in a global types
 * dependency so this package stays lightweight.
 */
interface WpMedia {
  (config: {
    title?: string;
    button?: { text?: string };
    multiple?: boolean;
    library?: { type?: string };
  }): {
    on: (event: string, handler: () => void) => void;
    open: () => void;
    state: () => {
      get: (key: 'selection') => {
        first: () => { toJSON: () => MediaAttachment };
        map: <T>(fn: (item: { toJSON: () => MediaAttachment }) => T) => T[];
      };
    };
  };
}

declare global {
  interface Window {
    wp?: {
      media?: WpMedia;
    };
  }
}

export interface MediaAttachment {
  id: number;
  url: string;
  alt?: string;
  title?: string;
  filename?: string;
  mime?: string;
  type?: string;
  sizes?: Record<string, { url: string; width: number; height: number }>;
}

export interface MediaButtonProps {
  /**
   * Called when the user picks one or more attachments via wp.media.
   * For a single-pick button, the array has exactly one item.
   */
  onSelect: (attachments: MediaAttachment[]) => void;
  /** Label for the trigger button. */
  children?: ReactNode;
  /** Title of the media library modal. */
  modalTitle?: string;
  /** Label of the "Select" button inside the modal. */
  modalButton?: string;
  /** Allow multiple selection. Default false. */
  multiple?: boolean;
  /** Restrict the wp.media library to a single type — e.g. 'image', 'video', 'audio'. */
  libraryType?: string;
  /**
   * MIME-type filter for the native file picker / drag-drop. Same syntax
   * as the HTML `accept` attribute (e.g. "image/*,application/pdf").
   */
  accept?: string;
  /**
   * Fired when the user drops file(s) onto the trigger, or picks via the
   * native file dialog (when `dropzone` is true). Receives raw File objects
   * — typically you'd POST these to your own /media REST endpoint.
   */
  onFileDrop?: (files: File[]) => void;
  /** Render as a drop zone (dashed border + click anywhere) instead of a plain button. */
  dropzone?: boolean;
  /** Initially-selected attachment to render a thumbnail preview. */
  preview?: MediaAttachment | null;
  /** Button variant — defaults to 'secondary' (.button without modifier). */
  variant?: 'primary' | 'secondary' | 'link';
  className?: string;
}

/**
 * MediaButton — wraps WordPress's media-library modal (wp.media).
 *
 * Requires the WP media scripts. In a plugin admin page, enqueue them via:
 *
 *   wp_enqueue_media();
 *
 * Outside of WordPress, this component renders the trigger but the modal
 * won't open (wp.media is undefined).
 */
export function MediaButton({
  onSelect,
  children = 'Select Media',
  modalTitle = 'Select or Upload Media',
  modalButton = 'Use this media',
  multiple = false,
  libraryType,
  accept,
  onFileDrop,
  dropzone = false,
  preview = null,
  variant = 'secondary',
  className
}: MediaButtonProps) {
  const [selected, setSelected] = useState<MediaAttachment | null>(preview);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<ReturnType<NonNullable<NonNullable<typeof window.wp>['media']>> | null>(null);

  useEffect(() => () => { frameRef.current = null; }, []);

  const open = () => {
    if (typeof window === 'undefined' || !window.wp?.media) {
      // Fall back to native file dialog if wp.media isn't around.
      fileInputRef.current?.click();
      return;
    }
    if (!frameRef.current) {
      frameRef.current = window.wp.media({
        title: modalTitle,
        button: { text: modalButton },
        multiple,
        library: libraryType ? { type: libraryType } : undefined
      });
      frameRef.current.on('select', () => {
        const selection = frameRef.current!.state().get('selection');
        if (multiple) {
          const items = selection.map<MediaAttachment>(s => s.toJSON());
          onSelect(items);
          setSelected(items[0] ?? null);
        } else {
          const first = selection.first().toJSON();
          onSelect([first]);
          setSelected(first);
        }
      });
    }
    frameRef.current.open();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    onFileDrop?.(list);
    // Show local preview of the first file
    const first = list[0];
    if (first && first.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelected({
          id: 0,
          url: String(reader.result),
          filename: first.name,
          mime: first.type,
          type: first.type.split('/')[0]
        });
      };
      reader.readAsDataURL(first);
    }
  };

  if (dropzone) {
    return (
      <label
        className={cn(
          'wp-admin-media-dropzone',
          isDragOver && 'is-dragover',
          className
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.currentTarget.files)}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        />
        {selected && (
          <span
            className="wp-admin-media__preview"
            style={{ backgroundImage: `url(${selected.url})` }}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </label>
    );
  }

  return (
    <span className={cn('wp-admin-media', className)}>
      {selected && (
        <span
          className="wp-admin-media__preview"
          style={{ backgroundImage: `url(${selected.url})` }}
          aria-hidden="true"
        />
      )}
      <Button
        variant={variant === 'secondary' ? undefined : variant}
        onClick={open}
        type="button"
      >
        {children}
      </Button>
      {(onFileDrop || accept) && (
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.currentTarget.files)}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        />
      )}
    </span>
  );
}
