import NetInfo from '@react-native-community/netinfo';
import { database } from './index';
import OutboxAction from './models/OutboxAction';
import { apiClient } from '../api/client';
import { Q } from '@nozbe/watermelondb';

let isSyncingOutbox = false;

export async function addOutboxAction(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  payload: Record<string, any>
): Promise<OutboxAction> {
  let createdRecord: OutboxAction | null = null;
  await database.write(async () => {
    createdRecord = await database.get<OutboxAction>('outbox_actions').create((action) => {
      action.endpoint = endpoint;
      action.method = method;
      action.payload = payload;
      action.status = 'pending';
      action.retryCount = 0;
      action.createdAt = new Date();
    });
  });

  // Attempt sync immediately if online
  triggerOutboxSync();
  return createdRecord!;
}

export async function processOutboxQueue(): Promise<void> {
  if (isSyncingOutbox) return;
  isSyncingOutbox = true;

  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      isSyncingOutbox = false;
      return;
    }

    const pendingActions = await database
      .get<OutboxAction>('outbox_actions')
      .query(Q.where('status', Q.oneOf(['pending', 'failed'])), Q.where('retry_count', Q.lte(5)))
      .fetch();

    for (const action of pendingActions) {
      try {
        await database.write(async () => {
          await action.update((a) => {
            a.status = 'syncing';
          });
        });

        await apiClient.request({
          url: action.endpoint,
          method: action.method,
          data: action.payload,
        });

        await database.write(async () => {
          await action.update((a) => {
            a.status = 'synced';
          });
        });
      } catch (err: any) {
        console.warn(`Outbox item ${action.id} sync failed:`, err?.message || err);
        await database.write(async () => {
          await action.update((a) => {
            a.status = 'failed';
            a.retryCount = a.retryCount + 1;
          });
        });
      }
    }
  } catch (error) {
    console.error('Outbox worker error:', error);
  } finally {
    isSyncingOutbox = false;
  }
}

export function startOutboxNetworkListener() {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      processOutboxQueue();
    }
  });
  return unsubscribe;
}

export function triggerOutboxSync() {
  processOutboxQueue();
}
