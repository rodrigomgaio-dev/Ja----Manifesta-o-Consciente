import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/Colors';
import SacredButton from './SacredButton';

interface SacredModalButton {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

interface SacredModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: SacredModalButton[];
  onClose?: () => void;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export default function SacredModal({
  visible,
  title,
  message,
  buttons = [],
  onClose,
  type = 'info',
}: SacredModalProps) {
  const { colors } = useTheme();

  const iconConfig = {
    info: { name: 'info', color: colors.primary },
    success: { name: 'check-circle', color: colors.success },
    warning: { name: 'warning', color: colors.warning },
    error: { name: 'error', color: colors.error },
  };

  const icon = iconConfig[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable 
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={colors.gradientBackground}
            style={styles.gradient}
          >
            <View style={[styles.modal, { borderColor: colors.border }]}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                <MaterialIcons name={icon.name as any} size={32} color={icon.color} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>

              {/* Message */}
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {buttons.length > 0 ? (
                  buttons.map((button, index) => (
                    <SacredButton
                      key={index}
                      title={button.text}
                      onPress={() => {
                        button.onPress();
                        if (onClose && button.variant !== 'outline') onClose();
                      }}
                      variant={button.variant || 'primary'}
                      style={[
                        styles.button,
                        button.variant === 'danger' && styles.dangerButton,
                      ]}
                    />
                  ))
                ) : (
                  <SacredButton
                    title="OK"
                    onPress={onClose || (() => {})}
                    style={styles.button}
                  />
                )}
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  gradient: {
    borderRadius: BorderRadius.xl,
    padding: 2,
  },
  modal: {
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  buttonsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
  dangerButton: {
    borderColor: '#EF4444',
  },
});
