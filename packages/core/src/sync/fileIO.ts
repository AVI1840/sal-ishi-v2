// מימושי FileIO: בדפדפן (הורדה, בחירת קובץ, fetch) ובזיכרון (לבדיקות).

import type { FileIO, PickedFile } from "./FileSyncAdapter";

export function createBrowserFileIO(baseUrl = "./"): FileIO {
  return {
    async save(fileName, text, mimeType) {
      // BOM כדי שקבצי טקסט בעברית ייפתחו נכון גם בעורכים ישנים.
      const blob = new Blob(["﻿", text], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    },

    pick(accept, multiple) {
      return new Promise<PickedFile[]>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.multiple = multiple;
        input.addEventListener("change", async () => {
          const files = [...(input.files ?? [])];
          resolve(await Promise.all(files.map(async (f) => ({ name: f.name, text: stripBom(await f.text()) }))));
        });
        input.addEventListener("cancel", () => resolve([]));
        input.click();
      });
    },

    async fetchText(path) {
      try {
        const res = await fetch(new URL(path, new URL(baseUrl, window.location.href)), { cache: "no-store" });
        return res.ok ? stripBom(await res.text()) : null;
      } catch {
        return null;
      }
    },
  };
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export interface MemoryFileIO extends FileIO {
  saved: Map<string, string>;
  /** הקבצים שיוחזרו בבחירה הבאה. */
  toPick: PickedFile[];
  /** קבצים "מפורסמים" לפי נתיב. */
  published: Map<string, string>;
}

export function createMemoryFileIO(): MemoryFileIO {
  const io: MemoryFileIO = {
    saved: new Map(),
    toPick: [],
    published: new Map(),
    async save(fileName, text) {
      io.saved.set(fileName, stripBom(text));
    },
    async pick(_accept, multiple) {
      const files = multiple ? io.toPick : io.toPick.slice(0, 1);
      io.toPick = [];
      return files;
    },
    async fetchText(path) {
      return io.published.get(path) ?? null;
    },
  };
  return io;
}
