import React, { Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  closeOnOverlayClick = true,
}) => {
  // u0644u0645u0646u0639 u0627u0644u062au0645u0631u064au0631 u0639u0644u0649 u0627u0644u062cu0633u0645 u0639u0646u062fu0645u0627 u064au0643u0648u0646 u0627u0644u0645u0646u0628u062bu0642 u0645u0641u062au0648u062du064bu0627
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // u062au062du062fu064au062f u062du062cu0645 u0627u0644u0645u0646u0628u062bu0642 u0628u0646u0627u0621u064b u0639u0644u0649 u0627u0644u062eu064au0627u0631
  const getModalSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-md';
    }
  };

  return createPortal(
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        {/* u0637u0628u0642u0629 u0627u0644u062eu0644u0641u064au0629 u0627u0644u0645u0638u0644u0645u0629 */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* u0645u062du062au0648u0649 u0627u0644u0645u0646u0628u062bu0642 */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={`w-full ${getModalSizeClass()} transform overflow-hidden rounded-lg bg-white text-right shadow-xl transition-all`}
            >
              {/* u0627u0644u0639u0646u0648u0627u0646 u0625u0630u0627 u0643u0627u0646 u0645u0648u062cu0648u062fu064bu0627 */}
              {title && (
                <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={onClose}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* u0627u0644u0645u062du062au0648u0649 */}
              <div className={!title ? 'relative' : ''}>
                {!title && (
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                    onClick={onClose}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>,
    document.getElementById('modal-root') || document.body
  );
};

export default Modal;
