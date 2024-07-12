'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, onAuthChange, db, collection, addDoc, getDocs, signOut } from '../../initFirebase';
import { Menu, MenuButton, MenuItem, MenuItems, Dialog, DialogPanel, DialogTitle, Tab } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faSignOutAlt, faEdit, faTrash, faEllipsisV, faTimes, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { CSSTransition } from 'react-transition-group';
import { format } from 'date-fns';
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";
import { auth } from '../../initFirebase';
import SearchableDropdown from './SearchableDropdown'; // Import the new component

const states = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida',
  'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine',
  'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 
  'nevada', 'new_hampshire', 'new_jersey', 'new_mexico', 'new_york', 'north_carolina', 'north_dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode_island', 'south_carolina', 'south_dakota', 'tennessee', 'texas',
  'utah', 'vermont', 'virginia', 'washington', 'west_virginia', 'wisconsin', 'wyoming'
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Example() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    schoolDistrict: '',
    school: '',
    state: '',
    link: ''
  });
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [theLink, setTheLink] = useState("");

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the contact document
      await deleteDoc(doc(db, 'contacts', contactToDelete.id));
      
      // Remove the contact UID from the state's document
      if (contactToDelete.state && contactToDelete.link) {
        const stateDocRef = doc(db, contactToDelete.state.toLowerCase(), contactToDelete.link);
        await updateDoc(stateDocRef, {
          contacts: arrayRemove(contactToDelete.id)
        });
      }

      // Update local state
      setContacts(contacts.filter(contact => contact.id !== contactToDelete.id));
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting contact: ', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      const fetchContacts = async () => {
        const contactsCol = collection(db, 'contacts');
        const contactSnapshot = await getDocs(contactsCol);
        const contactList = contactSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setContacts(contactList);
      };
      fetchContacts();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContact({ ...newContact, [name]: value });
    if (name === 'name' && value.length > 1) {
      setExpanded(true);
    } else if (name === 'name' && value.length <= 1) {
      setExpanded(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'contacts'), {
          ...newContact,
          link: theLink,
          userId: user.uid,
        });

        // Update the state document with the new contact UID
        if (newContact.state && selectedDistrict && selectedDistrict.link) {
          const stateDocRef = doc(db, newContact.state.toLowerCase(), selectedDistrict.link);
          await updateDoc(stateDocRef, {
            contacts: arrayUnion(docRef.id)
          });
        }

        setNewContact({
          name: '',
          email: '',
          phone: '',
          schoolDistrict: '',
          school: '',
          state: '',
          link: ''
        });
        setExpanded(false);

        // Refresh the contact list
        const contactsCol = collection(db, 'contacts');
        const contactSnapshot = await getDocs(contactsCol);
        const contactList = contactSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setContacts(contactList);
      } catch (error) {
        console.error('Error adding contact: ', error);
      }
    }
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setDrawerOpen(true);
  };

  const handleCheckboxChange = async (e) => {
    const { name, checked } = e.target;
    const updatedContact = { ...selectedContact, [name]: checked };

    if (checked) {
      updatedContact[`${name}Date`] = format(new Date(), 'yyyy-MM-dd');
    } else {
      delete updatedContact[`${name}Date`];
    }

    setSelectedContact(updatedContact);

    try {
      await updateDoc(doc(db, 'contacts', selectedContact.id), updatedContact);
    } catch (error) {
      console.error('Error updating contact: ', error);
    }
  };

  return (
    <>
      <div className="bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 min-h-screen">
        {deleteModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setDeleteModalOpen(false)}></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Delete Contact</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Are you sure you want to delete this contact?</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                      isDeleting ? 'bg-red-500' : 'bg-red-600 hover:bg-red-700'
                    } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm`}
                    onClick={confirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white" viewBox="0 0 24 24"></svg>
                        Deleting...
                      </span>
                    ) : (
                      'Delete'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-10 mx-auto max-w-7xl">
          <div className="flex items-center border-2 border-gray-800 pl-2 rounded-lg w-1/3 justify-between h-10">
            <button className="text-sm font-semibold text-white mr-2">Name:</button>
            <input
              type="text"
              name="name"
              value={newContact.name}
              onChange={handleInputChange}
              className="bg-gray-900 text-white rounded-md py-4 h-full w-full focus:outline-none focus:ring-0"
            />
          </div>
          <CSSTransition
            in={expanded}
            timeout={300}
            classNames="expand"
            unmountOnExit
          >
            <form onSubmit={handleAddContact} className="bg-gray-800 p-4 rounded-lg mt-2 w-1/3">
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="email"
                  name="email"
                  value={newContact.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className="bg-gray-900 text-white rounded-md py-2 px-2 focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  name="phone"
                  value={newContact.phone}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  className="bg-gray-900 text-white rounded-md py-2 px-2 focus:outline-none focus:ring-0"
                />
                <div className="relative">
                  <label className="block text-sm font-medium text-white">State</label>
                  <select
                    name="state"
                    value={newContact.state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                  >
                    <option value="">Select State</option>
                    {states.map((state, index) => (
                      <option key={index} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <SearchableDropdown
                  setTheLink={setTheLink}
                  state={newContact.state}
                  value={newContact.schoolDistrict}
                  onChange={(value, district) => {
                    setNewContact({ ...newContact, schoolDistrict: value });
                    setSelectedDistrict(district);
                  }}
                />
                <input
                  type="text"
                  name="school"
                  value={newContact.school}
                  onChange={handleInputChange}
                  placeholder="School"
                  className="bg-gray-900 text-white rounded-md py-2 px-2 focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full bg-indigo-500 text-white rounded-md py-2"
              >
                Save
              </button>
            </form>
          </CSSTransition>

          <div className="bg-gray-900 py-10 mt-10">
            <h2 className="px-4 text-base font-semibold leading-7 text-white sm:px-6 lg:px-8">Contacts</h2>
            <table className="mt-6 w-full whitespace-nowrap text-left">
              <colgroup>
                <col className="w-full sm:w-4/12" />
                <col className="lg:w-4/12" />
                <col className="lg:w-2/12" />
                <col className="lg:w-1/12" />
                <col className="lg:w-1/12" />
              </colgroup>
              <thead className="border-b border-white/10 text-sm leading-6 text-white">
                <tr>
                  <th scope="col" className="py-2 pl-4 pr-8 font-semibold sm:pl-6 lg:pl-8">Name</th>
                  <th scope="col" className="hidden py-2 pl-0 pr-8 font-semibold sm:table-cell">Email</th>
                  <th scope="col" className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">Phone</th>
                  <th scope="col" className="hidden py-2 pl-0 pr-8 font-semibold md:table-cell lg:pr-20">School District</th>
                  <th scope="col" className="hidden py-2 pl-0 pr-4 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8">School</th>
                  <th scope="col" className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                      <div className="flex items-center gap-x-4">
                        <div className="truncate text-sm font-medium leading-6 text-white">{contact.name}</div>
                      </div>
                    </td>
                    <td className="hidden py-4 pl-0 pr-4 sm:table-cell sm:pr-8">
                      <div className="text-sm leading-6 text-gray-400">{contact.email}</div>
                    </td>
                    <td className="py-4 pl-0 pr-4 text-sm leading-6 sm:pr-8 lg:pr-20">
                      <div className="text-white sm:text-left">{contact.phone}</div>
                    </td>
                    <td className="hidden py-4 pl-0 pr-8 text-sm leading-6 text-gray-400 md:table-cell lg:pr-20">
                      {contact.schoolDistrict}
                    </td>
                    <td className="hidden py-4 pl-0 pr-4 text-right text-sm leading-6 text-gray-400 sm:table-cell sm:pr-6 lg:pr-8">
                      {contact.school}
                    </td>
                    <td className="py-4 pl-0 pr-4 text-right text-sm leading-6 text-white sm:pr-8 sm:text-left lg:pr-20">
                      <button
                        onClick={() => handleDeleteClick(contact)}
                        className="inline-flex justify-center rounded-md p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        onClick={() => handleContactClick(contact)}
                        className="inline-flex justify-center rounded-md py-2 px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500 ml-2"
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} contact={selectedContact} onCheckboxChange={handleCheckboxChange} />
    </>
  );
}


function Drawer({ isOpen, onClose, contact, onCheckboxChange, refreshContacts }) {
  const [editableContact, setEditableContact] = useState(contact);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    setEditableContact(contact);
  }, [contact]);

  const handleCheckboxChange = async (e, type, index) => {
    const { checked } = e.target;
    const contactRef = doc(db, 'contacts', contact.id);
    const dateField = `${type}Dates`;

    let updateData;

    if (checked) {
      const newDate = new Date().toISOString();
      updateData = { [dateField]: arrayUnion(newDate) };
      editableContact[dateField] = editableContact[dateField] ? [...editableContact[dateField], newDate] : [newDate];
    } else {
      updateData = { [dateField]: arrayRemove(editableContact[dateField][index]) };
      editableContact[dateField] = editableContact[dateField].filter((_, i) => i !== index);
    }

    try {
      await updateDoc(contactRef, updateData);
      onCheckboxChange(e); // Update local state
    } catch (error) {
      console.error("Error updating contact: ", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableContact({ ...editableContact, [name]: value });
  };

  const handleSave = async () => {
    const contactRef = doc(db, 'contacts', contact.id);
    try {
      await updateDoc(contactRef, {
        email: editableContact.email,
        phone: editableContact.phone,
        schoolDistrict: editableContact.schoolDistrict,
        school: editableContact.school
      });
      refreshContacts();
    } catch (error) {
      console.error("Error updating contact: ", error);
    }
    onClose();
  };

  const handleNoteChange = (e, type, index) => {
    const updatedNotes = [...editableContact[type]];
    updatedNotes[index] = e.target.value;
    setEditableContact({ ...editableContact, [type]: updatedNotes });
  };

  const handleAddNote = async (type) => {
    const contactRef = doc(db, 'contacts', contact.id);
    const noteField = `${type}`;

    try {
      await updateDoc(contactRef, { [noteField]: arrayUnion(noteInput) });
      setEditableContact({ ...editableContact, [noteField]: [...(editableContact[noteField] || []), noteInput] });
      setNoteInput('');
    } catch (error) {
      console.error("Error updating contact: ", error);
    }
  };

  const formatDateTime = (dateString) => {
    const options = {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Dialog open={isOpen} onClose={handleSave} className="relative z-10">
      <div className="fixed inset-0" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel className="pointer-events-auto w-screen max-w-md">
              <div className="flex h-full flex-col bg-gray-900 shadow-xl">
                <div className="flex items-center justify-between p-4 bg-gray-800">
                  <DialogTitle className="text-lg font-medium text-white">
                    {editableContact.name}
                  </DialogTitle>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={handleSave}
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                  </button>
                </div>
                <Tab.Group>
                  <Tab.List className="flex p-1 space-x-1 bg-gray-800">
                    {editableContact.emailedDates?.length > 0 && (
                      <Tab
                        className={({ selected }) =>
                          classNames(
                            'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                            'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-800 ring-white ring-opacity-60',
                            selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          )
                        }
                      >
                        Email Notes
                      </Tab>
                    )}
                    {editableContact.calledDates?.length > 0 && (
                      <Tab
                        className={({ selected }) =>
                          classNames(
                            'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                            'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-800 ring-white ring-opacity-60',
                            selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          )
                        }
                      >
                        Call Notes
                      </Tab>
                    )}
                    {editableContact.videoCalledDates?.length > 0 && (
                      <Tab
                        className={({ selected }) =>
                          classNames(
                            'w-full py-2.5 text-sm leading-5 font-medium text-white rounded-lg',
                            'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-800 ring-white ring-opacity-60',
                            selected ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          )
                        }
                      >
                        Video Call Notes
                      </Tab>
                    )}
                  </Tab.List>
                  <Tab.Panels className="flex-1 overflow-y-auto p-4">
                    <Tab.Panel className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">Follow-Up</label>
                        <div className="space-y-1">
                          {editableContact.emailedDates?.map((date, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                id={`emailed${index}`}
                                name="emailed"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                checked={true}
                                onChange={(e) => handleCheckboxChange(e, 'emailed', index)}
                              />
                              <label htmlFor={`emailed${index}`} className="block text-sm text-gray-400">
                                Emailed on {formatDateTime(date)}
                              </label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <input
                              id="emailedNew"
                              name="emailed"
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              checked={false}
                              onChange={(e) => handleCheckboxChange(e, 'emailed', editableContact.emailedDates?.length || 0)}
                            />
                            <label htmlFor="emailedNew" className="block text-sm text-gray-400">
                              Emailed
                            </label>
                          </div>

                          {editableContact.calledDates?.map((date, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                id={`called${index}`}
                                name="called"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                checked={true}
                                onChange={(e) => handleCheckboxChange(e, 'called', index)}
                              />
                              <label htmlFor={`called${index}`} className="block text-sm text-gray-400">
                                Called on {formatDateTime(date)}
                              </label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <input
                              id="calledNew"
                              name="called"
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              checked={false}
                              onChange={(e) => handleCheckboxChange(e, 'called', editableContact.calledDates?.length || 0)}
                            />
                            <label htmlFor="calledNew" className="block text-sm text-gray-400">
                              Called
                            </label>
                          </div>

                          {editableContact.videoCalledDates?.map((date, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                id={`videoCalled${index}`}
                                name="videoCalled"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                checked={true}
                                onChange={(e) => handleCheckboxChange(e, 'videoCalled', index)}
                              />
                              <label htmlFor={`videoCalled${index}`} className="block text-sm text-gray-400">
                                Video Called on {formatDateTime(date)}
                              </label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <input
                              id="videoCalledNew"
                              name="videoCalled"
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              checked={false}
                              onChange={(e) => handleCheckboxChange(e, 'videoCalled', editableContact.videoCalledDates?.length || 0)}
                            />
                            <label htmlFor="videoCalledNew" className="block text-sm text-gray-400">
                              Video Called
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white">Email</label>
                          <input
                            type="text"
                            name="email"
                            className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                            value={editableContact.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white">Phone</label>
                          <input
                            type="text"
                            name="phone"
                            className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                            value={editableContact.phone}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white">School District</label>
                          <input
                            type="text"
                            name="schoolDistrict"
                            className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                            value={editableContact.schoolDistrict}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white">School</label>
                          <input
                            type="text"
                            name="school"
                            className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                            value={editableContact.school}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </Tab.Panel>
                    {editableContact.emailedDates?.length > 0 && (
                      <Tab.Panel className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white">Email Notes</label>
                          <textarea
                            className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                            rows="4"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                          />
                          <button
                            onClick={() => handleAddNote('emailNotes')}
                            className="mt-2 inline-flex justify-center rounded-md p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500"
                          >
                            Add Note
                          </button>
                          {editableContact.emailNotes?.map((note, index) => (
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
                      </Tab.Panel>
                    )}
                    {editableContact.calledDates?.length > 0 && (
                      <Tab.Panel className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white">Call Notes</label>
                          <textarea
                            className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                            rows="4"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                          />
                          <button
                            onClick={() => handleAddNote('callNotes')}
                            className="mt-2 inline-flex justify-center rounded-md p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500"
                          >
                            Add Note
                          </button>
                          {editableContact.callNotes?.map((note, index) => (
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
                      </Tab.Panel>
                    )}
                    {editableContact.videoCalledDates?.length > 0 && (
                      <Tab.Panel className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white">Video Call Notes</label>
                          <textarea
                            className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                            rows="4"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                          />
                          <button
                            onClick={() => handleAddNote('videoCallNotes')}
                            className="mt-2 inline-flex justify-center rounded-md p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500"
                          >
                            Add Note
                          </button>
                          {editableContact.videoCallNotes?.map((note, index) => (
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
                      </Tab.Panel>
                    )}
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
