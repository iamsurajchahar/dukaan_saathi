import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // A DNS miss means the URI points at a cluster that no longer exists (or a
    // typo'd hostname) — not a transient network blip. Say so, because the raw
    // "querySrv ENOTFOUND" is easy to mistake for a platform DNS problem.
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      logger.error(
        { err: error },
        `Cannot resolve the MongoDB host in MONGODB_URI. Check that the cluster ` +
          `still exists in Atlas and that the connection string is current ` +
          `(Atlas > Database > Connect > Drivers), and that this host is allowed ` +
          `under Network Access.`
      );
    } else {
      logger.error({ err: error }, 'MongoDB connection error');
    }
    process.exit(1);
  }
};
