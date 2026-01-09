import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ProjectData } from './types';

interface HrpDB extends DBSchema {
  projects: {
    key: string;
    value: ProjectData;
  };
}

const DB_NAME = 'hrp-audit-db';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<HrpDB>> => {
  return openDB<HrpDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
    },
  });
};

export const saveProject = async (project: ProjectData): Promise<void> => {
  const db = await initDB();
  await db.put('projects', project);
};

export const getProject = async (id: string = 'current'): Promise<ProjectData | undefined> => {
  const db = await initDB();
  return db.get('projects', id);
};

export const clearProject = async (id: string = 'current'): Promise<void> => {
  const db = await initDB();
  await db.delete('projects', id);
};
