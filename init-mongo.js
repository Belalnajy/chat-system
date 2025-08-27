// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the chat database
db = db.getSiblingDB('chat_db');

// Create a user for the chat application
db.createUser({
  user: 'chat_user',
  pwd: 'chat_password',
  roles: [
    {
      role: 'readWrite',
      db: 'chat_db'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'passwordHash'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email and is required'
        },
        passwordHash: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        provider: {
          bsonType: 'string',
          enum: ['local', 'google', 'facebook'],
          description: 'must be one of the enum values'
        },
        avatar: {
          bsonType: 'string',
          description: 'must be a string if provided'
        },
        isOnline: {
          bsonType: 'bool',
          description: 'must be a boolean if provided'
        },
        lastSeen: {
          bsonType: 'date',
          description: 'must be a date if provided'
        }
      }
    }
  }
});

db.createCollection('conversations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['participants'],
      properties: {
        participants: {
          bsonType: 'array',
          minItems: 2,
          maxItems: 2,
          items: {
            bsonType: 'objectId'
          },
          description: 'must be an array of exactly 2 user ObjectIds'
        },
        lastMessage: {
          bsonType: 'objectId',
          description: 'must be a message ObjectId if provided'
        },
        unreadCount: {
          bsonType: 'object',
          description: 'must be an object with user IDs as keys and counts as values'
        }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['conversationId', 'senderId', 'type'],
      properties: {
        conversationId: {
          bsonType: 'objectId',
          description: 'must be a conversation ObjectId and is required'
        },
        senderId: {
          bsonType: 'objectId',
          description: 'must be a user ObjectId and is required'
        },
        type: {
          bsonType: 'string',
          enum: ['text', 'image'],
          description: 'must be either text or image'
        },
        content: {
          bsonType: 'string',
          description: 'must be a string if provided'
        },
        imageUrl: {
          bsonType: 'string',
          description: 'must be a string if provided'
        },
        status: {
          bsonType: 'string',
          enum: ['sent', 'delivered', 'read'],
          description: 'must be one of the enum values'
        },
        readBy: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['userId', 'readAt'],
            properties: {
              userId: {
                bsonType: 'objectId'
              },
              readAt: {
                bsonType: 'date'
              }
            }
          }
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ name: 'text' });
db.users.createIndex({ isOnline: 1 });
db.users.createIndex({ lastSeen: -1 });

db.conversations.createIndex({ participants: 1 });
db.conversations.createIndex({ updatedAt: -1 });
db.conversations.createIndex({ 'participants.0': 1, 'participants.1': 1 }, { unique: true });

db.messages.createIndex({ conversationId: 1, createdAt: -1 });
db.messages.createIndex({ senderId: 1 });
db.messages.createIndex({ status: 1 });
db.messages.createIndex({ type: 1 });

print('MongoDB initialization completed successfully!');
print('Database: chat_db');
print('Collections created: users, conversations, messages');
print('Indexes created for optimal performance');
print('User created: chat_user with readWrite permissions');
