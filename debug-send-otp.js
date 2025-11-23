/**
 * Debug script for send-otp endpoint
 * Run this to diagnose the 500 error
 */

const axios = require('axios');

async function debugSendOtp() {
  console.log('🔍 Debugging send-otp endpoint...\n');

  // Test data
  const testData = {
    phone: '918248449609' // Example phone number from DTO
  };

  try {
    console.log('📞 Testing send-otp endpoint...');
    console.log('Request data:', testData);
    
    const response = await axios.post('http://localhost:3000/api/v1/auth/send-otp', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);

  } catch (error) {
    console.log('❌ Error occurred:');
    
    if (error.response) {
      // Server responded with error status
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Response Data:', error.response.data);
      console.log('Response Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.log('No response received');
      console.log('Request:', error.request);
    } else {
      // Something else happened
      console.log('Error Message:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if the API server is running on port 3000');
    console.log('2. Verify database connection');
    console.log('3. Check server logs for detailed error messages');
    console.log('4. Ensure all environment variables are set');
    console.log('5. Verify the phone number format is correct');
  }
}

// Run the debug function
debugSendOtp();
