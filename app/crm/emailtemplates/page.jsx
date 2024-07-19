'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../initFirebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    subject: '',
    body: ''
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      const templatesCol = collection(db, 'emailTemplates');
      const templatesSnapshot = await getDocs(templatesCol);
      const templatesList = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(templatesList);
    };
    fetchTemplates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate({ ...newTemplate, [name]: value });
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateDoc(doc(db, 'emailTemplates', editingTemplate.id), newTemplate);
        setEditingTemplate(null);
      } else {
        await addDoc(collection(db, 'emailTemplates'), newTemplate);
      }
      setNewTemplate({ subject: '', body: '' });
      setShowForm(false);
      const templatesCol = collection(db, 'emailTemplates');
      const templatesSnapshot = await getDocs(templatesCol);
      const templatesList = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(templatesList);
    } catch (error) {
      console.error('Error adding/updating template: ', error);
    }
  };

  const handleEditTemplate = (template) => {
    setNewTemplate(template);
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await deleteDoc(doc(db, 'emailTemplates', id));
      setTemplates(templates.filter(template => template.id !== id));
    } catch (error) {
      console.error('Error deleting template: ', error);
    }
  };

  const handleCopyTemplate = async (template) => {
    try {
      await navigator.clipboard.writeText(template.body);
      alert('Template copied to clipboard!');
    } catch (error) {
      console.error('Error copying template: ', error);
    }
  };

  return (
    <div className="bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 min-h-screen">
      <div className="mt-10 mx-auto max-w-7xl">
        <h2 className="text-2xl font-semibold leading-7 text-white sm:px-6 lg:px-8">Email Templates</h2>
        <div className="mt-6 flow-root">
          <ul role="list" className="-mb-8">
            {templates.map(template => (
              <li key={template.id} className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-white">Subject: {template.subject}</span>
                      </p>
                      <pre className="text-sm text-gray-400 whitespace-pre-wrap">{template.body}</pre>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditTemplate(template)} className="text-indigo-600 hover:text-indigo-900">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 hover:text-red-900">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button onClick={() => handleCopyTemplate(template)} className="text-green-600 hover:text-green-900">
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="mt-6 inline-flex justify-center rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          onClick={() => {
            setShowForm(true);
            setEditingTemplate(null);
            setNewTemplate({ subject: '', body: '' });
          }}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Email Template
        </button>

        {showForm && (
          <form onSubmit={handleAddTemplate} className="mt-6 bg-gray-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-white">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  value={newTemplate.subject}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-white">
                  Body
                </label>
                <textarea
                  name="body"
                  id="body"
                  value={newTemplate.body}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows="4"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
