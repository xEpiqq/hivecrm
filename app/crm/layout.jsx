'use client';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { auth, signOut } from '../../initFirebase';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'CRM', href: '/crm' },
  { name: 'FOLLOW-UP', href: '/crm/followup' },
  { name: 'EMAIL TEMPLATES', href: '/crm/emailtemplates' },
  { name: 'DATA', href: '/crm/data' },
];

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/'); // Redirect to home after sign-out
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const getTabClassName = (href) => {
    return pathname === href ? 'text-indigo-400' : '';
  };

  return (
    <div className="flex justify-between mx-auto max-w-7xl flex-col">
      <div className='flex'>
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            defaultValue={tabs.find((tab) => pathname.startsWith(tab.href)).name}
            className="block w-full rounded-md border-none bg-white/5 py-2 pl-3 pr-10 text-base text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex border-b border-white/10 py-4">
            <ul
              role="list"
              className="flex min-w-full flex-none gap-x-6 px-2 text-sm font-semibold leading-6 text-gray-400"
            >
              {tabs.map((tab) => (
                <li key={tab.name}>
                  <a
                    href={tab.href}
                    className={getTabClassName(tab.href)}
                  >
                    {tab.name}
                  </a>
                </li>
              ))}

              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <MenuButton className="inline-flex justify-center rounded-md bg-gray-800 p-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-gray-700">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </MenuButton>
                </div>
                <MenuItems
                  className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="py-1">
                    <MenuItem>
                      <button
                        onClick={handleSignOut}
                        className="group flex w-full items-center px-4 py-2 text-sm text-gray-700"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                        Sign Out
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            </ul>
          </nav>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
