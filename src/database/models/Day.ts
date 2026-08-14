import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';

export default class Day extends Model {
  static table = 'days';

  @text('remote_id') remoteId?: string;
  @text('ar_name') arName?: string;
  @text('en_name') enName?: string;
  @text('code') code?: string;
}
