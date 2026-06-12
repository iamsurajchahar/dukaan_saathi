import { Store } from '../models/store.model';
import { User } from '../models/user.model';
import { Subscription } from '../models/subscription.model';
import {
  BadRequestError,
  NotFoundError,
  PaymentRequiredError,
} from '../utils/errors';

export const storeService = {
  async create(userId: string, data: Record<string, any>) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check subscription limits
    const subscription = await Subscription.findById(user.subscriptionId);
    if (subscription) {
      const currentStoreCount = user.stores.length;
      if (currentStoreCount >= subscription.limits.maxStores) {
        throw new PaymentRequiredError(
          `Your plan allows a maximum of ${subscription.limits.maxStores} store(s). Please upgrade to add more.`
        );
      }
    }

    const store = await Store.create({
      ...data,
      ownerId: userId,
    });

    // Add store to user's stores array with owner role
    user.stores.push({ storeId: store._id as any, role: 'owner' });
    user.activeStoreId = store._id as any;
    await user.save();

    return store;
  },

  async getAll(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const storeIds = user.stores.map((s) => s.storeId);
    const stores = await Store.find({
      _id: { $in: storeIds },
      isActive: true,
    }).lean();

    return stores;
  },

  async getById(storeId: string) {
    const store = await Store.findOne({ _id: storeId, isActive: true }).lean();
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    return store;
  },

  async update(storeId: string, data: Record<string, any>) {
    const store = await Store.findOneAndUpdate(
      { _id: storeId, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return store;
  },

  async delete(storeId: string) {
    const store = await Store.findOneAndUpdate(
      { _id: storeId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!store) {
      throw new NotFoundError('Store not found');
    }

    return { message: 'Store deleted successfully' };
  },

  async switchStore(userId: string, storeId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hasAccess = user.stores.some(
      (s) => s.storeId.toString() === storeId
    );
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this store');
    }

    const store = await Store.findOne({ _id: storeId, isActive: true });
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    user.activeStoreId = store._id as any;
    await user.save();

    return { message: 'Active store switched', activeStoreId: storeId };
  },
};
