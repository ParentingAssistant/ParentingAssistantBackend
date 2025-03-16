#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'https://parenting-assistant-backend-h5engjskkq-uc.a.run.app';

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const config = { method, url, headers };
    if (data) {
      config.data = data;
    }
    
    console.log(`\n🚀 Testing ${method.toUpperCase()} ${url}`);
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    console.log('📄 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Response:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint');
  return makeRequest('get', '/health');
}

async function testRootEndpoint() {
  console.log('\n🔍 Testing Root Endpoint');
  return makeRequest('get', '/');
}

async function testMealPlanEndpoint() {
  console.log('\n🔍 Testing Meal Plan Endpoint');
  const data = {
    days: 3,
    preferences: 'vegetarian',
    allergies: 'nuts'
  };
  return makeRequest('post', '/api/meal-plans/generate-meal-plan', data);
}

async function testStoryEndpoint() {
  console.log('\n🔍 Testing Bedtime Story Endpoint');
  const data = {
    childName: 'Alex',
    childAge: 5,
    theme: 'space adventure',
    lengthMinutes: 5
  };
  return makeRequest('post', '/api/stories/generate-bedtime-story', data);
}

// Main function to run all tests
async function runTests() {
  console.log('🧪 Starting API Tests for Production Environment (No Auth)');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  await testHealthEndpoint();
  await testRootEndpoint();
  await testMealPlanEndpoint();
  await testStoryEndpoint();
  
  console.log('\n🏁 All tests completed');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
}); 