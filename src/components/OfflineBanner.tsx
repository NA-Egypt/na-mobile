import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import { AppText } from './ui/AppText';
import { database } from '../database';
import OutboxAction from '../database/models/OutboxAction';

export const OfflineBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    // Check pending outbox actions count
    const loadOutboxCount = async () => {
      try {
        const collection = database.get<OutboxAction>('outbox_actions');
        const pending = await collection.query().fetch();
        const unSynced = pending.filter((p) => p.status === 'pending');
        setPendingCount(unSynced.length);
      } catch {}
    };

    loadOutboxCount();

    const subscription = database
      .get<OutboxAction>('outbox_actions')
      .query()
      .observe()
      .subscribe((items) => {
        const unSynced = items.filter((p) => p.status === 'pending');
        setPendingCount(unSynced.length);
      });

    return () => {
      unsubscribeNet();
      subscription.unsubscribe();
    };
  }, []);

  if (!isOffline && pendingCount === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isOffline ? colors.warning : colors.info,
          paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 10),
        },
      ]}
    >
      <View style={styles.contentRow}>
        {isOffline ? (
          <WifiOff color="#ffffff" size={15} style={styles.icon} />
        ) : (
          <RefreshCw color="#ffffff" size={15} style={styles.icon} />
        )}
        <AppText variant="caption" color="#ffffff" weight="700">
          {isOffline
            ? isAr
              ? `أنت غير متصل بالإنترنت ${pendingCount > 0 ? `(${pendingCount} طلبات معلقة)` : '• وضع عدم الاتصال نشط'}`
              : `You are offline ${pendingCount > 0 ? `(${pendingCount} pending)` : '• Offline mode active'}`
            : isAr
            ? `جاري مزامنة ${pendingCount} طلبات في قائمة الانتظار...`
            : `Syncing ${pendingCount} pending requests...`}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 6,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginEnd: 6,
  },
});
