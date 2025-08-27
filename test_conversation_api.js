const axios = require("axios");

// Replace with a valid JWT token from your application
const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFlZmE3NmJjYjJlNDBjMmYyZDk0MDUiLCJlbWFpbCI6ImJlbGFsbmFqeTJAZ21haWwuY29tIiwiaWF0IjoxNzU2MzA1NzI2LCJleHAiOjE3NTYzMDkzMjZ9.8rJBdzij7NDN3znuJWbHY-K1SW3PBqz7sCwAvslYs8U";
// Replace with a valid conversation ID
const CONVERSATION_ID = "YOUR_CONVERSATION_ID_HERE";

const API_BASE_URL = "http://localhost:3001";

async function testGetConversationMessages() {
  try {
    console.log(
      `Testing GET ${API_BASE_URL}/api/conversations/${CONVERSATION_ID}/messages`
    );

    const response = await axios.get(
      `${API_BASE_URL}/api/conversations/${CONVERSATION_ID}/messages`,
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log("Successfully fetched conversation messages");
      console.log("Messages count:", response.data.data.messages?.length || 0);
      console.log(
        "Conversation participants:",
        response.data.data.conversation?.participants
          ?.map((p) => p.name || p._id)
          .join(", ")
      );
    } else {
      console.error(
        "Failed to fetch conversation messages:",
        response.data.message
      );
    }
  } catch (error) {
    console.error("Error testing conversation API:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testGetConversationMessages();
