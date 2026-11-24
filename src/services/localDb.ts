import type { CameraCapture, DailySteps, RecordingSession, SensorReading } from '../types/sensor';

const DB_NAME = 'sensor_data_dashboard_db';
const DB_VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('recording_sessions')) {
        const sStore = db.createObjectStore('recording_sessions', { keyPath: 'id' });
        sStore.createIndex('startedAt', 'startedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('sensor_readings')) {
        const rStore = db.createObjectStore('sensor_readings', {
          keyPath: 'id',
          autoIncrement: true,
        });
        rStore.createIndex('sessionId', 'sessionId', { unique: false });
        rStore.createIndex('timestamp', 'timestamp', { unique: false });
        rStore.createIndex('userEmail', 'userEmail', { unique: false });
      }
      if (!db.objectStoreNames.contains('daily_steps')) {
        db.createObjectStore('daily_steps', { keyPath: 'dateKey' });
      }
      if (!db.objectStoreNames.contains('camera_captures')) {
        const cStore = db.createObjectStore('camera_captures', {
          keyPath: 'id',
          autoIncrement: true,
        });
        cStore.createIndex('timestamp', 'timestamp', { unique: false });
        cStore.createIndex('userEmail', 'userEmail', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function insertSession(session: RecordingSession): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recording_sessions', 'readwrite');
    tx.objectStore('recording_sessions').put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function closeSession(
  sessionId: string,
  endedAt: string,
  sampleCount: number
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recording_sessions', 'readwrite');
    const store = tx.objectStore('recording_sessions');
    const req = store.get(sessionId);
    req.onsuccess = () => {
      const existing = req.result as RecordingSession | undefined;
      if (existing) {
        store.put({ ...existing, endedAt, sampleCount });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSessions(userEmail?: string): Promise<RecordingSession[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recording_sessions', 'readonly');
    const req = tx.objectStore('recording_sessions').getAll();
    req.onsuccess = () => {
      const all = (req.result as RecordingSession[])
        .filter((s) => !userEmail || s.userEmail === userEmail)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['recording_sessions', 'sensor_readings'], 'readwrite');
    tx.objectStore('recording_sessions').delete(sessionId);
    const rStore = tx.objectStore('sensor_readings');
    const idx = rStore.index('sessionId');
    const cursorReq = idx.openCursor(IDBKeyRange.only(sessionId));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function insertReading(reading: SensorReading): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sensor_readings', 'readwrite');
    const { id: _id, ...payload } = reading;
    tx.objectStore('sensor_readings').add(payload);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getReadingsInDateRange(
  startDate: string,
  endDate: string,
  userEmail?: string
): Promise<SensorReading[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sensor_readings', 'readonly');
    const req = tx.objectStore('sensor_readings').getAll();
    req.onsuccess = () => {
      const rows = (req.result as SensorReading[])
        .filter((r) => {
          const day = r.timestamp.slice(0, 10);
          const inRange = day >= startDate && day <= endDate;
          const matchesUser = !userEmail || r.userEmail === userEmail;
          return inRange && matchesUser;
        })
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getReadingsBySession(sessionId: string): Promise<SensorReading[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sensor_readings', 'readonly');
    const idx = tx.objectStore('sensor_readings').index('sessionId');
    const req = idx.getAll(IDBKeyRange.only(sessionId));
    req.onsuccess = () => {
      const rows = (req.result as SensorReading[]).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      );
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function upsertDailySteps(record: DailySteps): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('daily_steps', 'readwrite');
    tx.objectStore('daily_steps').put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDailyStepHistory(): Promise<DailySteps[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('daily_steps', 'readonly');
    const req = tx.objectStore('daily_steps').getAll();
    req.onsuccess = () => {
      const rows = (req.result as DailySteps[]).sort((a, b) =>
        b.dateKey.localeCompare(a.dateKey)
      );
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function insertCameraCapture(capture: CameraCapture): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('camera_captures', 'readwrite');
    const { id: _id, ...payload } = capture;
    tx.objectStore('camera_captures').add(payload);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCameraCaptures(userEmail?: string): Promise<CameraCapture[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('camera_captures', 'readonly');
    const req = tx.objectStore('camera_captures').getAll();
    req.onsuccess = () => {
      const rows = (req.result as CameraCapture[])
        .filter((c) => !userEmail || c.userEmail === userEmail)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCameraCapture(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('camera_captures', 'readwrite');
    tx.objectStore('camera_captures').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
