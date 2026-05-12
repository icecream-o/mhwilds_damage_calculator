import Dexie, { type Table } from 'dexie';
import type { Build, ThemeId } from '../types';

interface ThemePref { id: 'current'; theme: ThemeId; }

class AppDB extends Dexie {
  builds!:    Table<Build, string>;
  themePref!: Table<ThemePref, 'current'>;

  constructor() {
    super('mhwilds-calc');
    this.version(1).stores({
      builds:    'id, updatedAt',
      themePref: 'id',
    });
  }
}

export const db = new AppDB();
