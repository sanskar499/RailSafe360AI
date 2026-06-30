import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isMock = false;
const DB_DIR = path.resolve('./data/db');

// Ensure mock db directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (e) {
    // Ignored (Vercel read-only system)
  }
}

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('\n⚠️  WARNING: MONGODB_URI not found in environment variables.');
    console.warn('⚠️  Falling back to Persistent JSON Local Database (RailSafe360 Engine).\n');
    isMock = true;
    global.isMockDB = true;
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas successfully.');
    isMock = false;
    global.isMockDB = false;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.warn('⚠️  Falling back to Persistent JSON Local Database.\n');
    isMock = true;
    global.isMockDB = true;
  }
};

// Simple Mock Query Builder class to mimic Mongoose chainable methods
class MockQuery {
  constructor(data) {
    this.data = data;
  }

  find(filter = {}) {
    let result = [...this.data];
    for (const key in filter) {
      if (filter[key] !== undefined) {
        result = result.filter(item => {
          if (typeof filter[key] === 'object' && filter[key] !== null) {
            // Support simple $regex or $in
            if (filter[key].$regex) {
              const regex = new RegExp(filter[key].$regex, filter[key].$options || 'i');
              return regex.test(item[key]);
            }
            if (filter[key].$in) {
              return filter[key].$in.includes(item[key]);
            }
          }
          return item[key] === filter[key];
        });
      }
    }
    this.data = result;
    return this;
  }

  sort(sortObj = {}) {
    for (const key in sortObj) {
      const direction = sortObj[key];
      this.data.sort((a, b) => {
        if (a[key] < b[key]) return direction === -1 || direction === 'desc' ? 1 : -1;
        if (a[key] > b[key]) return direction === -1 || direction === 'desc' ? -1 : 1;
        return 0;
      });
    }
    return this;
  }

  limit(num) {
    this.data = this.data.slice(0, num);
    return this;
  }

  exec() {
    return Promise.resolve(this.data);
  }

  then(onfulfilled, onrejected) {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

// Ensure in-memory fallback dictionary exists
if (!global.inMemoryDB) {
  global.inMemoryDB = {};
}

// Mock Model Factory for Local JSON Database persistence
export const createMockModel = (modelName, defaultData = []) => {
  const filePath = path.join(DB_DIR, `${modelName.toLowerCase()}.json`);
  
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    } catch (e) {
      // Ignored write error (Vercel read-only filesystem)
    }
  }

  const readData = () => {
    try {
      if (global.inMemoryDB[modelName]) {
        return global.inMemoryDB[modelName];
      }
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      return defaultData;
    }
  };

  const writeData = (data) => {
    global.inMemoryDB[modelName] = data;
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      // Ignored write error (Vercel read-only filesystem)
    }
  };

  return {
    find: (filter = {}) => {
      const data = readData();
      return new MockQuery(data).find(filter);
    },

    findOne: async (filter = {}) => {
      const data = readData();
      const query = new MockQuery(data).find(filter);
      return query.data[0] || null;
    },

    findById: async (id) => {
      const data = readData();
      return data.find(item => item._id === id || item.id === id) || null;
    },

    create: async (docData) => {
      const data = readData();
      const newDoc = {
        _id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...docData
      };
      data.push(newDoc);
      writeData(data);
      return newDoc;
    },

    findByIdAndUpdate: async (id, updateData, options = {}) => {
      const data = readData();
      const index = data.findIndex(item => item._id === id || item.id === id);
      if (index === -1) return null;
      
      const updated = {
        ...data[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      data[index] = updated;
      writeData(data);
      return updated;
    },

    findOneAndUpdate: async (filter = {}, updateData, options = {}) => {
      const data = readData();
      const query = new MockQuery(data).find(filter);
      if (query.data.length === 0) return null;
      
      const target = query.data[0];
      const index = data.findIndex(item => item._id === target._id);
      
      const updated = {
        ...data[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      data[index] = updated;
      writeData(data);
      return updated;
    },

    updateOne: async (filter = {}, updateData) => {
      const data = readData();
      const query = new MockQuery(data).find(filter);
      if (query.data.length === 0) return { matchedCount: 0, modifiedCount: 0 };
      
      const target = query.data[0];
      const index = data.findIndex(item => item._id === target._id);
      data[index] = {
        ...data[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeData(data);
      return { matchedCount: 1, modifiedCount: 1 };
    },

    deleteOne: async (filter = {}) => {
      const data = readData();
      const query = new MockQuery(data).find(filter);
      if (query.data.length === 0) return { deletedCount: 0 };
      
      const target = query.data[0];
      const filtered = data.filter(item => item._id !== target._id);
      writeData(filtered);
      return { deletedCount: 1 };
    },

    countDocuments: async (filter = {}) => {
      const data = readData();
      const query = new MockQuery(data).find(filter);
      return query.data.length;
    }
  };
};
