const mongoose = require('mongoose');
const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

const AuthStateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  data: { type: String, required: true }
});
const AuthStateModel = mongoose.model('AuthState', AuthStateSchema);

async function useMongoDBAuthState(collectionName = 'auth_state') {
  // Use existing connection or schema if you want, but Mongoose is already connected in server.js
  const writeData = async (data, id) => {
    const informationToStore = JSON.stringify(data, BufferJSON.replacer);
    await AuthStateModel.updateOne({ id }, { $set: { data: informationToStore } }, { upsert: true });
  };
  
  const readData = async (id) => {
    try {
      const doc = await AuthStateModel.findOne({ id });
      if (doc && doc.data) {
        return JSON.parse(doc.data, BufferJSON.reviver);
      }
    } catch (e) {
      console.error('Error reading auth state', e);
    }
    return null;
  };
  
  const removeData = async (id) => {
    try {
      await AuthStateModel.deleteOne({ id });
    } catch (e) { }
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async id => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = require('@whiskeysockets/baileys').proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, key));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, 'creds')
  };
}

module.exports = { useMongoDBAuthState };
