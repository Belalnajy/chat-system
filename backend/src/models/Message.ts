import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: 'text' | 'image';
  text?: string;
  image?: {
    url: string;
    filename: string;
    size: number;
  };
  status: 'sent' | 'delivered' | 'read';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    required: true,
    default: 'text'
  },
  text: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  image: {
    url: {
      type: String,
      trim: true
    },
    filename: {
      type: String,
      trim: true
    },
    size: {
      type: Number
    }
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ conversationId: 1, sentAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ status: 1 });

// Validation: message must have either text or image
messageSchema.pre('save', function(next) {
  if (!this.text && !this.image?.url) {
    return next(new Error('Message must have either text or image'));
  }
  
  if (this.type === 'text' && !this.text) {
    return next(new Error('Text message must have text content'));
  }
  
  if (this.type === 'image' && !this.image?.url) {
    return next(new Error('Image message must have image URL'));
  }
  
  next();
});

// Transform output
messageSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    // Keep _id for frontend compatibility
    // delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Message = mongoose.model<IMessage>('Message', messageSchema);
