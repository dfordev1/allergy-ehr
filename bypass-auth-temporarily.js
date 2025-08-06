// Quick script to temporarily bypass authentication for testing
// This modifies your App.tsx to skip authentication checks

import { readFileSync, writeFileSync } from 'fs';

const appTsxPath = 'src/App.tsx';

try {
  console.log('🔧 Temporarily bypassing authentication for testing...\n');
  
  // Read current App.tsx
  let appContent = readFileSync(appTsxPath, 'utf8');
  
  // Create backup
  writeFileSync(appTsxPath + '.backup', appContent);
  console.log('✅ Created backup: src/App.tsx.backup');
  
  // Modify the authentication check
  const originalCheck = `  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Authentication Required</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Please sign in to access the Skin Track Aid booking system and patient records.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }`;

  const bypassCheck = `  // TEMPORARILY BYPASSED FOR TESTING
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-background">
  //       <div className="container mx-auto px-4 py-8">
  //         <div className="max-w-md mx-auto mb-6">
  //           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //             <div className="flex items-center space-x-3">
  //               <div className="flex-shrink-0">
  //                 <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
  //                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  //                 </svg>
  //               </div>
  //               <div>
  //                 <h3 className="text-sm font-medium text-blue-800">Authentication Required</h3>
  //                 <p className="text-sm text-blue-700 mt-1">
  //                   Please sign in to access the Skin Track Aid booking system and patient records.
  //                 </p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //         <AuthForm />
  //       </div>
  //     </div>
  //   );
  // }
  
  // TEMPORARY: Simulate authenticated user for testing
  const simulatedUser = user || { 
    id: 'temp-user-' + Date.now(), 
    email: 'temp@skintrack.com',
    aud: 'authenticated',
    role: 'authenticated'
  };`;

  // Replace the authentication check
  if (appContent.includes(originalCheck)) {
    appContent = appContent.replace(originalCheck, bypassCheck);
    console.log('✅ Authentication check bypassed');
  } else {
    console.log('⚠️  Could not find exact authentication check to replace');
    console.log('   You may need to manually comment out the authentication check');
  }
  
  // Also modify the user variable usage
  appContent = appContent.replace(
    'return (\n    <AsyncErrorBoundary>\n      <RBACProvider>',
    'return (\n    <AsyncErrorBoundary>\n      <RBACProvider user={simulatedUser}>'
  );
  
  // Write modified file
  writeFileSync(appTsxPath, appContent);
  console.log('✅ App.tsx modified for testing');
  
  console.log('\n🎉 Authentication temporarily bypassed!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. The app will now load without authentication');
  console.log('2. You can test all booking functionality');
  console.log('3. Open http://localhost:8082 to see the dashboard');
  console.log('\n🔄 TO RESTORE AUTHENTICATION:');
  console.log('1. Run: cp src/App.tsx.backup src/App.tsx');
  console.log('2. Or manually restore from the backup file');
  
} catch (error) {
  console.error('❌ Error modifying App.tsx:', error.message);
  console.log('\n🔧 MANUAL STEPS:');
  console.log('1. Open src/App.tsx in your editor');
  console.log('2. Find the line: if (!user) {');
  console.log('3. Comment out the entire if block');
  console.log('4. Add: const simulatedUser = { id: "temp", email: "temp@test.com" };');
}