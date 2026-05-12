import Dexie, { type Table } from 'dexie';
import type { ThemeId } from '../types';

interface ThemePref { id: 'current'; theme: ThemeId; }

class AppDB extends Dexie {
  themePref!: Table<ThemePref, 'current'>;

  constructor() {
    super('mhwilds-calc');
    this.version(2).stores({
      themePref: 'id',
    });
  }
}

export const db = new AppDB();
