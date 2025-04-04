import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ArrowUturnLeftIcon, 
  PencilSquareIcon, 
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ClockIcon,
  ListBulletIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

// استيراد المكونات
import CaseInfo, { CaseData } from '../../components/cases/CaseInfo'
import TabsContainer from '../../components/common/TabsContainer'
import NotesTab, { Note } from '../../components/cases/NotesTab'
import AttachmentsTab, { Attachment } from '../../components/cases/AttachmentsTab'
import ActivityLogTab, { Activity } from '../../components/cases/ActivityLogTab'
import WorkLogTab, { WorkLog } from '../../components/cases/WorkLogTab'
import CaseQRCodeManager from '../../components/cases/CaseQRCodeManager'
import LoadingScreen from '../../components/common/LoadingScreen'
import { CaseItem } from '../../services/offlineStorage'

// بيانات توضيحية (في التطبيق الفعلي ستأتي من API)
const mockCaseData: CaseData = {
  id: '12345678-1234-1234-1234-123456789012',
  deviceModel: 'iPhone 12',
  serialNumber: 'SN12345678',
  clientName: 'عمر أحمد',
  clientPhone: '01012345678',
  issueDescription: 'الشاشة لا تعمل بشكل صحيح، تظهر خطوط زرقاء على الشاشة عند تشغيل الجهاز. حدثت المشكلة بعد سقوط الجهاز من ارتفاع منخفض.',
  diagnosis: 'كابل الشاشة مفصول نتيجة الصدمة. لا توجد أضرار في الشاشة نفسها.',
  solution: 'تم إعادة توصيل كابل الشاشة والتأكد من تثبيته بشكل صحيح.',
  status: 'قيد الإصلاح',
  technicianName: 'محمد علي',
  createdAt: '2025-04-02T10:30:00',
  updatedAt: '2025-04-03T15:45:00'
}

const mockNotes: Note[] = [
  {
    id: '1',
    noteText: 'تم فحص الجهاز ووجدت أن كابل الشاشة مفصول بسبب الصدمة. لا توجد أضرار أخرى ظاهرة.',
    createdBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-02T11:45:00'
  },
  {
    id: '2',
    noteText: 'تم إعادة توصيل الكابل وتثبيته. تم اختبار الشاشة وتعمل بشكل طبيعي الآن. سيتم مراقبة الجهاز لمدة ساعة للتأكد من عدم وجود مشاكل أخرى.',
    createdBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-03T10:15:00'
  }
]

const mockAttachments: Attachment[] = [
  {
    id: '1',
    fileName: 'iphone-screen-issue.jpg',
    fileType: 'image',
    fileSize: 1240000,
    fileUrl: 'https://example.com/attachments/iphone-screen-issue.jpg',
    thumbnailUrl: 'https://example.com/attachments/thumbnails/iphone-screen-issue.jpg',
    createdBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-02T11:30:00'
  },
  {
    id: '2',
    fileName: 'تقرير الفحص.pdf',
    fileType: 'pdf',
    fileSize: 520000,
    fileUrl: 'https://example.com/attachments/inspection-report.pdf',
    createdBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-03T09:45:00'
  }
]

const mockActivities: Activity[] = [
  {
    id: '1',
    action: 'تم استلام الجهاز',
    performedBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-02T10:30:00'
  },
  {
    id: '2',
    action: 'تم فحص الجهاز',
    performedBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-02T11:20:00'
  },
  {
    id: '3',
    action: 'تم تشخيص المشكلة: كابل الشاشة مفصول',
    performedBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-02T11:45:00'
  },
  {
    id: '4',
    action: 'بدء الإصلاح',
    performedBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-03T09:30:00'
  },
  {
    id: '5',
    action: 'تم إصلاح المشكلة: إعادة توصيل كابل الشاشة',
    performedBy: {
      id: '101',
      name: 'محمد علي'
    },
    createdAt: '2025-04-03T10:15:00'
  }
]

const mockWorkLogs: WorkLog[] = [
  {
    id: '1',
    startTime: '2025-04-02T11:00:00',
    endTime: '2025-04-02T12:30:00',
    totalDuration: 5400, // 1.5 ساعة = 5400 ثانية
    technicianId: '101',
    technicianName: 'محمد علي'
  },
  {
    id: '2',
    startTime: '2025-04-03T09:30:00',
    endTime: '2025-04-03T11:00:00',
    totalDuration: 5400, // 1.5 ساعة = 5400 ثانية
    technicianId: '101',
    technicianName: 'محمد علي'
  }
]

/**
 * صفحة تفاصيل حالة الصيانة
 * تعرض معلومات الحالة وتتيح التفاعل معها
 */
const CaseDetails = () => {
  const { id } = useParams<{id: string}>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // حالة البيانات
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  
  // حالة تحميل البيانات
  const [isLoading, setIsLoading] = useState(true)
  
  // حالة جلسة العمل النشطة
  const [isActiveSession, setIsActiveSession] = useState(false)
  const [activeSessionStartTime, setActiveSessionStartTime] = useState<string | undefined>(undefined)
  
  // حالات تحميل العمليات
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  
  // محاكاة جلب البيانات من API
  useEffect(() => {
    // في التطبيق الفعلي، ستقوم بجلب البيانات من API
    const fetchData = async () => {
      setIsLoading(true)
      
      try {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // تعيين البيانات المحاكاة
        setCaseData(mockCaseData)
        setNotes(mockNotes)
        setAttachments(mockAttachments)
        setActivities(mockActivities)
        setWorkLogs(mockWorkLogs)
      } catch (error) {
        console.error('Error fetching case data:', error)
        // يمكن إضافة حالة خطأ هنا وعرضها للمستخدم
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [id])
  
  // تغيير حالة الصيانة
  const handleStatusChange = (newStatus: string) => {
    if (!caseData) return
    
    // في التطبيق الفعلي، سترسل طلب API لتحديث الحالة
    setCaseData({
      ...caseData,
      status: newStatus,
      updatedAt: new Date().toISOString()
    })
    
    // إضافة نشاط جديد
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      action: `تم تغيير الحالة إلى: ${newStatus}`,
      performedBy: {
        id: '101',
        name: 'محمد علي' // في التطبيق الفعلي، ستستخدم بيانات المستخدم الحالي
      },
      createdAt: new Date().toISOString()
    }
    
    setActivities([newActivity, ...activities])
  }
  
  // إضافة ملاحظة جديدة
  const handleAddNote = async (text: string, voiceUrl?: string) => {
    setIsAddingNote(true)
    
    try {
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // إنشاء ملاحظة جديدة
      const newNote: Note = {
        id: `note-${Date.now()}`,
        noteText: text,
        voiceNoteUrl: voiceUrl,
        createdBy: {
          id: '101',
          name: 'محمد علي' // في التطبيق الفعلي، ستستخدم بيانات المستخدم الحالي
        },
        createdAt: new Date().toISOString()
      }
      
      // إضافة الملاحظة للقائمة
      setNotes([newNote, ...notes])
      
      // إضافة نشاط جديد
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        action: 'تمت إضافة ملاحظة جديدة',
        performedBy: {
          id: '101',
          name: 'محمد علي'
        },
        createdAt: new Date().toISOString()
      }
      
      setActivities([newActivity, ...activities])
    } catch (error) {
      console.error('Error adding note:', error)
      // يمكن إضافة إشعار خطأ هنا
    } finally {
      setIsAddingNote(false)
    }
  }
  
  // إضافة مرفق جديد
  const handleAddAttachment = async (file: File) => {
    setIsUploadingAttachment(true)
    
    try {
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // محاكاة رفع الملف وإنشاء مرفق جديد
      const fileType = file.type.startsWith('image/') 
        ? 'image' 
        : file.type === 'application/pdf' 
          ? 'pdf' 
          : 'document'
      
      const newAttachment: Attachment = {
        id: `attachment-${Date.now()}`,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file), // في التطبيق الفعلي، سيكون هذا URL للملف المرفوع
        thumbnailUrl: fileType === 'image' ? URL.createObjectURL(file) : undefined,
        createdBy: {
          id: '101',
          name: 'محمد علي'
        },
        createdAt: new Date().toISOString()
      }
      
      // إضافة المرفق للقائمة
      setAttachments([newAttachment, ...attachments])
      
      // إضافة نشاط جديد
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        action: `تم رفع مرفق جديد: ${file.name}`,
        performedBy: {
          id: '101',
          name: 'محمد علي'
        },
        createdAt: new Date().toISOString()
      }
      
      setActivities([newActivity, ...activities])
    } catch (error) {
      console.error('Error uploading attachment:', error)
      // يمكن إضافة إشعار خطأ هنا
    } finally {
      setIsUploadingAttachment(false)
    }
  }
  
  // بدء جلسة عمل جديدة
  const handleStartWork = () => {
    const now = new Date().toISOString()
    
    // تعيين حالة الجلسة النشطة
    setIsActiveSession(true)
    setActiveSessionStartTime(now)
    
    // إضافة سجل عمل جديد
    const newWorkLog: WorkLog = {
      id: `worklog-${Date.now()}`,
      startTime: now,
      technicianId: '101',
      technicianName: 'محمد علي'
    }
    
    setWorkLogs([newWorkLog, ...workLogs])
    
    // إضافة نشاط جديد
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      action: 'بدء جلسة عمل',
      performedBy: {
        id: '101',
        name: 'محمد علي'
      },
      createdAt: now
    }
    
    setActivities([newActivity, ...activities])
  }
  
  // إنهاء جلسة العمل النشطة
  const handleEndWork = () => {
    const now = new Date().toISOString()
    
    // تحديث جلسة العمل النشطة
    if (isActiveSession) {
      const updatedWorkLogs = workLogs.map((log, index) => {
        // تحديث أحدث سجل عمل (الذي ليس له وقت انتهاء)
        if (index === 0 && !log.endTime) {
          // حساب المدة بين وقت البدء ووقت الانتهاء
          const startDate = new Date(log.startTime)
          const endDate = new Date(now)
          const durationInSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
          
          return {
            ...log,
            endTime: now,
            totalDuration: durationInSeconds
          }
        }
        return log
      })
      
      setWorkLogs(updatedWorkLogs)
      setIsActiveSession(false)
      setActiveSessionStartTime(undefined)
      
      // إضافة نشاط جديد
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        action: 'إنهاء جلسة عمل',
        performedBy: {
          id: '101',
          name: 'محمد علي'
        },
        createdAt: now
      }
      
      setActivities([newActivity, ...activities])
    }
  }
  
  // العودة إلى قائمة الحالات
  const handleGoBack = () => {
    navigate('/cases')
  }
  
  // الانتقال إلى صفحة تحرير الحالة
  const handleEdit = () => {
    navigate(`/cases/${id}/edit`)
  }
  
  // إنشاء علامات التبويب
  const tabs = [
    {
      id: 'notes',
      label: 'الملاحظات',
      icon: ChatBubbleLeftIcon,
      content: <NotesTab 
        notes={notes} 
        onAddNote={handleAddNote} 
        isLoading={isAddingNote} 
      />
    },
    {
      id: 'attachments',
      label: 'المرفقات',
      icon: PaperClipIcon,
      content: <AttachmentsTab 
        attachments={attachments} 
        onAddAttachment={handleAddAttachment} 
        isUploading={isUploadingAttachment}
      />
    },
    {
      id: 'work-log',
      label: 'سجل العمل',
      icon: ClockIcon,
      content: <WorkLogTab 
        workLogs={workLogs}
        onStartWork={handleStartWork}
        onEndWork={handleEndWork}
        isActiveSession={isActiveSession}
        activeSessionStartTime={activeSessionStartTime}
        caseStatus={caseData?.status || ''}
      />
    },
    {
      id: 'activity-log',
      label: 'سجل الأنشطة',
      icon: ListBulletIcon,
      content: <ActivityLogTab 
        activities={activities} 
      />
    }
  ]
  
  // عرض شاشة التحميل أثناء جلب البيانات
  if (isLoading) {
    return <LoadingScreen />
  }
  
  // التحقق من وجود بيانات الحالة
  if (!caseData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">الحالة غير موجودة</h2>
        <p className="text-gray-500 mb-6">لم يتم العثور على بيانات لهذه الحالة.</p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowUturnLeftIcon className="ml-2 h-5 w-5" />
          العودة إلى قائمة الحالات
        </button>
      </div>
    )
  }
  
  return (
    <div className="py-10">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <button
              onClick={handleGoBack}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">{caseData.deviceModel}</h1>
          </div>
          <p className="text-sm text-gray-500">{caseData.serialNumber} • {caseData.clientName}</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilSquareIcon className="ml-2 h-5 w-5 text-gray-500" />
            تعديل الحالة
          </button>
          
          {/* إضافة زر QR Code */}
          <div className="mr-2">
            {/* تحويل بيانات الحالة إلى تنسيق CaseItem */}
            {caseData && 
              <CaseQRCodeManager
                caseData={{
                  id: parseInt(id as string),
                  title: caseData.deviceModel,
                  clientName: caseData.clientName,
                  clientPhone: caseData.clientPhone,
                  deviceType: 'electronics', // نفترض قيمة افتراضية
                  deviceModel: caseData.deviceModel,
                  status: caseData.status,
                  issueDescription: caseData.issueDescription,
                  createdAt: caseData.createdAt,
                  updatedAt: caseData.updatedAt,
                  needsSync: false,
                  serialNumber: caseData.serialNumber,
                  technicianName: caseData.technicianName,
                  technicianId: '101', // نضيف معرف الفني
                  diagnosis: caseData.diagnosis,
                  solution: caseData.solution,
                  caseNumber: `FZ-${new Date().getFullYear()}-${id ? id.padStart(3, '0') : '000'}` // ننشئ رقم حالة
                }}
              />
            }
          </div>
        </div>
      </div>
      
      {/* معلومات الحالة */}
      <div className="mb-6">
        <CaseInfo 
          caseData={caseData} 
          onStatusChange={handleStatusChange} 
        />
      </div>
      
      {/* علامات التبويب */}
      <div className="mb-6">
        <TabsContainer tabs={tabs} defaultTabId="notes" />
      </div>
      
      {/* قسم طباعة رمز QR */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-4">
          <QrCodeIcon className="inline-block h-5 w-5 ml-2" />
          {t('qrCode.qrCodeForPrinting')}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{t('qrCode.printingDescription')}</p>
        
        {caseData && 
          <CaseQRCodeManager
            caseData={{
              id: parseInt(id as string),
              title: caseData.deviceModel,
              clientName: caseData.clientName,
              clientPhone: caseData.clientPhone,
              deviceType: 'electronics', // نفترض قيمة افتراضية
              deviceModel: caseData.deviceModel,
              status: caseData.status,
              issueDescription: caseData.issueDescription,
              createdAt: caseData.createdAt,
              updatedAt: caseData.updatedAt,
              needsSync: false,
              serialNumber: caseData.serialNumber,
              technicianName: caseData.technicianName,
              technicianId: '101', // نضيف معرف الفني
              diagnosis: caseData.diagnosis,
              solution: caseData.solution,
              caseNumber: `FZ-${new Date().getFullYear()}-${id ? id.padStart(3, '0') : '000'}` // ننشئ رقم حالة
            }}
            inline={true}
            size={250}
          />
        }
      </div>
    </div>
  )
}

export default CaseDetails
