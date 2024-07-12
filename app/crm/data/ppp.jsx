// 'use client';
// import { useState } from 'react';
// import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
// import { db } from '../../../initFirebase';
// import states from './states.json'; // Ensure the path is correct based on your project structure

// export default function DataPage() {
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [currentState, setCurrentState] = useState('');

//   const handleUploadData = async (state, data) => {
//     setLoading(true);
//     setMessage('');
//     setCurrentState(state);

//     try {
//       const stateCollectionRef = collection(db, state.toLowerCase());
//       const stateDocs = await getDocs(stateCollectionRef);
//       const stateDocMap = {};

//       stateDocs.forEach(doc => {
//         stateDocMap[doc.data().name.toLowerCase()] = doc.id;
//       });

//       const updatedData = data.map(entry => ({
//         ...entry,
//         completed: false,
//         completedAt: null,
//         contacts: [],
//         link: stateDocMap[entry.name.toLowerCase()] || null,
//       }));

//       const dataCollectionRef = collection(db, 'data');
//       const stateDocRef = doc(dataCollectionRef, state.toLowerCase());
//       await setDoc(stateDocRef, { districts: updatedData });

//       setMessage(`${state} data uploaded successfully!`);
//     } catch (error) {
//       console.error(`Error uploading ${state} data:`, error);
//       setMessage(`Failed to upload ${state} data.`);
//     }

//     setLoading(false);
//   };

//   const handleAllStates = async () => {
//     for (const state of states) {
//       const stateData = await import(`./${state.toLowerCase()}.json`);
//       await handleUploadData(state, stateData.default);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white p-4">
//       <h1 className="text-2xl font-semibold mb-4">Data Management</h1>
//       <button
//         onClick={handleAllStates}
//         className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded"
//         disabled={loading}
//       >
//         {loading ? `Uploading ${currentState}...` : 'Upload All States'}
//       </button>
//       {message && <p className="mt-4">{message}</p>}
//     </div>
//   );
// }
