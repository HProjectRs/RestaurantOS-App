const DB_NAME = 'RestaurantOSOffline'
const DB_VERSION = 2
const STORE_NAME = 'operationQueue'
const MAX_RETRIES = 5
const RETRY_BACKOFF = [1000, 2000, 4000, 8000, 16000]

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('status', 'status', { unique: false })
      }
    }
    req.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
    req.onerror = (event) => reject((event.target as IDBOpenDBRequest).error)
  })
}

export async function addToQueue(operation: string, data: unknown): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add({ operation, data, status: 'pending', retries: 0, createdAt: new Date().toISOString() })
    req.onsuccess = () => resolve(req.result as number)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getQueue(status = 'pending'): Promise<any[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('status')
    const req = index.getAll(status)
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function updateStatus(id: number, status: string, retries?: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const entry = getReq.result
      if (!entry) return resolve()
      entry.status = status
      if (retries !== undefined) entry.retries = retries
      store.put(entry)
    }
    getReq.onerror = () => reject(getReq.error)
    tx.oncomplete = () => { db.close(); resolve() }
  })
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}
