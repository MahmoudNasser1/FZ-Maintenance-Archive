import React, { useState, useRef } from 'react'
import { 
  DocumentIcon, 
  PhotoIcon, 
  DocumentTextIcon, 
  DocumentChartBarIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// واجهة المرفق
export interface Attachment {
  id: string
  fileName: string
  fileType: string // e.g., 'image', 'document', 'pdf', 'audio', 'video'
  fileSize: number
  fileUrl: string
  thumbnailUrl?: string
  createdBy: {
    id: string
    name: string
  }
  createdAt: string
}

interface AttachmentsTabProps {
  attachments: Attachment[]
  onAddAttachment: (file: File) => void
  isUploading?: boolean
}

/**
 * مكون علامة تبويب المرفقات
 * يعرض قائمة المرفقات ونموذج رفع مرفق جديد
 */
const AttachmentsTab: React.FC<AttachmentsTabProps> = ({ 
  attachments, 
  onAddAttachment, 
  isUploading = false 
}) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // تنسيق حجم الملف
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    }
  }
  
  // تنسيق التاريخ
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }
    return new Date(dateString).toLocaleDateString('ar-EG', options)
  }
  
  // معالجة اختيار الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddAttachment(e.target.files[0])
      e.target.value = '' // إعادة تعيين قيمة الإدخال بعد الرفع
    }
  }
  
  // معالجة النقر على زر الرفع
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }
  
  // معالجة السحب والإفلات
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  // معالجة إفلات الملف
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onAddAttachment(e.dataTransfer.files[0])
    }
  }
  
  // الحصول على أيقونة الملف بناءً على نوعه
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <PhotoIcon className="h-10 w-10 text-blue-500" />
      case 'pdf':
        return <DocumentTextIcon className="h-10 w-10 text-red-500" />
      case 'sheet':
        return <DocumentChartBarIcon className="h-10 w-10 text-green-500" />
      default:
        return <DocumentIcon className="h-10 w-10 text-gray-500" />
    }
  }
  
  // تصنيف المرفقات حسب النوع
  const categorizedAttachments = {
    images: attachments.filter(att => att.fileType === 'image'),
    documents: attachments.filter(att => ['pdf', 'doc', 'docx', 'txt'].includes(att.fileType)),
    others: attachments.filter(att => !['image', 'pdf', 'doc', 'docx', 'txt'].includes(att.fileType))
  }
  
  return (
    <div>
      {/* منطقة سحب وإفلات الملفات */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center mb-6 transition-colors
          ${dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
          }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">انقر لرفع ملف أو اسحب وأفلت الملف هنا</p>
        <p className="mt-1 text-xs text-gray-500">PNG، JPG، PDF حتى 10MB</p>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {isUploading && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary-600 h-2.5 rounded-full w-3/4 animate-pulse"></div>
            </div>
            <p className="mt-2 text-xs text-gray-500">جاري الرفع...</p>
          </div>
        )}
      </div>
      
      {/* عرض المرفقات */}
      {attachments.length > 0 ? (
        <div className="space-y-6">
          {/* صور */}
          {categorizedAttachments.images.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">الصور</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categorizedAttachments.images.map(attachment => (
                  <a 
                    key={attachment.id} 
                    href={attachment.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative block bg-gray-100 rounded-lg overflow-hidden shadow-sm aspect-square hover:shadow-md transition-shadow"
                  >
                    <img 
                      src={attachment.thumbnailUrl || attachment.fileUrl} 
                      alt={attachment.fileName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-xs truncate">
                      {attachment.fileName}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* المستندات */}
          {categorizedAttachments.documents.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">المستندات</h3>
              <div className="space-y-2">
                {categorizedAttachments.documents.map(attachment => (
                  <a 
                    key={attachment.id} 
                    href={attachment.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {getFileIcon(attachment.fileType)}
                    <div className="mr-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(attachment.fileSize)} • {formatDate(attachment.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm text-primary-600">فتح</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* ملفات أخرى */}
          {categorizedAttachments.others.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">ملفات أخرى</h3>
              <div className="space-y-2">
                {categorizedAttachments.others.map(attachment => (
                  <a 
                    key={attachment.id} 
                    href={attachment.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {getFileIcon(attachment.fileType)}
                    <div className="mr-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(attachment.fileSize)} • {formatDate(attachment.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm text-primary-600">تنزيل</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مرفقات</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ برفع صور أو مستندات متعلقة بهذه الحالة.</p>
        </div>
      )}
    </div>
  )
}

export default AttachmentsTab
