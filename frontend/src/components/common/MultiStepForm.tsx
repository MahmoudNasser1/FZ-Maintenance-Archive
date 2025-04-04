import React, { useState, ReactNode } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export interface Step {
  id: string
  title: string
  content: ReactNode
  isCompleted?: boolean
}

interface MultiStepFormProps {
  steps: Step[]
  onComplete: () => void
  allowSkipToStep?: boolean
  initialStepIndex?: number
}

/**
 * مكون نموذج متعدد الخطوات
 * يعرض واجهة للتنقل عبر خطوات متعددة
 */
const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onComplete,
  allowSkipToStep = false,
  initialStepIndex = 0
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  
  // الحصول على الخطوة الحالية
  const currentStep = steps[currentStepIndex]
  
  // الانتقال إلى الخطوة التالية
  const goToNextStep = () => {
    const nextStepIndex = currentStepIndex + 1
    
    // تحديث قائمة الخطوات المكتملة
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps([...completedSteps, currentStep.id])
    }
    
    // إذا كانت الخطوة التالية هي خطوة غير موجودة (أي أن الخطوة الحالية هي الأخيرة)
    if (nextStepIndex >= steps.length) {
      onComplete()
      return
    }
    
    // الانتقال إلى الخطوة التالية
    setCurrentStepIndex(nextStepIndex)
  }
  
  // الانتقال إلى الخطوة السابقة
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }
  
  // الانتقال إلى خطوة محددة
  const goToStep = (index: number) => {
    // التحقق من أن المستخدم يمكنه الانتقال إلى الخطوة المحددة
    if (allowSkipToStep || index < currentStepIndex || completedSteps.includes(steps[index].id)) {
      setCurrentStepIndex(index)
    }
  }
  
  // التحقق مما إذا كانت الخطوة مكتملة
  const isStepCompleted = (stepId: string): boolean => {
    return completedSteps.includes(stepId) || (steps.find(step => step.id === stepId)?.isCompleted || false)
  }
  
  return (
    <div>
      {/* شريط التقدم */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex
              const isComplete = isStepCompleted(step.id)
              const isClickable = allowSkipToStep || index < currentStepIndex || isComplete
              
              return (
                <li key={step.id} className={`relative ${index !== 0 ? 'mr-8 w-full' : ''}`}>
                  {/* خط اتصال بين الخطوات */}
                  {index !== 0 && (
                    <div className="absolute right-4 inset-y-0 -mr-px h-0.5 top-4 w-full bg-gray-200">
                      <div 
                        className="h-0.5 bg-primary-600 transition-all"
                        style={{ width: isComplete ? '100%' : '0%' }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="group relative flex items-center">
                    {/* رقم أو أيقونة الخطوة */}
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <button
                        type="button"
                        onClick={isClickable ? () => goToStep(index) : undefined}
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : isComplete
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-500'
                        } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        {isComplete ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </button>
                    </span>
                    
                    {/* عنوان الخطوة */}
                    <span className="mr-2 mr-inset-0 text-sm font-medium">
                      {step.title}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
      
      {/* محتوى الخطوة الحالية */}
      <div className="mb-6">
        {currentStep.content}
      </div>
      
      {/* أزرار التنقل */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            currentStepIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          السابق
        </button>
        
        <button
          type="button"
          onClick={goToNextStep}
          className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
        >
          {currentStepIndex === steps.length - 1 ? 'إنهاء' : 'التالي'}
        </button>
      </div>
    </div>
  )
}

export default MultiStepForm
