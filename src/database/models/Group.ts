import { Model } from '@nozbe/watermelondb';
import { text, date, relation, children } from '@nozbe/watermelondb/decorators';

export default class Group extends Model {
  static table = 'groups';

  static associations = {
    cities: { type: 'belongs_to' as const, key: 'city_id' },
    neighborhoods: { type: 'belongs_to' as const, key: 'neighborhood_id' },
    meetings: { type: 'has_many' as const, foreignKey: 'group_id' },
  };

  @text('remote_id') remoteId?: string;
  @text('name') name?: string;
  @text('group_type') groupType?: string;
  @text('city_id') cityId?: string;
  @text('neighborhood_id') neighborhoodId?: string;
  @date('updated_at') updatedAt?: Date;

  @relation('cities', 'city_id') city?: any;
  @relation('neighborhoods', 'neighborhood_id') neighborhood?: any;
  @children('meetings') meetings?: any;
}
