import { MenuItem, CartItem, Merchant } from "../types";

const DB_NAME = "diorderFoodDB";
const DB_VERSION = 3; // Increased version number

interface DBSchema {
  menuItems: MenuItem[];
  cartItems: CartItem[];
  merchantInfo: Merchant[];
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleInitDB = () => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          // Check if the error is due to version mismatch
          const error = (event.target as IDBOpenDBRequest).error;
          if (error && error.name === "VersionError") {
            // console.warn(
            //   "IndexedDB version mismatch. Deleting database and trying again..."
            // );
            // Delete the database and try again
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            deleteRequest.onsuccess = () => {
              // console.log("Database deleted successfully. Reopening...");
              // Call initDB again after successful deletion
              setTimeout(() => this.initDB().then(resolve).catch(reject), 100);
            };
            deleteRequest.onerror = () => {
              // console.error("Could not delete database", deleteRequest.error);
              reject(deleteRequest.error);
            };
          } else {
            // console.error("Database error:", event);
            reject(request.error);
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Delete existing stores to ensure clean upgrade
          if (db.objectStoreNames.contains("menuItems")) {
            db.deleteObjectStore("menuItems");
          }
          if (db.objectStoreNames.contains("cartItems")) {
            db.deleteObjectStore("cartItems");
          }
          if (db.objectStoreNames.contains("merchantInfo")) {
            db.deleteObjectStore("merchantInfo");
          }

          // Create object stores with proper configuration
          const menuStore = db.createObjectStore("menuItems", {
            keyPath: "id",
            autoIncrement: true,
          });
          menuStore.createIndex("by_merchant", "merchant_id", {
            unique: false,
          });

          db.createObjectStore("cartItems", {
            keyPath: "id",
            autoIncrement: true,
          });
          db.createObjectStore("merchantInfo", {
            keyPath: "id",
            autoIncrement: true,
          });
        };
      };

      handleInitDB();
    });
  }

  private getStore(
    storeName: keyof DBSchema,
    mode: IDBTransactionMode = "readonly"
  ): IDBObjectStore {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Generic get all items from a store
  async getAll<T extends keyof DBSchema>(storeName: T): Promise<DBSchema[T]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();

      request.onerror = () => {
        // console.error("Database error:", event);
        reject(request.error);
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Generic add item to a store
  async add<T extends keyof DBSchema>(
    storeName: T,
    item: DBSchema[T][number]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.add(item);

      request.onerror = () => {
        // console.error("Database error:", event);
        reject(request.error);
      };
      request.onsuccess = () => resolve();
    });
  }

  // Generic update item in a store
  async update<T extends keyof DBSchema>(
    storeName: T,
    item: DBSchema[T][number]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.put(item);

      request.onerror = () => {
        // console.error("Database error:", event);
        reject(request.error);
      };
      request.onsuccess = () => resolve();
    });
  }

  // Generic delete item from a store
  async delete<T extends keyof DBSchema>(
    storeName: T,
    id: string | number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.delete(id);

      request.onerror = () => {
        // console.error("Database error:", event);
        reject(request.error);
      };
      request.onsuccess = () => resolve();
    });
  }

  // Specific methods for cart operations
  async addToCart(item: CartItem): Promise<void> {
    return this.update("cartItems", item);
  }

  async removeFromCart(itemId: string | number): Promise<void> {
    return this.delete("cartItems", itemId);
  }

  async getCart(): Promise<CartItem[]> {
    return this.getAll("cartItems");
  }

  // Methods for menu items
  async cacheMenuItems(items: MenuItem[], merchantId: number): Promise<void> {
    const store = this.getStore("menuItems", "readwrite");
    return new Promise((resolve, reject) => {
      try {
        // Delete existing menu items for this merchant
        const index = store.index("by_merchant");
        const range = IDBKeyRange.only(merchantId);
        const deleteRequest = index.openCursor(range);

        deleteRequest.onsuccess = () => {
          const cursor = deleteRequest.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            // All existing items deleted, now add new ones
            const addPromises = items.map((item) => {
              const itemWithMerchant = { ...item, merchant_id: merchantId };
              return this.update("menuItems", itemWithMerchant);
            });

            Promise.all(addPromises)
              .then(() => resolve())
              .catch(reject);
          }
        };

        deleteRequest.onerror = () => reject(deleteRequest.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getMenuItems(merchantId: number): Promise<MenuItem[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore("menuItems");
      const index = store.index("by_merchant");
      const range = IDBKeyRange.only(merchantId);
      const request = index.getAll(range);

      request.onerror = () => {
        // console.error("Database error:", event);
        reject(request.error);
      };
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const indexedDBService = new IndexedDBService();
