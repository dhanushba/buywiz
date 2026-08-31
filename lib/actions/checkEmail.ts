// const fetch = require("node-fetch"); 
/// <reference types="node" />

const API_KEY = process.env.ABSTRACT_KEY || '';

if (!API_KEY && process.env.NODE_ENV === 'production') {
  console.error('WARNING: ABSTRACT_KEY environment variable is not defined for email validation');
}

export async function checkEmail(email: string ) {
  if (!API_KEY) {
    console.warn(`⚠️  Email validation skipped for ${email} - ABSTRACT_KEY not configured`);
    return email; // Allow email if API key is not configured
  }
  
  const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${email}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.deliverability === "DELIVERABLE") {
      // console.log("✅ Valid Email:", data.email);
      return email;
    } else {
      // console.log("❌ Invalid Email:", data.email);
      return null;
    }

  } catch (error) {
    console.error("Error validating email:", error);
  }
}

