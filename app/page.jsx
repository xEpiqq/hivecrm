'use client'
import { useEffect, useState } from 'react';
import { signInWithGoogle, onAuthChange } from '../initFirebase';
import { useRouter } from 'next/navigation'
 
export default function Login() {
  const router = useRouter()
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUser(user);
        router.push('/crm'); // Redirect to /crm after successful login
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function logUser() {
    console.log(user)
    router.push('/dashboard', { scroll: false })
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm mt-20">
          <img
            alt="Hive CRM"
            src="/honeycomb.png"
            className="mx-auto h-16 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Hive CRM 
          
          </h2>
          <h3 className='text-gray-500 w-full items-center justify-center flex text-lg'>(Minimalist CRM)</h3>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {user ? (
            <div className="text-center text-white">
              <h3>Welcome, {user.displayName}!</h3>
              <p>{user.email}</p>
              <img src={user.photoURL} alt="User Profile" className="mx-auto h-16 w-16 rounded-full" />
            </div>
          ) : (
            <div>
              <div className="relative">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-gray-800 px-6 rounded-xl text-white">Continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={signInWithGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span className="text-sm font-semibold leading-6">Sign in with Google</span>
                </button>
              </div>
            </div>
          )}
          <p className="mt-10 text-center text-sm text-gray-400">
            Not a member?{' '}
            <a href="#" className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300">
              It's time.
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
