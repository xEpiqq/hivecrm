import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Tab } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEllipsisV } from '@fortawesome/free-solid-svg-icons';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Drawer({ isOpen, onClose, contact }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-10">
      <div className="fixed inset-0" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel className="pointer-events-auto w-screen max-w-md">
              <div className="flex h-full flex-col bg-gray-900 shadow-xl">
                <div className="flex items-center justify-between p-4 bg-gray-800">
                  <DialogTitle className="text-lg font-medium text-white">
                    {contact.name}
                  </DialogTitle>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => onClose(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                  </button>
                </div>
                <Tab.Group>
                  <Tab.List className="flex p-1 space-x-1 bg-gray-800">
                    {['Main', 'Email Notes', 'Call Notes'].map((tab) => (
                      <Tab
                        key={tab}
                        className={({ selected }) =>
                          classNames(
                            'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                            'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-800 ring-white ring-opacity-60',
                            selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          )
                        }
                      >
                        {tab}
                      </Tab>
                    ))}
                  </Tab.List>
                  <Tab.Panels className="flex-1 overflow-y-auto p-4">
                    <Tab.Panel className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white">Last Contacted</label>
                        <input
                          type="date"
                          className="mt-1 block w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-0"
                          value={contact.lastContacted || ''}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white">Follow Up</label>
                        <input
                          type="date"
                          className="mt-1 block w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-0"
                          value={contact.followUp || ''}
                          readOnly
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center text-sm text-white">
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600" checked={contact.emailed || false} readOnly />
                          <span className="ml-2">Emailed</span>
                        </label>
                        <label className="flex items-center text-sm text-white">
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600" checked={contact.called || false} readOnly />
                          <span className="ml-2">Called</span>
                        </label>
                        <label className="flex items-center text-sm text-white">
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600" checked={contact.videoCalled || false} readOnly />
                          <span className="ml-2">Video Called</span>
                        </label>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel className="space-y-4">
                      <textarea
                        rows="10"
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-0"
                        placeholder="Email notes..."
                      />
                    </Tab.Panel>
                    <Tab.Panel className="space-y-4">
                      <textarea
                        rows="10"
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-0"
                        placeholder="Call notes..."
                      />
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
