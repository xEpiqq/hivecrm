'use client';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../initFirebase';

export default function SearchableDropdown({ state, value, onChange, setTheLink }) {
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDistricts = async () => {
      if (state) {
        const docRef = doc(collection(db, 'data'), state.toLowerCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDistricts(docSnap.data().districts);
        } else {
          console.log('No such document!');
        }
      }
    };

    fetchDistricts();
  }, [state]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      setFilteredDistricts(
        districts.filter(district =>
          district.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredDistricts([]);
    }
  }, [searchTerm, districts]);

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    onChange(e.target.value);
  };

  const handleSelect = (district) => {
    setTheLink(district.link);
    setSearchTerm(district.name);
    onChange(district.name, district);
    setFilteredDistricts([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md bg-gray-900 text-white border-gray-700 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 px-2 py-[6px]"
        placeholder="District"
      />
      {filteredDistricts.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto text-base leading-6 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredDistricts.map((district, index) => (
            <li
              key={index}
              className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
              onClick={() => handleSelect(district)}
            >
              {district.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
