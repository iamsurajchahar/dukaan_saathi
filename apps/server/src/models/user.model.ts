import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'owner' | 'manager' | 'staff';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  activeStoreId?: mongoose.Types.ObjectId;
  stores: { storeId: mongoose.Types.ObjectId; role: string }[];
  subscriptionId?: mongoose.Types.ObjectId;
  refreshToken?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['owner', 'manager', 'staff'],
      default: 'owner',
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    activeStoreId: { type: Schema.Types.ObjectId, ref: 'Store' },
    stores: [
      {
        storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
        role: { type: String, enum: ['owner', 'manager', 'staff'] },
      },
    ],
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    refreshToken: String,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// email already has a unique index from the field definition
userSchema.index({ 'stores.storeId': 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(config.bcryptRounds);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.passwordHash;
    delete ret.refreshToken;
    delete ret.emailVerificationToken;
    delete ret.resetPasswordToken;
    return ret;
  },
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
