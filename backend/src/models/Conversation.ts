import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Indexes for better performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Ensure only 2 participants per conversation (for one-to-one chat)
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  next();
});

// Transform output
conversationSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    // Keep _id for frontend compatibility
    // delete ret._id;
    delete ret.__v;
    
    // Convert unreadCount Map to object safely
    if (ret.unreadCount) {
      try {
        if (ret.unreadCount instanceof Map) {
          ret.unreadCount = Object.fromEntries(ret.unreadCount);
        } else if (typeof ret.unreadCount === 'object') {
          // Already an object, keep as is
          ret.unreadCount = ret.unreadCount;
        } else {
          ret.unreadCount = {};
        }
      } catch (error) {
        console.warn('Error converting unreadCount:', error);
        ret.unreadCount = {};
      }
    } else {
      ret.unreadCount = {};
    }
    
    return ret;
  }
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
