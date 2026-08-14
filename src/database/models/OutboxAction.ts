import { Model } from '@nozbe/watermelondb';
import { text, field, date, json } from '@nozbe/watermelondb/decorators';

const sanitizePayload = (raw: any) => (typeof raw === 'object' ? raw : {});

export default class OutboxAction extends Model {
  static table = 'outbox_actions';

  @text('endpoint') endpoint?: string;
  @text('method') method?: string; // 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  @json('payload', sanitizePayload) payload?: Record<string, any>;
  @text('status') status?: string; // 'pending' | 'syncing' | 'synced' | 'failed'
  @field('retry_count') retryCount?: number;
  @date('created_at') createdAt?: Date;
}
