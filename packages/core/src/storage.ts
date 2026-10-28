// שמירה מקומית במשטחים: IndexedDB, עם נפילה ל-localStorage ואז לזיכרון.
// כל גישה עטופה ב-try/catch: בחלון פרטי או כשהאחסון חסום, המשטח ממשיך לעבוד
// ופשוט לא שומר בין טעינות.

export interface KeyValueStore {
  readonly kind: "indexeddb" | "localstorage" | "memory";
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    kind: "memory",
    async get<T>(key: string) {
      const raw = map.get(key);
      return raw === undefined ? undefined : (JSON.parse(raw) as T);
    },
    async set(key, value) {
      map.set(key, JSON.stringify(value));
    },
    async delete(key) {
      map.delete(key);
    },
  };
}

function createLocalStorageStore(namespace: string, storage: Storage): KeyValueStore {
  const k = (key: string) => `${namespace}:${key}`;
  return {
    kind: "localstorage",
    async get<T>(key: string) {
      try {
        const raw = storage.getItem(k(key));
        return raw === null ? undefined : (JSON.parse(raw) as T);
      } catch {
        return undefined;
      }
    },
    async set(key, value) {
      try {
        storage.setItem(k(key), JSON.stringify(value));
      } catch (e) {
        console.warn("[storage] שמירה נכשלה", e);
      }
    },
    async delete(key) {
      try {
        storage.removeItem(k(key));
      } catch {
        /* אין מה לעשות */
      }
    },
  };
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const OPEN_TIMEOUT_MS = 3000;

/**
 * פתיחה עם מגבלת זמן: אם לשונית אחרת חוסמת את המאגר (מחיקה או שדרוג בהמתנה),
 * הבקשה עלולה לא להסתיים לעולם. אחרי 3 שניות עוברים לאחסון החלופי במקום להיתקע.
 */
async function openIndexedDb(name: string): Promise<IDBDatabase> {
  const req = indexedDB.open(name, 1);
  req.onupgradeneeded = () => req.result.createObjectStore("kv");
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("IndexedDB open timed out")), OPEN_TIMEOUT_MS),
  );
  const db = await Promise.race([request(req), timeout]);
  // לא חוסמים לשונית אחרת שרוצה למחוק או לשדרג את המאגר.
  db.onversionchange = () => db.close();
  return db;
}

function createIndexedDbStore(db: IDBDatabase, fallback: KeyValueStore): KeyValueStore {
  const tx = (mode: IDBTransactionMode) => db.transaction("kv", mode).objectStore("kv");
  return {
    kind: "indexeddb",
    async get<T>(key: string) {
      try {
        return (await request(tx("readonly").get(key))) as T | undefined;
      } catch {
        return fallback.get<T>(key);
      }
    },
    async set(key, value) {
      try {
        await request(tx("readwrite").put(value, key));
      } catch {
        await fallback.set(key, value);
      }
    },
    async delete(key) {
      try {
        await request(tx("readwrite").delete(key));
      } catch {
        await fallback.delete(key);
      }
    },
  };
}

/** פותח את האחסון הטוב ביותר שזמין. */
export async function openStore(namespace: string): Promise<KeyValueStore> {
  let fallback: KeyValueStore = createMemoryStore();
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.getItem("__probe__");
      fallback = createLocalStorageStore(namespace, localStorage);
    }
  } catch {
    /* localStorage חסום */
  }
  try {
    if (typeof indexedDB !== "undefined") return createIndexedDbStore(await openIndexedDb(namespace), fallback);
  } catch {
    /* IndexedDB חסום */
  }
  return fallback;
}
