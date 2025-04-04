import { openDB, DBSchema, IDBPDatabase } from 'idb';

// تعريف نوع بيانات الحالة
export interface CaseItem {
  id?: number; // سيكون اختيارياً عند الإنشاء
  localId?: string;
  title: string;
  clientName: string;
  clientPhone: string;
  deviceType: string;
  deviceModel: string;
  status: string;
  issueDescription: string;
  createdAt: string;
  updatedAt: string;
  needsSync: boolean;
  syncError?: string;
  // حقول إضافية لدعم وظائف رمز QR
  caseNumber?: string;
  serialNumber?: string;
  technicianName?: string;
  technicianId?: string;
  priority?: string;
  diagnosis?: string;
  solution?: string;
}

// تعريف نوع بيانات الملاحظة
interface NoteItem {
  id?: number; // سيكون اختيارياً عند الإنشاء
  caseId: number;
  text: string;
  createdBy: string;
  createdAt: string;
  needsSync: boolean;
  syncError?: string; // رسالة خطأ المزامنة إن وجدت
}

// تعريف نوع بيانات المرفق
interface AttachmentItem {
  id?: number; // سيكون اختيارياً عند الإنشاء
  caseId: number;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // لتخزين الملفات كقاعدة بيانات URL
  needsSync: boolean;
  syncError?: string; // رسالة خطأ المزامنة إن وجدت
}

// تعريف نوع بيانات حالة المزامنة
interface SyncStatusItem {
  key: string; // 'sync-status' كـ سجل وحيد
  lastSync: string;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
  pendingChanges: number;
}

// تعريف مخطط قاعدة البيانات IndexedDB
// تعريف مخطط قاعدة البيانات IndexedDB
// تعريف مطابق لمتطلبات DBSchema
interface MaintenanceDB extends DBSchema {
  [key: string]: any;

  
  // مخزن الحالات
  cases: {
    key: number;
    value: CaseItem;
    indexes: {
      'by-status': string;
      'by-date': string;
      'by-needs-sync': boolean;
    };
  };

  // مخزن الملاحظات
  notes: {
    key: number;
    value: NoteItem;
    indexes: {
      'by-case': number;
      'by-needs-sync': boolean;
    };
  };

  // مخزن المرفقات
  attachments: {
    key: number;
    value: AttachmentItem;
    indexes: {
      'by-case': number;
      'by-needs-sync': boolean;
    };
  };

  // مخزن حالة المزامنة
  syncStatus: {
    key: string;
    value: SyncStatusItem;
  };
}

let dbPromise: Promise<IDBPDatabase<MaintenanceDB>> | null = null;

// تهيئة قاعدة البيانات
const initDB = async (): Promise<IDBPDatabase<MaintenanceDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<MaintenanceDB>('maintenance-archive', 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // إنشاء مخازن البيانات
        if (oldVersion < 1) {
          // إنشاء مخزن الحالات
          const casesStore = db.createObjectStore('cases', { keyPath: 'id', autoIncrement: true });
          casesStore.createIndex('by-status', 'status');
          casesStore.createIndex('by-date', 'createdAt');
          casesStore.createIndex('by-needs-sync', 'needsSync');
          
          // إنشاء مخزن الملاحظات
          const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
          notesStore.createIndex('by-case', 'caseId');
          notesStore.createIndex('by-needs-sync', 'needsSync');
          
          // إنشاء مخزن المرفقات
          const attachmentsStore = db.createObjectStore('attachments', { keyPath: 'id', autoIncrement: true });
          attachmentsStore.createIndex('by-case', 'caseId');
          attachmentsStore.createIndex('by-needs-sync', 'needsSync');
          
          // إنشاء مخزن حالة المزامنة
          db.createObjectStore('syncStatus', { keyPath: 'key' });
          
          // تهيئة سجل حالة المزامنة
          try {
            const syncStatusStore = db.transaction('syncStatus', 'readwrite').objectStore('syncStatus');
            const initialStatus: SyncStatusItem = {
              key: 'sync-status',
              lastSync: new Date().toISOString(),
              status: 'idle',
              pendingChanges: 0
            };
            syncStatusStore.add(initialStatus);
          } catch (error) {
            console.error('Error initializing sync status:', error);
          }
        }
      }
    });
  }
  
  return dbPromise;
};

// تحديث حالة المزامنة
const updateSyncStatus = async (status: 'idle' | 'syncing' | 'error', error?: string) => {
  const db = await initDB();
  const tx = db.transaction('syncStatus', 'readwrite');
  const store = tx.objectStore('syncStatus');
  
  // الحصول على حالة المزامنة الحالية
  const currentStatus = await store.get('sync-status');
  
  // تحديث السجل
  if (currentStatus) {
    await store.put({
      ...currentStatus,
      status,
      error,
      ...(status === 'idle' && { lastSync: new Date().toISOString() })
    });
  }
  
  await tx.done;
};

// الحصول على حالة المزامنة الحالية
const getSyncStatus = async (): Promise<SyncStatusItem | undefined> => {
  const db = await initDB();
  const status = await db.get('syncStatus', 'sync-status');
  return status;
};

// الحصول على التغييرات التي تحتاج إلى مزامنة
const getPendingChanges = async (): Promise<{
  cases: CaseItem[];
  notes: NoteItem[];
  attachments: AttachmentItem[];
}> => {
  const db = await initDB();
  
  try {
    // الحصول على الحالات التي تحتاج إلى مزامنة
    const casesTx = db.transaction('cases', 'readonly');
    const caseIndex = casesTx.store.index('by-needs-sync');
    const casesPending = await caseIndex.getAll();
    await casesTx.done;
    
    // الحصول على الملاحظات التي تحتاج إلى مزامنة
    const notesTx = db.transaction('notes', 'readonly');
    const noteIndex = notesTx.store.index('by-needs-sync');
    const notesPending = await noteIndex.getAll();
    await notesTx.done;
    
    // الحصول على المرفقات التي تحتاج إلى مزامنة
    const attachmentsTx = db.transaction('attachments', 'readonly');
    const attachmentIndex = attachmentsTx.store.index('by-needs-sync');
    const attachmentsPending = await attachmentIndex.getAll();
    await attachmentsTx.done;
    
    // فلترة النتائج للحصول على العناصر التي تحتاج إلى مزامنة فقط
    return {
      cases: casesPending.filter(item => item.needsSync === true),
      notes: notesPending.filter(item => item.needsSync === true),
      attachments: attachmentsPending.filter(item => item.needsSync === true)
    };
  } catch (error) {
    console.error('Error getting pending changes:', error);
    return {
      cases: [],
      notes: [],
      attachments: []
    };
  }
};

// تحديث عدد التغييرات المعلقة
const updatePendingChangesCount = async (): Promise<number> => {
  try {
    const db = await initDB();
    
    // حساب عدد العناصر التي تحتاج إلى مزامنة
    const pendingChanges = await getPendingChanges();
    
    const totalPending = pendingChanges.cases.length + pendingChanges.notes.length + pendingChanges.attachments.length;

    // تحديث حالة المزامنة
    const statusTx = db.transaction('syncStatus', 'readwrite');
    const statusStore = statusTx.objectStore('syncStatus');
    const currentStatus = await statusStore.get('sync-status');

    if (currentStatus) {
      await statusStore.put({
        ...currentStatus,
        pendingChanges: totalPending
      });
    }
    
    await statusTx.done;
    
    return totalPending;
  } catch (error) {
    console.error('Error updating pending changes count:', error);
    return 0;
  }
};

// إضافة حالة صيانة جديدة
const addCase = async (caseData: Omit<CaseItem, 'id' | 'needsSync'>): Promise<number> => {
  const db = await initDB();
  const tx = db.transaction('cases', 'readwrite');
  
  // إضافة الحالة مع تعيين needsSync إلى true
  const newCase = {
    ...caseData,
    needsSync: true,
    localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  
  const id = await tx.store.add(newCase);
  
  await tx.done;
  
  // تحديث عدد التغييرات المعلقة
  await updatePendingChangesCount();
  
  return id;
};

// تحديث حالة موجودة
const updateCase = async (id: number, caseData: Partial<CaseItem>) => {
  const db = await initDB();
  const tx = db.transaction('cases', 'readwrite');
  
  // الحصول على الحالة الحالية
  const currentCase = await tx.store.get(id);
  
  if (!currentCase) {
    throw new Error('Case not found');
  }
  
  // تحديث البيانات مع تعيين needsSync إلى true
  const updatedCase: CaseItem = {
    ...currentCase,
    ...caseData,
    updatedAt: new Date().toISOString(),
    needsSync: true
  };
  
  await tx.store.put(updatedCase);
  
  await tx.done;
  
  // تحديث عدد التغييرات المعلقة
  await updatePendingChangesCount();
};

// الحصول على حالة بواسطة المعرف
const getCaseById = async (id: number): Promise<CaseItem | undefined> => {
  if (typeof id !== 'number') return undefined;
  
  try {
    const db = await initDB();
    return await db.get('cases', id);
  } catch (error) {
    console.error('Error fetching case by ID:', error);
    return undefined;
  }
};

// الحصول على جميع الحالات
const getAllCases = async () => {
  const db = await initDB();
  return db.getAll('cases');
};

// الحصول على الحالات حسب الحالة
const getCasesByStatus = async (status: string) => {
  const db = await initDB();
  return db.getAllFromIndex('cases', 'by-status', status);
};

// إضافة ملاحظة
const addNote = async (noteData: Omit<NoteItem, 'id' | 'needsSync'>) => {
  const db = await initDB();
  const tx = db.transaction('notes', 'readwrite');

  const newNote: Omit<NoteItem, 'id'> = {
    ...noteData,
    needsSync: true
  };
  
  const id = await tx.store.add(newNote);
  
  await tx.done;
  
  // تحديث عدد التغييرات المعلقة
  await updatePendingChangesCount();
  
  return id;
};

// الحصول على ملاحظات حالة معينة
const getNotesByCaseId = async (caseId: number): Promise<NoteItem[]> => {
  if (typeof caseId !== 'number') return [];

  try {
    const db = await initDB();
    return await db.getAllFromIndex('notes', 'by-case', caseId);
  } catch (error) {
    console.error('Error fetching notes by case ID:', error);
    return [];
  }
};

// إضافة مرفق
const addAttachment = async (attachmentData: Omit<AttachmentItem, 'id' | 'needsSync'>) => {
  const db = await initDB();
  const tx = db.transaction('attachments', 'readwrite');
  
  const newAttachment: Omit<AttachmentItem, 'id'> = {
    ...attachmentData,
    needsSync: true
  };
  
  const id = await tx.store.add(newAttachment);
  
  await tx.done;
  
  // تحديث عدد التغييرات المعلقة
  await updatePendingChangesCount();
  
  return id;
};

// الحصول على مرفقات حالة معينة
const getAttachmentsByCaseId = async (caseId: number): Promise<AttachmentItem[]> => {
  if (typeof caseId !== 'number') return [];

  try {
    const db = await initDB();
    return await db.getAllFromIndex('attachments', 'by-case', caseId);
  } catch (error) {
    console.error('Error fetching attachments by case ID:', error);
    return [];
  }
};



// تحويل من تنسيق Data URL إلى Blob
const dataURLToBlob = async (dataURL: string): Promise<Blob> => {
  try {
    // التحقق من صحة التنسيق
    if (!dataURL.startsWith('data:')) {
      throw new Error('Invalid data URL format');
    }
    
    // استخراج الجزء المهم من الـ data URL
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].slice(5);  // إزالة 'data:'
    const rawData = window.atob(parts[1]);
    
    // تحويل البيانات الخام إلى مصفوفة البايتات
    const byteArrays: Uint8Array[] = [];
    let sliceSize = 512;
    
    for (let offset = 0; offset < rawData.length; offset += sliceSize) {
      const slice = rawData.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: contentType });
  } catch (error) {
    console.error('Error converting data URL to Blob:', error);
    throw error;
  }
};

// وظيفة المزامنة الرئيسية
const synchronize = async (apiBaseUrl: string, authToken: string) => {
  try {
    // تحديث حالة المزامنة إلى 'syncing'
    await updateSyncStatus('syncing');
    
    // الحصول على التغييرات المعلقة
    const pendingChanges = await getPendingChanges();
    
    if (pendingChanges.cases.length === 0 && 
        pendingChanges.notes.length === 0 && 
        pendingChanges.attachments.length === 0) {
      // لا توجد تغييرات للمزامنة
      await updateSyncStatus('idle');
      return {
        success: true,
        message: 'No changes to synchronize'
      };
    }
    
    // مزامنة الحالات
    for (const caseItem of pendingChanges.cases) {
      try {
        let response;
        
        // إذا كان هناك localId، فهذا يعني أنها حالة جديدة
        if (caseItem.localId) {
          // إرسال طلب POST لإنشاء حالة جديدة
          response = await fetch(`${apiBaseUrl}/api/cases`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              // إزالة الحقول الخاصة بالتخزين المحلي
              ...caseItem,
              localId: undefined,
              needsSync: undefined,
              syncError: undefined
            })
          });
        } else {
          // إرسال طلب PUT لتحديث حالة موجودة
          response = await fetch(`${apiBaseUrl}/api/cases/${caseItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              // إزالة الحقول الخاصة بالتخزين المحلي
              ...caseItem,
              needsSync: undefined,
              syncError: undefined
            })
          });
        }
        
        if (response.ok) {
          const serverData = await response.json();
          
          // تحديث الحالة في التخزين المحلي
          const db = await initDB();
          const tx = db.transaction('cases', 'readwrite');
          
          if (caseItem.localId) {
            // إزالة الإصدار المحلي وإضافة الإصدار من الخادم
            if (caseItem.id !== undefined) {
              await tx.store.delete(caseItem.id);
            }
            await tx.store.add({
              ...serverData,
              needsSync: false
            });
          } else {
            // تحديث الحالة الموجودة
            await tx.store.put({
              ...caseItem,
              ...serverData,
              needsSync: false,
              syncError: undefined
            });
          }
          
          await tx.done;
        } else {
          // تحديث خطأ المزامنة
          const db = await initDB();
          const tx = db.transaction('cases', 'readwrite');
          await tx.store.put({
            ...caseItem,
            syncError: `Error: ${response.status} ${response.statusText}`
          });
          await tx.done;
        }
      } catch (error) {
        // تحديث خطأ المزامنة
        const db = await initDB();
        const tx = db.transaction('cases', 'readwrite');
        await tx.store.put({
          ...caseItem,
          syncError: error instanceof Error ? error.message : 'Unknown error'
        });
        await tx.done;
      }
    }
    
    // مزامنة الملاحظات
    for (const noteItem of pendingChanges.notes) {
      try {
        let response;
        
        // إذا لم يكن هناك معرف من الخادم، فهذه ملاحظة جديدة
        if (!noteItem.id || typeof noteItem.id !== 'number' || noteItem.id < 0) {
          // إرسال طلب POST لإنشاء ملاحظة جديدة
          response = await fetch(`${apiBaseUrl}/api/notes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              // إزالة الحقول الخاصة بالتخزين المحلي
              ...noteItem,
              needsSync: undefined,
              syncError: undefined
            })
          });
        } else {
          // إرسال طلب PUT لتحديث ملاحظة موجودة
          response = await fetch(`${apiBaseUrl}/api/notes/${noteItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              // إزالة الحقول الخاصة بالتخزين المحلي
              ...noteItem,
              needsSync: undefined,
              syncError: undefined
            })
          });
        }
        
        if (response.ok) {
          const serverData = await response.json();
          
          // تحديث الملاحظة في التخزين المحلي
          const db = await initDB();
          const tx = db.transaction('notes', 'readwrite');
          
          if (!noteItem.id || typeof noteItem.id !== 'number' || noteItem.id < 0) {
            // إزالة الإصدار المحلي وإضافة الإصدار من الخادم
            if (typeof noteItem.id === 'number') {
              await tx.store.delete(noteItem.id);
            }
            await tx.store.add({
              ...serverData,
              needsSync: false
            });
          } else {
            // تحديث الملاحظة الموجودة
            await tx.store.put({
              ...noteItem,
              ...serverData,
              needsSync: false,
              syncError: undefined
            });
          }
          
          await tx.done;
        } else {
          // تحديث خطأ المزامنة
          const db = await initDB();
          const tx = db.transaction('notes', 'readwrite');
          await tx.store.put({
            ...noteItem,
            syncError: `Error: ${response.status} ${response.statusText}`
          });
          await tx.done;
        }
      } catch (error) {
        // تحديث خطأ المزامنة
        const db = await initDB();
        const tx = db.transaction('notes', 'readwrite');
        await tx.store.put({
          ...noteItem,
          syncError: error instanceof Error ? error.message : 'Unknown error'
        });
        await tx.done;
      }
    }
    
    // مزامنة المرفقات
    for (const attachmentItem of pendingChanges.attachments) {
      try {
        let response;
        
        // تجهيز البيانات للإرسال (تحويل dataUrl إلى ملف)
        const formData = new FormData();
        
        // إضافة البيانات الوصفية كـ JSON
        const metadata = {
          caseId: attachmentItem.caseId,
          name: attachmentItem.name,
          type: attachmentItem.type,
          size: attachmentItem.size
        };
        formData.append('metadata', JSON.stringify(metadata));
        
        // تحويل dataUrl إلى blob وإضافته للنموذج
        if (attachmentItem.dataUrl) {
          const blob = await dataURLToBlob(attachmentItem.dataUrl);
          formData.append('file', blob, attachmentItem.name);
        }
        
        // إذا لم يكن هناك معرف من الخادم، فهذا مرفق جديد
        if (!attachmentItem.id || typeof attachmentItem.id !== 'number' || attachmentItem.id < 0) {
          // إرسال طلب POST لإنشاء مرفق جديد
          response = await fetch(`${apiBaseUrl}/api/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: formData
          });
        } else {
          // إرسال طلب PUT لتحديث مرفق موجود
          response = await fetch(`${apiBaseUrl}/api/attachments/${attachmentItem.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: formData
          });
        }
        
        if (response.ok) {
          const serverData = await response.json();
          
          // تحديث المرفق في التخزين المحلي
          const db = await initDB();
          const tx = db.transaction('attachments', 'readwrite');
          
          if (!attachmentItem.id || typeof attachmentItem.id !== 'number' || attachmentItem.id < 0) {
            // إزالة الإصدار المحلي وإضافة الإصدار من الخادم
            if (typeof attachmentItem.id === 'number') {
              await tx.store.delete(attachmentItem.id);
            }
            await tx.store.add({
              ...serverData,
              dataUrl: attachmentItem.dataUrl, // نحتفظ بنسخة محلية من البيانات
              needsSync: false
            });
          } else {
            // تحديث المرفق الموجود
            await tx.store.put({
              ...attachmentItem,
              ...serverData,
              needsSync: false,
              syncError: undefined
            });
          }
          
          await tx.done;
        } else {
          // تحديث خطأ المزامنة
          const db = await initDB();
          const tx = db.transaction('attachments', 'readwrite');
          await tx.store.put({
            ...attachmentItem,
            syncError: `Error: ${response.status} ${response.statusText}`
          });
          await tx.done;
        }
      } catch (error) {
        // تحديث خطأ المزامنة
        const db = await initDB();
        const tx = db.transaction('attachments', 'readwrite');
        await tx.store.put({
          ...attachmentItem,
          syncError: error instanceof Error ? error.message : 'Unknown error'
        });
        await tx.done;
      }
    }
    
    // تحديث عدد التغييرات المعلقة
    await updatePendingChangesCount();
    
    // تحديث حالة المزامنة إلى 'idle'
    await updateSyncStatus('idle');
    
    return {
      success: true,
      message: 'Synchronization completed successfully'
    };
  } catch (error) {
    // تحديث حالة المزامنة إلى 'error'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncStatus('error', errorMessage);
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

// مراقبة حالة الاتصال
const setupConnectionMonitoring = (onOffline: () => void, onOnline: () => void) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// تصدير الوظائف الرئيسية للاستخدام في باقي التطبيق
export {
  initDB,
  addCase,
  updateCase,
  getCaseById,
  getAllCases,
  getCasesByStatus,
  addNote,
  getNotesByCaseId,
  addAttachment,
  getAttachmentsByCaseId,
  getPendingChanges,
  synchronize,
  getSyncStatus,
  updateSyncStatus,
  updatePendingChangesCount,
  setupConnectionMonitoring
};

export type { NoteItem, AttachmentItem, SyncStatusItem };
