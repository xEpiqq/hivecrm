'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, onAuthChange, db } from '../../initFirebase';
import { collection, getDocs, updateDoc, doc, query, where, limit, startAfter } from 'firebase/firestore';
import { Menu, MenuButton, MenuItem, MenuItems, Dialog, DialogPanel, DialogTitle, Tab } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faSignOutAlt, faEdit, faTrash, faEllipsisV, faTimes, faChevronRight, faCopy } from '@fortawesome/free-solid-svg-icons';
import { CSSTransition } from 'react-transition-group';
import { format } from 'date-fns';

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const formatEmailTemplate = (template, contact) => {
  return template
    .replace('{name}', contact.name)
    .replace('{district}', contact.schoolDistrict)
    .replace('{school}', contact.school);
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Email template copied to clipboard!');
  } catch (error) {
    console.error('Error copying text: ', error);
  }
};

export default function Example() {
  const [user, setUser] = useState(null);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedState, setSelectedState] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [lastDoc, setLastDoc] = useState(null);

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
      fetchSchools();
    }
  }, [user, selectedState, perPage]);

  const fetchSchools = async (loadMore = false) => {
    if (!user) return;

    let schoolsQuery = collection(db, 'privateschools');
    if (selectedState) {
      schoolsQuery = query(schoolsQuery, where('state', '==', selectedState));
    }
    schoolsQuery = query(schoolsQuery, limit(perPage));
    if (loadMore && lastDoc) {
      schoolsQuery = query(schoolsQuery, startAfter(lastDoc));
    }

    const schoolsSnapshot = await getDocs(schoolsQuery);
    const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSchools(loadMore ? [...schools, ...schoolsList] : schoolsList);
    setLastDoc(schoolsSnapshot.docs[schoolsSnapshot.docs.length - 1]);
  };

  useEffect(() => {
    const fetchEmailTemplates = async () => {
      const templatesCol = collection(db, 'emailTemplates');
      const templatesSnapshot = await getDocs(templatesCol);
      const templatesList = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmailTemplates(templatesList);
      if (templatesList.length > 0) {
        setSelectedTemplate(templatesList[0]); // Default to the first template
      }
    };
    fetchEmailTemplates();
  }, []);

  const handleSchoolClick = (school) => {
    setSelectedSchool(school);
    setDrawerOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedSchool({ ...selectedSchool, [name]: value });
  };

  const handleSave = async () => {
    if (selectedSchool) {
      const schoolRef = doc(db, 'privateschools', selectedSchool.id);
      try {
        await updateDoc(schoolRef, {
          choirteacher: selectedSchool.choirteacher,
          choirteacherphone: selectedSchool.choirteacherphone,
          choirteacheremail: selectedSchool.choirteacheremail
        });
        setDrawerOpen(false);
        fetchSchools();
      } catch (error) {
        console.error("Error updating school: ", error);
      }
    }
  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
  };

  const handleLoadMore = () => {
    fetchSchools(true);
  };

  return (
    <>
      <div className="bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 min-h-screen">
        <div className="mt-10 mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <select
              value={selectedState}
              onChange={handleStateChange}
              className="bg-gray-800 text-white rounded-md px-3 py-2"
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              value={perPage}
              onChange={handlePerPageChange}
              className="bg-gray-800 text-white rounded-md px-3 py-2"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <div className="bg-gray-900 py-10 mt-10">
            <h2 className="px-4 text-base font-semibold leading-7 text-white sm:px-6 lg:px-8">Schools</h2>
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
                  <th scope="col" className="hidden py-2 pl-0 pr-8 font-semibold sm:table-cell">City</th>
                  <th scope="col" className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">State</th>
                  <th scope="col" className="hidden py-2 pl-0 pr-4 font-semibold sm:table-cell">Population</th>
                  <th scope="col" className="hidden py-2 pl-0 pr-4 font-semibold sm:table-cell">Choir Teacher</th>
                  <th scope="col" className="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {schools.map((school) => (
                  <tr key={school.id}>
                    <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                      <div className="flex items-center gap-x-4">
                        <div className="truncate text-sm font-medium leading-6 text-white">{school.name}</div>
                      </div>
                    </td>
                    <td className="hidden py-4 pl-0 pr-4 sm:table-cell sm:pr-8">
                      <div className="text-sm leading-6 text-gray-400">{school.city}</div>
                    </td>
                    <td className="py-4 pl-0 pr-4 text-sm leading-6 text-white sm:pr-8 sm:text-left">
                      {school.state}
                    </td>
                    <td className="hidden py-4 pl-0 pr-4 text-sm leading-6 text-gray-400 sm:table-cell sm:pr-6 lg:pr-8">
                      {school.population}
                    </td>
                    <td className="hidden py-4 pl-0 pr-4 text-sm leading-6 text-gray-400 sm:table-cell sm:pr-6 lg:pr-8">
                      {school.choirteacher}
                    </td>
                    <td className="py-4 pl-0 pr-4 text-right text-sm leading-6 text-white sm:pr-8 sm:text-left lg:pr-20">
                      <button
                        onClick={() => handleSchoolClick(school)}
                        className="inline-flex justify-center rounded-md py-2 px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-500 ml-2"
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                className="bg-indigo-500 text-white px-4 py-2 rounded-md"
              >
                Load More
              </button>
            </div>
          </div>
        </div>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} school={selectedSchool} onInputChange={handleInputChange} onSave={handleSave} />
    </>
  );
}

function Drawer({ isOpen, onClose, school, onInputChange, onSave }) {
  const [editableSchool, setEditableSchool] = useState(school);

  useEffect(() => {
    setEditableSchool(school);
  }, [school]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableSchool({ ...editableSchool, [name]: value });
    onInputChange(e);
  };

  return (
    <Dialog open={isOpen} onClose={onSave} className="relative z-10">
      <div className="fixed inset-0" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel className="pointer-events-auto w-screen max-w-md">
              <div className="flex h-full flex-col bg-gray-900 shadow-xl">
                <div className="flex items-center justify-between p-4 bg-gray-800">
                  <DialogTitle className="text-lg font-medium text-white">
                    {editableSchool?.name}
                  </DialogTitle>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onSave}
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white">Choir Teacher</label>
                      <input
                        type="text"
                        name="choirteacher"
                        className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                        value={editableSchool?.choirteacher}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white">Choir Teacher Phone</label>
                      <input
                        type="text"
                        name="choirteacherphone"
                        className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                        value={editableSchool?.choirteacherphone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white">Choir Teacher Email</label>
                      <input
                        type="email"
                        name="choirteacheremail"
                        className="mt-1 block w-full rounded-md bg-gray-800 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                        value={editableSchool?.choirteacheremail}
                        onChange={handleInputChange}
                      />
                    </div>
                    <button
                      onClick={onSave}
                      className="mt-4 w-full bg-indigo-500 text-white rounded-md py-2"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
