// components/ui/AppModal.tsx
import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AppModalProps {
  visible: boolean;
  type?: 'success' | 'error' | 'warning' | 'confirmation' | 'info';
  title: string;
  messageLines: string[];
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

const AppModal: React.FC<AppModalProps> = ({
  visible,
  type = 'info',
  title,
  messageLines,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  showCancel = false,
  onConfirm,
  onCancel,
  icon,
}) => {
  const getIconColor = () => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'confirmation': return '#7E5CEF';
      default: return '#3B82F6';
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          {/* Ícone opcional */}
          {icon && (
            <MaterialIcons name={icon} size={48} color={getIconColor()} style={styles.icon} />
          )}

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Linhas da mensagem */}
          <View style={styles.messageContainer}>
            {messageLines.map((line, index) => (
              <Text key={index} style={styles.message}>
                {line}
              </Text>
            ))}
          </View>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>
            )}

            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default AppModal;

const MAX_WIDTH = 320;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    maxWidth: MAX_WIDTH,
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1D',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  messageContainer: {
    width: '100%',
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    marginRight: 8,
    backgroundColor: '#F8F8F8',
  },
  cancelButtonText: {
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 15,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7E5CEF', // Cor primária do Jaé
  },
  confirmButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
});