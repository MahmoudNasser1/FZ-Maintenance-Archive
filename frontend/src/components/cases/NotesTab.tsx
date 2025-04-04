import React, { useState } from 'react'
import { ChatBubbleLeftIcon, UserCircleIcon, MicrophoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

// واجهة الملاحظة
export interface Note {
  id: string
  noteText: string
  voiceNoteUrl?: string
  createdBy: {
    id: string
    name: string
    avatarUrl?: string
  }
  createdAt: string
}

interface NotesTabProps {
  notes: Note[]
  onAddNote: (text: string, voiceUrl?: string) => void
  isLoading?: boolean
}

/**
 * مكون علامة تبويب الملاحظات
 * يعرض قائمة الملاحظات ونموذج إضافة ملاحظة جديدة
 */
const NotesTab: React.FC<NotesTabProps> = ({ notes, onAddNote, isLoading = false }) => {
  const [newNote, setNewNote] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  
  // تحويل التاريخ إلى تنسيق مناسب للعرض
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('ar-EG', options)
  }
  
  // إرسال الملاحظة الجديدة
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newNote.trim()) {
      onAddNote(newNote)
      setNewNote('')
    }
  }
  
  // محاكاة تسجيل ملاحظة صوتية
  const handleToggleRecording = () => {
    // في التطبيق الفعلي، هنا ستكون منطق بدء/إيقاف التسجيل
    setIsRecording(!isRecording)
    
    // محاكاة انتهاء التسجيل بعد 3 ثوان
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false)
        // هنا يتم إرسال الملف الصوتي 
        // onAddNote('', 'voice-note-url.mp3');
      }, 3000)
    }
  }
  
  return (
    <div>
      {/* نموذج إضافة ملاحظة جديدة */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <form onSubmit={handleSubmitNote}>
          <div className="flex">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 ml-3">
              <UserCircleIcon className="h-6 w-6 text-primary-600" />
            </div>
            
            <div className="flex-1">
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="أضف ملاحظة جديدة..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              ></textarea>
              
              <div className="flex justify-between items-center mt-3">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`inline-flex items-center p-2 rounded-full ${
                    isRecording 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title="تسجيل ملاحظة صوتية"
                >
                  <MicrophoneIcon className="h-5 w-5" />
                  {isRecording && <span className="mr-2 text-sm">جاري التسجيل...</span>}
                </button>
                
                <button
                  type="submit"
                  disabled={!newNote.trim() || isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>جاري الإرسال...</>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 ml-2" />
                      إرسال
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* قائمة الملاحظات */}
      {notes.length > 0 ? (
        <div className="space-y-6">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ml-3">
                  {note.createdBy.avatarUrl ? (
                    <img 
                      src={note.createdBy.avatarUrl} 
                      alt={note.createdBy.name} 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{note.createdBy.name}</h4>
                    <span className="text-sm text-gray-500">{formatDate(note.createdAt)}</span>
                  </div>
                  
                  <p className="text-gray-700 text-sm whitespace-pre-line">{note.noteText}</p>
                  
                  {note.voiceNoteUrl && (
                    <div className="mt-3">
                      <audio 
                        src={note.voiceNoteUrl} 
                        controls 
                        className="w-full h-10"
                      ></audio>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد ملاحظات</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة ملاحظة جديدة.</p>
        </div>
      )}
    </div>
  )
}

export default NotesTab
