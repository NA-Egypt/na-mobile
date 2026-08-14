import { Model } from '@nozbe/watermelondb';
import { text, date } from '@nozbe/watermelondb/decorators';

export default class Event extends Model {
  static table = 'events';

  @text('remote_id') remoteId?: string;
  @text('title') title?: string;
  @text('description') description?: string;
  @text('start_date') startDate?: string;
  @text('end_date') endDate?: string;
  @text('location') location?: string;
  @text('organizer') organizer?: string;
  @text('recurrence') recurrence?: string;
  @date('updated_at') updatedAt?: Date;
}
