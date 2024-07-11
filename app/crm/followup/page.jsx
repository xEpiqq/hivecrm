'use client';
import { useEffect, useState, Fragment } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from '../../../initFirebase';
import { formatDistanceToNow, parseISO, subDays } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faVideo, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Dialog, Transition, Tab } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function FollowUp() {
  const [contacts, setContacts] = useState([]);
  const [followUpContacts, setFollowUpContacts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      const contactsCol = collection(db, 'contacts');
      const contactSnapshot = await getDocs(contactsCol);
      const contactList = contactSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContacts(contactList);
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    const now = new Date();
    const followUpList = contacts.filter(contact => {
      const emailDates = contact.emailedDates || [];
      const callDates = contact.calledDates || [];
      const videoCallDates = contact.videoCalledDates || [];
      const allDates = [...emailDates, ...callDates, ...videoCallDates].map(date => parseISO(date));
      if (allDates.length === 0) return true; // No contact history

      const mostRecentContact = Math.max(...allDates.map(date => date.getTime()));
      contact.lastContacted = new Date(mostRecentContact).toISOString(); // Update the contact with the last contacted date
      return subDays(now, 3) > mostRecentContact;
    });
    setFollowUpContacts(followUpList);
  }, [contacts]);

  const openDrawer = (contact) => {
    setSelectedContact(contact);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedContact({ ...selectedContact, [name]: value });
  };

  const handleSave = async () => {
    const contactRef = doc(db, 'contacts', selectedContact.id);
    try {
      await updateDoc(contactRef, selectedContact);
      closeDrawer();
    } catch (error) {
      console.error("Error updating contact: ", error);
    }
  };

  const handleCheckboxChange = async (e, type) => {
    const { checked } = e.target;
    const contactRef = doc(db, 'contacts', selectedContact.id);
    const dateField = `${type}Dates`;

    let updateData;

    if (checked) {
      const newDate = new Date().toISOString();
      updateData = { [dateField]: arrayUnion(newDate) };
      selectedContact[dateField] = selectedContact[dateField] ? [...selectedContact[dateField], newDate] : [newDate];
    } else {
      const dateIndex = selectedContact[dateField].length - 1;
      updateData = { [dateField]: arrayRemove(selectedContact[dateField][dateIndex]) };
      selectedContact[dateField] = selectedContact[dateField].filter((_, i) => i !== dateIndex);
    }

    try {
      await updateDoc(contactRef, updateData);
      setSelectedContact({ ...selectedContact }); // Update local state
    } catch (error) {
      console.error("Error updating contact: ", error);
    }
  };

  const handleNoteChange = (e, type, index) => {
    const updatedNotes = [...selectedContact[type]];
    updatedNotes[index] = e.target.value;
    setSelectedContact({ ...selectedContact, [type]: updatedNotes });
  };

  const handleAddNote = async (type) => {
    const contactRef = doc(db, 'contacts', selectedContact.id);
    const noteField = `${type}Notes`;

    try {
      await updateDoc(contactRef, { [noteField]: arrayUnion(noteInput) });
      setSelectedContact({ ...selectedContact, [noteField]: [...(selectedContact[noteField] || []), noteInput] });
      setNoteInput('');
    } catch (error) {
      console.error("Error updating contact: ", error);
    }
  };

  return (
    <div className="bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 min-h-screen">
      <div className="mt-10 mx-auto max-w-7xl">
        <h2 className="text-2xl font-semibold leading-7 text-white sm:px-6 lg:px-8">Follow-Up Contacts</h2>
        <div className="mt-6 flow-root">
          <ul role="list" className="-mb-8">
            {followUpContacts.map(contact => (
              <li key={contact.id}>
                <div className="relative pb-8">
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={classNames(
                          'bg-red-500',
                          'flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white',
                        )}
                      >
                        <FontAwesomeIcon icon={faUser} aria-hidden="true" className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{contact.name}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Last contacted {formatDistanceToNow(parseISO(contact.lastContacted || ''))} ago
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        <button
                          onClick={() => openDrawer(contact)}
                          className="inline-flex justify-center rounded-md bg-indigo-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                          Follow Up
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative flex space-x-3">
                  <div>
                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
                  </div>
                  <div className="relative flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-500">Follow-Up History</p>
                      {contact.emailedDates?.map((date, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-green-500" aria-hidden="true" />
                          <span className="text-sm text-gray-400">
                            Emailed on {new Date(date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {contact.calledDates?.map((date, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-blue-500" aria-hidden="true" />
                          <span className="text-sm text-gray-400">
                            Called on {new Date(date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {contact.videoCalledDates?.map((date, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faVideo} className="h-5 w-5 text-green-500" aria-hidden="true" />
                          <span className="text-sm text-gray-400">
                            Video Called on {new Date(date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Drawer for Editing Contact */}
      <Transition.Root show={drawerOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeDrawer}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-400"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-400"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                      <div className="flex items-start justify-between p-4 bg-gray-900">
                        <Dialog.Title className="text-lg font-medium text-white">Edit Contact</Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-gray-900 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={closeDrawer}
                          >
                            <span className="sr-only">Close panel</span>
                            <FontAwesomeIcon icon={faTimes} className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="relative flex-1 px-4 py-6 sm:px-6 bg-gray-900">
                        <Tab.Group>
                          <Tab.List className="flex p-1 space-x-1 bg-gray-800 rounded-lg">
                            <Tab
                              className={({ selected }) =>
                                classNames(
                                  'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                                  selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                )
                              }
                            >
                              Main
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                classNames(
                                  'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                                  selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                )
                              }
                            >
                              Email Notes
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                classNames(
                                  'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                                  selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                )
                              }
                            >
                              Call Notes
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                classNames(
                                  'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                                  selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                )
                              }
                            >
                              Video Call Notes
                            </Tab>
                          </Tab.List>
                          <Tab.Panels className="flex-1 overflow-y-auto p-4 bg-gray-900 rounded-lg">
                            <Tab.Panel className="space-y-4">
                              <div>
                                <label htmlFor="name" className="block text-sm font-medium text-white">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  id="name"
                                  value={selectedContact?.name || ''}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  name="email"
                                  id="email"
                                  value={selectedContact?.email || ''}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-white">
                                  Phone
                                </label>
                                <input
                                  type="text"
                                  name="phone"
                                  id="phone"
                                  value={selectedContact?.phone || ''}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="schoolDistrict" className="block text-sm font-medium text-white">
                                  School District
                                </label>
                                <input
                                  type="text"
                                  name="schoolDistrict"
                                  id="schoolDistrict"
                                  value={selectedContact?.schoolDistrict || ''}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="school" className="block text-sm font-medium text-white">
                                  School
                                </label>
                                <input
                                  type="text"
                                  name="school"
                                  id="school"
                                  value={selectedContact?.school || ''}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white">Follow-Up</label>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      id="emailed"
                                      name="emailed"
                                      type="checkbox"
                                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      checked={!!selectedContact?.emailedDates?.length}
                                      onChange={(e) => handleCheckboxChange(e, 'emailed')}
                                    />
                                    <label htmlFor="emailed" className="block text-sm text-gray-400">
                                      Emailed
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      id="called"
                                      name="called"
                                      type="checkbox"
                                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      checked={!!selectedContact?.calledDates?.length}
                                      onChange={(e) => handleCheckboxChange(e, 'called')}
                                    />
                                    <label htmlFor="called" className="block text-sm text-gray-400">
                                      Called
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      id="videoCalled"
                                      name="videoCalled"
                                      type="checkbox"
                                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      checked={!!selectedContact?.videoCalledDates?.length}
                                      onChange={(e) => handleCheckboxChange(e, 'videoCalled')}
                                    />
                                    <label htmlFor="videoCalled" className="block text-sm text-gray-400">
                                      Video Called
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </Tab.Panel>
                            <Tab.Panel className="space-y-4">
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-white">Email Notes</label>
                                <div className="space-y-1">
                                  {selectedContact?.emailedDates?.map((date, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-green-500" aria-hidden="true" />
                                      <span className="text-sm text-gray-400">
                                        Emailed on {new Date(date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))}
                                  <textarea
                                    className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50"
                                    rows="4"
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleAddNote('email')}
                                    className="mt-2 inline-flex justify-center rounded-md p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500"
                                  >
                                    Add Note
                                  </button>
                                  {selectedContact?.emailNotes?.map((note, index) => (
                                    <div key={index} className="mt-4">
                                      <textarea
                                        className="block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                                        rows="2"
                                        value={note}
                                        onChange={(e) => handleNoteChange(e, 'emailNotes', index)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Tab.Panel>
                            <Tab.Panel className="space-y-4">
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-white">Call Notes</label>
                                <div className="space-y-1">
                                  {selectedContact?.calledDates?.map((date, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-blue-500" aria-hidden="true" />
                                      <span className="text-sm text-gray-400">
                                        Called on {new Date(date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))}
                                  <textarea
                                    className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50"
                                    rows="4"
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleAddNote('call')}
                                    className="mt-2 inline-flex justify-center rounded-md p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500"
                                  >
                                    Add Note
                                  </button>
                                  {selectedContact?.callNotes?.map((note, index) => (
                                    <div key={index} className="mt-4">
                                      <textarea
                                        className="block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                                        rows="2"
                                        value={note}
                                        onChange={(e) => handleNoteChange(e, 'callNotes', index)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Tab.Panel>
                            <Tab.Panel className="space-y-4">
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-white">Video Call Notes</label>
                                <div className="space-y-1">
                                  {selectedContact?.videoCalledDates?.map((date, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <FontAwesomeIcon icon={faVideo} className="h-5 w-5 text-green-500" aria-hidden="true" />
                                      <span className="text-sm text-gray-400">
                                        Video Called on {new Date(date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))}
                                  <textarea
                                    className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-opacity-50"
                                    rows="4"
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleAddNote('videoCall')}
                                    className="mt-2 inline-flex justify-center rounded-md p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500"
                                  >
                                    Add Note
                                  </button>
                                  {selectedContact?.videoCallNotes?.map((note, index) => (
                                    <div key={index} className="mt-4">
                                      <textarea
                                        className="block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                                        rows="2"
                                        value={note}
                                        onChange={(e) => handleNoteChange(e, 'videoCallNotes', index)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>
                      </div>
                      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-900 p-4">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={handleSave}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ml-4"
                          onClick={closeDrawer}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
