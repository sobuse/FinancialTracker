import { Link } from "wouter";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <div className="flex min-h-screen">
      {/* Left Banner */}
      <div className="hidden md:flex w-1/3 bg-sidebar flex-col justify-center items-start p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')] bg-cover opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center bg-primary rounded-full w-10 h-10 text-black font-semibold mb-8">C</div>
          <h1 className="text-3xl font-bold text-white mb-4">Unlock Financial Freedom</h1>
          <p className="text-neutral-300 mb-6">Secure, fast, and reliable financial transactions at your fingertips.</p>
          <div className="space-y-3 mt-12">
            <div className="flex items-center text-neutral-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secured</span>
            </div>
            <div className="flex items-center text-neutral-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
              <span>Licensed & regulated</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Form */}
      <div className="w-full md:w-2/3 flex justify-center items-center p-4 md:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to CredPal</h2>
          <p className="text-muted-foreground mb-8">Please sign in with your assigned login details</p>
          
          <LoginForm />
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don't have an account? 
              <Link href="/register" className="text-primary font-medium hover:underline ml-1">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
