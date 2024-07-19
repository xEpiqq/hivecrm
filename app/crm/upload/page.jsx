'use client';
import { useState } from 'react';
import { db } from '../../../initFirebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import privateSchools from '../../../us-private-schools.json';

export default function UploadSchools() {
  const [loading, setLoading] = useState(false);

  const uploadData = async () => {
    setLoading(true);
    try {
      const schoolsCol = collection(db, 'privateschools');
      
      const promises = privateSchools.map(async (school) => {
        const schoolData = {
          ...school,
          choirteacher: '',
          choirteacherphone: '',
          choirteacheremail: ''
        };
        const schoolDoc = doc(schoolsCol);
        await setDoc(schoolDoc, schoolData);
      });

      await Promise.all(promises);
      alert('Data uploaded successfully!');
    } catch (error) {
      console.error('Error uploading data: ', error);
      alert('Error uploading data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={uploadData}
        className={`px-4 py-2 bg-blue-600 text-white rounded-md ${loading ? 'cursor-not-allowed' : ''}`}
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Upload Schools Data'}
      </button>
    </div>
  );
}
