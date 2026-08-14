import { Model } from '@nozbe/watermelondb';
import { text, date, children } from '@nozbe/watermelondb/decorators';

export default class City extends Model {
  static table = 'cities';

  static associations = {
    neighborhoods: { type: 'has_many' as const, foreignKey: 'city_id' },
    groups: { type: 'has_many' as const, foreignKey: 'city_id' },
  };

  @text('remote_id') remoteId?: string;
  @text('ar_name') arName?: string;
  @text('en_name') enName?: string;
  @date('updated_at') updatedAt?: Date;

  @children('neighborhoods') neighborhoods?: any;
  @children('groups') groups?: any;
}
