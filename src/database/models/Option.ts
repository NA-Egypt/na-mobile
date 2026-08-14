import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';

export default class Option extends Model {
  static table = 'options';

  @text('remote_id') remoteId?: string;
  @text('ar_name') arName?: string;
  @text('en_name') enName?: string;
}
