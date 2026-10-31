import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';

/** A quiet mastery meter: a warm track with an accent fill. No stars, no XP. */
export function MasteryBar({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
});
