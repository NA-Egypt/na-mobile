import { Model } from '@nozbe/watermelondb';
import { text, date, relation } from '@nozbe/watermelondb/decorators';

export default class Neighborhood extends Model {
  static table = 'neighborhoods';

  static associations = {
    cities: { type: 'belongs_to' as const, key: 'city_id' },
    groups: { type: 'has_many' as const, foreignKey: 'neighborhood_id' },
  };

  @text('remote_id') remoteId?: string;
  @text('city_id') cityId?: string;
  @text('ar_name') arName?: string;
  @text('en_name') enName?: string;
  @date('updated_at') updatedAt?: Date;

  @relation('cities', 'city_id') city?: any;
}
