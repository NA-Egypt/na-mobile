import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import Meeting from './models/Meeting';
import Group from './models/Group';
import City from './models/City';
import Neighborhood from './models/Neighborhood';
import Day from './models/Day';
import Topic from './models/Topic';
import Option from './models/Option';
import Event from './models/Event';
import OutboxAction from './models/OutboxAction';

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment out migration logs in production)
  jsi: true, /* Enable JSI for faster SQLite operations when native bridge is active */
  onSetUpError: (error) => {
    console.error('WatermelonDB adapter setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Meeting,
    Group,
    City,
    Neighborhood,
    Day,
    Topic,
    Option,
    Event,
    OutboxAction,
  ],
});
