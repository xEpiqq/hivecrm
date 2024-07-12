'use client';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../initFirebase';
import states from './states.json'; // Ensure the path is correct based on your project structure

export default function DataDisplayPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(states[0]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const docRef = doc(collection(db, 'data'), selectedState.toLowerCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data().districts);
      } else {
        console.log('No such document!');
        setData([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedState]);

  const handleCheckboxChange = async (index) => {
    const updatedData = [...data];
    const now = new Date().toISOString();
    updatedData[index].completed = !updatedData[index].completed;
    updatedData[index].completedAt = updatedData[index].completed ? now : null;
    setData(updatedData);

    const docRef = doc(collection(db, 'data'), selectedState.toLowerCase());
    await updateDoc(docRef, { districts: updatedData });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-semibold mb-4">School Districts Data</h1>
      <div className="mb-4">
        <label htmlFor="state" className="block text-sm font-medium text-white mb-2">Select State:</label>
        <select
          id="state"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="block w-full bg-gray-800 border border-gray-700 rounded p-2"
        >
          {states.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr>
              <th className="p-2 text-left">District</th>
              <th className="p-2 text-left">Website</th>
              <th className="p-2 text-left">Completed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((district, index) => (
              <tr key={index} className={`p-2 ${district.completed ? 'line-through text-gray-500' : ''}`}>
                <td className="p-2">{district.name}</td>
                <td className="p-2">
                  {district.site !== "No valid link found" ? (
                    <a href={district.site} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">
                      Visit Site
                    </a>
                  ) : (
                    "No valid link found"
                  )}
                </td>
                <td className="p-2 flex gap-2">
                  <input
                    type="checkbox"
                    checked={district.completed}
                    onChange={() => handleCheckboxChange(index)}
                  />
                  {district.completed && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(district.completedAt).toLocaleString()}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
